"""Portfolio and trading endpoint tests."""

from __future__ import annotations

from fastapi.testclient import TestClient


def test_initial_portfolio_is_empty_with_10k_cash(client: TestClient) -> None:
    resp = client.get("/api/portfolio")
    assert resp.status_code == 200
    body = resp.json()
    assert body["cash_balance"] == 10000.0
    assert body["positions"] == []
    assert body["positions_value"] == 0.0
    assert body["total_value"] == 10000.0
    assert body["unrealized_pl"] == 0.0


def test_buy_then_get_portfolio_marks_to_market(client: TestClient) -> None:
    buy = client.post(
        "/api/portfolio/trade",
        json={"ticker": "AAPL", "quantity": 10, "side": "buy"},
    )
    assert buy.status_code == 200
    body = buy.json()
    assert body["price"] == 100.0
    assert body["quantity"] == 10
    assert body["side"] == "buy"

    portfolio = body["portfolio"]
    assert portfolio["cash_balance"] == 9000.0
    assert len(portfolio["positions"]) == 1
    pos = portfolio["positions"][0]
    assert pos["ticker"] == "AAPL"
    assert pos["quantity"] == 10
    assert pos["avg_cost"] == 100.0
    assert pos["current_price"] == 100.0
    assert pos["unrealized_pl"] == 0.0
    assert portfolio["total_value"] == 10000.0


def test_buy_then_price_rises_shows_unrealized_pl(
    client: TestClient, price_cache
) -> None:
    client.post(
        "/api/portfolio/trade",
        json={"ticker": "AAPL", "quantity": 5, "side": "buy"},
    )
    price_cache.update("AAPL", 110.0)

    body = client.get("/api/portfolio").json()
    pos = body["positions"][0]
    assert pos["current_price"] == 110.0
    assert pos["market_value"] == 550.0
    assert pos["unrealized_pl"] == 50.0
    assert body["total_value"] == 10000.0 + 50.0  # cash 9500 + market 550


def test_buy_with_insufficient_cash_returns_409(client: TestClient) -> None:
    resp = client.post(
        "/api/portfolio/trade",
        json={"ticker": "NVDA", "quantity": 1000, "side": "buy"},  # 1000 * 800 = 800k
    )
    assert resp.status_code == 409
    assert "insufficient cash" in resp.json()["detail"].lower()


def test_sell_more_than_held_returns_409(client: TestClient) -> None:
    client.post(
        "/api/portfolio/trade",
        json={"ticker": "AAPL", "quantity": 1, "side": "buy"},
    )
    resp = client.post(
        "/api/portfolio/trade",
        json={"ticker": "AAPL", "quantity": 100, "side": "sell"},
    )
    assert resp.status_code == 409
    assert "insufficient shares" in resp.json()["detail"].lower()


def test_sell_unowned_ticker_returns_409(client: TestClient) -> None:
    resp = client.post(
        "/api/portfolio/trade",
        json={"ticker": "AAPL", "quantity": 1, "side": "sell"},
    )
    assert resp.status_code == 409


def test_trade_unknown_ticker_returns_404(client: TestClient) -> None:
    resp = client.post(
        "/api/portfolio/trade",
        json={"ticker": "ZZZZ", "quantity": 1, "side": "buy"},
    )
    assert resp.status_code == 404


def test_trade_zero_quantity_returns_422(client: TestClient) -> None:
    resp = client.post(
        "/api/portfolio/trade",
        json={"ticker": "AAPL", "quantity": 0, "side": "buy"},
    )
    assert resp.status_code == 422


def test_trade_invalid_side_returns_422(client: TestClient) -> None:
    resp = client.post(
        "/api/portfolio/trade",
        json={"ticker": "AAPL", "quantity": 1, "side": "hold"},
    )
    assert resp.status_code == 422


def test_buy_then_sell_round_trip_returns_cash(client: TestClient) -> None:
    client.post(
        "/api/portfolio/trade",
        json={"ticker": "AAPL", "quantity": 5, "side": "buy"},
    )
    sell = client.post(
        "/api/portfolio/trade",
        json={"ticker": "AAPL", "quantity": 5, "side": "sell"},
    )
    assert sell.status_code == 200
    portfolio = sell.json()["portfolio"]
    assert portfolio["cash_balance"] == 10000.0
    assert portfolio["positions"] == []


def test_trade_records_snapshot(client: TestClient) -> None:
    client.post(
        "/api/portfolio/trade",
        json={"ticker": "AAPL", "quantity": 5, "side": "buy"},
    )
    history = client.get("/api/portfolio/history").json()
    assert len(history["snapshots"]) >= 1
    assert history["snapshots"][-1]["total_value"] == 10000.0


def test_history_empty_when_no_trades(client: TestClient) -> None:
    history = client.get("/api/portfolio/history").json()
    assert history == {"snapshots": []}


def test_ticker_is_normalized_to_upper(client: TestClient) -> None:
    resp = client.post(
        "/api/portfolio/trade",
        json={"ticker": "aapl", "quantity": 1, "side": "buy"},
    )
    assert resp.status_code == 200
    assert resp.json()["ticker"] == "AAPL"
