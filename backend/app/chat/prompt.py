"""Prompt construction for the LLM chat assistant.

Builds the message list passed to LiteLLM. Keeps formatting in one place so the
service layer is easy to read and the system prompt is easy to iterate on.
"""

from __future__ import annotations

import json

from ..schemas import PortfolioResponse, WatchlistItem

SYSTEM_PROMPT = """You are FinAlly, an AI trading assistant inside a simulated trading workstation.

You help the user analyze their portfolio, suggest trades, and act on their behalf.
You have access to the user's live cash balance, positions with current prices and
unrealized P&L, the watchlist with live prices, and the recent conversation.

When the user wants to trade or modify the watchlist, populate the `trades` and
`watchlist_changes` arrays in your structured response. These will be executed
automatically. Only fill them when the user has clearly asked for an action or
explicitly agreed to a suggestion. Use the `message` field for everything you
want the user to read.

Be concise, data-driven, and grounded in the supplied portfolio context. Do not
invent prices, positions, or trade history that are not in the context. Never
recommend more than the user can afford or sell more shares than they hold."""


def build_messages(
    *,
    user_message: str,
    portfolio: PortfolioResponse,
    watchlist: list[WatchlistItem],
    history: list[dict],
) -> list[dict]:
    """Build the LiteLLM `messages` list for one chat turn.

    `history` is a list of `{role, content}` dicts (oldest first), already
    trimmed to the recent window. The current `user_message` is appended last.
    """
    context_text = _format_context(portfolio, watchlist)
    messages: list[dict] = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "system", "content": context_text},
    ]
    messages.extend(history)
    messages.append({"role": "user", "content": user_message})
    return messages


def _format_context(portfolio: PortfolioResponse, watchlist: list[WatchlistItem]) -> str:
    """Render the portfolio + watchlist as a compact, model-friendly block."""
    payload = {
        "cash_balance": portfolio.cash_balance,
        "positions_value": portfolio.positions_value,
        "total_value": portfolio.total_value,
        "unrealized_pl": portfolio.unrealized_pl,
        "positions": [p.model_dump() for p in portfolio.positions],
        "watchlist": [w.model_dump() for w in watchlist],
    }
    return "PORTFOLIO CONTEXT (JSON):\n" + json.dumps(payload, default=str)
