import { APIRequestContext, expect } from "@playwright/test";

/**
 * Thin wrappers over the backend REST API. Tests use these for setup,
 * teardown, and assertions that don't depend on UI state.
 */
export async function resetState(request: APIRequestContext) {
  // No dedicated reset endpoint in the spec; we wipe via the Docker volume.
  // This helper exists so tests can call it once a reset endpoint lands.
  void request;
}

export async function getPortfolio(request: APIRequestContext) {
  const res = await request.get("/api/portfolio");
  expect(res.ok(), `GET /api/portfolio -> ${res.status()}`).toBeTruthy();
  return res.json();
}

export async function getWatchlist(request: APIRequestContext) {
  const res = await request.get("/api/watchlist");
  expect(res.ok(), `GET /api/watchlist -> ${res.status()}`).toBeTruthy();
  return res.json();
}

export async function executeTrade(
  request: APIRequestContext,
  body: { ticker: string; quantity: number; side: "buy" | "sell" },
) {
  const res = await request.post("/api/portfolio/trade", { data: body });
  return { status: res.status(), body: await res.json().catch(() => null) };
}

export async function addToWatchlist(
  request: APIRequestContext,
  ticker: string,
) {
  return request.post("/api/watchlist", { data: { ticker } });
}

export async function removeFromWatchlist(
  request: APIRequestContext,
  ticker: string,
) {
  return request.delete(`/api/watchlist/${ticker}`);
}
