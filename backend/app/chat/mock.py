"""Deterministic mock LLM response for `LLM_MOCK=true`.

Produces predictable output for E2E tests, CI, and offline development. No
network calls. The mock interprets simple imperative phrases so tests can
exercise the auto-execution code paths through the chat surface.
"""

from __future__ import annotations

import re

from .schemas import LLMResponse, TradeAction, WatchlistAction

_QTY = r"(\d+(?:\.\d+)?)"
_TICKER = r"([A-Za-z]{1,10})"
_FILLER = r"(?:\s+(?:shares?|stocks?))?(?:\s+of)?"

_BUY_PATTERN = re.compile(rf"\bbuy\s+{_QTY}{_FILLER}\s+{_TICKER}\b", re.IGNORECASE)
_SELL_PATTERN = re.compile(rf"\bsell\s+{_QTY}{_FILLER}\s+{_TICKER}\b", re.IGNORECASE)
_ADD_PATTERN = re.compile(rf"\badd\s+(?:ticker\s+)?{_TICKER}\b", re.IGNORECASE)
_REMOVE_PATTERN = re.compile(rf"\bremove\s+(?:ticker\s+)?{_TICKER}\b", re.IGNORECASE)


def mock_response(user_message: str) -> LLMResponse:
    """Return a deterministic LLMResponse derived from the user's message.

    Recognized phrases:
      - "buy <qty> <ticker>"     -> a buy trade
      - "sell <qty> <ticker>"    -> a sell trade
      - "add <ticker>"           -> watchlist add
      - "remove <ticker>"        -> watchlist remove
    Anything else returns a plain acknowledgement with no actions.
    """
    trades: list[TradeAction] = []
    watchlist_changes: list[WatchlistAction] = []

    for qty, ticker in _BUY_PATTERN.findall(user_message):
        trades.append(TradeAction(ticker=ticker, side="buy", quantity=float(qty)))
    for qty, ticker in _SELL_PATTERN.findall(user_message):
        trades.append(TradeAction(ticker=ticker, side="sell", quantity=float(qty)))
    for ticker in _ADD_PATTERN.findall(user_message):
        watchlist_changes.append(WatchlistAction(ticker=ticker, action="add"))
    for ticker in _REMOVE_PATTERN.findall(user_message):
        watchlist_changes.append(WatchlistAction(ticker=ticker, action="remove"))

    if trades or watchlist_changes:
        summary_parts = []
        if trades:
            summary_parts.append(
                "executed " + ", ".join(f"{t.side} {t.quantity} {t.ticker}" for t in trades)
            )
        if watchlist_changes:
            summary_parts.append(
                "watchlist " + ", ".join(f"{w.action} {w.ticker}" for w in watchlist_changes)
            )
        message = "[mock] " + "; ".join(summary_parts)
    else:
        message = f"[mock] received: {user_message}"

    return LLMResponse(
        message=message,
        trades=trades,
        watchlist_changes=watchlist_changes,
    )
