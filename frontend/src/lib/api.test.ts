import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { api } from "./api";

const originalFetch = globalThis.fetch;

function mockFetchOnce(response: Response) {
  globalThis.fetch = vi.fn().mockResolvedValue(response) as unknown as typeof fetch;
}

describe("api wrapper", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn() as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("treats 204 No Content as a successful empty response (regression: watchlist DELETE)", async () => {
    mockFetchOnce(new Response(null, { status: 204 }));
    await expect(api.removeWatchlist("PYPL")).resolves.toBeUndefined();
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/watchlist/PYPL",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("parses JSON for successful 200 responses", async () => {
    mockFetchOnce(new Response(JSON.stringify({ cash_balance: 100, positions: [], positions_value: 0, total_value: 100, unrealized_pl: 0 }), { status: 200, headers: { "Content-Type": "application/json" } }));
    const p = await api.portfolio();
    expect(p.cash_balance).toBe(100);
  });

  it("throws with backend detail on non-ok", async () => {
    mockFetchOnce(new Response(JSON.stringify({ detail: "insufficient cash" }), { status: 400, headers: { "Content-Type": "application/json" } }));
    await expect(api.trade({ ticker: "AAPL", quantity: 1, side: "buy" })).rejects.toThrow("insufficient cash");
  });
});
