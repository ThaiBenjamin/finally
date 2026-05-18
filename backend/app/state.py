"""Application-wide singletons.

These objects are populated during the FastAPI lifespan and read by handlers
and services. Keeping them in a small dedicated module avoids circular imports
between `api`, `services`, and `market`.
"""

from __future__ import annotations

from dataclasses import dataclass

from .market import MarketDataSource, PriceCache


@dataclass
class AppState:
    """Mutable container for runtime singletons.

    The lifespan replaces the contents in-place rather than swapping the object
    out, so any module that imported `state` keeps seeing the live values.
    """

    price_cache: PriceCache | None = None
    market_source: MarketDataSource | None = None


state = AppState()


def get_price_cache() -> PriceCache:
    if state.price_cache is None:
        raise RuntimeError("PriceCache is not initialized; lifespan has not run")
    return state.price_cache


def get_market_source() -> MarketDataSource:
    if state.market_source is None:
        raise RuntimeError("MarketDataSource is not initialized; lifespan has not run")
    return state.market_source
