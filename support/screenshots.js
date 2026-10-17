/**
 * Screenshot helper, shared by the tests (the "before submit" screenshot)
 * and by the failure hook.
 */

const path = require('path');
const config = require('../config/config');

/** Turns any text into a safe file name: "Form: submits OK!" -> "form-submits-ok". */
function toFileName(text) {
  const name = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
  return name || 'screenshot';
}

/**
 * Saves a full-page screenshot as <dir>/<name>.png and returns the file path.
 * Playwright creates the folder if it does not exist yet.
 */
async function takeScreenshot(page, name, dir = config.paths.screenshots) {
  const filePath = path.join(dir, `${toFileName(name)}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  return filePath;
}

module.exports = { takeScreenshot };
