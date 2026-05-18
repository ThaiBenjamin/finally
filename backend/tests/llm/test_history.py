"""Tests for `app.chat.history` against a fresh SQLite database."""

from __future__ import annotations

from pathlib import Path

import pytest

from app.chat import history
from app.db import connection


@pytest.fixture
def fresh_db(tmp_path: Path, monkeypatch) -> Path:
    db_path = tmp_path / "chat.db"
    monkeypatch.setenv("FINALLY_DB_PATH", str(db_path))
    connection.reset_init_cache()
    return db_path


def test_append_and_list_round_trip(fresh_db: Path):
    history.append_message(
        user_id="default", role="user", content="hello", actions=None
    )
    history.append_message(
        user_id="default",
        role="assistant",
        content="hi back",
        actions={"trades": [{"ticker": "AAPL"}]},
    )
    rows = history.list_recent("default", limit=10)
    assert [r["role"] for r in rows] == ["user", "assistant"]
    assert rows[0]["content"] == "hello"
    assert rows[1]["actions"] == {"trades": [{"ticker": "AAPL"}]}


def test_list_recent_respects_limit_and_returns_oldest_first(fresh_db: Path):
    for i in range(5):
        history.append_message(
            user_id="default", role="user", content=f"msg-{i}", actions=None
        )
    rows = history.list_recent("default", limit=3)
    assert [r["content"] for r in rows] == ["msg-2", "msg-3", "msg-4"]


def test_messages_for_other_user_are_isolated(fresh_db: Path):
    history.append_message(user_id="alice", role="user", content="A", actions=None)
    history.append_message(user_id="bob", role="user", content="B", actions=None)
    assert [r["content"] for r in history.list_recent("alice")] == ["A"]
    assert [r["content"] for r in history.list_recent("bob")] == ["B"]
