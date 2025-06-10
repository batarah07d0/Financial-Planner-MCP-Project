/**
 * Service untuk mengelola period visit count
 * Reset otomatis setiap pergantian periode waktu (pagi → siang → malam)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  getLocalTimeInfo, 
  getPeriodVisitCountKey, 
  getLastVisitPeriodKey,
  getDailyVisitCountKey,
  getLastVisitDateKey
} from '../utils/timeUtils';

export class PeriodVisitService {
  /**
   * Mendapatkan period visit count untuk user periode saat ini
   * @param userId - ID user
   * @returns Promise<number> - Jumlah kunjungan periode ini
   */
  static async getPeriodVisitCount(userId: string): Promise<number> {
    try {
      const timeInfo = getLocalTimeInfo();
      const { periodKey } = timeInfo;
      
      const storageKey = getPeriodVisitCountKey(userId, periodKey);
      const countStr = await AsyncStorage.getItem(storageKey);
      
      return countStr ? parseInt(countStr, 10) : 0;
    } catch (error) {
      // Silently handle error and return default value
      // Logging dihapus untuk mengurangi noise di console
      return 0;
    }
  }

  /**
   * Increment period visit count untuk user periode saat ini
   * @param userId - ID user
   * @returns Promise<number> - Jumlah kunjungan periode ini setelah increment
   */
  static async incrementPeriodVisitCount(userId: string): Promise<number> {
    try {
      const timeInfo = getLocalTimeInfo();
      const { periodKey } = timeInfo;
      
      // Cek apakah ini periode baru
      await this.checkAndResetIfNewPeriod(userId, periodKey);
      
      // Get current count
      const currentCount = await this.getPeriodVisitCount(userId);
      const newCount = currentCount + 1;
      
      // Save new count
      const storageKey = getPeriodVisitCountKey(userId, periodKey);
      await AsyncStorage.setItem(storageKey, newCount.toString());
      
      // Update last visit period
      const lastVisitKey = getLastVisitPeriodKey(userId);
      await AsyncStorage.setItem(lastVisitKey, periodKey);
      
      return newCount;
    } catch (error) {
      // Silently handle error and return fallback value
      // Logging dihapus untuk mengurangi noise di console
      return 1; // Return 1 as fallback
    }
  }

  /**
   * Cek apakah ini periode baru dan reset count jika perlu
   * @param userId - ID user
   * @param currentPeriodKey - Period key saat ini
   */
  private static async checkAndResetIfNewPeriod(userId: string, currentPeriodKey: string): Promise<void> {
    try {
      const lastVisitKey = getLastVisitPeriodKey(userId);
      const lastVisitPeriod = await AsyncStorage.getItem(lastVisitKey);
      
      // Jika ini periode baru, hapus count periode sebelumnya
      if (lastVisitPeriod && lastVisitPeriod !== currentPeriodKey) {
        // Hapus count periode sebelumnya
        const oldCountKey = getPeriodVisitCountKey(userId, lastVisitPeriod);
        await AsyncStorage.removeItem(oldCountKey);
        
        // Log untuk debugging - dihapus untuk mengurangi noise di console
      }
    } catch (error) {
      // Silently handle error
      // Logging dihapus untuk mengurangi noise di console
    }
  }

  /**
   * Reset period visit count untuk user (manual reset)
   * @param userId - ID user
   */
  static async resetPeriodVisitCount(userId: string): Promise<void> {
    try {
      const timeInfo = getLocalTimeInfo();
      const { periodKey } = timeInfo;
      
      const storageKey = getPeriodVisitCountKey(userId, periodKey);
      await AsyncStorage.removeItem(storageKey);
      
      // Manual reset period visit count - logging dihapus untuk mengurangi noise di console
    } catch (error) {
      // Silently handle error
      // Logging dihapus untuk mengurangi noise di console
    }
  }

  /**
   * Cleanup old period visit count data (untuk maintenance)
   * Hapus data yang lebih dari 7 hari
   * @param userId - ID user
   */
  static async cleanupOldPeriodData(userId: string): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const userPeriodKeys = allKeys.filter(key => 
        key.startsWith(`period_visit_count_${userId}_`)
      );
      
      const currentTime = new Date().getTime();
      const sevenDaysAgo = currentTime - (7 * 24 * 60 * 60 * 1000);
      
      const keysToDelete: string[] = [];
      
      for (const key of userPeriodKeys) {
        // Extract date from key (format: period_visit_count_userId_YYYY-MM-DD-period)
        const parts = key.split('_');
        if (parts.length >= 6) {
          const datePart = `${parts[4]}-${parts[5]}-${parts[6]}`;
          const [year, month, date] = datePart.split('-').map(Number);
          const keyDate = new Date(year, month, date).getTime();
          
          if (keyDate < sevenDaysAgo) {
            keysToDelete.push(key);
          }
        }
      }
      
      if (keysToDelete.length > 0) {
        await AsyncStorage.multiRemove(keysToDelete);
        
        // Cleaned up old period data - logging dihapus untuk mengurangi noise di console
      }
    } catch (error) {
      // Silently handle error
      // Logging dihapus untuk mengurangi noise di console
    }
  }

  /**
   * Migrasi dari daily visit count ke period visit count
   * @param userId - ID user
   */
  static async migrateToPeriodVisitCount(userId: string): Promise<void> {
    try {
      const timeInfo = getLocalTimeInfo();
      const { dateKey, periodKey } = timeInfo;
      
      // Cek apakah ada daily visit count yang perlu dimigrasi
      const oldDailyKey = getDailyVisitCountKey(userId, dateKey);
      const oldDailyCount = await AsyncStorage.getItem(oldDailyKey);
      
      if (oldDailyCount) {
        // Migrasi ke period visit count
        const newPeriodKey = getPeriodVisitCountKey(userId, periodKey);
        await AsyncStorage.setItem(newPeriodKey, oldDailyCount);
        
        // Hapus old daily count
        await AsyncStorage.removeItem(oldDailyKey);
        
        // Update last visit period
        const lastVisitPeriodKey = getLastVisitPeriodKey(userId);
        await AsyncStorage.setItem(lastVisitPeriodKey, periodKey);
        
        // Hapus old last visit date
        const oldLastVisitKey = getLastVisitDateKey(userId);
        await AsyncStorage.removeItem(oldLastVisitKey);
        
        // Migrated daily visit count to period visit count - logging dihapus untuk mengurangi noise di console
      }
    } catch (error) {
      // Silently handle error
      // Logging dihapus untuk mengurangi noise di console
    }
  }
}
