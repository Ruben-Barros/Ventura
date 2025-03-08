/**
 * This script can help fix dependency conflicts in your Ventura app.
 * 
 * Run this with:
 * node fix-dependencies.js
 * 
 * Then run:
 * npm install --legacy-peer-deps
 * 
 * Or to downgrade React:
 * npm install react@18.3.1 react-dom@18.3.1 --save
 */

const fs = require('fs');
const path = require('path');

// Path to package.json
const packageJsonPath = path.join(__dirname, 'package.json');

// Read the current package.json
const packageJson = require(packageJsonPath);

console.log('Current React version:', packageJson.dependencies.react);
console.log('\nOptions to fix dependencies:\n');
console.log('Option 1: Run "npm install --legacy-peer-deps" to install dependencies despite conflicts');
console.log('Option 2: Run "npm install react@18.3.1 react-dom@18.3.1 --save" to downgrade React to a compatible version');
console.log('\nAfter fixing dependencies, restart your Expo app with: "npx expo start"'); 