// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Tambahkan resolver untuk Node.js polyfills
config.resolver = {
    ...config.resolver,
    extraNodeModules: {
        // Polyfills untuk modul Node.js yang dibutuhkan
        stream: require.resolve('stream-browserify'),
        zlib: require.resolve('browserify-zlib'),
        util: require.resolve('util/'),
        buffer: require.resolve('@craftzdog/react-native-buffer'),
        events: require.resolve('events/'),
        path: require.resolve('path-browserify'),
        querystring: require.resolve('querystring-es3'),
        url: require.resolve('url/'),
        crypto: require.resolve('expo-crypto'),
        fs: require.resolve('expo-file-system'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        net: require.resolve('react-native-tcp-socket'),
        tls: require.resolve('react-native-tcp-socket'),
        os: require.resolve('os-browserify/browser'),
        dns: require.resolve('./src/mocks/dns.js'),
        dgram: require.resolve('./src/mocks/dgram.js'),
        // Tambahkan mock untuk xmlhttprequest dan ws
        'xmlhttprequest': require.resolve('./src/mocks/xmlhttprequest.js'),
        'ws': require.resolve('./src/mocks/ws.js'),
    }
};

module.exports = config;
