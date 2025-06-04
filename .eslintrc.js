/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */

module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  plugins: ['react', 'react-hooks', '@typescript-eslint'],
  rules: {
    // Aturan kustom Anda
    'no-console': 'warn',
    'react/prop-types': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  ignorePatterns: [
    // Ignore semua node_modules
    'node_modules/**/*',
    '**/node_modules/**/*',

    // Ignore file konfigurasi
    'babel.config.js',
    'metro.config.js',
    'webpack.config.js',
    'app.config.js',
    '**/*.config.js',

    // Ignore file build dan output
    'dist/',
    'build/',
    '.expo/',
    'web-build/',

    // Ignore file mock JavaScript (bukan TypeScript)
    'src/mocks/**/*.js',
    'index.js',

    // Ignore file polyfill JavaScript
    'polyfill.js',
  ],

  // Override untuk file tertentu
  overrides: [
    {
      // Untuk file JavaScript di src/mocks, gunakan parser JavaScript biasa
      files: ['src/mocks/**/*.js'],
      parser: 'espree',
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        'unicorn/prefer-module': 'off', // Allow CommonJS in mock files
      },
    },
    {
      // Untuk file konfigurasi, gunakan parser JavaScript biasa
      files: ['*.config.js', '.eslintrc.js'],
      parser: 'espree',
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'script',
      },
      env: {
        node: true,
      },
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
};
