/**
 * Smoke test: a fast check that the site under test is up.
 *
 * If this fails, the problem is the environment (site down, wrong BASE_URL,
 * no network), not the form, so look there before debugging other tests.
 */

const assert = require('node:assert/strict');

describe('Smoke', function () {
  it('loads the landing page', async function () {
    const response = await this.page.goto('/');

    assert.ok(response, 'No response received for the landing page');
    assert.ok(response.ok(), `Landing page returned HTTP ${response.status()}`);
  });
});
