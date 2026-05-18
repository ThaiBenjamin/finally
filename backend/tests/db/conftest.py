"""Fixtures for db tests: ephemeral sqlite file per test."""

from __future__ import annotations

import os

import pytest

from app import db


@pytest.fixture
def db_path(tmp_path, monkeypatch):
    path = tmp_path / "finally.db"
    monkeypatch.setenv("FINALLY_DB_PATH", str(path))
    db.reset_init_cache()
    yield path
    db.reset_init_cache()
    os.environ.pop("FINALLY_DB_PATH", None)


@pytest.fixture
def conn(db_path):
    c = db.connect()
    try:
        yield c
    finally:
        c.close()
