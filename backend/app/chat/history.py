"""Chat history persistence — delegates to `app.db.chat_messages`.

The shim owns its own sqlite3 connection per call, which suits the chat
layer where each call is at the boundary of a chat turn.
"""

from __future__ import annotations

from app.db.chat_messages import append_message, list_recent

__all__ = ["append_message", "list_recent"]
