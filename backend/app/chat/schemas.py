"""Pydantic schemas for chat input, structured LLM output, and API output.

`LLMResponse` is the structured output schema sent to the model. The model is
constrained to produce JSON matching this shape, so it can be parsed directly
with `LLMResponse.model_validate_json`. Auto-execution then translates the
declared actions into trade and watchlist service calls.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator


def _normalize_ticker(value: str) -> str:
    cleaned = value.strip().upper()
    if not cleaned:
        raise ValueError("ticker must not be empty")
    return cleaned


class ChatRequest(BaseModel):
    """Incoming user message to `/api/chat`."""

    message: str = Field(..., min_length=1, max_length=4000)


class TradeAction(BaseModel):
    """A trade the LLM wants to auto-execute."""

    ticker: str
    side: Literal["buy", "sell"]
    quantity: float = Field(..., gt=0)

    @field_validator("ticker")
    @classmethod
    def _normalize(cls, value: str) -> str:
        return _normalize_ticker(value)


class WatchlistAction(BaseModel):
    """A watchlist change the LLM wants to make."""

    ticker: str
    action: Literal["add", "remove"]

    @field_validator("ticker")
    @classmethod
    def _normalize(cls, value: str) -> str:
        return _normalize_ticker(value)


class LLMResponse(BaseModel):
    """Structured output schema the LLM is constrained to produce."""

    message: str
    trades: list[TradeAction] = Field(default_factory=list)
    watchlist_changes: list[WatchlistAction] = Field(default_factory=list)


class TradeResult(BaseModel):
    """Per-trade outcome surfaced back to the client."""

    ticker: str
    side: Literal["buy", "sell"]
    quantity: float
    status: Literal["executed", "failed"]
    price: float | None = None
    executed_at: str | None = None
    error: str | None = None


class WatchlistChangeResult(BaseModel):
    """Per-watchlist-change outcome surfaced back to the client."""

    ticker: str
    action: Literal["add", "remove"]
    status: Literal["applied", "failed"]
    error: str | None = None


class ChatResponse(BaseModel):
    """Response body of `/api/chat`."""

    message: str
    trades: list[TradeResult] = Field(default_factory=list)
    watchlist_changes: list[WatchlistChangeResult] = Field(default_factory=list)
    created_at: str
