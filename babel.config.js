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
            // Alias untuk paket yang bermasalah
            'ws': './src/mocks/ws.js',
            'dns.js': './src/mocks/dns.js',
            'dgram': './src/mocks/dgram.js',
            'react-native-maps': './src/mocks/react-native-maps.tsx',
            'react-native-maps/src/createFabricMap': './src/mocks/createFabricMap.tsx',
            'react-native-maps/src/specs/NativeComponentMapView': './src/mocks/NativeComponentMapView.ts',
            'react-native-maps/src/ComponentType': './src/mocks/ComponentType.js',
            'react-native-maps/src/specs/NativeComponentGoogleMapView': './src/mocks/NativeComponentGoogleMapView.ts'
          },
        },
      ],
    ],
  };
};
