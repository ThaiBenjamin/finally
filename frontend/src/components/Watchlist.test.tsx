import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const marketState = {
  prices: {
    AAPL: { ticker: "AAPL", price: 192.34, previous_price: 190.0, timestamp: 1, change: 2.34, change_percent: 1.23, direction: "up" as const },
    GOOGL: { ticker: "GOOGL", price: 175.0, previous_price: 176.0, timestamp: 1, change: -1.0, change_percent: -0.57, direction: "down" as const },
  },
  spark: { AAPL: [], GOOGL: [] },
  tickVersion: { AAPL: 1, GOOGL: 1 },
  connection: "connected" as const,
};

const portfolioState = {
  watchlist: [
    { ticker: "AAPL", added_at: "x", price: 192.34, previous_price: 190, change: 2.34, change_percent: 1.23, direction: "up" as const },
    { ticker: "GOOGL", added_at: "x", price: 175, previous_price: 176, change: -1, change_percent: -0.57, direction: "down" as const },
  ],
  addToWatchlist: vi.fn(),
  removeFromWatchlist: vi.fn(),
};

vi.mock("@/lib/market-context", () => ({
  useMarket: () => marketState,
  useTick: () => null,
}));

vi.mock("@/lib/portfolio-context", () => ({
  usePortfolio: () => portfolioState,
}));

vi.mock("@/lib/selection-context", () => ({
  useSelection: () => ({ selected: "AAPL", setSelected: vi.fn() }),
}));

describe("Watchlist", () => {
  beforeEach(() => {
    portfolioState.addToWatchlist.mockClear();
    portfolioState.removeFromWatchlist.mockClear();
  });

  it("renders rows with prices and direction-derived flash class", async () => {
    const { Watchlist } = await import("./Watchlist");
    render(<Watchlist />);
    expect(screen.getByTestId("watchlist-row-AAPL")).toBeInTheDocument();
    expect(screen.getByTestId("watchlist-row-GOOGL")).toBeInTheDocument();

    const aapl = screen.getByTestId("watchlist-price-AAPL");
    expect(aapl.textContent).toContain("$192.34");
    expect(aapl.className).toContain("flash-up");

    const googl = screen.getByTestId("watchlist-price-GOOGL");
    expect(googl.textContent).toContain("$175.00");
    expect(googl.className).toContain("flash-down");
  });

  it("renders add input and remove button per ticker", async () => {
    const { Watchlist } = await import("./Watchlist");
    render(<Watchlist />);
    expect(screen.getByTestId("watchlist-add-input")).toBeInTheDocument();
    expect(screen.getByTestId("watchlist-add-button")).toBeInTheDocument();
    expect(screen.getByTestId("watchlist-remove-AAPL")).toBeInTheDocument();
  });
});
