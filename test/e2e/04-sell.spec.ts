import { test, expect } from "@playwright/test";
import { TID } from "./helpers/selectors";
import { waitForAppReady, readNumeric } from "./helpers/fixtures";
import { executeTrade } from "./helpers/api";

const TICKER = "MSFT";

test.describe("Sell shares", () => {
  test("cash increases and position updates or disappears", async ({
    page,
    request,
  }) => {
    // Seed a position via the API so this test is independent of the buy spec.
    const buy = await executeTrade(request, {
      ticker: TICKER,
      quantity: 2,
      side: "buy",
    });
    expect(buy.status, `seed buy must succeed (${buy.status})`).toBeLessThan(300);

    await page.goto("/");
    await waitForAppReady(page, TICKER);

    await expect(page.getByTestId(TID.positionRow(TICKER))).toBeVisible();

    const cashBefore = await readNumeric(page, TID.cashBalance);

    // Sell 1 share via UI.
    await page.getByTestId(TID.tradeTicker).fill(TICKER);
    await page.getByTestId(TID.tradeQuantity).fill("1");
    await page.getByTestId(TID.tradeSell).click();

    await expect.poll(async () => readNumeric(page, TID.cashBalance)).toBeGreaterThan(
      cashBefore,
    );

    // Position should still show 1 share remaining.
    await expect(page.getByTestId(TID.positionQuantity(TICKER))).toHaveText(
      /1(\.0+)?/,
    );

    // Sell the last share — position row should disappear.
    await page.getByTestId(TID.tradeTicker).fill(TICKER);
    await page.getByTestId(TID.tradeQuantity).fill("1");
    await page.getByTestId(TID.tradeSell).click();

    await expect(page.getByTestId(TID.positionRow(TICKER))).toBeHidden();
  });
});
