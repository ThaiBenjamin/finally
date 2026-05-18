"""Smoke test: CORS middleware activates when FINALLY_CORS_ORIGINS is set."""

from __future__ import annotations

import importlib
import os

from fastapi.testclient import TestClient


def test_cors_headers_present_when_configured(monkeypatch):
    monkeypatch.setenv("FINALLY_CORS_ORIGINS", "https://finally.vercel.app")
    monkeypatch.setenv("LLM_MOCK", "true")

    import app.main as main

    importlib.reload(main)
    app = main.create_app()

    with TestClient(app) as client:
        r = client.get("/api/health", headers={"Origin": "https://finally.vercel.app"})
    assert r.status_code == 200
    assert r.headers.get("access-control-allow-origin") == "https://finally.vercel.app"


def test_cors_off_by_default(monkeypatch):
    monkeypatch.delenv("FINALLY_CORS_ORIGINS", raising=False)
    monkeypatch.setenv("LLM_MOCK", "true")

    import app.main as main

    importlib.reload(main)
    app = main.create_app()

    with TestClient(app) as client:
        r = client.get("/api/health", headers={"Origin": "https://finally.vercel.app"})
    assert r.status_code == 200
    assert "access-control-allow-origin" not in {k.lower() for k in r.headers}
