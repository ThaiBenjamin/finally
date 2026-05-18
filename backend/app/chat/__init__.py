"""LLM chat assistant package.

Exports the FastAPI router and the structured response schema. See
`planning/PLAN.md` Section 9 for the contract.
"""

from .routes import router
from .schemas import (
    ChatRequest,
    ChatResponse,
    LLMResponse,
    TradeAction,
    TradeResult,
    WatchlistAction,
    WatchlistChangeResult,
)

__all__ = [
    "router",
    "ChatRequest",
    "ChatResponse",
    "LLMResponse",
    "TradeAction",
    "TradeResult",
    "WatchlistAction",
    "WatchlistChangeResult",
]
