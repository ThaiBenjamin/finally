"""Connection-managed chat DAO for the LLM chat layer.

Thin wrapper over `app.db.chat` for callers that prefer not to manage a
sqlite3 connection themselves. Each call opens and closes its own
connection. Backend code that already has a connection in scope (e.g.,
the FastAPI request scope) should call `app.db.chat` directly.
"""

from __future__ import annotations

from . import chat as _chat
from .connection import DEFAULT_USER_ID, connect


def append_message(
    *,
    user_id: str = DEFAULT_USER_ID,
    role: str,
    content: str,
    actions: dict | list | None = None,
) -> dict:
    """Insert a chat row. Returns the row with `actions` decoded."""
    conn = connect()
    try:
        return _chat.append_chat(
            conn, role=role, content=content, actions=actions, user_id=user_id
        )
    finally:
        conn.close()


def list_recent(user_id: str = DEFAULT_USER_ID, limit: int = 20) -> list[dict]:
    """Return the `limit` most recent messages, oldest first, actions decoded."""
    conn = connect()
    try:
        return _chat.list_chat(conn, user_id=user_id, limit=limit)
    finally:
        conn.close()
