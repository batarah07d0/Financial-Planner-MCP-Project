// Pastikan polyfill dimuat terlebih dahulu
import 'react-native-get-random-values';

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { RootNavigator } from './src/core/navigation';
import { SupabaseProvider, DatabaseProvider } from './src/core/providers';
import { useNotificationManager } from './src/core/hooks';
// Abaikan warning yang tidak relevan
import { LogBox } from 'react-native';
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  'crypto.getRandomValues() not supported',
  'Possible Unhandled Promise Rejection',
  'expo-av has been deprecated',
  'Due to changes in Androids permission requirements',
  'expo-notifications functionality is not fully supported in Expo Go',
  'is not a valid icon name for family',
  'radar-off',
]);

// Komponen untuk menginisialisasi notifikasi
function NotificationInitializer() {
  useNotificationManager(); // Inisialisasi notification manager
  return null;
}

export default function App() {
  return (
    <SupabaseProvider>
      <DatabaseProvider>
        <PaperProvider>
          <SafeAreaProvider>
            <StatusBar style="dark" />
            <NotificationInitializer />
            <RootNavigator />
          </SafeAreaProvider>
        </PaperProvider>
      </DatabaseProvider>
    </SupabaseProvider>
  );
}
