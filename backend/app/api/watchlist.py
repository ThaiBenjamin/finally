"""Watchlist REST endpoints."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from ..schemas import WatchlistAddRequest, WatchlistItem
from ..services import watchlist as watchlist_service
from ..services.errors import TickerAlreadyWatchedError, TickerNotWatchedError

router = APIRouter(prefix="/api/watchlist", tags=["watchlist"])


@router.get("", response_model=list[WatchlistItem])
async def get_watchlist() -> list[WatchlistItem]:
    return await watchlist_service.list_watchlist()


@router.post("", response_model=WatchlistItem, status_code=status.HTTP_201_CREATED)
async def add_to_watchlist(payload: WatchlistAddRequest) -> WatchlistItem:
    try:
        return await watchlist_service.add_to_watchlist(payload.ticker)
    except TickerAlreadyWatchedError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"ticker already on watchlist: {exc}",
        ) from exc


@router.delete("/{ticker}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_watchlist(ticker: str) -> None:
    try:
        await watchlist_service.remove_from_watchlist(ticker)
    except TickerNotWatchedError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"ticker not on watchlist: {exc}",
        ) from exc
