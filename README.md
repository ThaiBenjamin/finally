# FinAlly — AI Trading Workstation

A trading terminal with streaming prices, a simulated portfolio, and an AI copilot that
executes trades through structured outputs instead of just describing them.

**Frontend:** https://finally-gules.vercel.app
**Backend:** https://finally-backend-cj11.onrender.com

The backend runs on Render's free plan and sleeps after about 15 minutes of inactivity, so
the first request after a cold start takes around 30 seconds to wake the container. After
that it's quick.

## The idea

Trading interfaces are dense because they have to be — a watchlist, a chart, positions, and
an order ticket all live at once. The usual way to add AI to one is a sidebar that answers
questions about whatever you're looking at. It reads the screen and explains it, and every
suggestion still ends with you finding the right field and typing the numbers in yourself.

This was built on the opposite premise: give the assistant the same powers the interface
has. "Sell my NVDA" should move shares, not explain which button moves them. That changes
what the model is allowed to return, since prose can't be executed, and it raises the
question the rest of the build is really about — what happens when a language model's output
is wired directly to something that spends money.

Everything in the demo is mock data. Prices come from a geometric Brownian motion simulator
seeded with realistic starting values, and the portfolio is $10,000 of virtual cash. No
broker, no real money, no live quotes anywhere on screen.

## What's in it

Prices stream to the browser over Server-Sent Events, and a watchlist flashes green or red
on every tick. Sparklines accumulate client-side from that same stream since page load. The
portfolio view has a treemap heatmap sized by weight and colored by P&L, plus a live value
chart. You can place market orders by hand with instant fills and fractional shares, or ask
the copilot to do it.

The copilot goes through LiteLLM to OpenRouter, and returns a typed schema rather than a
paragraph. It analyzes holdings, suggests trades, and executes them.

Real market data is a supported mode rather than a missing one: set a `MASSIVE_API_KEY` and
the backend swaps the simulator for a Polygon.io REST poller behind the same interface.
Nothing else in the system changes.

## How a copilot turn works

The current portfolio snapshot, the watchlist, and the last twenty messages get assembled
into the prompt, so "sell half my tech" resolves against real positions rather than asking
the model to remember them.

The model is then bound to a Pydantic shape — a message plus a list of trades and a list of
watchlist changes. Sides are restricted to buy or sell, quantities must be positive, and
tickers are normalized on the way in. Anything that doesn't fit fails at the boundary rather
than deeper in.

Every declared trade runs through the same `execute_trade` service the order ticket uses.
There's no separate AI code path to keep in sync, which means the assistant cannot buy
something a human couldn't. Results come back per action rather than per turn, because a
batch is rarely all-or-nothing — ten fills and one rejection for insufficient cash is a
normal turn, and the whole set is persisted alongside the assistant's message so reopening
the chat shows what actually happened rather than what was proposed.

Then nothing refetches. The trade changed the portfolio, the next SSE frame carries the
prices, and positions, the heatmap, and the value chart re-derive themselves. A trade placed
by the copilot animates exactly like one placed by hand.

## Some decisions worth explaining

**Correlated random walks, not independent noise.** Independently wandering tickers look
obviously fake, because a real market moves together. Prices are drawn through a Cholesky
decomposition of a sector correlation matrix — tech at 0.6, finance at 0.5, cross-sector at
0.3 — plus a small chance per tick of a 2–5% shock, so the charts have events instead of
drift.

**SSE rather than WebSockets.** Price data only travels one way. Server-Sent Events give
browser-native auto-reconnect and survive proxies with no handshake to manage, and the client
sends its intentions over ordinary REST calls.

**A version counter on the price cache.** The stream compares the cache's version to what it
last sent and skips the frame when nothing moved, so an idle market costs an integer
comparison instead of a serialized payload every 500 ms.

## Stack

| Layer | What |
|---|---|
| Frontend | Next.js 16 static export, React 19, TypeScript, Tailwind CSS |
| Charts | Lightweight Charts |
| Backend | Python 3.12, FastAPI, Uvicorn, `uv` |
| Streaming | Server-Sent Events |
| Database | SQLite with lazy schema init and auto-seeding |
| AI | LiteLLM to OpenRouter to Cerebras (`gpt-oss-120b`), structured outputs |
| Market data | GBM simulator by default, Massive (Polygon.io) polling when keyed |
| Testing | Vitest, pytest, Playwright |
| Deployment | Docker, Vercel for the frontend, Render for the backend |

## Running it

You'll need Docker with the daemon running, or Node 20+ and Python 3.12+ with
[`uv`](https://docs.astral.sh/uv/). The AI chat needs an OpenRouter API key — free signups
at https://openrouter.ai.

### With Docker

```bash
git clone https://github.com/ThaiBenjamin/finally.git
cd finally

cp .env.example .env       # set OPENROUTER_API_KEY

./scripts/start_windows.ps1   # Windows PowerShell
./scripts/start_mac.sh        # macOS / Linux
```

The app runs at http://localhost:8000. The named volume `finally-data` keeps the SQLite
database across restarts.

### Without Docker

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

```bash
cd frontend
npm install
npm run dev   # http://localhost:3000
```

Running the frontend on its own port means setting
`NEXT_PUBLIC_API_BASE_URL=http://localhost:8000` in `frontend/.env.local`, and
`FINALLY_CORS_ORIGINS=http://localhost:3000` for the backend.

### Tests

```bash
cd frontend && npm test        # unit
cd backend && uv run pytest    # backend
cd test && npx playwright test # end to end
```

## Environment variables

| Variable | Required | What it does |
|---|---|---|
| `OPENROUTER_API_KEY` | Yes | Key for the AI chat assistant |
| `MASSIVE_API_KEY` | No | Polygon.io key for real market data; omit to use the simulator |
| `LLM_MOCK` | No | `true` gives deterministic mock responses for tests and offline work |
| `FINALLY_CORS_ORIGINS` | No | Comma-separated origins allowed to call the backend, needed when frontend and backend deploy separately |

## Layout

```
finally/
├── frontend/    Next.js static export, TypeScript, Tailwind
├── backend/     FastAPI uv project (REST + SSE)
├── planning/    Project documentation and agent contracts
├── test/        Playwright end-to-end tests
├── db/          SQLite volume mount at runtime
├── scripts/     Per-OS start/stop helpers
├── Dockerfile   Multi-stage build, Node then Python
└── render.yaml  Render blueprint for the backend
```

This is the capstone for an agentic AI coding course, so the build ran the way it reads:
specialized coding agents working against a shared `planning/` directory, with the interfaces
above written down as contracts before the code that filled them in.

## License

See [LICENSE](LICENSE).
