import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Menyimpan data ke AsyncStorage
 * @param key - Kunci untuk menyimpan data
 * @param value - Nilai yang akan disimpan
 * @returns Promise yang menunjukkan keberhasilan operasi
 */
export const storeData = async (key: string, value: any): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (error) {
    console.error('Error storing data:', error);
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
    console.error('Error retrieving data:', error);
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
    console.error('Error removing data:', error);
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
export const storeDataWithExpiry = async (
  key: string,
  value: any,
  ttl: number
): Promise<void> => {
  try {
    const item = {
      value,
      expiry: Date.now() + ttl,
    };
    await storeData(key, item);
  } catch (error) {
    console.error('Error storing data with expiry:', error);
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
    console.error('Error retrieving data with expiry:', error);
    throw error;
  }
};

/**
 * Mendapatkan semua kunci yang tersimpan di AsyncStorage
 * @returns Promise yang berisi array kunci
 */
export const getAllKeys = async (): Promise<readonly string[]> => {
  try {
    return await AsyncStorage.getAllKeys();
  } catch (error) {
    console.error('Error getting all keys:', error);
    throw error;
  }
};

/**
 * Menghapus semua data dari AsyncStorage
 * @returns Promise yang menunjukkan keberhasilan operasi
 */
export const clearAll = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Error clearing all data:', error);
    throw error;
  }
};
