module.exports = {
  root: true,
  extends: '@react-native', // Or your preferred base config
  plugins: [
    'react-native'
  ],
  rules: {
    // Existing rules...
    'react-native/no-inline-styles': 'warn', // Add rule: warn about inline styles
    'react-native/no-unused-styles': 'warn', // Add rule: warn about unused styles defined in StyleSheet
    // Add other rules as needed
  },
  // Optional: Specify parser options, env, etc. if not covered by extends
  // parserOptions: {
  //   ecmaFeatures: {
  //     jsx: true,
  //   },
  // },
  // env: {
  //   'react-native/react-native': true,
  // },
};