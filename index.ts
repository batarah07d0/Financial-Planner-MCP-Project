// Import polyfill terlebih dahulu
// Gunakan polyfill.js yang lebih sederhana dan tidak mengimpor modul bermasalah
import './polyfill.js';

import { registerRootComponent } from 'expo';
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
