/**
 * The assignment's required flow, end to end:
 *   1. Type values in the Name, Email, Phone, Company and Website fields
 *   2. (Bonus) Change Number of Employees from 1-10 to 51-500
 *   3. Take a screenshot of the page before clicking "Request a call back"
 *   4. Click "Request a call back"
 *   5. Write to console.log when the thank-you page is reached
 *
 * The bonus step runs before the screenshot so the new value is visible in it.
 * Every step is checked, not just performed, so the test fails at the exact
 * step that breaks.
 */

const assert = require('node:assert/strict');
const fs = require('fs');
const LandingPage = require('../pages/LandingPage');
const ThankYouPage = require('../pages/ThankYouPage');
const { validLead, employees } = require('../data/callbackForm.data');

describe('Request a call back', function () {
  it('submits a valid lead and reaches the thank-you page', async function () {
    const landing = await new LandingPage(this.page).open();

    // Step 1: type values in the five text fields.
    await landing.fillForm(validLead);
    assert.deepEqual(await landing.formValues(), validLead, 'The fields should hold the typed values');

    // Step 2 (bonus): change Number of Employees from 1-10 to 51-500.
    assert.equal(await landing.selectedEmployees(), employees.default, 'Employees should start at the default range');
    await landing.selectEmployees(employees.target);
    assert.equal(await landing.selectedEmployees(), employees.target, 'Employees should show the new range');

    // Step 3: screenshot before submitting.
    const screenshotPath = await landing.screenshot('before-submit');
    assert.ok(fs.existsSync(screenshotPath), `The screenshot should be saved at ${screenshotPath}`);

    // Step 4: click "Request a call back", capturing what the browser sends.
    const submission = await landing.submitAndCaptureRequest();

    // Step 5: confirm the thank-you page and log it.
    const thankYou = await new ThankYouPage(this.page).waitUntilLoaded();
    console.log(`      Reached the thank-you page: ${thankYou.url()}`);

    // And the browser sent exactly what was entered.
    assert.deepEqual(
      submission.values,
      { ...validLead, employees: employees.target },
      'The submitted values should match what was entered',
    );
  });

  it('offers the expected Number of Employees ranges', async function () {
    const landing = await new LandingPage(this.page).open();

    assert.deepEqual(await landing.employeeOptions(), employees.options, 'The dropdown should offer the expected ranges');
  });
});
