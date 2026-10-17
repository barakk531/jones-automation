/**
 * Known issues found while testing the site (details in README, "Issues found").
 *
 * Each test describes the CORRECT behaviour, so it fails today. They are
 * marked pending with it.skip(): the suite stays green, the report still lists
 * them, and when a bug is fixed, removing .skip turns its test into a
 * regression check.
 */

const assert = require('node:assert/strict');
const LandingPage = require('../pages/LandingPage');
const ThankYouPage = require('../pages/ThankYouPage');
const { validLead, invalidPhone } = require('../data/callbackForm.data');

describe('Known issues (pending until fixed)', function () {
  it.skip('#1 does not put personal data in the URL when the form is submitted', async function () {
    const landing = await new LandingPage(this.page).open();
    await landing.fillForm(validLead);
    await landing.submit();

    const sent = (await new ThankYouPage(this.page).waitUntilLoaded()).submittedValues();
    for (const field of ['name', 'email', 'phone']) {
      assert.equal(sent[field], undefined, `${field} should not appear in the thank-you page URL`);
    }
  });

  it.skip('#2 accepts a website in the format its placeholder suggests', async function () {
    const landing = await new LandingPage(this.page).open();
    const placeholder = await landing.field('website').getAttribute('placeholder');

    await landing.fillForm({ website: placeholder });

    assert.equal(await landing.validationMessage('website'), '', `Website should accept its own example "${placeholder}"`);
  });

  it.skip('#3 rejects a phone value that is not a phone number', async function () {
    const landing = await new LandingPage(this.page).open();

    await landing.fillForm({ phone: invalidPhone });

    assert.notEqual(await landing.validationMessage('phone'), '', `Phone should reject "${invalidPhone}"`);
  });
});
