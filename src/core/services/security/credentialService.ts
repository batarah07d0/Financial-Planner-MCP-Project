import AsyncStorage from '@react-native-async-storage/async-storage';
import { encryptData, decryptData } from './encryptionService';

// Kunci untuk penyimpanan credentials
const STORED_CREDENTIALS_KEY = '@budgetwise:stored_credentials';
const BIOMETRIC_LOGIN_ENABLED_KEY = '@budgetwise:biometric_login_enabled';

export interface StoredCredentials {
  email: string;
  encryptedPassword: string;
  lastLoginTime: number;
  userId: string;
}

// Fungsi untuk menyimpan credentials setelah login berhasil
export const storeCredentials = async (
  email: string,
  password: string,
  userId: string
): Promise<boolean> => {
  try {
    // Enkripsi password
    const encryptedPassword = await encryptData(password);
    if (!encryptedPassword) {
      // Failed to encrypt password
      return false;
    }

    const credentials: StoredCredentials = {
      email,
      encryptedPassword,
      lastLoginTime: Date.now(),
      userId,
    };

    // Simpan credentials terenkripsi
    await AsyncStorage.setItem(STORED_CREDENTIALS_KEY, JSON.stringify(credentials));
    
    return true;
  } catch (error) {
    // Error storing credentials - silently handled
    return false;
  }
};

// Fungsi untuk mengambil credentials yang tersimpan
export const getStoredCredentials = async (): Promise<StoredCredentials | null> => {
  try {
    const storedData = await AsyncStorage.getItem(STORED_CREDENTIALS_KEY);
    if (!storedData) {
      return null;
    }

    const credentials: StoredCredentials = JSON.parse(storedData);
    
    // Periksa apakah credentials masih valid (tidak lebih dari 30 hari)
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - credentials.lastLoginTime > thirtyDaysInMs) {
      // Credentials sudah kadaluarsa, hapus
      await clearStoredCredentials();
      return null;
    }

    return credentials;
  } catch (error) {
    // Error getting stored credentials - silently handled
    return null;
  }
};

// Fungsi untuk mendekripsi password dari credentials yang tersimpan
export const decryptStoredPassword = async (credentials: StoredCredentials): Promise<string | null> => {
  try {
    const decryptedPassword = await decryptData(credentials.encryptedPassword);
    return decryptedPassword;
  } catch (error) {
    // Error decrypting stored password - silently handled
    return null;
  }
};

// Fungsi untuk menghapus credentials yang tersimpan
export const clearStoredCredentials = async (): Promise<boolean> => {
  try {
    await AsyncStorage.removeItem(STORED_CREDENTIALS_KEY);
    await AsyncStorage.removeItem(BIOMETRIC_LOGIN_ENABLED_KEY);
    return true;
  } catch (error) {
    // Error clearing stored credentials - silently handled
    return false;
  }
};

// Fungsi untuk mengaktifkan biometric login
export const enableBiometricLogin = async (): Promise<boolean> => {
  try {
    // Periksa apakah ada credentials yang tersimpan
    const credentials = await getStoredCredentials();
    if (!credentials) {
      return false;
    }

    await AsyncStorage.setItem(BIOMETRIC_LOGIN_ENABLED_KEY, 'true');
    return true;
  } catch (error) {
    // Error enabling biometric login - silently handled
    return false;
  }
};

// Fungsi untuk menonaktifkan biometric login
export const disableBiometricLogin = async (): Promise<boolean> => {
  try {
    await AsyncStorage.removeItem(BIOMETRIC_LOGIN_ENABLED_KEY);
    return true;
  } catch (error) {
    // Error disabling biometric login - silently handled
    return false;
  }
};

// Fungsi untuk memeriksa apakah biometric login diaktifkan
export const isBiometricLoginEnabled = async (): Promise<boolean> => {
  try {
    const enabled = await AsyncStorage.getItem(BIOMETRIC_LOGIN_ENABLED_KEY);
    return enabled === 'true';
  } catch (error) {
    // Error checking biometric login status - silently handled
    return false;
  }
};

// Fungsi untuk mendapatkan credentials untuk biometric login
export const getBiometricLoginCredentials = async (): Promise<{
  email: string;
  password: string;
} | null> => {
  try {
    // Periksa apakah biometric login diaktifkan
    const biometricEnabled = await isBiometricLoginEnabled();
    if (!biometricEnabled) {
      return null;
    }

    // Ambil credentials yang tersimpan
    const credentials = await getStoredCredentials();
    if (!credentials) {
      return null;
    }

    // Dekripsi password
    const password = await decryptStoredPassword(credentials);
    if (!password) {
      return null;
    }

    return {
      email: credentials.email,
      password,
    };
  } catch (error) {
    // Error getting biometric login credentials - silently handled
    return null;
  }
};


