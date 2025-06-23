// Global shims for Node.js core modules
global.Buffer = global.Buffer || require('buffer').Buffer;

if (typeof btoa === 'undefined') {
  global.btoa = function(str) {
    return Buffer.from(str).toString('base64');
  };
}

if (typeof atob === 'undefined') {
  global.atob = function(b64Encoded) {
    return Buffer.from(b64Encoded, 'base64').toString('binary');
  };
}

process.version = 'v16.0.0'; // Fake Node.js version
process.browser = false;