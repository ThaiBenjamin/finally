"""Service-level tests for `handle_chat`.

Covers mock-mode auto-execution, error capture from a failing trade,
and conversation persistence (user + assistant rows written).
"""

from __future__ import annotations

from typing import Any

import pytest

from app.chat import service
from app.chat.schemas import ChatResponse
from app.schemas import (
    PortfolioResponse,
    Position,
    TradeResponse,
    WatchlistItem,
)
from app.services.errors import (
    InsufficientCashError,
    TickerAlreadyWatchedError,
    TickerNotWatchedError,
)


@pytest.fixture
def fake_portfolio() -> PortfolioResponse:
    return PortfolioResponse(
        cash_balance=10000.0,
        positions=[
            Position(
                ticker="AAPL",
                quantity=10,
                avg_cost=180.0,
                current_price=200.0,
                market_value=2000.0,
                unrealized_pl=200.0,
                unrealized_pl_percent=11.1,
            )
        ],
        positions_value=2000.0,
        total_value=12000.0,
        unrealized_pl=200.0,
    )


@pytest.fixture
def fake_watchlist() -> list[WatchlistItem]:
    return [WatchlistItem(ticker="AAPL", added_at="2026-05-16T00:00:00+00:00", price=200.0)]


@pytest.fixture
def history_store(monkeypatch) -> list[dict]:
    """Replace the chat history module with an in-memory list."""
    store: list[dict] = []

    def append_message(*, user_id, role, content, actions=None):
        row = {
            "id": f"row-{len(store)}",
            "user_id": user_id,
            "role": role,
            "content": content,
            "actions": actions,
            "created_at": f"2026-05-16T00:00:{len(store):02d}+00:00",
        }
        store.append(row)
        return row

    def list_recent(user_id="default", limit=20):
        return [r for r in store if r["user_id"] == user_id][-limit:]

    monkeypatch.setattr(service.history, "append_message", append_message)
    monkeypatch.setattr(service.history, "list_recent", list_recent)
    return store


@pytest.fixture
def mock_services(monkeypatch, fake_portfolio, fake_watchlist):
    """Patch the portfolio + watchlist services used by `handle_chat`."""
    calls: dict[str, list[Any]] = {"trades": [], "watchlist": []}

    def get_portfolio(user_id="default"):
        return fake_portfolio

    def execute_trade(*, ticker, quantity, side, user_id="default"):
        calls["trades"].append((ticker, quantity, side, user_id))
        return TradeResponse(
            ticker=ticker,
            side=side,
            quantity=quantity,
            price=200.0,
            executed_at="2026-05-16T00:00:00+00:00",
            portfolio=fake_portfolio,
        )

    async def list_watchlist(user_id="default"):
        return fake_watchlist

    async def add_to_watchlist(ticker, user_id="default"):
        calls["watchlist"].append(("add", ticker, user_id))
        return WatchlistItem(ticker=ticker, added_at="2026-05-16T00:00:00+00:00")

    async def remove_from_watchlist(ticker, user_id="default"):
        calls["watchlist"].append(("remove", ticker, user_id))

    monkeypatch.setattr(service.portfolio_service, "get_portfolio", get_portfolio)
    monkeypatch.setattr(
        service.portfolio_service,
        "execute_trade",
        lambda ticker, quantity, side, user_id="default": execute_trade(
            ticker=ticker, quantity=quantity, side=side, user_id=user_id
        ),
    )
    monkeypatch.setattr(service.watchlist_service, "list_watchlist", list_watchlist)
    monkeypatch.setattr(service.watchlist_service, "add_to_watchlist", add_to_watchlist)
    monkeypatch.setattr(
        service.watchlist_service, "remove_from_watchlist", remove_from_watchlist
    )
    return calls


@pytest.fixture(autouse=True)
def enable_mock_mode(monkeypatch):
    monkeypatch.setenv("LLM_MOCK", "true")


async def test_handle_chat_executes_trade_from_mock(
    history_store, mock_services
):
    response = await service.handle_chat("buy 1 share of AAPL")
    assert isinstance(response, ChatResponse)
    assert len(response.trades) == 1
    trade = response.trades[0]
    assert trade.ticker == "AAPL"
    assert trade.side == "buy"
    assert trade.quantity == 1.0
    assert trade.status == "executed"
    assert trade.price == 200.0
    assert mock_services["trades"] == [("AAPL", 1.0, "buy", "default")]


async def test_handle_chat_captures_insufficient_cash_error(
    monkeypatch, history_store, mock_services
):
    def boom(ticker, quantity, side, user_id="default"):
        raise InsufficientCashError("need $1000, have $50")

    monkeypatch.setattr(service.portfolio_service, "execute_trade", boom)
    response = await service.handle_chat("buy 1000 AAPL")
    assert len(response.trades) == 1
    trade = response.trades[0]
    assert trade.status == "failed"
    assert "need $1000" in (trade.error or "")
    assert trade.price is None


async def test_handle_chat_applies_watchlist_add(
    history_store, mock_services
):
    response = await service.handle_chat("add PYPL")
    assert response.watchlist_changes[0].ticker == "PYPL"
    assert response.watchlist_changes[0].status == "applied"
    assert ("add", "PYPL", "default") in mock_services["watchlist"]


async def test_handle_chat_captures_watchlist_error(
    monkeypatch, history_store, mock_services
):
    async def already(ticker, user_id="default"):
        raise TickerAlreadyWatchedError(ticker)

    monkeypatch.setattr(service.watchlist_service, "add_to_watchlist", already)
    response = await service.handle_chat("add AAPL")
    assert response.watchlist_changes[0].status == "failed"
    assert response.watchlist_changes[0].error == "AAPL"


async def test_handle_chat_captures_remove_not_watched_error(
    monkeypatch, history_store, mock_services
):
    async def missing(ticker, user_id="default"):
        raise TickerNotWatchedError(ticker)

    monkeypatch.setattr(service.watchlist_service, "remove_from_watchlist", missing)
    response = await service.handle_chat("remove ZZZZ")
    assert response.watchlist_changes[0].status == "failed"


async def test_handle_chat_persists_user_and_assistant_messages(
    history_store, mock_services
):
    await service.handle_chat("buy 1 share of AAPL")
    roles = [row["role"] for row in history_store]
    assert roles == ["user", "assistant"]
    assert history_store[0]["content"] == "buy 1 share of AAPL"
    assert history_store[1]["content"].startswith("[mock]")
    actions = history_store[1]["actions"]
    assert actions is not None
    assert actions["trades"][0]["ticker"] == "AAPL"
    assert actions["trades"][0]["status"] == "executed"


async def test_handle_chat_history_is_passed_to_prompt_builder(
    monkeypatch, history_store, mock_services
):
    """When not in mock mode, history rows should flow into build_messages."""
    monkeypatch.setenv("LLM_MOCK", "false")
    history_store.append(
        {
            "id": "seed",
            "user_id": "default",
            "role": "user",
            "content": "earlier message",
            "actions": None,
            "created_at": "2026-05-16T00:00:00+00:00",
        }
    )
    captured: dict = {}

    async def fake_acall(messages):
        captured["messages"] = messages
        from app.chat.schemas import LLMResponse

        return LLMResponse(message="ok", trades=[], watchlist_changes=[])

    monkeypatch.setattr(service, "acall_llm", fake_acall)
    await service.handle_chat("now message")
    contents = [m["content"] for m in captured["messages"]]
    assert "earlier message" in contents
    assert "now message" in contents
