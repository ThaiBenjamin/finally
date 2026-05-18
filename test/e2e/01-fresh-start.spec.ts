import { test, expect } from "@playwright/test";
import { TID, DEFAULT_TICKERS } from "./helpers/selectors";
import { waitForAppReady, readNumeric } from "./helpers/fixtures";

test.describe("Fresh start", () => {
  test("default watchlist, $10k cash, prices streaming", async ({ page }) => {
    await page.goto("/");
    await waitForAppReady(page);

    // All ten seed tickers visible.
    for (const ticker of DEFAULT_TICKERS) {
      await expect(
        page.getByTestId(TID.watchlistRow(ticker)),
        `${ticker} row should be visible`,
      ).toBeVisible();
    }

    // Starting cash exactly $10,000.
    const cash = await readNumeric(page, TID.cashBalance);
    expect(cash).toBe(10_000);

    // SSE delivers at least one price update within 5s after first paint.
    const priceLocator = page.getByTestId(TID.watchlistPrice("AAPL"));
    const first = await priceLocator.innerText();
    await expect(async () => {
      const next = await priceLocator.innerText();
      expect(next).not.toBe(first);
    }).toPass({ timeout: 5_000 });
  });
});
