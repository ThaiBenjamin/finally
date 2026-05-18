"""Chat message DAO. Stores user/assistant turns with optional action payload."""

from __future__ import annotations

import json
import sqlite3
import uuid
from typing import Any

from .connection import DEFAULT_USER_ID
from .timeutil import utc_now_iso


def append_chat(
    conn: sqlite3.Connection,
    role: str,
    content: str,
    actions: dict | list | None = None,
    user_id: str = DEFAULT_USER_ID,
) -> dict:
    if role not in ("user", "assistant"):
        raise ValueError(f"role must be 'user' or 'assistant', got {role!r}")
    row_id = str(uuid.uuid4())
    created_at = utc_now_iso()
    actions_json = json.dumps(actions) if actions is not None else None
    conn.execute(
        "INSERT INTO chat_messages "
        "(id, user_id, role, content, actions, created_at) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        (row_id, user_id, role, content, actions_json, created_at),
    )
    return {
        "id": row_id,
        "role": role,
        "content": content,
        "actions": actions,
        "created_at": created_at,
    }


def list_chat(
    conn: sqlite3.Connection,
    user_id: str = DEFAULT_USER_ID,
    limit: int | None = None,
) -> list[dict]:
    """Chat history in chronological order (oldest first)."""
    if limit is None:
        rows = conn.execute(
            "SELECT id, role, content, actions, created_at "
            "FROM chat_messages WHERE user_id = ? "
            "ORDER BY created_at ASC",
            (user_id,),
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT id, role, content, actions, created_at FROM ("
            "  SELECT id, role, content, actions, created_at "
            "  FROM chat_messages WHERE user_id = ? "
            "  ORDER BY created_at DESC LIMIT ?"
            ") ORDER BY created_at ASC",
            (user_id, limit),
        ).fetchall()
    return [_decode(r) for r in rows]


def _decode(row: sqlite3.Row) -> dict:
    actions: Any = row["actions"]
    if actions is not None:
        actions = json.loads(actions)
    return {
        "id": row["id"],
        "role": row["role"],
        "content": row["content"],
        "actions": actions,
        "created_at": row["created_at"],
    }
