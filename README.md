# Jones Automation — Playwright + Mocha

Automated tests for the Acme "Request a call back" form at https://test.netlify.app/,
built with [Playwright](https://playwright.dev/docs/library) and [Mocha](https://mochajs.org/).

## Requirements

- [Node.js](https://nodejs.org/en/download/) 20.19 or newer (`node --version`)

## Install

```bash
npm install                       # Playwright, Mocha, cross-env
npx playwright install chromium   # the browser Playwright drives
```

## Run

```bash
npm test             # headless (default)
npm run test:headed  # visible browser, slowed down to watch
```

## Configuration

All settings live in [`config/config.js`](config/config.js). Each one can be overridden with an
environment variable, so the same code runs locally, against another environment, or in CI.

| Variable | Default | Meaning |
| --- | --- | --- |
| `BASE_URL` | `https://test.netlify.app/` | Site under test |
| `HEADED` | off | `1` opens a visible browser |
| `SLOWMO` | `0` | Pause between browser actions (ms) |
| `ACTION_TIMEOUT` | `10000` | Max wait for a click / fill / select (ms) |
| `NAVIGATION_TIMEOUT` | `30000` | Max wait for a page load or URL change (ms) |
| `TEST_TIMEOUT` | `60000` | Max duration of one test (ms) |

Invalid values (for example `SLOWMO=fast`) stop the run immediately with a clear error message.

## How the tests run

- **One browser per run, a fresh page per test.** Chromium starts once (the slow part). Each test
  gets its own isolated browser context, so no cookies or form state carry over between tests.
- **Screenshot on failure.** When a test fails, a full-page screenshot is saved to
  `screenshots/failures/<test name>.png` and its path is printed under the failing test.
- **Always cleaned up.** Pages and the browser are closed even when a test fails.
- **Clear setup errors.** If Chromium isn't installed, the run stops with the command that fixes it.

This lives in [`support/`](support/) and is loaded for every test through `.mocharc.js`, so test
files contain only test steps.

## Project structure

```
config/config.js            settings: site URL, browser mode, timeouts, paths
data/callbackForm.data.js   test data: a valid lead, the dropdown's ranges
pages/BasePage.js           what every page object shares: open, wait until loaded, screenshot
pages/LandingPage.js        the landing page: form selectors and actions
pages/ThankYouPage.js       the thank-you page: load check, submitted values
support/browser.js          start the browser, open and close isolated pages
support/screenshots.js      save screenshots with safe file names
support/hooks.js            Mocha root hooks that wire it all together
tests/smoke.spec.js         quick check that the site is up
```

Each layer has one job:

| Layer | Knows about | Never contains |
| --- | --- | --- |
| `tests/` | what to check, in user language | selectors, URLs, hardcoded data |
| `pages/` | selectors and actions for one page | assertions |
| `data/` | input values and expected values | logic |
| `config/` | environment settings | test logic |
| `support/` | browser lifecycle, screenshots | anything page-specific |

So when the site's HTML changes, only `pages/` changes. When the data changes, only `data/` changes.

## Writing a test

Tests use page objects and test data, never raw selectors:

```js
const LandingPage = require('../pages/LandingPage');
const { validLead } = require('../data/callbackForm.data');

it('fills the call-back form', async function () {
  const landing = await new LandingPage(this.page).open();
  await landing.fillForm(validLead);
});
```

Use `function () {}`, not arrow functions, so Mocha can give the test its page as `this.page`.

## Adding a new page

1. Create `pages/MyPage.js` with a class that extends `BasePage`.
2. In its constructor, set `path`, define the page's selectors once, and set `loadedIndicator`
   (an element that is visible when the page is ready). Add `urlPattern` if the page is reached by
   navigation, so `waitUntilLoaded()` also checks the URL.
3. Add methods for what a user does on that page, named in user language (`submit()`, not
   `clickButton2()`).
