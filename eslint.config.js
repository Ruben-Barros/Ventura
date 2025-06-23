// @ts-check

const eslintJs = require('@eslint/js');
const tseslint = require('typescript-eslint');
const reactNativePlugin = require('eslint-plugin-react-native');
const globals = require('globals');

module.exports = tseslint.config(
  {
    // Global ignores
    ignores: ["node_modules/", ".expo/", "babel.config.js", "metro.config.js", "app.plugin.js", "*.config.js", "build/"],
  },
  // Base ESLint recommended rules
  eslintJs.configs.recommended,
  // Base TypeScript recommended rules
  ...tseslint.configs.recommended,
  // Configuration specific to React Native TS/JS files
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      'react-native': reactNativePlugin,
    },
    languageOptions: {
      // Use TypeScript parser
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        project: './tsconfig.json', // Point to your tsconfig
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        // Manually add essential RN globals instead of spreading the potentially problematic environment
        __DEV__: 'readonly',
      },
    },
    rules: {
      // Apply React Native plugin recommended rules (or 'all')
      ...reactNativePlugin.configs.all.rules,

      // Add the specific rules requested
      'react-native/no-inline-styles': 'warn',
      'react-native/no-unused-styles': 'warn',

      // Override or add other rules
      'react-native/no-raw-text': 'off', // Keep off for now

      // Disable potentially conflicting recommended rules if necessary
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-undef': 'off', // Keep off as globals might still be tricky
    },
  },
);