"""Test fixtures for the FastAPI API layer.

Tests run against the real DAOs in `app.db` pointed at a per-test temporary
SQLite file via `FINALLY_DB_PATH`. The price cache is a freshly built one
preseeded with known prices for deterministic assertions.
"""

from __future__ import annotations

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app import db, state
from app.api import health_router, portfolio_router, watchlist_router
from app.market import PriceCache, create_stream_router


class _FakeMarketSource:
    """In-process market source double for tests; tracks add/remove calls."""

    def __init__(self) -> None:
        self.added: list[str] = []
        self.removed: list[str] = []

    async def add_ticker(self, ticker: str) -> None:
        self.added.append(ticker)

    async def remove_ticker(self, ticker: str) -> None:
        self.removed.append(ticker)


@pytest.fixture(autouse=True)
def isolated_db(tmp_path, monkeypatch: pytest.MonkeyPatch):
    """Point the DB layer at a fresh SQLite file for each test."""
    db_path = tmp_path / "finally.db"
    monkeypatch.setenv("FINALLY_DB_PATH", str(db_path))
    db.reset_init_cache()
    yield
    db.reset_init_cache()


@pytest.fixture
def price_cache() -> PriceCache:
    cache = PriceCache()
    for ticker, price in [
        ("AAPL", 100.0),
        ("GOOGL", 200.0),
        ("MSFT", 300.0),
        ("AMZN", 150.0),
        ("TSLA", 250.0),
        ("NVDA", 800.0),
        ("META", 500.0),
        ("JPM", 195.0),
        ("V", 280.0),
        ("NFLX", 600.0),
    ]:
        cache.update(ticker, price)
    return cache


@pytest.fixture
def client(price_cache: PriceCache):
    """FastAPI TestClient bypassing the production lifespan."""
    market_source = _FakeMarketSource()
    state.state.price_cache = price_cache
    state.state.market_source = market_source  # type: ignore[assignment]

    app = FastAPI()
    app.include_router(health_router)
    app.include_router(watchlist_router)
    app.include_router(portfolio_router)
    app.include_router(create_stream_router(price_cache))

    with TestClient(app) as test_client:
        test_client.market_source = market_source  # type: ignore[attr-defined]
        yield test_client

    state.state.price_cache = None
    state.state.market_source = None
