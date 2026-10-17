/**
 * The Acme landing page and its "Request a call back" form.
 *
 * Every selector for this page is defined once, in the constructor. They find
 * elements by label and role (what a user sees), not by CSS classes or ids,
 * so they keep working when the page is restyled.
 */

const BasePage = require('./BasePage');

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
}

module.exports = LandingPage;
