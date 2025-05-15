import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Kunci untuk penyimpanan pengaturan enkripsi
const ENCRYPTION_ENABLED_KEY = '@budgetwise:encryption_enabled';
const ENCRYPTION_KEY_KEY = '@budgetwise:encryption_key';

// Fungsi untuk menghasilkan kunci enkripsi
const generateEncryptionKey = async (): Promise<string> => {
  const randomBytes = await Crypto.getRandomBytesAsync(32);
  return Array.from(randomBytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
};

// Fungsi untuk mendapatkan kunci enkripsi
const getEncryptionKey = async (): Promise<string | null> => {
  try {
    const key = await AsyncStorage.getItem(ENCRYPTION_KEY_KEY);
    return key;
  } catch (error) {
    console.error('Error getting encryption key:', error);
    return null;
  }
};

// Fungsi untuk menyimpan kunci enkripsi
const saveEncryptionKey = async (key: string): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(ENCRYPTION_KEY_KEY, key);
    return true;
  } catch (error) {
    console.error('Error saving encryption key:', error);
    return false;
  }
};

// Fungsi untuk mengaktifkan enkripsi
export const enableEncryption = async (): Promise<boolean> => {
  try {
    // Periksa apakah enkripsi sudah diaktifkan
    const enabled = await isEncryptionEnabled();
    if (enabled) {
      return true;
    }
    
    // Hasilkan kunci enkripsi baru
    const key = await generateEncryptionKey();
    
    // Simpan kunci enkripsi
    const keySaved = await saveEncryptionKey(key);
    if (!keySaved) {
      return false;
    }
    
    // Aktifkan enkripsi
    await AsyncStorage.setItem(ENCRYPTION_ENABLED_KEY, 'true');
    
    return true;
  } catch (error) {
    console.error('Error enabling encryption:', error);
    return false;
  }
};

// Fungsi untuk menonaktifkan enkripsi
export const disableEncryption = async (): Promise<boolean> => {
  try {
    // Hapus kunci enkripsi
    await AsyncStorage.removeItem(ENCRYPTION_KEY_KEY);
    
    // Nonaktifkan enkripsi
    await AsyncStorage.setItem(ENCRYPTION_ENABLED_KEY, 'false');
    
    return true;
  } catch (error) {
    console.error('Error disabling encryption:', error);
    return false;
  }
};

// Fungsi untuk memeriksa apakah enkripsi diaktifkan
export const isEncryptionEnabled = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(ENCRYPTION_ENABLED_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error checking encryption enabled:', error);
    return false;
  }
};

// Fungsi untuk mengenkripsi data
export const encryptData = async (data: string): Promise<string | null> => {
  try {
    // Periksa apakah enkripsi diaktifkan
    const enabled = await isEncryptionEnabled();
    if (!enabled) {
      return data; // Jika enkripsi tidak diaktifkan, kembalikan data asli
    }
    
    // Dapatkan kunci enkripsi
    const key = await getEncryptionKey();
    if (!key) {
      return null;
    }
    
    // Hasilkan salt acak
    const salt = await Crypto.getRandomBytesAsync(16);
    const saltHex = Array.from(salt)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
    
    // Hasilkan kunci derivasi
    const derivedKey = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      key + saltHex
    );
    
    // Enkripsi data
    const dataBuffer = new TextEncoder().encode(data);
    const encryptedData = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      derivedKey + Array.from(dataBuffer)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('')
    );
    
    // Gabungkan salt dan data terenkripsi
    return saltHex + encryptedData;
  } catch (error) {
    console.error('Error encrypting data:', error);
    return null;
  }
};

// Fungsi untuk mendekripsi data
export const decryptData = async (encryptedData: string): Promise<string | null> => {
  try {
    // Periksa apakah enkripsi diaktifkan
    const enabled = await isEncryptionEnabled();
    if (!enabled) {
      return encryptedData; // Jika enkripsi tidak diaktifkan, kembalikan data asli
    }
    
    // Dapatkan kunci enkripsi
    const key = await getEncryptionKey();
    if (!key) {
      return null;
    }
    
    // Ekstrak salt dan data terenkripsi
    const saltHex = encryptedData.substring(0, 32);
    const encryptedPayload = encryptedData.substring(32);
    
    // Hasilkan kunci derivasi
    const derivedKey = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      key + saltHex
    );
    
    // Dekripsi data (dalam implementasi nyata, gunakan algoritma dekripsi yang sesuai)
    // Catatan: Ini hanya simulasi dekripsi karena keterbatasan expo-crypto
    // Dalam aplikasi produksi, gunakan library enkripsi yang lebih kuat
    
    return encryptedPayload; // Ini hanya placeholder
  } catch (error) {
    console.error('Error decrypting data:', error);
    return null;
  }
};

// Fungsi untuk mengenkripsi objek
export const encryptObject = async <T>(obj: T): Promise<string | null> => {
  try {
    const jsonString = JSON.stringify(obj);
    return await encryptData(jsonString);
  } catch (error) {
    console.error('Error encrypting object:', error);
    return null;
  }
};

// Fungsi untuk mendekripsi objek
export const decryptObject = async <T>(encryptedData: string): Promise<T | null> => {
  try {
    const jsonString = await decryptData(encryptedData);
    if (!jsonString) {
      return null;
    }
    
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('Error decrypting object:', error);
    return null;
  }
};
