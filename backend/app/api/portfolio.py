"""Portfolio and trading REST endpoints."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from ..schemas import (
    PortfolioHistoryResponse,
    PortfolioResponse,
    TradeRequest,
    TradeResponse,
)
from ..services import portfolio as portfolio_service
from ..services.errors import (
    InsufficientCashError,
    InsufficientSharesError,
    UnknownTickerError,
)

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])


@router.get("", response_model=PortfolioResponse)
async def get_portfolio() -> PortfolioResponse:
    return portfolio_service.get_portfolio()


@router.post("/trade", response_model=TradeResponse)
async def trade(payload: TradeRequest) -> TradeResponse:
    try:
        return portfolio_service.execute_trade(
            ticker=payload.ticker,
            quantity=payload.quantity,
            side=payload.side,
        )
    except UnknownTickerError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"no live price for ticker: {exc}",
        ) from exc
    except InsufficientCashError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"insufficient cash: {exc}",
        ) from exc
    except InsufficientSharesError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"insufficient shares: {exc}",
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.get("/history", response_model=PortfolioHistoryResponse)
async def get_portfolio_history() -> PortfolioHistoryResponse:
    return portfolio_service.get_portfolio_history()
