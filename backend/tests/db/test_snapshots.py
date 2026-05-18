"""Portfolio snapshot DAO."""

from __future__ import annotations

from app import db


def test_append_and_list_in_order(conn):
    db.append_snapshot(conn, 10000.0)
    db.append_snapshot(conn, 10500.0)
    db.append_snapshot(conn, 10250.0)
    history = db.get_history(conn)
    assert [h["total_value"] for h in history] == [10000.0, 10500.0, 10250.0]


def test_history_empty_initially(conn):
    assert db.get_history(conn) == []


def test_history_respects_limit(conn):
    for v in (1.0, 2.0, 3.0, 4.0):
        db.append_snapshot(conn, v)
    assert len(db.get_history(conn, limit=2)) == 2
