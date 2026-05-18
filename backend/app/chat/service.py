"""Chat orchestration.

Loads portfolio context, calls the LLM (or mock), auto-executes declared
trades and watchlist changes through the existing service layer, persists the
turn, and returns the final response.
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone

from ..services import portfolio as portfolio_service
from ..services import watchlist as watchlist_service
from ..services.errors import (
    InsufficientCashError,
    InsufficientSharesError,
    ServiceError,
    TickerAlreadyWatchedError,
    TickerNotWatchedError,
    UnknownTickerError,
)
from . import history
from .llm import acall_llm
from .mock import mock_response
from .prompt import build_messages
from .schemas import (
    ChatResponse,
    LLMResponse,
    TradeAction,
    TradeResult,
    WatchlistAction,
    WatchlistChangeResult,
)

logger = logging.getLogger(__name__)

HISTORY_WINDOW = 20


def _mock_mode() -> bool:
    return os.environ.get("LLM_MOCK", "").strip().lower() == "true"


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def handle_chat(user_message: str, user_id: str = "default") -> ChatResponse:
    """Run one chat turn: gather context, call model, auto-execute, persist."""
    portfolio = portfolio_service.get_portfolio(user_id)
    watchlist = await watchlist_service.list_watchlist(user_id)
    history_rows = history.list_recent(user_id=user_id, limit=HISTORY_WINDOW)
    history_messages = [
        {"role": row["role"], "content": row["content"]} for row in history_rows
    ]

    history.append_message(
        user_id=user_id,
        role="user",
        content=user_message,
        actions=None,
    )

    if _mock_mode():
        llm_response = mock_response(user_message)
    else:
        messages = build_messages(
            user_message=user_message,
            portfolio=portfolio,
            watchlist=watchlist,
            history=history_messages,
        )
        llm_response = await acall_llm(messages)

    trade_results = [_execute_trade(t, user_id) for t in llm_response.trades]
    watchlist_results = [
        await _apply_watchlist_change(w, user_id) for w in llm_response.watchlist_changes
    ]

    actions_payload = _actions_payload(trade_results, watchlist_results)
    history.append_message(
        user_id=user_id,
        role="assistant",
        content=llm_response.message,
        actions=actions_payload,
    )

    return ChatResponse(
        message=llm_response.message,
        trades=trade_results,
        watchlist_changes=watchlist_results,
        created_at=_utc_now_iso(),
    )


def _execute_trade(action: TradeAction, user_id: str) -> TradeResult:
    try:
        result = portfolio_service.execute_trade(
            ticker=action.ticker,
            quantity=action.quantity,
            side=action.side,
            user_id=user_id,
        )
        return TradeResult(
            ticker=result.ticker,
            side=result.side,
            quantity=result.quantity,
            status="executed",
            price=result.price,
            executed_at=result.executed_at,
        )
    except (
        UnknownTickerError,
        InsufficientCashError,
        InsufficientSharesError,
    ) as exc:
        return _failed_trade(action, str(exc))
    except ServiceError as exc:
        return _failed_trade(action, str(exc))
    except ValueError as exc:
        return _failed_trade(action, str(exc))
    except Exception:
        logger.exception("Unexpected error auto-executing trade %s", action)
        return _failed_trade(action, "internal error")


async def _apply_watchlist_change(
    action: WatchlistAction, user_id: str
) -> WatchlistChangeResult:
    try:
        if action.action == "add":
            await watchlist_service.add_to_watchlist(action.ticker, user_id=user_id)
        else:
            await watchlist_service.remove_from_watchlist(action.ticker, user_id=user_id)
        return WatchlistChangeResult(
            ticker=action.ticker,
            action=action.action,
            status="applied",
        )
    except (TickerAlreadyWatchedError, TickerNotWatchedError) as exc:
        return WatchlistChangeResult(
            ticker=action.ticker,
            action=action.action,
            status="failed",
            error=str(exc),
        )
    except ServiceError as exc:
        return WatchlistChangeResult(
            ticker=action.ticker,
            action=action.action,
            status="failed",
            error=str(exc),
        )
    except Exception:
        logger.exception("Unexpected error auto-applying watchlist change %s", action)
        return WatchlistChangeResult(
            ticker=action.ticker,
            action=action.action,
            status="failed",
            error="internal error",
        )


def _failed_trade(action: TradeAction, error: str) -> TradeResult:
    return TradeResult(
        ticker=action.ticker,
        side=action.side,
        quantity=action.quantity,
        status="failed",
        error=error,
    )


def _actions_payload(
    trades: list[TradeResult],
    watchlist_changes: list[WatchlistChangeResult],
) -> dict | None:
    if not trades and not watchlist_changes:
        return None
    return {
        "trades": [t.model_dump() for t in trades],
        "watchlist_changes": [w.model_dump() for w in watchlist_changes],
    }


def parse_llm_response(payload: str | bytes) -> LLMResponse:
    """Public helper for tests: parse a raw LLM JSON string."""
    return LLMResponse.model_validate_json(payload)
