"""Mock-mode behavior tests."""

from __future__ import annotations

import pytest

from app.chat.mock import mock_response


def test_recognizes_integration_test_prompt():
    result = mock_response("buy 1 share of AAPL")
    assert len(result.trades) == 1
    trade = result.trades[0]
    assert trade.ticker == "AAPL"
    assert trade.side == "buy"
    assert trade.quantity == 1.0
    assert result.watchlist_changes == []
    assert result.message.startswith("[mock]")


@pytest.mark.parametrize(
    "prompt,ticker,side,qty",
    [
        ("buy 5 NVDA", "NVDA", "buy", 5.0),
        ("Please sell 2.5 TSLA now", "TSLA", "sell", 2.5),
        ("buy 3 shares of MSFT", "MSFT", "buy", 3.0),
        ("sell 1 share GOOGL", "GOOGL", "sell", 1.0),
    ],
)
def test_recognizes_trade_phrases(prompt, ticker, side, qty):
    result = mock_response(prompt)
    assert len(result.trades) == 1
    trade = result.trades[0]
    assert (trade.ticker, trade.side, trade.quantity) == (ticker, side, qty)


def test_recognizes_watchlist_phrases():
    result = mock_response("add PYPL and remove ORCL")
    actions = {(w.ticker, w.action) for w in result.watchlist_changes}
    assert ("PYPL", "add") in actions
    assert ("ORCL", "remove") in actions


def test_unmatched_prompt_returns_no_actions():
    result = mock_response("what's the weather like today?")
    assert result.trades == []
    assert result.watchlist_changes == []
    assert "weather" in result.message
