/**
 * The page the form lands on after a successful submission.
 */

const BasePage = require('./BasePage');

class ThankYouPage extends BasePage {
  /** @param {import('playwright').Page} page */
  constructor(page) {
    super(page);
    this.path = 'thank-you.html';
    this.urlPattern = /\/thank-you\.html/;
    this.heading = page.getByRole('heading', { name: 'Thank You!' });

    this.loadedIndicator = this.heading;
  }

  /** The query-string parameters in this page's URL, as a plain object. */
  urlParams() {
    return Object.fromEntries(new URL(this.page.url()).searchParams);
  }
}

module.exports = ThankYouPage;
