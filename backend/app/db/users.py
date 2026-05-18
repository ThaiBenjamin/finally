"""User profile DAO (cash balance)."""

from __future__ import annotations

import sqlite3

from .connection import DEFAULT_USER_ID


def get_cash(conn: sqlite3.Connection, user_id: str = DEFAULT_USER_ID) -> float:
    row = conn.execute(
        "SELECT cash_balance FROM users_profile WHERE id = ?",
        (user_id,),
    ).fetchone()
    if row is None:
        raise LookupError(f"user profile not found: {user_id}")
    return float(row["cash_balance"])


def set_cash(
    conn: sqlite3.Connection, amount: float, user_id: str = DEFAULT_USER_ID
) -> None:
    cur = conn.execute(
        "UPDATE users_profile SET cash_balance = ? WHERE id = ?",
        (amount, user_id),
    )
    if cur.rowcount == 0:
        raise LookupError(f"user profile not found: {user_id}")
