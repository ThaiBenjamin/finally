import { test, expect } from "@playwright/test";
import { TID } from "./helpers/selectors";
import { waitForAppReady } from "./helpers/fixtures";

test.describe("SSE resilience", () => {
  test("connection indicator reflects disconnect and reconnect", async ({
    page,
  }) => {
    // Phase 1 — happy path: stream is reachable, indicator reaches "connected".
    await page.goto("/");
    await waitForAppReady(page);

    const indicator = page.getByTestId(TID.connectionStatus);
    await expect(indicator).toHaveAttribute("data-state", "connected", {
      timeout: 10_000,
    });

    // Phase 2 — gated reconnect: install a route that aborts the stream, then
    // reload. The new EventSource attempt will be aborted, exercising the
    // frontend's reconnect/disconnect handling.
    await page.route("**/api/stream/prices", (route) => route.abort());
    await page.reload();

    await expect(indicator).toHaveAttribute(
      "data-state",
      /connecting|reconnecting|disconnected/,
      { timeout: 15_000 },
    );

    // Phase 3 — recovery: lift the abort, reload, indicator returns to "connected".
    await page.unroute("**/api/stream/prices");
    await page.reload();

    await expect(indicator).toHaveAttribute("data-state", "connected", {
      timeout: 20_000,
    });
  });
});
