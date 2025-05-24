import { useNotifications } from '../hooks/useNotifications';
import { getUserSettings } from '../../features/settings/services';

export class NotificationService {
  private static instance: NotificationService;
  private notificationHook: ReturnType<typeof useNotifications> | null = null;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public setNotificationHook(hook: ReturnType<typeof useNotifications>) {
    this.notificationHook = hook;
  }

  // Getter untuk notificationHook (untuk digunakan di service lain)
  public getNotificationHook() {
    return this.notificationHook;
  }

  // Cek apakah user mengaktifkan notifikasi
  private async isNotificationEnabled(userId: string): Promise<boolean> {
    try {
      const settings = await getUserSettings(userId);
      return settings?.notification_enabled ?? true;
    } catch (error) {
      console.error('Error checking notification settings:', error);
      return false;
    }
  }

  // Kirim budget alert jika notifikasi diaktifkan
  public async sendBudgetAlert(
    userId: string,
    budgetName: string,
    percentageUsed: number,
    remainingAmount: number
  ): Promise<boolean> {
    try {
      if (!this.notificationHook) return false;

      const isEnabled = await this.isNotificationEnabled(userId);
      if (!isEnabled) return false;

      const result = await this.notificationHook.sendBudgetAlert(
        budgetName,
        percentageUsed,
        remainingAmount
      );

      return result !== null;
    } catch (error) {
      console.error('Error sending budget alert:', error);
      return false;
    }
  }

  // Kirim challenge reminder jika notifikasi diaktifkan
  public async sendChallengeReminder(
    userId: string,
    challengeTitle: string,
    daysLeft: number
  ): Promise<boolean> {
    try {
      if (!this.notificationHook) return false;

      const isEnabled = await this.isNotificationEnabled(userId);
      if (!isEnabled) return false;

      const result = await this.notificationHook.sendChallengeReminder(
        challengeTitle,
        daysLeft
      );

      return result !== null;
    } catch (error) {
      console.error('Error sending challenge reminder:', error);
      return false;
    }
  }

  // Kirim saving goal progress jika notifikasi diaktifkan
  public async sendSavingGoalProgress(
    userId: string,
    goalName: string,
    progressPercentage: number,
    currentAmount: number,
    targetAmount: number
  ): Promise<boolean> {
    try {
      if (!this.notificationHook) return false;

      const isEnabled = await this.isNotificationEnabled(userId);
      if (!isEnabled) return false;

      const result = await this.notificationHook.sendSavingGoalProgress(
        goalName,
        progressPercentage,
        currentAmount,
        targetAmount
      );

      return result !== null;
    } catch (error) {
      console.error('Error sending saving goal progress:', error);
      return false;
    }
  }

  // Kirim account update notification jika notifikasi diaktifkan
  public async sendAccountUpdateNotification(
    userId: string,
    updateType: 'password' | 'email' | 'profile',
    success: boolean = true
  ): Promise<boolean> {
    try {
      if (!this.notificationHook) return false;

      const isEnabled = await this.isNotificationEnabled(userId);
      if (!isEnabled) return false;

      const result = await this.notificationHook.sendAccountUpdateNotification(
        updateType,
        success
      );

      return result !== null;
    } catch (error) {
      console.error('Error sending account update notification:', error);
      return false;
    }
  }

  // Kirim transaction reminder jika notifikasi diaktifkan
  public async sendTransactionReminder(userId: string): Promise<boolean> {
    try {
      if (!this.notificationHook) return false;

      const isEnabled = await this.isNotificationEnabled(userId);
      if (!isEnabled) return false;

      const result = await this.notificationHook.sendTransactionReminder();

      return result !== null;
    } catch (error) {
      console.error('Error sending transaction reminder:', error);
      return false;
    }
  }

  // Setup daily reminder jika notifikasi diaktifkan
  public async setupDailyReminder(
    userId: string,
    hour: number = 20,
    minute: number = 0
  ): Promise<boolean> {
    try {
      if (!this.notificationHook) return false;

      const isEnabled = await this.isNotificationEnabled(userId);
      if (!isEnabled) return false;

      const result = await this.notificationHook.scheduleDailyReminder(hour, minute);

      return result !== null;
    } catch (error) {
      console.error('Error setting up daily reminder:', error);
      return false;
    }
  }

  // Batalkan semua notifikasi
  public async cancelAllNotifications(): Promise<boolean> {
    try {
      if (!this.notificationHook) return false;

      return await this.notificationHook.cancelAllNotifications();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
      return false;
    }
  }

  // Kirim notifikasi lokal langsung
  public async sendLocalNotification(notificationData: {
    title: string;
    body: string;
    data?: Record<string, any>;
  }): Promise<boolean> {
    try {
      if (!this.notificationHook) return false;

      const result = await this.notificationHook.sendLocalNotification(notificationData);
      return result !== null;
    } catch (error) {
      console.error('Error sending local notification:', error);
      return false;
    }
  }

