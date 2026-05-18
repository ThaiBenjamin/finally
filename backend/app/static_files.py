"""Static file serving for the Next.js export.

FastAPI serves the built frontend on every non-/api route. The directory is
chosen by `FINALLY_STATIC_DIR` if set (devops sets this in the Docker image),
otherwise it falls back to `backend/static/`. If the directory is missing the
mount is skipped and `/api/*` still works.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

logger = logging.getLogger(__name__)

DEFAULT_STATIC_DIR = Path(__file__).resolve().parent.parent / "static"


def resolve_static_dir() -> Path:
    """Return the static directory, honoring the FINALLY_STATIC_DIR env var."""
    override = os.environ.get("FINALLY_STATIC_DIR", "").strip()
    if override:
        return Path(override)
    return DEFAULT_STATIC_DIR


def mount_static(app: FastAPI, directory: Path | None = None) -> None:
    """Mount the Next.js export and add a catch-all SPA fallback.

    Behavior:
    - GET /         -> directory/index.html
    - GET /foo      -> directory/foo.html if present, else directory/foo/index.html, else index.html
    - GET /_next/*  -> served as built assets
    """
    if directory is None:
        directory = resolve_static_dir()
    if not directory.exists():
        logger.warning("Static directory missing: %s (skipping frontend mount)", directory)
        return

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa(full_path: str) -> FileResponse:  # noqa: D401
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404)

        candidate = directory / full_path
        if candidate.is_file():
            return FileResponse(candidate)

        html_candidate = directory / f"{full_path}.html"
        if html_candidate.is_file():
            return FileResponse(html_candidate)

        nested_index = directory / full_path / "index.html"
        if nested_index.is_file():
            return FileResponse(nested_index)

        index = directory / "index.html"
        if index.is_file():
            return FileResponse(index)

        raise HTTPException(status_code=404)

    # Mount /_next assets directly so StaticFiles handles caching headers.
    next_dir = directory / "_next"
    if next_dir.exists():
        app.mount("/_next", StaticFiles(directory=next_dir), name="next-assets")
