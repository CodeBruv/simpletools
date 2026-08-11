import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'verify/index.html'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // The whole product promise is that files never leave the device.
      // Make an accidental upload a lint failure, not a code-review catch.
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: 'SimpleTools is client-side only: user data must never be transmitted.' },
        { name: 'XMLHttpRequest', message: 'SimpleTools is client-side only: user data must never be transmitted.' },
        // Bare `localStorage` was previously unrestricted while `window.localStorage`
        // was blocked — the same API through two spellings. Closing that gap so the
        // one sanctioned storage site (src/lib/themeStorage.ts, appearance
        // preference only) has to opt out explicitly and visibly.
        { name: 'localStorage', message: 'Never persist user files or private input.' },
        { name: 'sessionStorage', message: 'Never persist user files or private input.' },
      ],
      'no-restricted-properties': [
        'error',
        { object: 'navigator', property: 'sendBeacon', message: 'SimpleTools must not transmit user data.' },
        { object: 'window', property: 'localStorage', message: 'Never persist user files or private input.' },
      ],
    },
  },
)
