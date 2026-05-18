import type {
  ChatResponse,
  PortfolioHistoryResponse,
  PortfolioResponse,
  TradeRequest,
  TradeResponse,
  WatchlistItem,
} from "./types";

export const API_BASE_URL =
  (process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "") || "";
const BASE = `${API_BASE_URL}/api`;

async function jsonFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const body = (await res.json()) as { detail?: string };
      if (body?.detail) detail = body.detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T;
  }
  return (await res.json()) as T;
}

export const api = {
  portfolio: () => jsonFetch<PortfolioResponse>(`${BASE}/portfolio`),
  history: () => jsonFetch<PortfolioHistoryResponse>(`${BASE}/portfolio/history`),
  trade: (req: TradeRequest) =>
    jsonFetch<TradeResponse>(`${BASE}/portfolio/trade`, {
      method: "POST",
      body: JSON.stringify(req),
    }),
  watchlist: () => jsonFetch<WatchlistItem[]>(`${BASE}/watchlist`),
  addWatchlist: (ticker: string) =>
    jsonFetch<WatchlistItem>(`${BASE}/watchlist`, {
      method: "POST",
      body: JSON.stringify({ ticker }),
    }),
  removeWatchlist: (ticker: string) =>
    jsonFetch<void>(`${BASE}/watchlist/${encodeURIComponent(ticker)}`, {
      method: "DELETE",
    }),
  chat: (message: string) =>
    jsonFetch<ChatResponse>(`${BASE}/chat`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
};
