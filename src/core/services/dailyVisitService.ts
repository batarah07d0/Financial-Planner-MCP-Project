/**
 * Service untuk mengelola daily visit count
 * Reset otomatis setiap hari untuk UX yang lebih baik
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocalTimeInfo, getDailyVisitCountKey, getLastVisitDateKey } from '../utils/timeUtils';

export class DailyVisitService {
  /**
   * Mendapatkan daily visit count untuk user hari ini
   * @param userId - ID user
   * @returns Promise<number> - Jumlah kunjungan hari ini
   */
  static async getDailyVisitCount(userId: string): Promise<number> {
    try {
      const timeInfo = getLocalTimeInfo();
      const { dateKey } = timeInfo;
      
      const storageKey = getDailyVisitCountKey(userId, dateKey);
      const countStr = await AsyncStorage.getItem(storageKey);
      
      return countStr ? parseInt(countStr, 10) : 0;
    } catch (error) {
      // Silently handle error and return default value
      // Logging dihapus untuk mengurangi noise di console
      return 0;
    }
  }

  /**
   * Increment daily visit count untuk user hari ini
   * @param userId - ID user
   * @returns Promise<number> - Jumlah kunjungan hari ini setelah increment
   */
  static async incrementDailyVisitCount(userId: string): Promise<number> {
    try {
      const timeInfo = getLocalTimeInfo();
      const { dateKey } = timeInfo;
      
      // Cek apakah ini hari baru
      await this.checkAndResetIfNewDay(userId, dateKey);
      
      // Get current count
      const currentCount = await this.getDailyVisitCount(userId);
      const newCount = currentCount + 1;
      
      // Save new count
      const storageKey = getDailyVisitCountKey(userId, dateKey);
      await AsyncStorage.setItem(storageKey, newCount.toString());
      
      // Update last visit date
      const lastVisitKey = getLastVisitDateKey(userId);
      await AsyncStorage.setItem(lastVisitKey, dateKey);
      
      return newCount;
    } catch (error) {
      // Silently handle error and return fallback value
      // Logging dihapus untuk mengurangi noise di console
      return 1; // Return 1 as fallback
    }
  }

  /**
   * Cek apakah ini hari baru dan reset count jika perlu
   * @param userId - ID user
   * @param currentDateKey - Date key hari ini
   */
  private static async checkAndResetIfNewDay(userId: string, currentDateKey: string): Promise<void> {
    try {
      const lastVisitKey = getLastVisitDateKey(userId);
      const lastVisitDate = await AsyncStorage.getItem(lastVisitKey);
      
      // Jika ini hari baru, hapus count hari sebelumnya
      if (lastVisitDate && lastVisitDate !== currentDateKey) {
        // Hapus count hari sebelumnya
        const oldCountKey = getDailyVisitCountKey(userId, lastVisitDate);
        await AsyncStorage.removeItem(oldCountKey);
        
        // Log untuk debugging - dihapus untuk mengurangi noise di console
      }
    } catch (error) {
      // Silently handle error
      // Logging dihapus untuk mengurangi noise di console
    }
  }

  /**
   * Reset daily visit count untuk user (manual reset)
   * @param userId - ID user
   */
  static async resetDailyVisitCount(userId: string): Promise<void> {
    try {
      const timeInfo = getLocalTimeInfo();
      const { dateKey } = timeInfo;
      
      const storageKey = getDailyVisitCountKey(userId, dateKey);
      await AsyncStorage.removeItem(storageKey);
      
      // Manual reset daily visit count - logging dihapus untuk mengurangi noise di console
    } catch (error) {
      // Silently handle error
      // Logging dihapus untuk mengurangi noise di console
    }
  }

  /**
   * Cleanup old visit count data (untuk maintenance)
   * Hapus data yang lebih dari 7 hari
   * @param userId - ID user
   */
  static async cleanupOldVisitData(userId: string): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const userVisitKeys = allKeys.filter(key => 
        key.startsWith(`daily_visit_count_${userId}_`)
      );
      
      const currentTime = new Date().getTime();
      const sevenDaysAgo = currentTime - (7 * 24 * 60 * 60 * 1000);
      
      const keysToDelete: string[] = [];
      
      for (const key of userVisitKeys) {
        // Extract date from key
        const datePart = key.split('_').pop();
        if (datePart) {
          const [year, month, date] = datePart.split('-').map(Number);
          const keyDate = new Date(year, month, date).getTime();
          
          if (keyDate < sevenDaysAgo) {
            keysToDelete.push(key);
          }
        }
      }
      
      if (keysToDelete.length > 0) {
        await AsyncStorage.multiRemove(keysToDelete);
        
        // Cleaned up old visit data - logging dihapus untuk mengurangi noise di console
      }
    } catch (error) {
      // Silently handle error
      // Logging dihapus untuk mengurangi noise di console
    }
  }
}
