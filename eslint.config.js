import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // dist is build output; public/ holds static assets (incl. a stale
  // MapCalibrator.jsx copy) that should not be linted as source.
  globalIgnores(['dist', 'public']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', {
        varsIgnorePattern: '^[A-Z_]',
        argsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      }],
      // This is a plain Vite React SPA — it does NOT use the React Compiler.
      // eslint-plugin-react-hooks v7's flat/recommended bundles compiler-oriented
      // diagnostics that flag intentional, documented patterns (e.g. the useLatest
      // ref idiom in useGameState, manual memoization). Turn those off; keep the
      // classic rules-of-hooks (error) and exhaustive-deps (warn).
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
    },
  },
])
