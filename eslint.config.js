// ─────────────────────────────────────────────────────────────────────────────
// ESLint configuration for BrainBoost frontend.
//
// Uses the flat config format (ESLint 9+).
// Three rule sets are applied:
//   1. js.configs.recommended     — standard JavaScript best practices.
//   2. reactHooks.configs.flat.recommended — enforces the Rules of Hooks
//                                           (e.g. no hooks inside conditions).
//   3. reactRefresh.configs.vite  — warns if a file exports non-component values
//                                   that would break Vite's Fast Refresh HMR.
//
// Custom rules:
//   no-unused-vars: errors on unused variables, but ignores names matching /^[A-Z_]/
//                   (UPPER_CASE constants and React components) to reduce noise.
// ─────────────────────────────────────────────────────────────────────────────
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // Exclude the compiled output directory from linting.
  globalIgnores(['dist']),
  {
    // Apply to all JavaScript and JSX source files.
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,                       // eslint built-in recommended rules
      reactHooks.configs.flat.recommended,           // react-hooks plugin
      reactRefresh.configs.vite,                     // vite fast-refresh compatibility check
    ],
    languageOptions: {
      ecmaVersion: 2020,          // allow modern JS syntax (optional chaining, etc.)
      globals: globals.browser,   // pre-define browser globals (window, document, etc.)
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },  // enable JSX parsing
        sourceType: 'module',         // treat files as ES modules (import/export)
      },
    },
    rules: {
      // Report unused variables as errors, except names matching /^[A-Z_]/
      // (React components in PascalCase and module-level SCREAMING_SNAKE_CASE constants).
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
])
