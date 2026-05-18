import { test, expect } from "@playwright/test";
import { TID } from "./helpers/selectors";
import { waitForAppReady } from "./helpers/fixtures";
import { executeTrade } from "./helpers/api";

const TICKER = "NVDA";

test.describe("Portfolio visualizations", () => {
  test("heatmap renders a cell and P&L chart has data after a trade", async ({
    page,
    request,
  }) => {
    const buy = await executeTrade(request, {
      ticker: TICKER,
      quantity: 3,
      side: "buy",
    });
    expect(buy.status, `seed buy status ${buy.status}`).toBeLessThan(300);

    await page.goto("/");
    await waitForAppReady(page, TICKER);

    // Heatmap exists and contains a cell for the position.
    await expect(page.getByTestId(TID.heatmap)).toBeVisible();
    await expect(page.getByTestId(TID.heatmapCell(TICKER))).toBeVisible();

    // P&L chart is mounted and has at least one rendered path/element.
    const chart = page.getByTestId(TID.pnlChart);
    await expect(chart).toBeVisible();

    // Confirm the chart actually drew something (svg path / canvas).
    const hasContent = await chart.evaluate((el) => {
      const svgPaths = el.querySelectorAll("svg path, svg circle, svg line");
      const canvases = el.querySelectorAll("canvas");
      return svgPaths.length > 0 || canvases.length > 0;
    });
    expect(hasContent, "P&L chart should have at least one drawn element").toBe(
      true,
    );
  });
});
