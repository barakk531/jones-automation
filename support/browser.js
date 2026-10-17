/**
 * Browser lifecycle helpers.
 *
 * The only place that talks to Playwright's launch API. Hooks call these
 * functions instead of launching browsers themselves, so the options from
 * config (headless, slowMo, base URL, timeouts) are applied the same way
 * everywhere.
 */

const { chromium } = require('playwright');
const config = require('../config/config');

/** Starts Chromium with the browser options from config. */
async function launchBrowser() {
  try {
    return await chromium.launch({
      headless: config.browser.headless,
      slowMo: config.browser.slowMo,
    });
  } catch (error) {
    // Most common setup mistake: the browser binary was never downloaded.
    if (/Executable doesn't exist/i.test(error.message)) {
      throw new Error('Chromium is not installed. Run "npx playwright install chromium" and try again.', {
        cause: error,
      });
    }
    throw error;
  }
}

/**
 * Opens a fresh page in a new browser context. A new context per test means
 * no cookies, storage or form state can leak from one test into the next.
 */
async function openPage(browser) {
  const context = await browser.newContext({ baseURL: config.baseUrl });
  context.setDefaultTimeout(config.timeouts.action);
  context.setDefaultNavigationTimeout(config.timeouts.navigation);
  return context.newPage();
}

/** Closes the page together with its context. Safe to call with no page. */
async function closePage(page) {
  if (page) {
    await page.context().close();
  }
}

module.exports = { launchBrowser, openPage, closePage };
