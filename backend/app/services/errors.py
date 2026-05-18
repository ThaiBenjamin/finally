"""Domain errors raised by the service layer.

HTTP handlers map these to status codes; the chat/LLM layer catches them to
report failed auto-executions back to the user.
"""

from __future__ import annotations


class ServiceError(Exception):
    """Base class for domain errors raised out of the service layer."""


class UnknownTickerError(ServiceError):
    """The ticker has no current price (not tracked by the market source)."""


class InsufficientCashError(ServiceError):
    """Buy attempt with cash balance below total cost."""


class InsufficientSharesError(ServiceError):
    """Sell attempt with held quantity below requested quantity."""


class TickerAlreadyWatchedError(ServiceError):
    """The ticker is already on the watchlist."""


class TickerNotWatchedError(ServiceError):
    """The ticker is not on the watchlist."""
