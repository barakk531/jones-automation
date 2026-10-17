/**
 * Mocha settings.
 *
 * The test timeout comes from config/config.js, so every time limit in the
 * project lives in one place.
 */

const config = require('./config/config');

module.exports = {
  spec: ['tests/**/*.spec.js'],
  // Shared hooks: browser per run, fresh page per test, failure screenshots.
  require: ['./support/hooks.js'],
  timeout: config.timeouts.test,
  // Browser tests always take seconds; only flag a test as "slow" past 10s.
  slow: 10_000,
  reporter: 'spec',
};
