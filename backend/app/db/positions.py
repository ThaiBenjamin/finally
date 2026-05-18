"""Positions DAO. Mutated via the trades.execute_trade transaction."""

from __future__ import annotations

import sqlite3

from .connection import DEFAULT_USER_ID


def list_positions(
    conn: sqlite3.Connection, user_id: str = DEFAULT_USER_ID
) -> list[dict]:
    rows = conn.execute(
        "SELECT id, ticker, quantity, avg_cost, updated_at "
        "FROM positions WHERE user_id = ? AND quantity > 0 "
        "ORDER BY ticker ASC",
        (user_id,),
    ).fetchall()
    return [dict(r) for r in rows]


def get_position(
    conn: sqlite3.Connection,
    ticker: str,
    user_id: str = DEFAULT_USER_ID,
) -> dict | None:
    row = conn.execute(
        "SELECT id, ticker, quantity, avg_cost, updated_at "
        "FROM positions WHERE user_id = ? AND ticker = ?",
        (user_id, ticker.upper()),
    ).fetchone()
    return dict(row) if row else None
