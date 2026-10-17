/**
 * ESLint settings: ESLint's recommended rules, plus the globals each part of
 * the project uses (Node everywhere, Mocha's describe/it in tests).
 * Run with: npm run lint
 */

const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  { ignores: ['node_modules/', 'screenshots/'] },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {
      eqeqeq: 'error',
      'prefer-const': 'error',
    },
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      globals: { ...globals.mocha },
    },
  },
];
