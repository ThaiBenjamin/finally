"""Trades DAO. Owns the atomic execute_trade transaction."""

from __future__ import annotations

import sqlite3
import uuid

from .connection import DEFAULT_USER_ID
from .timeutil import utc_now_iso


class TradeError(ValueError):
    """Base class for trade validation failures."""


class InsufficientCashError(TradeError):
    pass


class InsufficientSharesError(TradeError):
    pass


class InvalidTradeError(TradeError):
    pass


def execute_trade(
    conn: sqlite3.Connection,
    ticker: str,
    side: str,
    quantity: float,
    price: float,
    user_id: str = DEFAULT_USER_ID,
) -> dict:
    """Execute a market order atomically.

    Updates cash, positions (insert/update/delete), and appends a row to
    trades. All within a single transaction; raises and rolls back on any
    validation failure with no partial state changes.

    Returns the inserted trade row as a dict.
    """
    ticker = ticker.upper().strip()
    side = side.lower().strip()
    if side not in ("buy", "sell"):
        raise InvalidTradeError(f"side must be 'buy' or 'sell', got {side!r}")
    if quantity <= 0:
        raise InvalidTradeError("quantity must be > 0")
    if price <= 0:
        raise InvalidTradeError("price must be > 0")

    notional = round(quantity * price, 4)

    try:
        conn.execute("BEGIN IMMEDIATE")

        cash_row = conn.execute(
            "SELECT cash_balance FROM users_profile WHERE id = ?",
            (user_id,),
        ).fetchone()
        if cash_row is None:
            raise InvalidTradeError(f"user profile not found: {user_id}")
        cash = float(cash_row["cash_balance"])

        pos_row = conn.execute(
            "SELECT id, quantity, avg_cost FROM positions "
            "WHERE user_id = ? AND ticker = ?",
            (user_id, ticker),
        ).fetchone()

        now = utc_now_iso()

        if side == "buy":
            if cash < notional:
                raise InsufficientCashError(
                    f"need {notional:.2f}, have {cash:.2f}"
                )
            new_cash = round(cash - notional, 4)
            if pos_row is None:
                conn.execute(
                    "INSERT INTO positions "
                    "(id, user_id, ticker, quantity, avg_cost, updated_at) "
                    "VALUES (?, ?, ?, ?, ?, ?)",
                    (str(uuid.uuid4()), user_id, ticker, quantity, price, now),
                )
            else:
                old_qty = float(pos_row["quantity"])
                old_cost = float(pos_row["avg_cost"])
                new_qty = old_qty + quantity
                new_avg = (old_qty * old_cost + quantity * price) / new_qty
                conn.execute(
                    "UPDATE positions "
                    "SET quantity = ?, avg_cost = ?, updated_at = ? "
                    "WHERE id = ?",
                    (new_qty, round(new_avg, 6), now, pos_row["id"]),
                )
        else:  # sell
            if pos_row is None or float(pos_row["quantity"]) < quantity:
                have = float(pos_row["quantity"]) if pos_row else 0.0
                raise InsufficientSharesError(
                    f"need {quantity}, have {have}"
                )
            new_cash = round(cash + notional, 4)
            new_qty = float(pos_row["quantity"]) - quantity
            if new_qty <= 1e-9:
                conn.execute(
                    "DELETE FROM positions WHERE id = ?",
                    (pos_row["id"],),
                )
            else:
                conn.execute(
                    "UPDATE positions "
                    "SET quantity = ?, updated_at = ? WHERE id = ?",
                    (new_qty, now, pos_row["id"]),
                )

        conn.execute(
            "UPDATE users_profile SET cash_balance = ? WHERE id = ?",
            (new_cash, user_id),
        )

        trade_id = str(uuid.uuid4())
        conn.execute(
            "INSERT INTO trades "
            "(id, user_id, ticker, side, quantity, price, executed_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            (trade_id, user_id, ticker, side, quantity, price, now),
        )

        conn.execute("COMMIT")
    except Exception:
        conn.execute("ROLLBACK")
        raise

    return {
        "id": trade_id,
        "ticker": ticker,
        "side": side,
        "quantity": quantity,
        "price": price,
        "executed_at": now,
    }


def list_trades(
    conn: sqlite3.Connection,
    user_id: str = DEFAULT_USER_ID,
    limit: int | None = None,
) -> list[dict]:
    sql = (
        "SELECT id, ticker, side, quantity, price, executed_at "
        "FROM trades WHERE user_id = ? ORDER BY executed_at DESC"
    )
    params: tuple = (user_id,)
    if limit is not None:
        sql += " LIMIT ?"
        params = (user_id, limit)
    rows = conn.execute(sql, params).fetchall()
    return [dict(r) for r in rows]
