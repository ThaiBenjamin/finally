"""Pydantic request and response models for the REST API.

These shapes are the public contract with the frontend (see PLAN.md Section 8).
Keep them stable across releases.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator

TradeSide = Literal["buy", "sell"]


def _normalize_ticker(value: str) -> str:
    cleaned = value.strip().upper()
    if not cleaned:
        raise ValueError("ticker must not be empty")
    return cleaned


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"


class WatchlistItem(BaseModel):
    """Watchlist row enriched with the latest cached price (if any)."""

    ticker: str
    added_at: str
    price: float | None = None
    previous_price: float | None = None
    change: float | None = None
    change_percent: float | None = None
    direction: str | None = None


class WatchlistAddRequest(BaseModel):
    ticker: str = Field(..., min_length=1, max_length=10)

    @field_validator("ticker")
    @classmethod
    def _normalize(cls, value: str) -> str:
        return _normalize_ticker(value)


class Position(BaseModel):
    ticker: str
    quantity: float
    avg_cost: float
    current_price: float | None
    market_value: float | None
    unrealized_pl: float | None
    unrealized_pl_percent: float | None


class PortfolioResponse(BaseModel):
    cash_balance: float
    positions: list[Position]
    positions_value: float
    total_value: float
    unrealized_pl: float


class TradeRequest(BaseModel):
    ticker: str = Field(..., min_length=1, max_length=10)
    quantity: float = Field(..., gt=0)
    side: TradeSide

    @field_validator("ticker")
    @classmethod
    def _normalize(cls, value: str) -> str:
        return _normalize_ticker(value)


class TradeResponse(BaseModel):
    """Result of a successful trade, plus the resulting portfolio."""

    ticker: str
    side: TradeSide
    quantity: float
    price: float
    executed_at: str
    portfolio: PortfolioResponse


class SnapshotPoint(BaseModel):
    total_value: float
    recorded_at: str


class PortfolioHistoryResponse(BaseModel):
    snapshots: list[SnapshotPoint]
