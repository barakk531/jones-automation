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

/** Reads a non-negative number from an env var, or returns the default when unset. */
function numberFromEnv(name, defaultValue) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return defaultValue;

  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid ${name}="${raw}": expected a non-negative number of milliseconds.`);
  }
  return value;
}

/** Reads the base URL from an env var and checks it is a valid absolute URL. */
function urlFromEnv(name, defaultValue) {
  const value = process.env[name] || defaultValue;
  try {
    return new URL(value).href;
  } catch {
    throw new Error(`Invalid ${name}="${value}": expected an absolute URL such as https://test.netlify.app/`);
  }
}

const config = {
  baseUrl: urlFromEnv('BASE_URL', 'https://test.netlify.app/'),

  browser: {
    // Headless by default: faster, and works on CI machines with no screen.
    // HEADED=1 opens a visible browser window for watching or debugging.
    headless: process.env.HEADED !== '1',
    // Pause between browser actions (ms). Makes a headed run easy to follow.
    slowMo: numberFromEnv('SLOWMO', 0),
  },

  timeouts: {
    action: numberFromEnv('ACTION_TIMEOUT', 10_000), // click, fill, select
    navigation: numberFromEnv('NAVIGATION_TIMEOUT', 30_000), // page loads, URL changes
    test: numberFromEnv('TEST_TIMEOUT', 60_000), // one whole test (Mocha)
  },

  paths: {
    screenshots: path.join(ROOT_DIR, 'screenshots'),
  },
};

module.exports = config;
