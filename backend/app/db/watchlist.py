"""Watchlist DAO."""

from __future__ import annotations

import sqlite3
import uuid

from .connection import DEFAULT_USER_ID
from .timeutil import utc_now_iso


class DuplicateWatchError(ValueError):
    """Ticker already on the user's watchlist."""


def list_watchlist(
    conn: sqlite3.Connection, user_id: str = DEFAULT_USER_ID
) -> list[dict]:
    rows = conn.execute(
        "SELECT id, ticker, added_at FROM watchlist "
        "WHERE user_id = ? ORDER BY added_at ASC",
        (user_id,),
    ).fetchall()
    return [dict(r) for r in rows]


def list_tickers(
    conn: sqlite3.Connection, user_id: str = DEFAULT_USER_ID
) -> list[str]:
    rows = conn.execute(
        "SELECT ticker FROM watchlist WHERE user_id = ? ORDER BY added_at ASC",
        (user_id,),
    ).fetchall()
    return [r["ticker"] for r in rows]


def add_watch(
    conn: sqlite3.Connection,
    ticker: str,
    user_id: str = DEFAULT_USER_ID,
) -> dict:
    ticker = ticker.upper().strip()
    if not ticker:
        raise ValueError("ticker must be non-empty")
    row_id = str(uuid.uuid4())
    added_at = utc_now_iso()
    try:
        conn.execute(
            "INSERT INTO watchlist (id, user_id, ticker, added_at) "
            "VALUES (?, ?, ?, ?)",
            (row_id, user_id, ticker, added_at),
        )
    except sqlite3.IntegrityError as e:
        raise DuplicateWatchError(ticker) from e
    return {"id": row_id, "ticker": ticker, "added_at": added_at}


def remove_watch(
    conn: sqlite3.Connection,
    ticker: str,
    user_id: str = DEFAULT_USER_ID,
) -> bool:
    ticker = ticker.upper().strip()
    cur = conn.execute(
        "DELETE FROM watchlist WHERE user_id = ? AND ticker = ?",
        (user_id, ticker),
    )
    return cur.rowcount > 0
