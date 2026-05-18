"""Portfolio snapshots DAO. Used to drive the P&L chart."""

from __future__ import annotations

import sqlite3
import uuid

from .connection import DEFAULT_USER_ID
from .timeutil import utc_now_iso


def append_snapshot(
    conn: sqlite3.Connection,
    total_value: float,
    user_id: str = DEFAULT_USER_ID,
) -> dict:
    row_id = str(uuid.uuid4())
    recorded_at = utc_now_iso()
    conn.execute(
        "INSERT INTO portfolio_snapshots "
        "(id, user_id, total_value, recorded_at) VALUES (?, ?, ?, ?)",
        (row_id, user_id, total_value, recorded_at),
    )
    return {
        "id": row_id,
        "total_value": total_value,
        "recorded_at": recorded_at,
    }


def get_history(
    conn: sqlite3.Connection,
    user_id: str = DEFAULT_USER_ID,
    limit: int | None = None,
) -> list[dict]:
    """Snapshots in ascending time order, oldest first (chart-friendly)."""
    sql = (
        "SELECT id, total_value, recorded_at FROM portfolio_snapshots "
        "WHERE user_id = ? ORDER BY recorded_at ASC"
    )
    params: tuple = (user_id,)
    if limit is not None:
        sql += " LIMIT ?"
        params = (user_id, limit)
    rows = conn.execute(sql, params).fetchall()
    return [dict(r) for r in rows]
