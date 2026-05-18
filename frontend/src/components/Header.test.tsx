import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/market-context", () => ({
  useMarket: () => ({ connection: "connected" }),
}));

vi.mock("@/lib/portfolio-context", () => ({
  usePortfolio: () => ({
    portfolio: {
      cash_balance: 4250.55,
      positions: [],
      positions_value: 5749.5,
      total_value: 10000,
      unrealized_pl: 123.45,
    },
  }),
}));

describe("Header", () => {
  it("renders live portfolio metrics and connection dot", async () => {
    const { Header } = await import("./Header");
    render(<Header />);

    expect(screen.getByTestId("header-total-value").textContent).toContain("$10,000");
    expect(screen.getByTestId("header-cash-balance").textContent).toContain("$4,250.55");
    const dot = screen.getByTestId("connection-status");
    expect(dot.getAttribute("data-state")).toBe("connected");
  });
});
