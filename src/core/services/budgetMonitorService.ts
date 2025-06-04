import { getBudgets, getBudgetSpending } from './supabase/budget.service';
import { getCategories } from './supabase/category.service';
import { getUserSettings } from '../../features/settings/services';
import { notificationService } from './notificationService';

export interface BudgetStatus {
  id: string;
  categoryName: string;
  amount: number;
  spent: number;
  percentage: number;
  remainingAmount: number;
  isOverThreshold: boolean;
  shouldAlert: boolean;
}

export class BudgetMonitorService {
  private static instance: BudgetMonitorService;
  private lastAlertTimestamps: Map<string, number> = new Map();
  private readonly ALERT_COOLDOWN = 24 * 60 * 60 * 1000; // 24 jam dalam milliseconds

  private constructor() {}

  public static getInstance(): BudgetMonitorService {
    if (!BudgetMonitorService.instance) {
      BudgetMonitorService.instance = new BudgetMonitorService();
    }
    return BudgetMonitorService.instance;
  }

  // Fungsi untuk mengecek semua budget user dan mengirim alert jika perlu
  public async checkBudgetThresholds(userId: string): Promise<BudgetStatus[]> {
    try {
      // Ambil pengaturan user
      const userSettings = await getUserSettings(userId);
      if (!userSettings?.notification_enabled) {
        return [];
      }

      const threshold = userSettings.budget_alert_threshold || 80;

      // Ambil semua budget user
      const budgets = await getBudgets(userId);
      if (!budgets || budgets.length === 0) {
        return [];
      }

      // Ambil kategori untuk mapping nama
      const categories = await getCategories({ type: 'expense' });
      const categoryMap = new Map();
      categories.forEach(cat => {
        categoryMap.set(cat.id, cat.name);
      });

      const budgetStatuses: BudgetStatus[] = [];
      const now = new Date();

      for (const budget of budgets) {
        // Hitung periode budget (asumsi monthly jika tidak ada period)
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

        // Ambil total pengeluaran untuk kategori ini
        const spent = await getBudgetSpending(
          userId,
          budget.category_id,
          startDate,
          endDate
        );

        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
        const remainingAmount = budget.amount - spent;
        const isOverThreshold = percentage >= threshold;
        
        // Cek apakah perlu mengirim alert (belum pernah alert atau sudah lewat cooldown)
        const lastAlertTime = this.lastAlertTimestamps.get(budget.id) || 0;
        const shouldAlert = isOverThreshold && (now.getTime() - lastAlertTime > this.ALERT_COOLDOWN);

        const budgetStatus: BudgetStatus = {
          id: budget.id,
          categoryName: categoryMap.get(budget.category_id) || 'Kategori',
          amount: budget.amount,
          spent,
          percentage,
          remainingAmount,
          isOverThreshold,
          shouldAlert,
        };

        budgetStatuses.push(budgetStatus);

        // Kirim notifikasi jika perlu
        if (shouldAlert) {
          await this.sendBudgetAlert(userId, budgetStatus);
          this.lastAlertTimestamps.set(budget.id, now.getTime());
        }
      }

      return budgetStatuses;
    } catch (error) {
      // Error checking budget thresholds - silently handled
      return [];
    }
  }

  // Fungsi untuk mengirim budget alert
  private async sendBudgetAlert(userId: string, budgetStatus: BudgetStatus): Promise<void> {
    try {
      await notificationService.sendBudgetAlert(
        userId,
        budgetStatus.categoryName,
        budgetStatus.percentage,
        budgetStatus.remainingAmount
      );

      // Budget alert sent successfully
    } catch (error) {
      // Error sending budget alert - silently handled
    }
  }

  // Fungsi untuk mengecek budget tertentu (untuk real-time checking)
  public async checkSpecificBudget(
    userId: string,
    categoryId: string,
    budgetAmount: number
  ): Promise<BudgetStatus | null> {
    try {
      const userSettings = await getUserSettings(userId);
      if (!userSettings?.notification_enabled) {
        return null;
      }

      const threshold = userSettings.budget_alert_threshold || 80;
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

      // Ambil pengeluaran untuk kategori ini
      const spent = await getBudgetSpending(userId, categoryId, startDate, endDate);
      const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
      const remainingAmount = budgetAmount - spent;
      const isOverThreshold = percentage >= threshold;

      // Ambil nama kategori
      const categories = await getCategories({ type: 'expense' });
      const category = categories.find(cat => cat.id === categoryId);
      const categoryName = category?.name || 'Kategori';

      const budgetStatus: BudgetStatus = {
        id: categoryId,
        categoryName,
        amount: budgetAmount,
        spent,
        percentage,
        remainingAmount,
        isOverThreshold,
        shouldAlert: isOverThreshold,
      };

      // Kirim alert jika over threshold
      if (isOverThreshold) {
        await this.sendBudgetAlert(userId, budgetStatus);
      }

      return budgetStatus;
    } catch (error) {
      // Error checking specific budget - silently handled
      return null;
    }
  }

  // Fungsi untuk reset cooldown (untuk testing)
  public resetAlertCooldown(budgetId: string): void {
    this.lastAlertTimestamps.delete(budgetId);
  }

  // Fungsi untuk mendapatkan status semua budget tanpa mengirim alert
  public async getBudgetStatuses(userId: string): Promise<BudgetStatus[]> {
    try {
      const budgets = await getBudgets(userId);
      if (!budgets || budgets.length === 0) {
        return [];
      }

      const categories = await getCategories({ type: 'expense' });
      const categoryMap = new Map();
      categories.forEach(cat => {
        categoryMap.set(cat.id, cat.name);
      });

      const budgetStatuses: BudgetStatus[] = [];
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

      for (const budget of budgets) {
        const spent = await getBudgetSpending(
          userId,
          budget.category_id,
          startDate,
          endDate
        );

        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
        const remainingAmount = budget.amount - spent;

        budgetStatuses.push({
          id: budget.id,
          categoryName: categoryMap.get(budget.category_id) || 'Kategori',
          amount: budget.amount,
          spent,
          percentage,
          remainingAmount,
          isOverThreshold: percentage >= 80, // Default threshold
          shouldAlert: false, // Tidak mengirim alert di fungsi ini
        });
      }

      return budgetStatuses;
    } catch (error) {
      // Error getting budget statuses - silently handled
      return [];
    }
  }
}

// Export singleton instance
export const budgetMonitorService = BudgetMonitorService.getInstance();
