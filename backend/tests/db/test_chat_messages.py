"""Connection-managed shim used by the LLM chat layer."""

from __future__ import annotations

from app.db import chat_messages


def test_append_and_list_recent(db_path):
    chat_messages.append_message(role="user", content="hi")
    chat_messages.append_message(
        role="assistant",
        content="hello",
        actions={"trades": [{"ticker": "AAPL", "side": "buy", "quantity": 1}]},
    )
    chat_messages.append_message(role="user", content="thanks")

    msgs = chat_messages.list_recent(limit=10)
    assert [m["content"] for m in msgs] == ["hi", "hello", "thanks"]
    assert msgs[1]["actions"] == {
        "trades": [{"ticker": "AAPL", "side": "buy", "quantity": 1}]
    }


def test_list_recent_returns_most_recent_chronological(db_path):
    for i in range(5):
        chat_messages.append_message(role="user", content=f"m{i}")
    msgs = chat_messages.list_recent(limit=2)
    assert [m["content"] for m in msgs] == ["m3", "m4"]
