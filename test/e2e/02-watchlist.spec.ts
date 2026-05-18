import { test, expect } from "@playwright/test";
import { TID } from "./helpers/selectors";
import { waitForAppReady } from "./helpers/fixtures";

const NEW_TICKER = "PYPL";

test.describe("Watchlist add and remove", () => {
  test("adds a new ticker and then removes it", async ({ page }) => {
    await page.goto("/");
    await waitForAppReady(page);

    // Add via the input.
    await page.getByTestId(TID.watchlistAddInput).fill(NEW_TICKER);
    await page.getByTestId(TID.watchlistAddButton).click();

    await expect(
      page.getByTestId(TID.watchlistRow(NEW_TICKER)),
      "new ticker row should appear after add",
    ).toBeVisible();

    // Price should stream within 10s.
    await expect(page.getByTestId(TID.watchlistPrice(NEW_TICKER))).toHaveText(
      /\$?\d+(\.\d+)?/,
      { timeout: 10_000 },
    );

    // Remove it.
    await page.getByTestId(TID.watchlistRemove(NEW_TICKER)).click();

    await expect(
      page.getByTestId(TID.watchlistRow(NEW_TICKER)),
      "row should disappear after remove",
    ).toBeHidden();
  });
});
