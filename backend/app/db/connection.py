"""SQLite connection helper with lazy schema initialization."""

from __future__ import annotations

import os
import sqlite3
import threading
from pathlib import Path

DEFAULT_USER_ID = "default"

_SCHEMA_FILE = Path(__file__).resolve().parents[2] / "db" / "schema.sql"

_init_lock = threading.Lock()
_initialized_paths: set[str] = set()


def get_db_path() -> Path:
    """Resolve the SQLite database path.

    Defaults to <project_root>/db/finally.db. The path is the Docker
    volume mount target. Override via FINALLY_DB_PATH for tests or
    alternative deployments.
    """
    env_path = os.environ.get("FINALLY_DB_PATH")
    if env_path:
        return Path(env_path)
    project_root = Path(__file__).resolve().parents[3]
    return project_root / "db" / "finally.db"


def connect(db_path: Path | None = None) -> sqlite3.Connection:
    """Open a new sqlite3 connection and ensure the schema is initialized.

    Each caller gets its own connection. Connections are configured with
    `Row` row factory and foreign key enforcement on. Schema initialization
    is performed at most once per database path per process.
    """
    path = Path(db_path) if db_path else get_db_path()
    path.parent.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(
        str(path),
        detect_types=sqlite3.PARSE_DECLTYPES,
        isolation_level=None,
        check_same_thread=False,
    )
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")

    _ensure_initialized(conn, path)
    return conn


def _ensure_initialized(conn: sqlite3.Connection, path: Path) -> None:
    """Create tables and seed defaults on first use of a given db file."""
    key = str(path.resolve())
    if key in _initialized_paths:
        return
    with _init_lock:
        if key in _initialized_paths:
            return
        _apply_schema(conn)
        from .seed import seed_defaults

        seed_defaults(conn)
        _initialized_paths.add(key)


def _apply_schema(conn: sqlite3.Connection) -> None:
    sql = _SCHEMA_FILE.read_text(encoding="utf-8")
    conn.executescript(sql)


def reset_init_cache() -> None:
    """Forget which paths have been initialized. For tests only."""
    with _init_lock:
        _initialized_paths.clear()
