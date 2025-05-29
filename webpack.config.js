// Konfigurasi webpack untuk menangani paket-paket bermasalah
// File ini digunakan oleh Expo untuk mengonfigurasi webpack saat menjalankan aplikasi di web

const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Tambahkan fallback untuk modul Node.js
  if (!config.resolve.fallback) {
    config.resolve.fallback = {};
  }

  Object.assign(config.resolve.fallback, {
    stream: require.resolve('stream-browserify'),
    zlib: require.resolve('browserify-zlib'),
    util: require.resolve('util/'),
    buffer: require.resolve('@craftzdog/react-native-buffer'),
    events: require.resolve('events/'),
    path: require.resolve('path-browserify'),
    querystring: require.resolve('querystring-es3'),
    url: require.resolve('url/'),
    crypto: require.resolve('expo-crypto'),
    fs: false,
    http: require.resolve('stream-http'),
    https: require.resolve('https-browserify'),
    net: false,
    tls: false,
    os: require.resolve('os-browserify/browser'),
    dns: false,
  });

  // Tambahkan alias untuk paket bermasalah
  config.resolve.alias = {
    ...config.resolve.alias,
    'ws': require.resolve('./src/mocks/ws.js'),
    'dns.js': require.resolve('./src/mocks/dns.js'),
    'dgram': require.resolve('./src/mocks/dgram.js'),
  };

  return config;
};
