import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for FinAlly E2E tests.
 *
 * The app is expected to be running at BASE_URL (default http://localhost:8000).
 * Start it with `npm run docker:up` from this directory, or via the project's
 * top-level start script with LLM_MOCK=true exported in the environment.
 */
const BASE_URL = process.env.BASE_URL ?? "http://localhost:8000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
