const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure JS files are resolved before TS files
config.resolver.sourceExts = ['js', 'jsx', 'json', 'ts', 'tsx'];

module.exports = config; 