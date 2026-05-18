"""FinAlly database layer.

Public API surface used by backend-api and llm-engineer:

    from app.db import connect, DEFAULT_USER_ID

    # users / cash
    get_cash, set_cash

    # watchlist
    list_watchlist, list_tickers, add_watch, remove_watch, DuplicateWatchError

    # positions / trades
    list_positions, get_position
    execute_trade, list_trades
    TradeError, InsufficientCashError, InsufficientSharesError, InvalidTradeError

    # snapshots
    append_snapshot, get_history

    # chat
    append_chat, list_chat

    # composite
    get_portfolio
"""

from .chat import append_chat, list_chat
from .connection import DEFAULT_USER_ID, connect, get_db_path, reset_init_cache
from .portfolio import get_portfolio
from .positions import get_position, list_positions
from .seed import DEFAULT_CASH, DEFAULT_WATCHLIST, seed_defaults
from .snapshots import append_snapshot, get_history
from .timeutil import utc_now_iso
from .trades import (
    InsufficientCashError,
    InsufficientSharesError,
    InvalidTradeError,
    TradeError,
    execute_trade,
    list_trades,
)
from .users import get_cash, set_cash
from .watchlist import (
    DuplicateWatchError,
    add_watch,
    list_tickers,
    list_watchlist,
    remove_watch,
)

__all__ = [
    "DEFAULT_USER_ID",
    "DEFAULT_CASH",
    "DEFAULT_WATCHLIST",
    "connect",
    "get_db_path",
    "reset_init_cache",
    "seed_defaults",
    "utc_now_iso",
    "get_cash",
    "set_cash",
    "list_watchlist",
    "list_tickers",
    "add_watch",
    "remove_watch",
    "DuplicateWatchError",
    "list_positions",
    "get_position",
    "execute_trade",
    "list_trades",
    "TradeError",
    "InsufficientCashError",
    "InsufficientSharesError",
    "InvalidTradeError",
    "append_snapshot",
    "get_history",
    "append_chat",
    "list_chat",
    "get_portfolio",
]
