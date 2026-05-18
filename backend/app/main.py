"""FastAPI application entrypoint.

Composes:
- Lifespan: lazy-init DB, start market data source seeded from watchlist,
  start background snapshot loop, stop cleanly on shutdown.
- Routers: health, watchlist, portfolio, market SSE stream, optional chat.
- Static frontend mount for non-/api routes.
"""

from __future__ import annotations

import asyncio
import logging
import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import state
from .api import health_router, portfolio_router, watchlist_router
from .market import PriceCache, create_market_data_source, create_stream_router
from .snapshots_task import run_snapshot_loop
from .static_files import mount_static

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Initialize singletons, market data, and the snapshot loop."""
    from app import db

    cache = PriceCache()
    source = create_market_data_source(cache)

    conn = db.connect()
    try:
        tickers = db.list_tickers(conn)
    finally:
        conn.close()

    if not tickers:
        logger.warning("Watchlist is empty at startup; market source will have no tickers")

    await source.start(tickers)

    state.state.price_cache = cache
    state.state.market_source = source

    snapshot_task = asyncio.create_task(run_snapshot_loop(), name="snapshot-loop")

    try:
        yield
    finally:
        snapshot_task.cancel()
        try:
            await snapshot_task
        except (asyncio.CancelledError, Exception):
            pass
        await source.stop()
        state.state.market_source = None
        state.state.price_cache = None


def create_app(price_cache: PriceCache | None = None) -> FastAPI:
    """Build the FastAPI app.

    `price_cache` is an optional override used by tests so the SSE router can
    be wired to a pre-populated cache. In production, the lifespan creates one
    and a shared singleton in `app.state` is used by services.
    """
    app = FastAPI(
        title="FinAlly Backend",
        description="AI Trading Workstation backend (REST + SSE).",
        version="0.1.0",
        lifespan=lifespan,
    )

    origins_raw = os.environ.get("FINALLY_CORS_ORIGINS", "").strip()
    if origins_raw:
        origins = [o.strip() for o in origins_raw.split(",") if o.strip()]
        app.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    app.include_router(health_router)
    app.include_router(watchlist_router)
    app.include_router(portfolio_router)

    # The SSE router needs a PriceCache. Production uses the lifespan-managed
    # cache via the state singleton; tests can pass one in directly.
    stream_cache = price_cache if price_cache is not None else _LazyCache()
    app.include_router(create_stream_router(stream_cache))  # type: ignore[arg-type]

    try:
        from app.chat.routes import router as chat_router  # type: ignore[import-not-found]

        app.include_router(chat_router)
    except ImportError:
        logger.info("Chat router not available yet; /api/chat will 404")

    mount_static(app)

    return app


class _LazyCache:
    """Proxy that defers PriceCache access until the lifespan has populated state.

    The SSE router captures the cache reference at construction time, but in
    production we don't have the cache yet at that point. This proxy forwards
    attribute access to whatever cache the lifespan has set.
    """

    def __getattr__(self, name: str):
        return getattr(state.get_price_cache(), name)


app = create_app()
