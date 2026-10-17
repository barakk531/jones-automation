/**
 * Mocha root hooks, loaded for every test file through .mocharc.js.
 *
 * - Screenshots from earlier runs are cleared, so old files can't be mistaken for new ones.
 * - One browser for the whole run (starting Chromium is the slow part).
 * - A fresh, isolated page for every test, available to tests as `this.page`.
 * - When a test fails, a full-page screenshot goes to screenshots/failures/.
 * - Pages and the browser are always closed, even when a test fails.
 *
 * Tests must use `function () {}`, not arrow functions: Mocha passes
 * `this.page` through the function's `this`, which arrow functions don't have.
 *
 * The hook functions are named so that if one of them fails, Mocha's report
 * says which one (e.g. "before all" hook: launchSharedBrowser).
 */

const config = require('../config/config');
const { launchBrowser, openPage, closePage } = require('./browser');
const { clearScreenshots, takeScreenshot } = require('./screenshots');

let browser;

exports.mochaHooks = {
  beforeAll: [
    function clearOldScreenshots() {
      clearScreenshots();
    },
    async function launchSharedBrowser() {
      browser = await launchBrowser();
    },
  ],

  beforeEach: async function openFreshPage() {
    this.page = await openPage(browser);
  },

  afterEach: async function screenshotOnFailureAndClosePage() {
    const { page, currentTest } = this;
    try {
      if (page && currentTest.state === 'failed') {
        const file = await takeScreenshot(page, currentTest.fullTitle(), config.paths.failureScreenshots);
        console.log(`      Failure screenshot: ${file}`);
      }
    } catch (error) {
      // A screenshot problem must never hide the real test failure.
      console.warn(`      Could not save failure screenshot: ${error.message}`);
    } finally {
      await closePage(page);
      this.page = undefined;
    }
  },

  afterAll: async function closeSharedBrowser() {
    if (browser) {
      await browser.close();
    }
  },
};
