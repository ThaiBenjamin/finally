"""Smoke test: `app.main:app` (devops Dockerfile entrypoint) imports cleanly.

Catches any wiring breakage between routers / state / static-files without
booting the lifespan.
"""

from __future__ import annotations


def test_app_main_imports_and_has_routes() -> None:
    # The autouse install_fake_db fixture has already populated app.db.*.
    from app.main import app, create_app

    assert app is not None
    assert callable(create_app)
    paths = {getattr(r, "path", None) for r in app.routes}
    assert "/api/health" in paths
    assert "/api/portfolio" in paths
    assert "/api/portfolio/trade" in paths
    assert "/api/portfolio/history" in paths
    assert "/api/watchlist" in paths
    assert "/api/stream/prices" in paths


def test_resolve_static_dir_respects_env(monkeypatch, tmp_path) -> None:
    from app.static_files import resolve_static_dir

    monkeypatch.setenv("FINALLY_STATIC_DIR", str(tmp_path))
    assert resolve_static_dir() == tmp_path

    monkeypatch.delenv("FINALLY_STATIC_DIR")
    # Falls back to default path under backend/
    assert resolve_static_dir().name == "static"
