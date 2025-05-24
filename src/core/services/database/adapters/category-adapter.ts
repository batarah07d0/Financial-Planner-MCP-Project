import { useDatabase } from '../../../providers/DatabaseProvider';
import { TABLES } from '../supabase-tables';

// Model untuk Category
export interface CategoryModel {
  id: string;
  user_id?: string;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
  is_default?: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Adapter untuk model Category
 * Menyediakan metode untuk mengakses dan memanipulasi data kategori
 */
export const useCategoryAdapter = () => {
  const db = useDatabase();

  return {
    /**
     * Mendapatkan semua kategori
     */
    getAll: async (): Promise<CategoryModel[]> => {
      return await db.getAll<CategoryModel>(TABLES.CATEGORIES);
    },

    /**
     * Mendapatkan kategori berdasarkan ID
     */
    getById: async (id: string): Promise<CategoryModel | null> => {
      return await db.getById<CategoryModel>(TABLES.CATEGORIES, id);
    },

    /**
     * Mendapatkan kategori berdasarkan tipe (income/expense)
     */
    getByType: async (type: 'income' | 'expense'): Promise<CategoryModel[]> => {
      return await db.getWhere<CategoryModel>(TABLES.CATEGORIES, { type });
    },

    /**
     * Membuat kategori baru
     */
    create: async (data: Omit<CategoryModel, 'id' | 'created_at' | 'updated_at'>): Promise<CategoryModel> => {
      return await db.create<CategoryModel>(TABLES.CATEGORIES, data);
    },

    /**
     * Memperbarui kategori
     */
    update: async (id: string, data: Partial<CategoryModel>): Promise<CategoryModel | null> => {
      return await db.update<CategoryModel>(TABLES.CATEGORIES, id, data);
    },

    /**
     * Menghapus kategori
     */
    delete: async (id: string): Promise<boolean> => {
      return await db.delete(TABLES.CATEGORIES, id);
    }
  };
};