  // Schedule notifikasi dengan jadwal tertentu
  public async scheduleNotification(
    notificationData: {
      title: string;
      body: string;
      data?: Record<string, any>;
    },
    schedule: {
      seconds?: number;
      minutes?: number;
      hours?: number;
      day?: number;
      month?: number;
      year?: number;
      weekday?: number;
      repeats?: boolean;
    }
  ): Promise<string | null> {
    try {
      if (!this.notificationHook) return null;

      return await this.notificationHook.scheduleNotification(notificationData, schedule);
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  // Schedule daily reminder dengan userId
  public async scheduleDailyReminder(
    userId: string,
    hour: number = 20,
    minute: number = 0
  ): Promise<string | null> {
    try {
      if (!this.notificationHook) return null;

      const isEnabled = await this.isNotificationEnabled(userId);
      if (!isEnabled) return null;

      return await this.notificationHook.scheduleDailyReminder(hour, minute);
    } catch (error) {
      console.error('Error scheduling daily reminder:', error);
      return null;
    }
  }

  // Setup challenge reminders untuk tantangan yang aktif
  public async setupChallengeReminders(
    userId: string,
    challengeTitle: string,
    endDate: string
  ): Promise<boolean> {
    try {
      if (!this.notificationHook) return false;

      const isEnabled = await this.isNotificationEnabled(userId);
      if (!isEnabled) return false;

      const endDateTime = new Date(endDate);
      const now = new Date();
      const daysLeft = Math.ceil((endDateTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Setup reminder 3 hari sebelum berakhir
      if (daysLeft > 3) {
        const reminderDate = new Date(endDateTime);
        reminderDate.setDate(reminderDate.getDate() - 3);

        await this.notificationHook.scheduleNotification(
          {
            title: '🎯 Pengingat Tantangan',
            body: `"${challengeTitle}" akan berakhir dalam 3 hari. Jangan sampai terlewat!`,
            data: { type: 'challenge_reminder', challengeTitle, daysLeft: 3 },
          },
          {
            year: reminderDate.getFullYear(),
            month: reminderDate.getMonth() + 1,
            day: reminderDate.getDate(),
            hours: 10,
            minutes: 0,
          }
        );
      }

      // Setup reminder 1 hari sebelum berakhir
      if (daysLeft > 1) {
        const reminderDate = new Date(endDateTime);
        reminderDate.setDate(reminderDate.getDate() - 1);

        await this.notificationHook.scheduleNotification(
          {
            title: '⏰ Tantangan Berakhir Besok',
            body: `"${challengeTitle}" berakhir besok. Pastikan Anda mencapai target!`,
            data: { type: 'challenge_reminder', challengeTitle, daysLeft: 1 },
          },
          {
            year: reminderDate.getFullYear(),
            month: reminderDate.getMonth() + 1,
            day: reminderDate.getDate(),
            hours: 18,
            minutes: 0,
          }
        );
      }

      // Setup reminder di hari terakhir
      if (daysLeft >= 1) {
        await this.notificationHook.scheduleNotification(
          {
            title: '🏁 Tantangan Berakhir Hari Ini!',
            body: `"${challengeTitle}" berakhir hari ini. Selesaikan sekarang!`,
            data: { type: 'challenge_reminder', challengeTitle, daysLeft: 0 },
          },
          {
            year: endDateTime.getFullYear(),
            month: endDateTime.getMonth() + 1,
            day: endDateTime.getDate(),
            hours: 9,
            minutes: 0,
          }
        );
      }

      return true;
    } catch (error) {
      console.error('Error setting up challenge reminders:', error);
      return false;
    }
  }

  // Kirim notifikasi completion challenge
  public async sendChallengeCompletion(
    userId: string,
    challengeTitle: string,
    isSuccess: boolean,
    targetAmount?: number,
    currentAmount?: number
  ): Promise<boolean> {
    try {
      if (!this.notificationHook) return false;

      const isEnabled = await this.isNotificationEnabled(userId);
      if (!isEnabled) return false;

      let title = '';
      let body = '';

      if (isSuccess) {
        title = '🎉 Tantangan Berhasil Diselesaikan!';
        body = `Selamat! Anda berhasil menyelesaikan "${challengeTitle}". Target tercapai!`;
        if (targetAmount) {
          body += ` Target: Rp ${targetAmount.toLocaleString('id-ID')}`;
        }
      } else {
        title = '😔 Tantangan Berakhir';
        body = `"${challengeTitle}" telah berakhir. Jangan menyerah, coba lagi!`;
        if (targetAmount && currentAmount) {
          const percentage = (currentAmount / targetAmount) * 100;
          body += ` Anda mencapai ${percentage.toFixed(0)}% dari target.`;
        }
      }

      const result = await this.notificationHook.sendLocalNotification({
        title,
        body,
        data: { type: 'challenge_completion', challengeTitle, isSuccess },
      });

      return result !== null;
    } catch (error) {
      console.error('Error sending challenge completion:', error);
      return false;
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
