"""Watchlist DAO."""

from __future__ import annotations

import pytest

from app import db


def test_add_new_ticker(conn):
    row = db.add_watch(conn, "PYPL")
    assert row["ticker"] == "PYPL"
    assert "PYPL" in db.list_tickers(conn)


def test_add_uppercases_and_trims(conn):
    db.add_watch(conn, "  pypl  ")
    assert "PYPL" in db.list_tickers(conn)


def test_add_duplicate_raises(conn):
    with pytest.raises(db.DuplicateWatchError):
        db.add_watch(conn, "AAPL")  # AAPL is seeded


def test_remove_existing(conn):
    assert db.remove_watch(conn, "AAPL") is True
    assert "AAPL" not in db.list_tickers(conn)


def test_remove_missing_returns_false(conn):
    assert db.remove_watch(conn, "ZZZZ") is False


def test_list_watchlist_shapes(conn):
    rows = db.list_watchlist(conn)
    assert len(rows) == len(db.DEFAULT_WATCHLIST)
    assert set(rows[0].keys()) == {"id", "ticker", "added_at"}


def test_empty_ticker_rejected(conn):
    with pytest.raises(ValueError):
        db.add_watch(conn, "   ")
