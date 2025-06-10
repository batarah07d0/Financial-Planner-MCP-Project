module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo', '@babel/preset-typescript'],
    plugins: [
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',
          path: '.env',
          blacklist: null,
          whitelist: null,
          safe: false,
          allowUndefined: true,
        },
      ],
      // Tambahkan plugin untuk menangani polyfills
      'react-native-reanimated/plugin',
      // Plugin untuk alias modul
      [
        'module-resolver',
        {
          alias: {
            // Alias untuk paket yang bermasalah (hanya yang diperlukan)
            'ws': './src/mocks/ws.js',
            'dns.js': './src/mocks/dns.js',
            'dgram': './src/mocks/dgram.js',
          },
        },
      ],
    ],
  };
};
