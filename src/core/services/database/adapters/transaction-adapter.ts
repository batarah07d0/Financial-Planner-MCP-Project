import { useDatabase } from '../../../providers/DatabaseProvider';
import { TABLES } from '../supabase-tables';

// Model untuk Transaction
export interface TransactionModel {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  date: string;
  description: string;
  type: 'income' | 'expense';
  payment_method?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  image_url?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

/**
 * Adapter untuk model Transaction
 * Menyediakan metode untuk mengakses dan memanipulasi data transaksi
 */
export const useTransactionAdapter = () => {
  const db = useDatabase();

  return {
    /**
     * Mendapatkan semua transaksi
     */
    getAll: async (): Promise<TransactionModel[]> => {
      return await db.getAll<TransactionModel>(TABLES.TRANSACTIONS);
    },

    /**
     * Mendapatkan transaksi berdasarkan ID
     */
    getById: async (id: string): Promise<TransactionModel | null> => {
      return await db.getById<TransactionModel>(TABLES.TRANSACTIONS, id);
    },

    /**
     * Mendapatkan transaksi berdasarkan kategori
     */
    getByCategory: async (categoryId: string): Promise<TransactionModel[]> => {
      return await db.getWhere<TransactionModel>(TABLES.TRANSACTIONS, { category_id: categoryId });
    },

    /**
     * Mendapatkan transaksi berdasarkan tipe (income/expense)
     */
    getByType: async (type: 'income' | 'expense'): Promise<TransactionModel[]> => {
      return await db.getWhere<TransactionModel>(TABLES.TRANSACTIONS, { type });
    },

    /**
     * Membuat transaksi baru
     */
    create: async (data: Omit<TransactionModel, 'id' | 'created_at' | 'updated_at'>): Promise<TransactionModel> => {
      return await db.create<TransactionModel>(TABLES.TRANSACTIONS, data);
    },

    /**
     * Memperbarui transaksi
     */
    update: async (id: string, data: Partial<TransactionModel>): Promise<TransactionModel | null> => {
      return await db.update<TransactionModel>(TABLES.TRANSACTIONS, id, data);
    },

    /**
     * Menghapus transaksi
     */
    delete: async (id: string): Promise<boolean> => {
      return await db.delete(TABLES.TRANSACTIONS, id);
    }
  };
};
