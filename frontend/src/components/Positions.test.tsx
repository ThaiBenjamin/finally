import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/market-context", () => ({
  useMarket: () => ({
    prices: {
      AAPL: { ticker: "AAPL", price: 200, previous_price: 190, timestamp: 1, change: 10, change_percent: 5, direction: "up" },
    },
    tickVersion: { AAPL: 1 },
  }),
}));

vi.mock("@/lib/portfolio-context", () => ({
  usePortfolio: () => ({
    portfolio: {
      cash_balance: 0,
      positions_value: 2000,
      total_value: 2000,
      unrealized_pl: 100,
      positions: [
        { ticker: "AAPL", quantity: 10, avg_cost: 190, current_price: 200, market_value: 2000, unrealized_pl: 100, unrealized_pl_percent: 5.26 },
      ],
    },
  }),
}));

vi.mock("@/lib/selection-context", () => ({
  useSelection: () => ({ selected: "AAPL", setSelected: vi.fn() }),
}));

describe("Positions", () => {
  it("renders P/L calculations from streaming price", async () => {
    const { Positions } = await import("./Positions");
    render(<Positions />);

    const row = screen.getByTestId("position-row-AAPL");
    expect(row).toBeInTheDocument();
    expect(screen.getByTestId("position-quantity-AAPL").textContent).toBe("10");
    expect(row.textContent).toContain("+$100.00");
  });
});
