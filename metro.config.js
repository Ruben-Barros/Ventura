const { getDefaultConfig } = require('expo/metro-config');

// Get default config
const config = getDefaultConfig(__dirname);

// Use node-libs-react-native for polyfilling
config.resolver.extraNodeModules = {
  ...require('node-libs-react-native'),
};

// Use node-libs-react-native for polyfilling
config.resolver.extraNodeModules = {
  ...require('node-libs-react-native'),
};

// Block the ws package completely
config.resolver.blockList = Array.isArray(config.resolver.blockList)
  ? [...config.resolver.blockList, /node_modules[\\/]ws/]
  : [/node_modules[\\/]ws/];

// Provide our WebSocket stub
config.resolver.extraNodeModules.ws = require.resolve('./ws-stub');

// Remove specific 3D model file extensions
if (config.resolver.assetExts) {
  config.resolver.assetExts = config.resolver.assetExts.filter(
    ext => !['glb', 'gltf'].includes(ext)
  );
}

// Remove specific source extensions
if (config.resolver.sourceExts) {
  config.resolver.sourceExts = config.resolver.sourceExts.filter(
    ext => !['cjs', 'mjs'].includes(ext)
  );
}

module.exports = config;