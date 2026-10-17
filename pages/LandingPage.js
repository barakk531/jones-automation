/**
 * The Acme landing page and its "Request a call back" form.
 *
 * Every selector for this page is defined once, in the constructor. They find
 * elements by label and role (what a user sees), not by CSS classes or ids,
 * so they keep working when the page is restyled.
 */

const BasePage = require('./BasePage');

/**
 * Turns submitted form data into an object keyed like the test data. A field
 * sent more than once fails loudly, since the server might read the wrong copy.
 */
function readSentValues(formData) {
  const values = {};
  for (const [key, value] of new URLSearchParams(formData)) {
    if (Object.hasOwn(values, key)) {
      throw new Error(`The form sent "${key}" more than once.`);
    }
    values[key] = value;
  }
  // The site calls the dropdown "number_of_employees"; the test data calls it "employees".
  const { number_of_employees: employees, ...fields } = values;
  return { ...fields, employees };
}

class LandingPage extends BasePage {
  /** @param {import('playwright').Page} page */
  constructor(page) {
    super(page);
    this.path = './';

    // Text fields, keyed by the same names the test data uses.
    this.fields = {
      name: page.getByLabel('Name'),
      email: page.getByLabel('Email'),
      phone: page.getByLabel('Phone'),
      company: page.getByLabel('Company'),
      website: page.getByLabel('Website'),
    };
    this.employeesSelect = page.getByLabel('Number of Employees');
    this.submitButton = page.getByRole('button', { name: 'Request a call back' });

    this.loadedIndicator = this.submitButton;
  }

  /** Returns a text field's locator. Fails clearly on an unknown name, e.g. a typo in test data. */
  field(name) {
    if (!Object.hasOwn(this.fields, name)) {
      throw new Error(`Unknown form field "${name}". Known fields: ${Object.keys(this.fields).join(', ')}.`);
    }
    return this.fields[name];
  }

  /** Types each value of `lead` into its field. Fields missing from `lead` are left untouched. */
  async fillForm(lead) {
    for (const [name, value] of Object.entries(lead)) {
      await this.field(name).fill(value);
    }
  }

  /** Reads the current value of every text field, keyed like the test data. */
  async formValues() {
    const values = {};
    for (const [name, locator] of Object.entries(this.fields)) {
      values[name] = await locator.inputValue();
    }
    return values;
  }

  /** The ranges the "Number of Employees" dropdown offers, as shown to the user. */
  async employeeOptions() {
    const labels = await this.employeesSelect.locator('option').allTextContents();
    return labels.map((label) => label.trim());
  }

  /** The range currently selected in "Number of Employees", as shown to the user. */
  async selectedEmployees() {
    return this.employeesSelect.evaluate((select) => select.selectedOptions[0]?.textContent.trim());
  }

  /** Selects a "Number of Employees" range by its visible label. Fails fast if the range doesn't exist. */
  async selectEmployees(range) {
    const options = await this.employeeOptions();
    if (!options.includes(range)) {
      throw new Error(`"${range}" is not a Number of Employees option. Available: ${options.join(', ')}.`);
    }
    await this.employeesSelect.selectOption({ label: range });
  }

  /** The browser's validation message for a field, or '' when its value is valid. */
  async validationMessage(name) {
    return this.field(name).evaluate((input) => input.validationMessage);
  }

  /** Whether a field currently has keyboard focus. */
  async isFocused(name) {
    return this.field(name).evaluate((input) => input === input.ownerDocument.activeElement);
  }

  /** Clicks "Request a call back". Whether the page changes is up to the caller to check. */
  async submit() {
    await this.submitButton.click();
  }

  /**
   * Clicks "Request a call back" and returns the request the browser sent:
   * its method, its URL, and its values keyed like the test data.
   *
   * Values are read from the URL for GET and from the body for POST, so checks
   * keep working if the site fixes known issue #1 by switching to POST. This
   * covers standard HTML form submissions (URL-encoded); any other body type
   * stops with a clear error instead of a misleading comparison.
   */
  async submitAndCaptureRequest() {
    const [request] = await Promise.all([
      this.page.waitForRequest((req) => req.isNavigationRequest() && req.frame() === this.page.mainFrame()),
      this.submit(),
    ]);

    const method = request.method();
    let formData;
    if (method === 'GET') {
      formData = new URL(request.url()).search;
    } else {
      const contentType = (await request.headerValue('content-type')) || 'no content type';
      if (!contentType.startsWith('application/x-www-form-urlencoded')) {
        throw new Error(`The form was sent as ${method} with "${contentType}"; only GET and URL-encoded POST are supported.`);
      }
      formData = request.postData() || '';
    }
    return { method, url: request.url(), values: readSentValues(formData) };
  }
}

module.exports = LandingPage;
