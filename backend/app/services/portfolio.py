"""Portfolio service.

Reads cash + positions from the DB, marks positions to market using the live
PriceCache, and routes trade execution through the DAO's atomic
`execute_trade` transaction.
"""

from __future__ import annotations

from app import db

from ..schemas import (
    PortfolioHistoryResponse,
    PortfolioResponse,
    Position,
    SnapshotPoint,
    TradeResponse,
    TradeSide,
)
from ..state import get_price_cache
from .errors import (
    InsufficientCashError,
    InsufficientSharesError,
    UnknownTickerError,
)


def _to_position(row: dict) -> Position:
    return Position(
        ticker=row["ticker"],
        quantity=float(row["quantity"]),
        avg_cost=float(row["avg_cost"]),
        current_price=(
            float(row["current_price"]) if row.get("current_price") is not None else None
        ),
        market_value=(
            float(row["market_value"]) if row.get("market_value") is not None else None
        ),
        unrealized_pl=(
            float(row["unrealized_pnl"]) if row.get("unrealized_pnl") is not None else None
        ),
        unrealized_pl_percent=(
            float(row["unrealized_pnl_percent"])
            if row.get("unrealized_pnl_percent") is not None
            else None
        ),
    )


def get_portfolio(user_id: str = "default") -> PortfolioResponse:
    cache = get_price_cache()
    conn = db.connect()
    try:
        data = db.get_portfolio(conn, cache, user_id)
    finally:
        conn.close()
    positions = [_to_position(r) for r in data["positions"]]
    unrealized = round(sum((p.unrealized_pl or 0.0) for p in positions), 4)
    return PortfolioResponse(
        cash_balance=float(data["cash_balance"]),
        positions=positions,
        positions_value=float(data["positions_value"]),
        total_value=float(data["total_value"]),
        unrealized_pl=unrealized,
    )


def execute_trade(
    ticker: str,
    quantity: float,
    side: TradeSide,
    user_id: str = "default",
) -> TradeResponse:
    """Validate and atomically execute a trade at the current cached price.

    Raises:
        UnknownTickerError: ticker has no current price.
        InsufficientCashError: buy cost exceeds cash balance.
        InsufficientSharesError: sell quantity exceeds held shares.
        ValueError: invalid side / non-positive quantity (rejected by DAO).
    """
    ticker = ticker.strip().upper()

    price = get_price_cache().get_price(ticker)
    if price is None:
        raise UnknownTickerError(ticker)

    conn = db.connect()
    try:
        trade_row = db.execute_trade(
            conn,
            ticker=ticker,
            side=side,
            quantity=quantity,
            price=price,
            user_id=user_id,
        )
    except db.InsufficientCashError as exc:
        raise InsufficientCashError(str(exc)) from exc
    except db.InsufficientSharesError as exc:
        raise InsufficientSharesError(str(exc)) from exc
    except db.InvalidTradeError as exc:
        raise ValueError(str(exc)) from exc
    finally:
        conn.close()

    portfolio = get_portfolio(user_id)
    snap_conn = db.connect()
    try:
        db.append_snapshot(snap_conn, portfolio.total_value, user_id)
    finally:
        snap_conn.close()

    return TradeResponse(
        ticker=trade_row["ticker"],
        side=trade_row["side"],
        quantity=float(trade_row["quantity"]),
        price=float(trade_row["price"]),
        executed_at=trade_row["executed_at"],
        portfolio=portfolio,
    )


def get_portfolio_history(user_id: str = "default") -> PortfolioHistoryResponse:
    conn = db.connect()
    try:
        rows = db.get_history(conn, user_id)
    finally:
        conn.close()
    points = [
        SnapshotPoint(total_value=float(r["total_value"]), recorded_at=r["recorded_at"])
        for r in rows
    ]
    return PortfolioHistoryResponse(snapshots=points)


def record_snapshot(user_id: str = "default") -> None:
    """Capture the current total portfolio value as a new snapshot row."""
    portfolio = get_portfolio(user_id)
    conn = db.connect()
    try:
        db.append_snapshot(conn, portfolio.total_value, user_id)
    finally:
        conn.close()
