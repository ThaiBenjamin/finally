"""Default seed data for a fresh database."""

from __future__ import annotations

import sqlite3
import uuid

from .connection import DEFAULT_USER_ID
from .timeutil import utc_now_iso

DEFAULT_CASH = 10000.0

DEFAULT_WATCHLIST: tuple[str, ...] = (
    "AAPL",
    "GOOGL",
    "MSFT",
    "AMZN",
    "TSLA",
    "NVDA",
    "META",
    "JPM",
    "V",
    "NFLX",
)


def seed_defaults(conn: sqlite3.Connection) -> None:
    """Seed the default user profile and watchlist if not already present.

    Idempotent: safe to call multiple times. Uses INSERT OR IGNORE so it
    does not overwrite a profile whose cash balance has already changed.
    """
    now = utc_now_iso()
    conn.execute(
        "INSERT OR IGNORE INTO users_profile (id, cash_balance, created_at) "
        "VALUES (?, ?, ?)",
        (DEFAULT_USER_ID, DEFAULT_CASH, now),
    )
    for ticker in DEFAULT_WATCHLIST:
        conn.execute(
            "INSERT OR IGNORE INTO watchlist (id, user_id, ticker, added_at) "
            "VALUES (?, ?, ?, ?)",
            (str(uuid.uuid4()), DEFAULT_USER_ID, ticker, now),
        )
