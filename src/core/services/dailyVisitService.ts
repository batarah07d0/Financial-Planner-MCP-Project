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
      console.error('Error getting daily visit count:', error);
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
      console.error('Error incrementing daily visit count:', error);
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
        
        // Log untuk debugging
        if (__DEV__) {
          console.log('🗓️ New day detected, reset daily visit count:', {
            userId: userId.substring(0, 8) + '...',
            lastDate: lastVisitDate,
            currentDate: currentDateKey
          });
        }
      }
    } catch (error) {
      console.error('Error checking new day:', error);
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
      
      if (__DEV__) {
        console.log('🔄 Manual reset daily visit count for user:', userId.substring(0, 8) + '...');
      }
    } catch (error) {
      console.error('Error resetting daily visit count:', error);
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
        
        if (__DEV__) {
          console.log('🧹 Cleaned up old visit data:', keysToDelete.length, 'entries');
        }
      }
    } catch (error) {
      console.error('Error cleaning up old visit data:', error);
    }
  }
}
