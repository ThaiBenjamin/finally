"""Watchlist service.

The watchlist lives in SQLite (source of truth) but every mutation also tells
the running market data source so that prices start/stop flowing for the
ticker. Service functions are async because `market_source.add_ticker` is.
"""

from __future__ import annotations

from app import db

from ..schemas import WatchlistItem
from ..state import get_market_source, get_price_cache
from .errors import TickerAlreadyWatchedError, TickerNotWatchedError


def _build_item(ticker: str, added_at: str) -> WatchlistItem:
    update = get_price_cache().get(ticker)
    if update is None:
        return WatchlistItem(ticker=ticker, added_at=added_at)
    return WatchlistItem(
        ticker=ticker,
        added_at=added_at,
        price=update.price,
        previous_price=update.previous_price,
        change=update.change,
        change_percent=update.change_percent,
        direction=update.direction,
    )


async def list_watchlist(user_id: str = "default") -> list[WatchlistItem]:
    conn = db.connect()
    try:
        rows = db.list_watchlist(conn, user_id)
    finally:
        conn.close()
    return [_build_item(row["ticker"], row["added_at"]) for row in rows]


async def add_to_watchlist(ticker: str, user_id: str = "default") -> WatchlistItem:
    ticker = ticker.strip().upper()
    conn = db.connect()
    try:
        try:
            row = db.add_watch(conn, ticker, user_id)
        except db.DuplicateWatchError as exc:
            raise TickerAlreadyWatchedError(ticker) from exc
    finally:
        conn.close()
    await get_market_source().add_ticker(ticker)
    return _build_item(row["ticker"], row["added_at"])


async def remove_from_watchlist(ticker: str, user_id: str = "default") -> None:
    ticker = ticker.strip().upper()
    conn = db.connect()
    try:
        removed = db.remove_watch(conn, ticker, user_id)
    finally:
        conn.close()
    if not removed:
        raise TickerNotWatchedError(ticker)
    await get_market_source().remove_ticker(ticker)
