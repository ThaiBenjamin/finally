"""Lazy initialization and seeding behavior."""

from __future__ import annotations

import sqlite3

from app import db


def test_connect_creates_db_file_and_tables(db_path):
    assert not db_path.exists()
    conn = db.connect()
    try:
        assert db_path.exists()
        names = {
            r["name"]
            for r in conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table'"
            ).fetchall()
        }
    finally:
        conn.close()
    expected = {
        "users_profile",
        "watchlist",
        "positions",
        "trades",
        "portfolio_snapshots",
        "chat_messages",
    }
    assert expected <= names


def test_seed_creates_default_user(conn):
    cash = db.get_cash(conn)
    assert cash == db.DEFAULT_CASH


def test_seed_creates_default_watchlist(conn):
    tickers = db.list_tickers(conn)
    assert set(tickers) == set(db.DEFAULT_WATCHLIST)
    assert len(tickers) == len(db.DEFAULT_WATCHLIST)


def test_init_is_idempotent(db_path):
    c1 = db.connect()
    c1.close()
    # Re-open: should not duplicate watchlist rows or reset cash.
    c2 = db.connect()
    try:
        c2.execute(
            "UPDATE users_profile SET cash_balance = 42.0 WHERE id = 'default'"
        )
    finally:
        c2.close()

    # Force re-init by clearing the in-process cache (simulates fresh process).
    db.reset_init_cache()
    c3 = db.connect()
    try:
        assert db.get_cash(c3) == 42.0  # not overwritten by seed_defaults
        assert len(db.list_tickers(c3)) == len(db.DEFAULT_WATCHLIST)
    finally:
        c3.close()


def test_foreign_keys_enabled(conn):
    val = conn.execute("PRAGMA foreign_keys").fetchone()[0]
    assert val == 1


def test_row_factory_is_row(conn):
    row = conn.execute("SELECT 1 AS x").fetchone()
    assert isinstance(row, sqlite3.Row)
    assert row["x"] == 1
