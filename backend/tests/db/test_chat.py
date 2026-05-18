"""Chat message DAO."""

from __future__ import annotations

import pytest

from app import db


def test_append_user_message(conn):
    row = db.append_chat(conn, "user", "what is my portfolio?")
    assert row["role"] == "user"
    assert row["actions"] is None


def test_append_assistant_with_actions(conn):
    actions = {"trades": [{"ticker": "AAPL", "side": "buy", "quantity": 1}]}
    row = db.append_chat(conn, "assistant", "Bought AAPL.", actions=actions)
    assert row["actions"] == actions


def test_list_chat_chronological(conn):
    db.append_chat(conn, "user", "hi")
    db.append_chat(conn, "assistant", "hello")
    db.append_chat(conn, "user", "thanks")
    history = db.list_chat(conn)
    assert [m["content"] for m in history] == ["hi", "hello", "thanks"]


def test_list_chat_decodes_actions_json(conn):
    db.append_chat(conn, "assistant", "ok", actions={"foo": 1})
    msgs = db.list_chat(conn)
    assert msgs[0]["actions"] == {"foo": 1}


def test_list_chat_limit_returns_most_recent_in_chronological_order(conn):
    for i in range(5):
        db.append_chat(conn, "user", f"msg{i}")
    msgs = db.list_chat(conn, limit=2)
    assert [m["content"] for m in msgs] == ["msg3", "msg4"]


def test_invalid_role_raises(conn):
    with pytest.raises(ValueError):
        db.append_chat(conn, "system", "nope")
