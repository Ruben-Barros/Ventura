import './shim'; // Import shim first for Node.js core modules
import 'react-native-url-polyfill/auto';
import 'react-native-reanimated';
// Ensure expo-router is imported after shim and polyfills
import 'expo-router/entry';