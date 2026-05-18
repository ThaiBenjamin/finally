"""Watchlist REST endpoint tests."""

from __future__ import annotations

from fastapi.testclient import TestClient


def test_get_watchlist_returns_seeded_tickers_with_prices(client: TestClient) -> None:
    resp = client.get("/api/watchlist")
    assert resp.status_code == 200
    items = resp.json()
    tickers = {item["ticker"] for item in items}
    assert {"AAPL", "GOOGL", "MSFT"}.issubset(tickers)
    aapl = next(i for i in items if i["ticker"] == "AAPL")
    assert aapl["price"] == 100.0
    assert aapl["direction"] in {"up", "down", "flat"}


def test_add_ticker_persists_and_notifies_market(client: TestClient) -> None:
    resp = client.post("/api/watchlist", json={"ticker": "pypl"})
    assert resp.status_code == 201
    body = resp.json()
    assert body["ticker"] == "PYPL"
    # Price isn't in the cache yet
    assert body["price"] is None
    # The market source was told about the new ticker
    assert "PYPL" in client.market_source.added  # type: ignore[attr-defined]

    listing = client.get("/api/watchlist").json()
    assert any(item["ticker"] == "PYPL" for item in listing)


def test_add_duplicate_ticker_returns_409(client: TestClient) -> None:
    resp = client.post("/api/watchlist", json={"ticker": "AAPL"})
    assert resp.status_code == 409


def test_add_empty_ticker_returns_422(client: TestClient) -> None:
    resp = client.post("/api/watchlist", json={"ticker": ""})
    assert resp.status_code == 422


def test_remove_ticker_succeeds_and_notifies_market(client: TestClient) -> None:
    resp = client.delete("/api/watchlist/AAPL")
    assert resp.status_code == 204
    assert "AAPL" in client.market_source.removed  # type: ignore[attr-defined]

    listing = client.get("/api/watchlist").json()
    assert all(item["ticker"] != "AAPL" for item in listing)


def test_remove_unknown_ticker_returns_404(client: TestClient) -> None:
    resp = client.delete("/api/watchlist/ZZZZ")
    assert resp.status_code == 404


def test_remove_is_case_insensitive(client: TestClient) -> None:
    resp = client.delete("/api/watchlist/aapl")
    assert resp.status_code == 204
