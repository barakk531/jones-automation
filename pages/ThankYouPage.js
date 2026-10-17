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
    this.path = '/thank-you.html';
    this.urlPattern = /\/thank-you\.html/;
    this.heading = page.getByRole('heading', { name: 'Thank You!' });

    this.loadedIndicator = this.heading;
  }

  /**
   * The submitted form values, read from the URL query string. Keys match the
   * test data, so the site's internal name "number_of_employees" stays here.
   */
  submittedValues() {
    const params = new URL(this.page.url()).searchParams;
    return {
      name: params.get('name'),
      email: params.get('email'),
      phone: params.get('phone'),
      company: params.get('company'),
      website: params.get('website'),
      employees: params.get('number_of_employees'),
    };
  }
}

module.exports = ThankYouPage;
