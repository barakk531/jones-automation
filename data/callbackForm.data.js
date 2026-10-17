/**
 * Test data for the "Request a call back" form.
 *
 * Kept apart from tests and page objects, so values can change (or later come
 * from a file, an API or a generator) without touching test logic.
 *
 * The objects are frozen: a test that needs a variation makes its own copy,
 * e.g. { ...validLead, email: '' }, and cannot change the data other tests use.
 */

/** A complete, valid lead. Keys match the field names in LandingPage. */
const validLead = Object.freeze({
  name: 'Jane Tester',
  email: 'jane.tester@example.com',
  phone: '+1 555 010 0199',
  company: 'Jones Automation QA',
  website: 'https://example.com',
});

/** The "Number of Employees" dropdown: what it offers, its default, and the bonus target. */
const employees = Object.freeze({
  options: Object.freeze(['1-10', '11-50', '51-500', '500+']),
  default: '1-10',
  target: '51-500',
});

module.exports = { validLead, employees };
