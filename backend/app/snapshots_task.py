"""Background task that records a portfolio_snapshot every 30 seconds."""

from __future__ import annotations

import asyncio
import logging

from .services import portfolio as portfolio_service

logger = logging.getLogger(__name__)

SNAPSHOT_INTERVAL_SECONDS = 30.0


async def run_snapshot_loop(interval: float = SNAPSHOT_INTERVAL_SECONDS) -> None:
    """Record a portfolio snapshot every `interval` seconds until cancelled."""
    while True:
        try:
            await asyncio.sleep(interval)
            portfolio_service.record_snapshot()
        except asyncio.CancelledError:
            logger.info("Snapshot loop cancelled")
            raise
        except Exception:
            logger.exception("Failed to record portfolio snapshot; continuing")
