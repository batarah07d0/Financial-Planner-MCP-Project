// Pastikan polyfill dimuat terlebih dahulu
import 'react-native-get-random-values';

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { RootNavigator } from './src/core/navigation';
import { useThemeStore } from './src/core/services/store';
import { SupabaseProvider } from './src/core/providers';
import { MotionDetector } from './src/core/components';
// Abaikan warning yang tidak relevan
import { LogBox } from 'react-native';
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  'crypto.getRandomValues() not supported',
  'Possible Unhandled Promise Rejection',
  'expo-av has been deprecated',
  'Due to changes in Androids permission requirements',
  'expo-notifications functionality is not fully supported in Expo Go'
]);

export default function App() {
  const { mode, motionDetectionEnabled } = useThemeStore();

  // Fungsi untuk menangani deteksi gerakan
  const handleMotionDetected = (motion: 'shake' | 'tilt' | 'flip' | 'walk' | 'run') => {
    // Hanya log jika deteksi gerakan diaktifkan
    if (motionDetectionEnabled) {
      console.log('Motion detected:', motion);
    }

    // Implementasi logika berdasarkan gerakan
    // Misalnya, jika pengguna mengguncang perangkat, buka halaman tertentu
    // atau jika pengguna membalikkan perangkat, ubah tema
  };

  // Jika deteksi gerakan dinonaktifkan, gunakan komponen biasa
  if (!motionDetectionEnabled) {
    return (
      <SupabaseProvider>
        <PaperProvider>
          <SafeAreaProvider>
            <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
            <RootNavigator />
          </SafeAreaProvider>
        </PaperProvider>
      </SupabaseProvider>
    );
  }

  // Jika deteksi gerakan diaktifkan, gunakan MotionDetector
  return (
    <SupabaseProvider>
      <PaperProvider>
        <SafeAreaProvider>
          <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
          <MotionDetector onMotionDetected={handleMotionDetected}>
            <RootNavigator />
          </MotionDetector>
        </SafeAreaProvider>
      </PaperProvider>
    </SupabaseProvider>
  );
}
