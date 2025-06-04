/**
 * Polyfill untuk modul-modul yang tidak tersedia di React Native
 * Ini membantu mengatasi masalah kompatibilitas dengan library yang dibuat untuk web
 */

import { Buffer } from '@craftzdog/react-native-buffer';
import { TextEncoder, TextDecoder } from 'util';
import { URL } from 'url';
import * as process from 'process';
import * as ExpoCrypto from 'expo-crypto';

// Interface untuk global object yang akan diperluas
interface GlobalWithPolyfills {
  self?: typeof globalThis;
  process?: typeof import('process');
  URL?: typeof import('url').URL;
  Buffer?: typeof import('@craftzdog/react-native-buffer').Buffer;
  TextEncoder?: typeof import('util').TextEncoder;
  TextDecoder?: typeof import('util').TextDecoder;
  RNMapsAirModule?: Record<string, unknown>;
  _WORKLET?: boolean;
  crypto?: typeof ExpoCrypto;
  atob?: (data: string) => string;
  btoa?: (data: string) => string;
}

// Cast global ke interface yang diperluas
const globalWithPolyfills = global as unknown as GlobalWithPolyfills;

// Polyfill untuk global
if (typeof globalWithPolyfills.self === 'undefined') {
  globalWithPolyfills.self = global;
}

// Polyfill untuk proses
if (typeof globalWithPolyfills.process === 'undefined') {
  globalWithPolyfills.process = process;
}

// Polyfill untuk URL
if (typeof globalWithPolyfills.URL === 'undefined') {
  globalWithPolyfills.URL = URL;
}

// Polyfill untuk Buffer
if (typeof globalWithPolyfills.Buffer === 'undefined') {
  globalWithPolyfills.Buffer = Buffer;
}

// Polyfill untuk TextEncoder/TextDecoder
if (typeof globalWithPolyfills.TextEncoder === 'undefined') {
  globalWithPolyfills.TextEncoder = TextEncoder;
}

if (typeof globalWithPolyfills.TextDecoder === 'undefined') {
  globalWithPolyfills.TextDecoder = TextDecoder;
}

// Polyfill untuk react-native-maps
// Ini membantu mengatasi masalah "RNMapsAirModule could not be found"
if (typeof globalWithPolyfills.RNMapsAirModule === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  globalWithPolyfills.RNMapsAirModule = require('./src/mocks/RNMapsAirModule') as Record<string, unknown>;
}

// Polyfill untuk react-native-reanimated
if (typeof globalWithPolyfills._WORKLET === 'undefined') {
  globalWithPolyfills._WORKLET = false;
}

// Polyfill untuk crypto
if (typeof globalWithPolyfills.crypto === 'undefined') {
  globalWithPolyfills.crypto = ExpoCrypto;
}

// Polyfill untuk setTimeout/setInterval
// Ini memastikan bahwa setTimeout dan setInterval berfungsi dengan benar
type TimerCallback = (...args: unknown[]) => void;
type TimerID = ReturnType<typeof setTimeout>;

const originalSetTimeout = global.setTimeout;
const originalClearTimeout = global.clearTimeout;
const originalSetInterval = global.setInterval;
const originalClearInterval = global.clearInterval;

// Extend global interface untuk timer functions
interface GlobalWithTimers extends GlobalWithPolyfills {
  setTimeout?: (callback: TimerCallback, timeout?: number, ...args: unknown[]) => TimerID;
  clearTimeout?: (id: TimerID) => void;
  setInterval?: (callback: TimerCallback, timeout?: number, ...args: unknown[]) => TimerID;
  clearInterval?: (id: TimerID) => void;
  console?: Console;
}

const globalWithTimers = global as unknown as GlobalWithTimers;

globalWithTimers.setTimeout = (callback: TimerCallback, timeout?: number, ...args: unknown[]) => {
  return originalSetTimeout(callback, timeout, ...args);
};

globalWithTimers.clearTimeout = (id: TimerID) => {
  originalClearTimeout(id);
};

globalWithTimers.setInterval = (callback: TimerCallback, timeout?: number, ...args: unknown[]) => {
  return originalSetInterval(callback, timeout, ...args);
};

globalWithTimers.clearInterval = (id: TimerID) => {
  originalClearInterval(id);
};

// Polyfill untuk console
if (typeof globalWithTimers.console === 'undefined') {
  globalWithTimers.console = {
    log: () => { /* noop */ },
    info: () => { /* noop */ },
    warn: () => { /* noop */ },
    error: () => { /* noop */ },
    debug: () => { /* noop */ },
  } as Console;
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
if (typeof globalWithPolyfills.atob === 'undefined') {
  globalWithPolyfills.atob = (data: string) => Buffer.from(data, 'base64').toString('binary');
}

if (typeof globalWithPolyfills.btoa === 'undefined') {
  globalWithPolyfills.btoa = (data: string) => Buffer.from(data, 'binary').toString('base64');
}

export { };
