/**
 * Central configuration.
 *
 * The single place for values that can change between environments or runs:
 * the site URL, browser mode, timeouts and output paths. Tests and page
 * objects read from here and never hardcode these values, so pointing the
 * suite at another environment is a config change, not a code change.
 *
 * Every value can be overridden with an environment variable (see README).
 * Invalid values fail fast with a clear message instead of being silently
 * ignored, so a typo in CI does not turn into a confusing test failure.
 */

const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

// Node's timers overflow above this (about 24.8 days), and Mocha treats larger
// timeouts as "no timeout", so bigger values are rejected too.
const MAX_MS = 2_147_483_647;

/** Reads a whole number of milliseconds (min..MAX_MS) from an env var, or returns the default when unset. */
function msFromEnv(name, defaultValue, { min = 0 } = {}) {
  const raw = (process.env[name] || '').trim();
  if (raw === '') return defaultValue;

  if (!/^\d+$/.test(raw) || Number(raw) < min || Number(raw) > MAX_MS) {
    throw new Error(`Invalid ${name}="${raw}": expected a whole number of milliseconds from ${min} to ${MAX_MS}.`);
  }
  return Number(raw);
}

/** Reads an on/off switch from an env var: 1/true or 0/false. Unset means off. */
function flagFromEnv(name) {
  const raw = (process.env[name] || '').trim().toLowerCase();
  if (raw === '' || raw === '0' || raw === 'false') return false;
  if (raw === '1' || raw === 'true') return true;
  throw new Error(`Invalid ${name}="${process.env[name]}": expected 1/true or 0/false.`);
}

/**
 * Reads the site's base address from an env var and checks it is an http(s)
 * URL of a folder, not a page. Page paths are relative, so the base always
 * ends with "/": that keeps a sub-path such as https://host/staging/.
 */
function urlFromEnv(name, defaultValue) {
  const value = (process.env[name] || '').trim() || defaultValue;
  let url;
  try {
    url = new URL(value);
  } catch {
    url = null;
  }
  if (!url || !['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`Invalid ${name}="${value}": expected an http(s) URL such as https://test.netlify.app/`);
  }

  const lastSegment = url.pathname.split('/').pop();
  if (lastSegment.includes('.')) {
    throw new Error(`Invalid ${name}="${value}": expected the site's base address, not a page ("${lastSegment}").`);
  }
  if (!url.pathname.endsWith('/')) {
    url.pathname += '/';
  }
  return url.href;
}

const config = {
  baseUrl: urlFromEnv('BASE_URL', 'https://test.netlify.app/'),

  browser: {
    // Headless by default: faster, and works on CI machines with no screen.
    // HEADED=1 opens a visible browser window for watching or debugging.
    headless: !flagFromEnv('HEADED'),
    // Pause between browser actions (ms). Makes a headed run easy to follow.
    slowMo: msFromEnv('SLOWMO', 0),
  },

  // Timeouts must be at least 1 ms: both Mocha and Playwright treat 0 as "wait forever".
  timeouts: {
    action: msFromEnv('ACTION_TIMEOUT', 10_000, { min: 1 }), // click, fill, select
    navigation: msFromEnv('NAVIGATION_TIMEOUT', 30_000, { min: 1 }), // page loads, URL changes
    test: msFromEnv('TEST_TIMEOUT', 60_000, { min: 1 }), // one whole test (Mocha)
  },

  paths: {
    screenshots: path.join(ROOT_DIR, 'screenshots'),
    failureScreenshots: path.join(ROOT_DIR, 'screenshots', 'failures'),
  },
};

// A test must outlast one page load plus one action. Otherwise Mocha's generic
// "Timeout exceeded" fires first and hides the clearer page-level error messages.
const { action, navigation, test } = config.timeouts;
if (test <= navigation + action) {
  throw new Error(
    `TEST_TIMEOUT (${test}) must be greater than NAVIGATION_TIMEOUT + ACTION_TIMEOUT (${navigation + action}).`,
  );
}

module.exports = config;
