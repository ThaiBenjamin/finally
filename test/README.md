# FinAlly E2E Tests

Playwright end-to-end suite for the FinAlly trading workstation. Covers the
scenarios in `planning/PLAN.md` Section 12.

## Layout

```
test/
  package.json
  playwright.config.ts        BASE_URL defaults to http://localhost:8000
  docker-compose.test.yml     Brings up the app container with LLM_MOCK=true
  e2e/
    helpers/                  Shared selector constants and API helpers
    01-fresh-start.spec.ts
    02-watchlist.spec.ts
    03-buy.spec.ts
    04-sell.spec.ts
    05-portfolio-viz.spec.ts
    06-chat.spec.ts
    07-sse-resilience.spec.ts
```

## Running locally

```powershell
cd test
npm install
npm run install-browsers
npm run docker:up
npm test
npm run docker:down
```

To run against an already-running app on a different host/port:

```powershell
$env:BASE_URL = "http://localhost:8000"
npm test
```

## Selector contract

All UI assertions use `data-testid` attributes listed in
`e2e/helpers/selectors.ts`. If a selector is missing on the frontend, file a
task to the frontend-engineer with the required testid — do not fall back to
text/role selectors that may be fragile.

## Filing bugs

When a test fails, do not patch the test to make it pass. File a new task in
the TaskList with: scenario, expected vs actual, repro steps, and the
suspected owner (frontend / backend-api / llm / db / devops). Mark task #6
as blocked by the new task.
