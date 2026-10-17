/**
 * The page the form lands on after a successful submission.
 *
 * The form submits with GET, so the values the browser sent appear in this
 * page's URL. submittedValues() reads them back, which lets a test confirm
 * that what was typed is exactly what was submitted.
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

  /**
   * Every submitted form value, read from the URL query string. The site's
   * internal name "number_of_employees" becomes "employees", so the keys match
   * the test data. A new form field shows up here without any change.
   */
  submittedValues() {
    const params = Object.fromEntries(new URL(this.page.url()).searchParams);
    const { number_of_employees: employees, ...fields } = params;
    return { ...fields, employees };
  }
}

module.exports = ThankYouPage;
