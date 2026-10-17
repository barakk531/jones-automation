/**
 * Validation: the form must refuse incomplete or malformed input, tell the
 * user which field is wrong, and keep what they already typed.
 *
 * The form relies on the browser's built-in validation (`required`,
 * `type="email"`). The tests check that a validation message exists, not its
 * exact wording, because the wording differs between browsers and languages.
 */

const assert = require('node:assert/strict');
const LandingPage = require('../pages/LandingPage');
const { validLead, requiredFields, invalidEmails } = require('../data/callbackForm.data');

/** Fills the form with `lead`, submits, and checks the browser blocked it because of `invalidField`. */
async function expectSubmissionBlocked(page, lead, invalidField) {
  const landing = await new LandingPage(page).open();
  await landing.fillForm(lead);

  // Checked before clicking: if the field were wrongly accepted, the form would
  // submit and navigate away, and this is the message the failure should show.
  assert.notEqual(await landing.validationMessage(invalidField), '', `"${invalidField}" should show a validation message`);

  const urlBefore = landing.url();
  await landing.submit();

  assert.equal(landing.url(), urlBefore, 'The page should not change');
  assert.deepEqual(await landing.formValues(), lead, 'The typed values should be kept');
}

describe('Request a call back: validation', function () {
  for (const field of requiredFields) {
    it(`blocks submission when ${field} is empty`, async function () {
      await expectSubmissionBlocked(this.page, { ...validLead, [field]: '' }, field);
    });
  }

  for (const email of invalidEmails) {
    it(`blocks submission for invalid email "${email}"`, async function () {
      await expectSubmissionBlocked(this.page, { ...validLead, email }, 'email');
    });
  }
});
