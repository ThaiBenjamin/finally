"""ISO 8601 UTC timestamp helpers."""

from __future__ import annotations

from datetime import datetime, timezone


def utc_now_iso() -> str:
    """Return the current UTC time as an ISO 8601 string with 'Z' suffix."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f") + "Z"
