import { test, expect } from "@playwright/test";
import { TID } from "./helpers/selectors";
import { waitForAppReady, readNumeric } from "./helpers/fixtures";

const TICKER = "AAPL";
const QTY = 1;

test.describe("Buy shares", () => {
  test("cash decreases, position appears, total updates", async ({ page }) => {
    await page.goto("/");
    await waitForAppReady(page, TICKER);

    const cashBefore = await readNumeric(page, TID.cashBalance);
    const totalBefore = await readNumeric(page, TID.totalValue);

    await page.getByTestId(TID.tradeTicker).fill(TICKER);
    await page.getByTestId(TID.tradeQuantity).fill(String(QTY));
    await page.getByTestId(TID.tradeBuy).click();

    // Position row appears.
    await expect(page.getByTestId(TID.positionRow(TICKER))).toBeVisible();

    // Position quantity reflects the buy.
    await expect(page.getByTestId(TID.positionQuantity(TICKER))).toHaveText(
      new RegExp(`${QTY}(\\.0+)?`),
    );

    // Cash decreased.
    await expect.poll(async () => readNumeric(page, TID.cashBalance)).toBeLessThan(
      cashBefore,
    );

    // Total value is still roughly preserved (cash + position value).
    const totalAfter = await readNumeric(page, TID.totalValue);
    expect(Math.abs(totalAfter - totalBefore) / totalBefore).toBeLessThan(0.05);
  });
});
