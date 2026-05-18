"""Trade execution: atomicity, P&L math, validation."""

from __future__ import annotations

import pytest

from app import db


def test_buy_creates_position_and_decreases_cash(conn):
    db.execute_trade(conn, "AAPL", "buy", 10, 100.0)
    pos = db.get_position(conn, "AAPL")
    assert pos["quantity"] == 10
    assert pos["avg_cost"] == 100.0
    assert db.get_cash(conn) == db.DEFAULT_CASH - 1000.0


def test_buy_then_buy_updates_avg_cost(conn):
    db.execute_trade(conn, "AAPL", "buy", 10, 100.0)
    db.execute_trade(conn, "AAPL", "buy", 10, 200.0)
    pos = db.get_position(conn, "AAPL")
    assert pos["quantity"] == 20
    assert pos["avg_cost"] == pytest.approx(150.0)


def test_sell_reduces_position_and_increases_cash(conn):
    db.execute_trade(conn, "AAPL", "buy", 10, 100.0)
    db.execute_trade(conn, "AAPL", "sell", 4, 150.0)
    pos = db.get_position(conn, "AAPL")
    assert pos["quantity"] == 6
    assert pos["avg_cost"] == pytest.approx(100.0)  # avg_cost unchanged on sell
    expected_cash = db.DEFAULT_CASH - 10 * 100.0 + 4 * 150.0
    assert db.get_cash(conn) == pytest.approx(expected_cash)


def test_sell_all_removes_position(conn):
    db.execute_trade(conn, "AAPL", "buy", 5, 100.0)
    db.execute_trade(conn, "AAPL", "sell", 5, 110.0)
    assert db.get_position(conn, "AAPL") is None


def test_buy_with_insufficient_cash_raises_and_rolls_back(conn):
    cash_before = db.get_cash(conn)
    with pytest.raises(db.InsufficientCashError):
        db.execute_trade(conn, "AAPL", "buy", 1000, 100.0)  # $100k > $10k
    assert db.get_cash(conn) == cash_before
    assert db.get_position(conn, "AAPL") is None
    assert db.list_trades(conn) == []


def test_sell_more_than_owned_raises_and_rolls_back(conn):
    db.execute_trade(conn, "AAPL", "buy", 5, 100.0)
    cash_before = db.get_cash(conn)
    pos_before = db.get_position(conn, "AAPL")
    with pytest.raises(db.InsufficientSharesError):
        db.execute_trade(conn, "AAPL", "sell", 10, 100.0)
    assert db.get_cash(conn) == cash_before
    assert db.get_position(conn, "AAPL")["quantity"] == pos_before["quantity"]
    # Only the original buy in history.
    assert len(db.list_trades(conn)) == 1


def test_sell_with_no_position_raises(conn):
    with pytest.raises(db.InsufficientSharesError):
        db.execute_trade(conn, "AAPL", "sell", 1, 100.0)


def test_invalid_side_raises(conn):
    with pytest.raises(db.InvalidTradeError):
        db.execute_trade(conn, "AAPL", "hodl", 1, 100.0)


def test_invalid_quantity_raises(conn):
    with pytest.raises(db.InvalidTradeError):
        db.execute_trade(conn, "AAPL", "buy", 0, 100.0)
    with pytest.raises(db.InvalidTradeError):
        db.execute_trade(conn, "AAPL", "buy", -1, 100.0)


def test_invalid_price_raises(conn):
    with pytest.raises(db.InvalidTradeError):
        db.execute_trade(conn, "AAPL", "buy", 1, 0)


def test_list_trades_orders_newest_first(conn):
    db.execute_trade(conn, "AAPL", "buy", 1, 100.0)
    db.execute_trade(conn, "MSFT", "buy", 1, 400.0)
    trades = db.list_trades(conn)
    assert trades[0]["ticker"] == "MSFT"
    assert trades[1]["ticker"] == "AAPL"


def test_list_positions_only_returns_open(conn):
    db.execute_trade(conn, "AAPL", "buy", 1, 100.0)
    db.execute_trade(conn, "MSFT", "buy", 1, 400.0)
    db.execute_trade(conn, "AAPL", "sell", 1, 110.0)  # closes AAPL
    open_pos = db.list_positions(conn)
    tickers = {p["ticker"] for p in open_pos}
    assert tickers == {"MSFT"}
