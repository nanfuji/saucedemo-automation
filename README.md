# SauceDemo E-Commerce – End-to-End Test Automation Framework

Playwright + TypeScript end-to-end test suite for [SauceDemo](https://www.saucedemo.com/), built with the Page Object Model, data-driven tests, independent price calculations and Playwright's HTML reporter.

## Tech stack

| Tool | Purpose |
| --- | --- |
| [Playwright Test](https://playwright.dev/) 1.48 | Browser automation, test runner, assertions, HTML report, traces |
| TypeScript 5 (strict) | Typed page objects, test data and helpers |
| Node.js 18+ (tested on 20) | Runtime |
| Git / GitHub | Version control |

## Getting started

```bash
npm install
npx playwright install --with-deps chromium   # or: npm run install:browsers
```

## Running tests

| Command | What it does |
| --- | --- |
| `npm test` | Run the full suite headless |
| `npm run test:headed` | Run with a visible browser |
| `npm run test:ui` | Open Playwright UI mode |
| `npm run test:debug` | Run with the Playwright inspector |
| `npm run test:login` / `test:inventory` / `test:cart` / `test:checkout` / `test:confirmation` / `test:navigation` / `test:ui-validation` / `test:advanced` | Run a single module |
| `npm run test:module -- @cart` | Run by tag (`@login`, `@inventory`, `@cart`, `@checkout`, `@order`, `@confirmation`, `@navigation`, `@ui`, `@advanced`) |
| `npx playwright test -g "CART-005"` | Run a single test case by ID |
| `npm run report` | Open the last HTML report |
| `npm run summary` | Print pass/fail/skip totals, duration and recorded defects from the last run |
| `npm run typecheck` | Type-check the project |

Environment overrides: `BASE_URL` (default `https://www.saucedemo.com`), `SAUCE_PASSWORD` (default: the public demo password), `CI=1` (enables retries, `forbidOnly` and 2 workers).

## Reports

Every run produces:

- **HTML report** in `playwright-report/` – passed / failed / skipped / expected-failure tests, per-test duration, annotations (known defects, observations, performance timings). Open it with `npm run report`.
- **JSON report** in `test-results/results.json` – consumed by `npm run summary`.
- **Failure artifacts** in `test-results/` – screenshot, video and trace (`npx playwright show-trace <trace.zip>`) are retained for failed tests only.

Generated reports are git-ignored.

## Project structure

```
saucedemo-automation/
├── tests/                       # Test scenarios + assertions only
│   ├── login.spec.ts            # LOGIN-001..012
│   ├── inventory.spec.ts        # INV-001..013
│   ├── cart.spec.ts             # CART-001..012
│   ├── checkout.spec.ts         # CHK-001..010, ORD-001..008
│   ├── order-confirmation.spec.ts # CONF-001..006
│   ├── navigation.spec.ts       # NAV-001..008
│   ├── ui.spec.ts               # UI-001..008
│   └── advanced.spec.ts         # ADV-001..010
├── pages/                       # Page Object Model
│   ├── BasePage.ts              # Shared base exposing the Header component
│   ├── components/Header.ts     # Logo, burger menu, cart icon/badge
│   ├── LoginPage.ts
│   ├── InventoryPage.ts
│   ├── ProductDetailsPage.ts
│   ├── CartPage.ts
│   ├── CheckoutPage.ts          # Checkout step one (customer information)
│   ├── OverviewPage.ts          # Checkout step two (order summary + totals)
│   └── CheckoutCompletePage.ts
├── fixtures/test-fixtures.ts    # Page-object fixtures, ShopFlows, loggedInInventory
├── test-data/
│   ├── users.ts                 # Centralised credentials + login error messages
│   ├── products.ts              # Product catalogue + sort scenarios
│   └── checkout.ts              # Customer data, validation scenarios, injection payloads
├── utils/helpers.ts             # Cent-based price parsing, tax/total calculation, sort oracle
├── scripts/summarize-results.mjs
├── playwright.config.ts
├── package.json
└── tsconfig.json
```

## Framework design

- **Page Object Model** – each page class owns its locators and interactions; specs contain only scenarios and assertions. A shared `Header` component (menu, cart badge, logout) is composed into every authenticated page through `BasePage`.
- **Fixtures** – `test-fixtures.ts` injects every page object, a `ShopFlows` helper (`loginAs`, `addToCartAndOpenCart`, `goToCheckoutInformation`, `goToOverview`) so login/cart/checkout logic is never duplicated, and a `loggedInInventory` fixture that starts a test already logged in as `standard_user`.
- **Locators** – user-facing locators first (`getByRole`, `getByPlaceholder`, `getByText`), with `getByTestId` mapped to SauceDemo's stable `data-test` attributes (`testIdAttribute: 'data-test'`) where no accessible role/name exists. No XPath.
- **Data-driven tests** – login negatives, the four sort options, checkout validation, unusual input, per-product detail checks, order-total scenarios (1 / 3 / 6 items), protected URLs, viewports and rapid-click counts are all arrays looped into individual tests.
- **Independent business logic** – `utils/helpers.ts` converts prices to integer cents, computes item total, 8% tax (half-up rounding) and grand total, and compares them with the values displayed on the overview page. No floating-point arithmetic is used.
- **Isolation** – every test runs in a fresh browser context (new cookies + localStorage), sets up its own state, and can be run on its own (`-g "<ID>"`). No test depends on another.
- **Waiting** – only Playwright auto-waiting and web-first assertions; there is no `waitForTimeout`. Global timeouts are raised (60 s test / 10 s expect) and `test.slow()` is used for `performance_glitch_user` scenarios.
- **Known application defects vs regressions** – intentional SauceDemo bugs (`problem_user`, `performance_glitch_user`) are tagged with a `known-defect` annotation. `problem_user` anomalies use `test.fail()` with assertions of the *correct* behaviour, so they show as expected failures today and will flag as "unexpectedly passed" if the defect is ever fixed. Genuine regressions show up as ordinary failures.

## Test coverage summary

| Module | Spec | Test cases (IDs) | Executed tests* |
| --- | --- | --- | --- |
| 1. Login & Authentication | `login.spec.ts` | LOGIN-001..012 | 12 |
| 2. Inventory & Product Catalog | `inventory.spec.ts` | INV-001..013 | 18 |
| 3. Shopping Cart | `cart.spec.ts` | CART-001..012 | 12 |
| 4. Checkout Information & Validation | `checkout.spec.ts` | CHK-001..010 | 10 |
| 5. Checkout Overview & Order Summary | `checkout.spec.ts` | ORD-001..008 | 15 |
| 6. Order Confirmation | `order-confirmation.spec.ts` | CONF-001..006 | 6 |
| 7. Navigation & User Session | `navigation.spec.ts` | NAV-001..008 | 8 |
| 8. UI & General Validation | `ui.spec.ts` | UI-001..008 | 10 |
| 9. Advanced Testing | `advanced.spec.ts` | ADV-001..010 | 17 |
| **Total** | | **87 test case IDs** | **108** |

\*Some IDs expand into several data-driven tests (e.g. INV-012 runs once per product, ORD-004/005/006 run for 1, 3 and 6 item carts, UI-008 runs for three viewports, ADV-007 covers five `problem_user` defects).

## Latest execution results

Actual results from `npx playwright test --workers=2` against https://www.saucedemo.com (Chromium, Playwright 1.48.2, Node 20, Ubuntu, 2 Nov 2026). An earlier single-worker run of the same suite gave identical results (108/108 as expected, 123.6 s).

| Metric | Result |
| --- | --- |
| Total executed tests | 108 (covering 87 test case IDs) |
| Passed | 103 |
| Expected failures (known `problem_user` defects, `test.fail()`) | 5 |
| Failed | 0 |
| Flaky | 0 |
| Skipped | 0 |
| Wall-clock duration | 94.5 s |

Re-generate this with `npm test && npm run summary`.

## Known application defects (intentional SauceDemo behaviour)

| User | Defect | Covered by |
| --- | --- | --- |
| `problem_user` | All product images are the same `sl-404` placeholder | ADV-007a |
| `problem_user` | Sorting has no effect | ADV-007b |
| `problem_user` | Add to cart does nothing for Bolt T-Shirt, Fleece Jacket and Test.allTheThings() T-Shirt; Remove does nothing for several others | ADV-007c |
| `problem_user` | Product links open the wrong item (id + 1) | ADV-007d |
| `problem_user` | Typing in *Last Name* overwrites *First Name*, so checkout always fails with "Last Name is required" | ADV-007e |
| `performance_glitch_user` | ~5 s artificial delay on login and on every sort | LOGIN-010, ADV-006 |
| `locked_out_user` | Login is rejected (by design) | LOGIN-008 |

## Observations (not intentional test-user bugs)

Recorded as `observation` annotations in the report:

- Cart contents stay in `localStorage` after logout and reappear at the next login (ADV-010).
- The checkout information form is cleared when the page is refreshed (ADV-005).
- The chosen sort order resets to *Name (A to Z)* after a refresh (NAV-008).
- Checkout fields have no `<label>` elements; the placeholder is the only label (CHK-010, accessibility gap).
- Unauthenticated access to a protected URL renders the login form with an error but leaves the protected URL in the address bar (no redirect).

## Known limitations

- Tests run against the public, shared SauceDemo site, so results depend on its availability and on any content changes made by Sauce Labs (e.g. the footer social links changed from Twitter to X).
- NAV-004 and UI-007 open external sites (saucelabs.com, linkedin.com); network restrictions can make them fail.
- SauceDemo has no quantity selector, real payments or a backend API, so quantity changes, payment validation and server-side checks are out of scope.
- Only Chromium is configured by default.
- Layout checks (UI-004, UI-008) verify geometry, not pixel-perfect visuals.

## Recommended future improvements

- Add Firefox, WebKit and mobile-emulation projects to `playwright.config.ts`.
- Visual regression with `toHaveScreenshot()` and accessibility scanning with `@axe-core/playwright`.
- GitHub Actions workflow that runs the suite and publishes the HTML report as an artifact / to GitHub Pages.
- Reuse an authenticated `storageState` for tests that don't target login to shorten execution time.
- ESLint + Prettier with the Playwright plugin and a pre-commit hook.
