// Polyfill untuk modul Node.js yang dibutuhkan oleh paket-paket tertentu
// File ini akan diimpor di index.ts

// Polyfill untuk crypto.getRandomValues()
import 'react-native-get-random-values';

// Stream dan Buffer
global.Buffer = require('@craftzdog/react-native-buffer').Buffer;
global.process = require('process');

// Util
global.process.env = {};
global.process.version = '';
global.process.versions = { node: '' };
global.process.nextTick = setImmediate;

// HTTP dan networking
if (typeof XMLHttpRequest !== 'undefined') {
  global.XMLHttpRequest = XMLHttpRequest;
}

// Untuk menangani WebSocket
if (typeof window !== 'undefined') {
  // Pastikan WebSocket tersedia
  if (!window.WebSocket) {
    console.warn('WebSocket tidak tersedia di lingkungan ini');
  } else {
    global.WebSocket = window.WebSocket;
  }
}

// Polyfill untuk http.Agent
global.Agent = function () { };

// Polyfill untuk os
global.os = require('os-browserify/browser');

// Polyfill untuk net dan tls
try {
  global.net = require('react-native-tcp-socket');
  global.tls = require('react-native-tcp-socket');
} catch (e) {
  console.warn('Tidak dapat memuat react-native-tcp-socket:', e);
}

// Polyfill untuk dns dan dgram
try {
  const dnsModule = require('./src/mocks/dns.js');
  const dgramModule = require('./src/mocks/dgram.js');
  global.dns = dnsModule;
  global.dgram = dgramModule;
} catch (e) {
  console.warn('Tidak dapat memuat dns.js atau dgram:', e);
}

// Tambahkan polyfill lain yang mungkin diperlukan di sini
