# 📈 FinAlly — AI Trading Workstation

A visually stunning, AI-powered trading workstation that streams live market data, simulates portfolio trading, and integrates an LLM chat assistant that can analyze positions and execute trades via natural language.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?logo=sqlite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?logo=docker&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?logo=vercel&logoColor=white)
![Render](https://img.shields.io/badge/Render-Backend-46E3B7?logo=render&logoColor=white)

---

## 🌐 Live Demo

- **Frontend (UI):** https://finally-gules.vercel.app
- **Backend (API):** https://finally-backend-cj11.onrender.com

> The backend runs on Render's free plan and sleeps after ~15 min of inactivity — the first request after a cold start takes ~30s to wake the container, then everything is snappy.

---

## ✨ Features

- **Live Price Streaming** — Server-Sent Events feed a watchlist that flashes green / red on every tick
- **Simulated Portfolio** — Start with $10k virtual cash, market orders, instant fills, fractional shares
- **Portfolio Visualizations** — Treemap heatmap sized by weight and colored by P&L, plus a live portfolio-value chart
- **AI Chat Assistant** — Natural-language interface (LiteLLM → OpenRouter → Cerebras) that analyzes holdings, suggests trades, and auto-executes them through structured outputs
- **Watchlist Management** — Add and remove tickers manually or via the AI assistant
- **Sparklines Everywhere** — Mini-charts accumulated client-side from the SSE stream since page load
- **Dark Terminal Aesthetic** — Bloomberg-inspired, data-dense layout
- **Two Market Data Modes** — Built-in GBM simulator (default) or live data via the Massive (Polygon.io) API
- **Fully Tested** — Vitest unit tests on the frontend, pytest coverage on the backend, and Playwright E2E suites

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (static export), React 19, TypeScript, Tailwind CSS |
| Charts | Lightweight Charts |
| Backend | Python 3.12, FastAPI, Uvicorn, `uv` |
| Streaming | Server-Sent Events (SSE) for live price ticks |
| Database | SQLite with lazy schema init and auto-seeding |
| AI | LiteLLM → OpenRouter → Cerebras (`gpt-oss-120b`) with structured outputs |
| Market Data | GBM simulator (default) or Massive (Polygon.io) REST polling |
| Testing | Vitest, pytest, Playwright |
| Deployment | Docker (single container), Vercel (frontend), Render (backend) |

---

## 🚀 Setup & Running

### Prerequisites

- Docker (with the daemon running), **or** Node.js 20+ and Python 3.12+ with [`uv`](https://docs.astral.sh/uv/)
- An OpenRouter API key for the AI chat — free signups at https://openrouter.ai

### Option A — Docker (recommended)

```bash
git clone https://github.com/ThaiBenjamin/finally.git
cd finally

# Configure
cp .env.example .env       # then edit .env and set OPENROUTER_API_KEY

# Start (Windows PowerShell)
./scripts/start_windows.ps1

# Start (macOS / Linux)
./scripts/start_mac.sh
```

The app runs at **http://localhost:8000**. The named Docker volume `finally-data` keeps your SQLite database across restarts.

### Option B — Local development

```bash
# Backend
cd backend
uv sync
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev   # runs at http://localhost:3000
```

When running the frontend on a separate port, set `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000` in `frontend/.env.local` and `FINALLY_CORS_ORIGINS=http://localhost:3000` for the backend.

### Running Tests

```bash
# Frontend unit tests
cd frontend && npm test

# Backend tests
cd backend && uv run pytest

# End-to-end (Playwright)
cd test && npx playwright test
```

---

## ⚙️ Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENROUTER_API_KEY` | Yes | OpenRouter API key for the AI chat assistant |
| `MASSIVE_API_KEY` | No | Massive (Polygon.io) key for real market data; omit to use the simulator |
| `LLM_MOCK` | No | Set `true` for deterministic mock LLM responses (tests / offline dev) |
| `FINALLY_CORS_ORIGINS` | No | Comma-separated origins allowed to call the backend cross-origin — needed when frontend and backend are deployed separately (e.g. Vercel + Render) |

---

## 🧠 What I Built and Why

FinAlly is the capstone project for an agentic AI coding course — every line of code was written by orchestrated coding agents working through a shared `planning/` directory, demonstrating how a team of specialized agents can ship a production-quality full-stack application.

The most interesting design decision was wiring the LLM to use **structured outputs** for trade execution. Instead of treating the AI as a chat box, it returns a typed JSON schema (`{ message, trades[], watchlist_changes[] }`) that the backend parses and auto-executes through the same validation path as manual trades. You can ask "rebalance my tech exposure" and watch positions actually move — agentic AI as a first-class UI affordance, not an afterthought.

The architecture is deliberately small: one Docker container, one SQLite file, one SSE stream feeding a single in-memory price cache. The simulator / Massive split lives behind a shared abstract interface so the rest of the system never knows which data source is active. That same boundary makes it trivial to deploy in two pieces — static frontend on Vercel, FastAPI backend on Render — exactly as the live demo above does.

---

## 📁 Project Structure

```
finally/
├── frontend/    # Next.js static export, TypeScript, Tailwind
├── backend/     # FastAPI uv project (REST + SSE)
├── planning/    # Project documentation and agent contracts
├── test/        # Playwright E2E tests
├── db/          # SQLite volume mount (runtime)
├── scripts/     # Per-OS start/stop helpers
├── Dockerfile   # Multi-stage build (Node → Python)
└── render.yaml  # Render Blueprint for backend deploy
```

## 📄 License

See [LICENSE](LICENSE).
