/**
 * Screenshot helper, shared by the tests (the "before submit" screenshot)
 * and by the failure hook.
 */

const fs = require('fs');
const path = require('path');
const config = require('../config/config');

/** Deletes screenshots from earlier runs, so every file in the folder comes from this run. */
function clearScreenshots() {
  fs.rmSync(config.paths.screenshots, { recursive: true, force: true });
}

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
 *
 * CSS animations are finished before capturing, so a label caught halfway
 * through a transition can't make the same page look different between runs.
 */
async function takeScreenshot(page, name, dir = config.paths.screenshots) {
  const filePath = path.join(dir, `${toFileName(name)}.png`);
  await page.screenshot({ path: filePath, fullPage: true, animations: 'disabled' });
  return filePath;
}

module.exports = { clearScreenshots, takeScreenshot };
