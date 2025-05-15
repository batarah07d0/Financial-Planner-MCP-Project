import { useDatabase } from '../../../providers/DatabaseProvider';
import { TABLES } from '../sqlite-database';
import { BudgetModel } from '../sqlite-service';

/**
 * Adapter untuk model Budget
 * Menyediakan metode untuk mengakses dan memanipulasi data anggaran
 */
export const useBudgetAdapter = () => {
  const db = useDatabase();

  return {
    /**
     * Mendapatkan semua anggaran
     */
    getAll: async (): Promise<BudgetModel[]> => {
      return await db.getAll<BudgetModel>(TABLES.BUDGETS);
    },

    /**
     * Mendapatkan anggaran berdasarkan ID
     */
    getById: async (id: string): Promise<BudgetModel | null> => {
      return await db.getById<BudgetModel>(TABLES.BUDGETS, id);
    },

    /**
     * Mendapatkan anggaran berdasarkan kategori
     */
    getByCategory: async (categoryId: string): Promise<BudgetModel[]> => {
      return await db.getWhere<BudgetModel>(TABLES.BUDGETS, { category_id: categoryId });
    },

    /**
     * Mendapatkan anggaran aktif (berdasarkan tanggal saat ini)
     */
    getActive: async (): Promise<BudgetModel[]> => {
      const allBudgets = await db.getAll<BudgetModel>(TABLES.BUDGETS);
      const now = new Date().toISOString();

      return allBudgets.filter(budget => {
        return budget.start_date <= now && budget.end_date >= now;
      });
    },

    /**
     * Membuat anggaran baru
     */
    create: async (data: Omit<BudgetModel, 'id' | 'created_at' | 'updated_at'>): Promise<BudgetModel> => {
      return await db.create<BudgetModel>(TABLES.BUDGETS, data);
    },

    /**
     * Memperbarui anggaran
     */
    update: async (id: string, data: Partial<BudgetModel>): Promise<BudgetModel | null> => {
      return await db.update<BudgetModel>(TABLES.BUDGETS, id, data);
    },

    /**
     * Menghapus anggaran
     */
    delete: async (id: string): Promise<boolean> => {
      return await db.delete(TABLES.BUDGETS, id);
    }
  };
};
