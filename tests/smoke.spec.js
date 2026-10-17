/**
 * Smoke test: a fast check that the site under test is up and shows the form.
 *
 * If this fails, the problem is the environment (site down, wrong BASE_URL,
 * no network), not the form, so look there before debugging other tests.
 */

const assert = require('node:assert/strict');
const LandingPage = require('../pages/LandingPage');

describe('Smoke', function () {
  it('loads the landing page with the call-back form', async function () {
    const landing = await new LandingPage(this.page).open();

    assert.ok(await landing.submitButton.isVisible(), 'The "Request a call back" button should be visible');
  });
});
