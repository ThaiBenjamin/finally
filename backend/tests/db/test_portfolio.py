"""Composite portfolio query."""

from __future__ import annotations

from app import db


class FakePrices:
    def __init__(self, prices):
        self._prices = prices

    def get_price(self, ticker):
        return self._prices.get(ticker)


def test_empty_portfolio(conn):
    p = db.get_portfolio(conn, FakePrices({}))
    assert p["cash_balance"] == db.DEFAULT_CASH
    assert p["positions_value"] == 0.0
    assert p["total_value"] == db.DEFAULT_CASH
    assert p["positions"] == []


def test_portfolio_with_open_position(conn):
    db.execute_trade(conn, "AAPL", "buy", 10, 100.0)
    p = db.get_portfolio(conn, FakePrices({"AAPL": 120.0}))
    assert p["cash_balance"] == db.DEFAULT_CASH - 1000.0
    assert len(p["positions"]) == 1
    pos = p["positions"][0]
    assert pos["ticker"] == "AAPL"
    assert pos["market_value"] == 1200.0
    assert pos["unrealized_pnl"] == 200.0
    assert pos["unrealized_pnl_percent"] == 20.0
    assert p["positions_value"] == 1200.0
    assert p["total_value"] == p["cash_balance"] + 1200.0


def test_portfolio_falls_back_to_avg_cost_when_no_price(conn):
    db.execute_trade(conn, "AAPL", "buy", 5, 100.0)
    p = db.get_portfolio(conn, FakePrices({}))  # no live price yet
    pos = p["positions"][0]
    assert pos["current_price"] == 100.0
    assert pos["unrealized_pnl"] == 0.0
