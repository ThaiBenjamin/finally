import { test, expect } from "@playwright/test";
import { TID } from "./helpers/selectors";
import { waitForAppReady } from "./helpers/fixtures";

/**
 * Runs against LLM_MOCK=true. The mock is expected to:
 *   - Respond to "buy 1 share of AAPL" with an assistant message AND
 *     a structured trade that auto-executes.
 *
 * If the mock contract changes, update the prompt below and notify llm-engineer.
 */
test.describe("AI chat (mocked)", () => {
  test("sends a message and shows assistant response + trade confirmation", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForAppReady(page);

    // Welcome bubble is rendered on mount.
    const messages = page.getByTestId(TID.chatMessage);
    await expect(messages).toHaveCount(1, { timeout: 5_000 });

    await page.getByTestId(TID.chatInput).fill("buy 1 share of AAPL");
    await page.getByTestId(TID.chatSend).click();

    // After one round-trip: welcome + user + assistant reply = 3.
    await expect(messages).toHaveCount(3, { timeout: 15_000 });
    await expect(page.locator(`[data-testid="${TID.chatMessage}"][data-role="user"]`)).toHaveCount(1);
    await expect(
      page.locator(`[data-testid="${TID.chatMessage}"][data-role="assistant"]`),
    ).toHaveCount(2);

    // Inline trade confirmation rendered.
    await expect(
      page.getByTestId(TID.chatTradeConfirmation).first(),
      "executed-trade confirmation should appear inline in chat",
    ).toBeVisible({ timeout: 15_000 });

    // Position now exists.
    await expect(page.getByTestId(TID.positionRow("AAPL"))).toBeVisible();
  });
});
