import { getUserSettings } from '../../features/settings/services';
import { notificationService } from './notificationService';
import { getTransactions } from './supabase/transaction.service';

export class TransactionReminderService {
  private static instance: TransactionReminderService;
  private reminderScheduleId: string | null = null;
  private lastReminderDate: string | null = null;

  private constructor() {}

  public static getInstance(): TransactionReminderService {
    if (!TransactionReminderService.instance) {
      TransactionReminderService.instance = new TransactionReminderService();
    }
    return TransactionReminderService.instance;
  }

  // Setup daily transaction reminder
  public async setupDailyReminder(userId: string): Promise<boolean> {
    try {
      const userSettings = await getUserSettings(userId);
      if (!userSettings?.notification_enabled) {
        return false;
      }

      // Cancel existing reminder if any
      if (this.reminderScheduleId) {
        await this.cancelReminder();
      }

      // Setup reminder untuk jam 8 malam setiap hari
      const scheduleId = await notificationService.scheduleDailyReminder(userId, 20, 0);

      if (scheduleId) {
        this.reminderScheduleId = scheduleId;
        console.log('Daily transaction reminder scheduled');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error setting up daily reminder:', error);
      return false;
    }
  }

  // Cancel reminder
  public async cancelReminder(): Promise<boolean> {
    try {
      if (this.reminderScheduleId && notificationService.getNotificationHook()) {
        await notificationService.getNotificationHook()!.cancelNotification(this.reminderScheduleId);
        this.reminderScheduleId = null;
        console.log('Transaction reminder cancelled');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error cancelling reminder:', error);
      return false;
    }
  }

  // Check if user has recorded transactions today
  public async checkTodayTransactions(userId: string): Promise<boolean> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

      const transactions = await getTransactions(userId, {
        startDate: startOfDay,
        endDate: endOfDay,
        limit: 1, // Hanya perlu tahu apakah ada transaksi
      });

      return transactions && transactions.length > 0;
    } catch (error) {
      console.error('Error checking today transactions:', error);
      return false;
    }
  }

  // Send smart reminder based on user activity
  public async sendSmartReminder(userId: string): Promise<boolean> {
    try {
      const userSettings = await getUserSettings(userId);
      if (!userSettings?.notification_enabled) {
        return false;
      }

      const today = new Date().toISOString().split('T')[0];

      // Prevent multiple reminders on the same day
      if (this.lastReminderDate === today) {
        return false;
      }

      // Check if user has recorded transactions today
      const hasTransactionsToday = await this.checkTodayTransactions(userId);

      if (!hasTransactionsToday) {
        // Send reminder only if no transactions recorded today
        const success = await notificationService.sendTransactionReminder(userId);

        if (success) {
          this.lastReminderDate = today;
          console.log('Smart transaction reminder sent');
        }

        return success;
      }

      return false; // No reminder needed, user already recorded transactions
    } catch (error) {
      console.error('Error sending smart reminder:', error);
      return false;
    }
  }

  // Send weekly summary reminder
  public async sendWeeklySummary(userId: string): Promise<boolean> {
    try {
      const userSettings = await getUserSettings(userId);
      if (!userSettings?.notification_enabled) {
        return false;
      }

      // Get transactions for the past week
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 7);

      const transactions = await getTransactions(userId, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      if (!transactions || transactions.length === 0) {
        // Send reminder to start tracking
        return await notificationService.sendLocalNotification({
          title: '📊 Mulai Tracking Keuangan',
          body: 'Belum ada transaksi minggu ini. Mulai catat pengeluaran Anda untuk kontrol keuangan yang lebih baik!',
          data: { type: 'weekly_summary', hasTransactions: false },
        });
      }

      // Calculate weekly summary
      const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const transactionCount = transactions.length;

      return await notificationService.sendLocalNotification({
        title: '📈 Ringkasan Mingguan',
        body: `${transactionCount} transaksi tercatat. Pengeluaran: Rp ${totalExpense.toLocaleString('id-ID')}, Pemasukan: Rp ${totalIncome.toLocaleString('id-ID')}`,
        data: {
          type: 'weekly_summary',
          hasTransactions: true,
          totalExpense,
          totalIncome,
          transactionCount
        },
      });
    } catch (error) {
      console.error('Error sending weekly summary:', error);
      return false;
    }
  }

  // Setup weekly summary reminder (every Sunday at 7 PM)
  public async setupWeeklySummary(userId: string): Promise<boolean> {
    try {
      const userSettings = await getUserSettings(userId);
      if (!userSettings?.notification_enabled) {
        return false;
      }

      // Schedule for every Sunday at 7 PM
      const scheduleId = await notificationService.scheduleNotification(
        {
          title: '📊 Saatnya Review Mingguan',
          body: 'Lihat ringkasan keuangan Anda minggu ini dan rencanakan minggu depan!',
          data: { type: 'weekly_review_trigger' },
        },
        {
          weekday: 1, // Sunday
          hours: 19,
          minutes: 0,
          repeats: true,
        }
      );

      return scheduleId !== null;
    } catch (error) {
      console.error('Error setting up weekly summary:', error);
      return false;
    }
  }

  // Check if it's time for evening reminder
  public shouldSendEveningReminder(): boolean {
    const now = new Date();
    const hour = now.getHours();
    const today = now.toISOString().split('T')[0];

    // Send reminder between 7-9 PM and not sent today yet
    return hour >= 19 && hour <= 21 && this.lastReminderDate !== today;
  }

  // Reset reminder state (for testing)
  public resetReminderState(): void {
    this.lastReminderDate = null;
    this.reminderScheduleId = null;
  }
}

// Export singleton instance
export const transactionReminderService = TransactionReminderService.getInstance();
