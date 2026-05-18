"""Composite portfolio query.

Mirrors what the /api/portfolio endpoint needs: cash + positions enriched
with current price and unrealized P&L from the in-memory price cache.
"""

from __future__ import annotations

import sqlite3
from typing import Protocol

from . import positions as positions_dao
from . import users as users_dao
from .connection import DEFAULT_USER_ID


class _PriceLookup(Protocol):
    def get_price(self, ticker: str) -> float | None: ...


def get_portfolio(
    conn: sqlite3.Connection,
    prices: _PriceLookup,
    user_id: str = DEFAULT_USER_ID,
) -> dict:
    """Build the portfolio summary using DB state plus a live price source.

    `prices` is anything with a `.get_price(ticker)` method returning the
    latest price or None (e.g., `app.market.PriceCache`). Positions whose
    ticker is unknown to the cache use `avg_cost` as a fallback so the
    portfolio still renders before the first price tick arrives.
    """
    cash = users_dao.get_cash(conn, user_id)
    rows = positions_dao.list_positions(conn, user_id)

    enriched: list[dict] = []
    positions_value = 0.0
    for r in rows:
        ticker = r["ticker"]
        qty = float(r["quantity"])
        avg = float(r["avg_cost"])
        current = prices.get_price(ticker)
        if current is None:
            current = avg
        market_value = qty * current
        cost_basis = qty * avg
        unrealized = market_value - cost_basis
        pct = ((current - avg) / avg * 100) if avg > 0 else 0.0
        positions_value += market_value
        enriched.append(
            {
                "ticker": ticker,
                "quantity": qty,
                "avg_cost": avg,
                "current_price": round(current, 4),
                "market_value": round(market_value, 4),
                "unrealized_pnl": round(unrealized, 4),
                "unrealized_pnl_percent": round(pct, 4),
                "updated_at": r["updated_at"],
            }
        )

    total = cash + positions_value
    return {
        "cash_balance": round(cash, 4),
        "positions_value": round(positions_value, 4),
        "total_value": round(total, 4),
        "positions": enriched,
    }
