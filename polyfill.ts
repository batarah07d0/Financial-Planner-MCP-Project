/**
 * Polyfill untuk modul-modul yang tidak tersedia di React Native
 * Ini membantu mengatasi masalah kompatibilitas dengan library yang dibuat untuk web
 */

// Deklarasi tipe untuk global
declare global {
  interface Window {
    self: any;
    process: any;
    URL: any;
    Buffer: any;
    TextEncoder: any;
    TextDecoder: any;
    RNMapsAirModule: any;
    _WORKLET: boolean;
    crypto: any;
    setTimeout: any;
    clearTimeout: any;
    setInterval: any;
    clearInterval: any;
    console: any;
    fetch: any;
    XMLHttpRequest: any;
    WebSocket: any;
    atob: any;
    btoa: any;
  }

  var self: any;
  var process: any;
  var URL: any;
  var Buffer: any;
  var TextEncoder: any;
  var TextDecoder: any;
  var RNMapsAirModule: any;
  var _WORKLET: boolean;
  var crypto: any;
}

// Polyfill untuk global
if (typeof (global as any).self === 'undefined') {
  (global as any).self = global;
}

// Polyfill untuk proses
if (typeof (global as any).process === 'undefined') {
  (global as any).process = require('process');
}

// Polyfill untuk URL
if (typeof (global as any).URL === 'undefined') {
  (global as any).URL = require('url').URL;
}

// Polyfill untuk Buffer
if (typeof (global as any).Buffer === 'undefined') {
  (global as any).Buffer = require('@craftzdog/react-native-buffer').Buffer;
}

// Polyfill untuk TextEncoder/TextDecoder
if (typeof (global as any).TextEncoder === 'undefined') {
  (global as any).TextEncoder = require('util').TextEncoder;
}

if (typeof (global as any).TextDecoder === 'undefined') {
  (global as any).TextDecoder = require('util').TextDecoder;
}

// Polyfill untuk react-native-maps
// Ini membantu mengatasi masalah "RNMapsAirModule could not be found"
if (typeof (global as any).RNMapsAirModule === 'undefined') {
  (global as any).RNMapsAirModule = require('./src/mocks/RNMapsAirModule');
}

// Polyfill untuk react-native-reanimated
if (typeof (global as any)._WORKLET === 'undefined') {
  (global as any)._WORKLET = false;
}

// Polyfill untuk crypto
if (typeof (global as any).crypto === 'undefined') {
  (global as any).crypto = require('expo-crypto');
}

// Polyfill untuk setTimeout/setInterval
// Ini memastikan bahwa setTimeout dan setInterval berfungsi dengan benar
const _setTimeout = (global as any).setTimeout;
const _clearTimeout = (global as any).clearTimeout;
const _setInterval = (global as any).setInterval;
const _clearInterval = (global as any).clearInterval;

(global as any).setTimeout = (callback: Function, timeout?: number, ...args: any[]) => {
  return _setTimeout(callback, timeout, ...args);
};

(global as any).clearTimeout = (id: number) => {
  _clearTimeout(id);
};

(global as any).setInterval = (callback: Function, timeout?: number, ...args: any[]) => {
  return _setInterval(callback, timeout, ...args);
};

(global as any).clearInterval = (id: number) => {
  _clearInterval(id);
};

// Polyfill untuk console
if (typeof (global as any).console === 'undefined') {
  (global as any).console = {
    log: () => { },
    info: () => { },
    warn: () => { },
    error: () => { },
    debug: () => { },
  };
}

// Polyfill untuk fetch
// React Native sudah memiliki implementasi fetch sendiri
// Jadi kita tidak perlu mengimpor modul node-fetch
// if (typeof (global as any).fetch === 'undefined') {
//   (global as any).fetch = require('node-fetch');
// }

// Polyfill untuk XMLHttpRequest
// React Native sudah memiliki implementasi XMLHttpRequest sendiri
// Jadi kita tidak perlu mengimpor modul xmlhttprequest
// if (typeof (global as any).XMLHttpRequest === 'undefined') {
//   (global as any).XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
// }

// Polyfill untuk WebSocket
// React Native sudah memiliki implementasi WebSocket sendiri
// Jadi kita tidak perlu mengimpor modul ws
// if (typeof (global as any).WebSocket === 'undefined') {
//   (global as any).WebSocket = require('ws');
// }

// Polyfill untuk atob/btoa
if (typeof (global as any).atob === 'undefined') {
  (global as any).atob = (data: string) => Buffer.from(data, 'base64').toString('binary');
}

if (typeof (global as any).btoa === 'undefined') {
  (global as any).btoa = (data: string) => Buffer.from(data, 'binary').toString('base64');
}

export { };
