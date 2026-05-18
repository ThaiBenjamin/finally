"""Structured-output schema parsing tests."""

from __future__ import annotations

import json

import pytest
from pydantic import ValidationError

from app.chat.schemas import LLMResponse, TradeAction, WatchlistAction


def test_parses_message_only_payload():
    payload = json.dumps({"message": "hello"})
    parsed = LLMResponse.model_validate_json(payload)
    assert parsed.message == "hello"
    assert parsed.trades == []
    assert parsed.watchlist_changes == []


def test_parses_full_payload():
    payload = json.dumps(
        {
            "message": "executed",
            "trades": [{"ticker": "aapl", "side": "buy", "quantity": 2.5}],
            "watchlist_changes": [{"ticker": "pypl", "action": "add"}],
        }
    )
    parsed = LLMResponse.model_validate_json(payload)
    assert parsed.message == "executed"
    assert parsed.trades == [TradeAction(ticker="AAPL", side="buy", quantity=2.5)]
    assert parsed.watchlist_changes == [WatchlistAction(ticker="PYPL", action="add")]


def test_rejects_invalid_side():
    payload = json.dumps(
        {"message": "x", "trades": [{"ticker": "AAPL", "side": "short", "quantity": 1}]}
    )
    with pytest.raises(ValidationError):
        LLMResponse.model_validate_json(payload)


def test_rejects_non_positive_quantity():
    payload = json.dumps(
        {"message": "x", "trades": [{"ticker": "AAPL", "side": "buy", "quantity": 0}]}
    )
    with pytest.raises(ValidationError):
        LLMResponse.model_validate_json(payload)


def test_rejects_invalid_watchlist_action():
    payload = json.dumps(
        {"message": "x", "watchlist_changes": [{"ticker": "AAPL", "action": "delete"}]}
    )
    with pytest.raises(ValidationError):
        LLMResponse.model_validate_json(payload)
