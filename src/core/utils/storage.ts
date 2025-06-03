import AsyncStorage from '@react-native-async-storage/async-storage';

// Simple logger untuk production-ready logging
const logger = {
  error: (message: string, error?: unknown) => {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error(message, error);
    }
    // Dalam production, ini bisa dikirim ke service logging seperti Sentry
  }
};

/**
 * Menyimpan data ke AsyncStorage
 * @param key - Kunci untuk menyimpan data
 * @param value - Nilai yang akan disimpan
 * @returns Promise yang menunjukkan keberhasilan operasi
 */
export const storeData = async <T>(key: string, value: T): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (error) {
    logger.error('Error storing data:', error);
    throw error;
  }
};

/**
 * Mengambil data dari AsyncStorage
 * @param key - Kunci untuk mengambil data
 * @returns Promise yang berisi data yang diambil
 */
export const getData = async <T>(key: string): Promise<T | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    logger.error('Error retrieving data:', error);
    throw error;
  }
};

/**
 * Menghapus data dari AsyncStorage
 * @param key - Kunci untuk menghapus data
 * @returns Promise yang menunjukkan keberhasilan operasi
 */
export const removeData = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    logger.error('Error removing data:', error);
    throw error;
  }
};

/**
 * Menyimpan data dengan expiry time
 * @param key - Kunci untuk menyimpan data
 * @param value - Nilai yang akan disimpan
 * @param ttl - Time to live dalam milidetik
 * @returns Promise yang menunjukkan keberhasilan operasi
 */
export const storeDataWithExpiry = async <T>(
  key: string,
  value: T,
  ttl: number
): Promise<void> => {
  try {
    const item = {
      value,
      expiry: Date.now() + ttl,
    };
    await storeData(key, item);
  } catch (error) {
    logger.error('Error storing data with expiry:', error);
    throw error;
  }
};

/**
 * Mengambil data dengan expiry time dari AsyncStorage
 * @param key - Kunci untuk mengambil data
 * @returns Promise yang berisi data yang diambil
 */
export const getDataWithExpiry = async <T>(key: string): Promise<T | null> => {
  try {
    const item = await getData<{ value: T; expiry: number }>(key);

    // Jika item tidak ada atau sudah expired
    if (!item || Date.now() > item.expiry) {
      await removeData(key);
      return null;
    }

    return item.value;
  } catch (error) {
    logger.error('Error retrieving data with expiry:', error);
    throw error;
  }
};

/**
 * Mendapatkan semua kunci yang tersimpan di AsyncStorage
 * @returns Promise yang berisi array kunci
 */
export const getAllKeys = async (): Promise<readonly string[]> => {
  return await AsyncStorage.getAllKeys();
};

/**
 * Menghapus semua data dari AsyncStorage
 * @returns Promise yang menunjukkan keberhasilan operasi
 */
export const clearAll = async (): Promise<void> => {
  await AsyncStorage.clear();
};
