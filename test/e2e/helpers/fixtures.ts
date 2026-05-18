import { Page, expect } from "@playwright/test";
import { TID } from "./selectors";

/**
 * Wait for the SPA to be mounted and the SSE stream to deliver at least
 * one price update to the watchlist. Tests should call this first so they
 * don't race the EventSource connection.
 */
export async function waitForAppReady(page: Page, ticker = "AAPL") {
  await expect(
    page.getByTestId(TID.watchlistRow(ticker)),
    "default watchlist row should render",
  ).toBeVisible();

  const priceLocator = page.getByTestId(TID.watchlistPrice(ticker));
  await expect(priceLocator, "first price must arrive from SSE").toHaveText(
    /\$?\d+(\.\d+)?/,
    { timeout: 10_000 },
  );
}

export async function readNumeric(page: Page, testId: string): Promise<number> {
  const text = (await page.getByTestId(testId).innerText()).trim();
  const cleaned = text.replace(/[^0-9.\-]/g, "");
  const value = Number(cleaned);
  if (Number.isNaN(value)) {
    throw new Error(`Could not parse number from "${text}" (testid=${testId})`);
  }
  return value;
}
