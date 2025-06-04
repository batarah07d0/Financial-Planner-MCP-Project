import { useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Kunci untuk penyimpanan pengaturan biometrik
const BIOMETRIC_ENABLED_KEY = '@budgetwise:biometric_enabled';
const BIOMETRIC_LAST_CHECK_KEY = '@budgetwise:biometric_last_check';

export const useBiometrics = (showErrorDialog?: (title: string, message: string) => void) => {
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fungsi untuk memeriksa ketersediaan biometrik
  const checkBiometricAvailability = async (): Promise<boolean> => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      const available = compatible && enrolled;
      setIsAvailable(available);

      return available;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat memeriksa ketersediaan biometrik';
      setError(errorMessage);
      return false;
    }
  };

  // Fungsi untuk memeriksa apakah biometrik diaktifkan
  const checkBiometricEnabled = async (): Promise<boolean> => {
    try {
      const value = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      const enabled = value === 'true';
      setIsEnabled(enabled);
      return enabled;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat memeriksa pengaturan biometrik';
      setError(errorMessage);
      return false;
    }
  };

  // Fungsi untuk mengaktifkan biometrik
  const enableBiometrics = async (): Promise<boolean> => {
    try {
      setIsLoading(true);

      // Periksa ketersediaan biometrik
      const available = await checkBiometricAvailability();
      if (!available) {
        if (showErrorDialog) {
          showErrorDialog(
            'Biometrik Tidak Tersedia',
            'Perangkat Anda tidak mendukung autentikasi biometrik atau belum ada data biometrik yang terdaftar.'
          );
        }
        return false;
      }

      // Autentikasi untuk memastikan pengguna adalah pemilik perangkat
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autentikasi untuk mengaktifkan biometrik',
        fallbackLabel: 'Gunakan PIN',
      });

      if (result.success) {
        // Simpan pengaturan
        await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
        setIsEnabled(true);
        return true;
      } else {
        return false;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat mengaktifkan biometrik';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi untuk menonaktifkan biometrik
  const disableBiometrics = async (): Promise<boolean> => {
    try {
      setIsLoading(true);

      // Autentikasi untuk memastikan pengguna adalah pemilik perangkat
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autentikasi untuk menonaktifkan biometrik',
        fallbackLabel: 'Gunakan PIN',
      });

      if (result.success) {
        // Simpan pengaturan
        await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'false');
        setIsEnabled(false);
        return true;
      } else {
        return false;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat menonaktifkan biometrik';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi untuk melakukan autentikasi biometrik
  const authenticate = async (
    options: {
      promptMessage?: string;
      fallbackLabel?: string;
      cancelLabel?: string;
    } = {}
  ): Promise<boolean> => {
    try {
      setIsLoading(true);

      // Periksa ketersediaan biometrik
      const available = await checkBiometricAvailability();
      if (!available) {
        if (showErrorDialog) {
          showErrorDialog(
            'Biometrik Tidak Tersedia',
            'Perangkat Anda tidak mendukung autentikasi biometrik atau belum ada data biometrik yang terdaftar.'
          );
        }
        return false;
      }

      // Periksa apakah biometrik diaktifkan
      const enabled = await checkBiometricEnabled();
      if (!enabled) {
        return true; // Jika biometrik tidak diaktifkan, anggap autentikasi berhasil
      }

      // Lakukan autentikasi
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: options.promptMessage || 'Autentikasi untuk melanjutkan',
        fallbackLabel: options.fallbackLabel || 'Gunakan PIN',
        cancelLabel: options.cancelLabel || 'Batal',
      });

      // Jika berhasil, perbarui waktu pemeriksaan terakhir
      if (result.success) {
        await AsyncStorage.setItem(BIOMETRIC_LAST_CHECK_KEY, Date.now().toString());
      }

      return result.success;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat autentikasi';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi untuk memeriksa apakah perlu autentikasi ulang
  const shouldReauthenticate = async (timeoutMinutes: number = 5): Promise<boolean> => {
    try {
      // Periksa apakah biometrik diaktifkan
      const enabled = await checkBiometricEnabled();
      if (!enabled) {
        return false; // Jika biometrik tidak diaktifkan, tidak perlu autentikasi ulang
      }

      // Dapatkan waktu pemeriksaan terakhir
      const lastCheckStr = await AsyncStorage.getItem(BIOMETRIC_LAST_CHECK_KEY);
      if (!lastCheckStr) {
        return true; // Jika belum pernah diperiksa, perlu autentikasi
      }

      // Hitung selisih waktu
      const lastCheck = parseInt(lastCheckStr, 10);
      const now = Date.now();
      const diffMinutes = (now - lastCheck) / (1000 * 60);

      return diffMinutes > timeoutMinutes;
    } catch (error) {
      // Error checking reauthentication - silently handled
      return true; // Jika terjadi kesalahan, lebih aman untuk melakukan autentikasi ulang
    }
  };

  // Inisialisasi
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        await checkBiometricAvailability();
        await checkBiometricEnabled();
      } catch (error: unknown) {
        // Error initializing biometrics - silently handled
        const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat menginisialisasi biometrik';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  return {
    isAvailable,
    isEnabled,
    isLoading,
    error,
    enableBiometrics,
    disableBiometrics,
    authenticate,
    shouldReauthenticate,
  };
};
