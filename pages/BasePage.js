/**
 * Base class for all page objects.
 *
 * A page object wraps one page of the site: its selectors live in one class,
 * and tests call readable actions (fillForm, submit) instead of raw selectors.
 * When the site's HTML changes, only the page object needs updating.
 *
 * Each page object sets these in its constructor:
 *   path            where open() navigates, relative to config.baseUrl. No
 *                   leading "/", so a base URL with a sub-path keeps it.
 *   loadedIndicator an element that is visible once the page is ready
 *   urlPattern      (optional) a RegExp the URL must match once the page is ready
 */

const { takeScreenshot } = require('../support/screenshots');

class BasePage {
  /** @param {import('playwright').Page} page */
  constructor(page) {
    this.page = page;
  }

  /** Navigates to this page and waits until it is ready. */
  async open() {
    if (!this.path) {
      throw new Error(`${this.constructor.name} has no path, so it cannot be opened directly.`);
    }

    const response = await this.page.goto(this.path);
    if (!response || !response.ok()) {
      const status = response ? `HTTP ${response.status()}` : 'no response';
      throw new Error(`${this.constructor.name}: could not open ${this.path} (${status}).`);
    }
    return this.waitUntilLoaded();
  }

  /**
   * Waits until this page is ready: the URL matches urlPattern (if the page
   * defines one) and the loaded indicator is visible. On timeout, the error
   * says which page was expected and which URL the browser is actually on.
   */
  async waitUntilLoaded() {
    try {
      if (this.urlPattern) {
        await this.page.waitForURL(this.urlPattern);
      }
      await this.loadedIndicator.waitFor({ state: 'visible' });
    } catch (error) {
      throw new Error(`${this.constructor.name} did not load. Current URL: ${this.page.url()}\n${error.message}`, {
        cause: error,
      });
    }
    return this;
  }

  /** The URL the browser is currently on. */
  url() {
    return this.page.url();
  }

  /** Saves a full-page screenshot as screenshots/<name>.png and returns its path. */
  screenshot(name) {
    return takeScreenshot(this.page, name);
  }
}

module.exports = BasePage;
