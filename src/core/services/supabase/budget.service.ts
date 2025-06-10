import { supabase } from '../../../config/supabase';
import { Budget } from './types';

/**
 * Mendapatkan semua anggaran pengguna
 * @param userId - ID pengguna
 * @param options - Opsi untuk query
 * @returns Promise yang berisi array anggaran
 */
export const getBudgets = async (
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    categoryId?: string;
  } = {}
): Promise<Budget[]> => {
  const {
    limit = 10,
    offset = 0,
    period,
    categoryId,
  } = options;

  let query = supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
    .range(offset, offset + limit - 1);

  // Cek apakah kolom period ada di tabel budgets
  try {
    if (period) {
      query = query.eq('period', period);
    }
  } catch (periodError) {
    // Lanjutkan tanpa filter period
  }

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query;

  if (error) {
    // Jika error terkait kolom period, coba lagi tanpa filter period
    if (error.message && error.message.includes('period does not exist') && period) {
      return await getBudgets(userId, { ...options, period: undefined });
    }
    throw error;
  }

  return data as Budget[];
};

/**
 * Mendapatkan anggaran berdasarkan ID
 * @param id - ID anggaran
 * @returns Promise yang berisi anggaran
 */
export const getBudgetById = async (id: string): Promise<Budget> => {
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;

  if (!data) {
    throw new Error('Anggaran tidak ditemukan');
  }

  return data as Budget;
};

/**
 * Membuat anggaran baru
 * @param budget - Data anggaran
 * @returns Promise yang berisi anggaran yang dibuat
 */
export const createBudget = async (
  budget: Omit<Budget, 'id' | 'created_at' | 'updated_at'>
): Promise<Budget> => {
  const { data, error } = await supabase
    .from('budgets')
    .insert([budget])
    .select()
    .single();

  if (error) throw error;

  if (!data) {
    throw new Error('Gagal membuat anggaran');
  }

  return data as Budget;
};

/**
 * Memperbarui anggaran
 * @param id - ID anggaran
 * @param updates - Data yang akan diperbarui
 * @returns Promise yang berisi anggaran yang diperbarui
 */
export const updateBudget = async (
  id: string,
  updates: Partial<Budget>
): Promise<Budget> => {
  const { data, error } = await supabase
    .from('budgets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  if (!data) {
    throw new Error('Gagal memperbarui anggaran');
  }

  return data as Budget;
};

/**
 * Menghapus anggaran
 * @param id - ID anggaran
 * @returns Promise yang menunjukkan keberhasilan operasi
 */
export const deleteBudget = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

/**
 * Mendapatkan total pengeluaran untuk anggaran
 * @param userId - ID pengguna
 * @param categoryId - ID kategori
 * @param startDate - Tanggal mulai
 * @param endDate - Tanggal akhir
 * @returns Promise yang berisi total pengeluaran
 */
export const getBudgetSpending = async (
  userId: string,
  categoryId: string,
  startDate: string,
  endDate: string
): Promise<number> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('amount')
    .eq('user_id', userId)
    .eq('category_id', categoryId)
    .eq('type', 'expense')
    .gte('date', startDate)
    .lte('date', endDate);

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return 0;
  }

  // Pastikan amount dikonversi ke number dengan benar
  const total = data.reduce((sum, transaction) => {
    const amount = Number(transaction.amount) || 0;
    return sum + amount;
  }, 0);

  return total;
};

/**
 * Mendapatkan detail pengeluaran untuk anggaran dengan breakdown
 * @param userId - ID pengguna
 * @param categoryId - ID kategori
 * @param startDate - Tanggal mulai
 * @param endDate - Tanggal akhir
 * @returns Promise yang berisi detail pengeluaran
 */
export const getBudgetSpendingDetails = async (
  userId: string,
  categoryId: string,
  startDate: string,
  endDate: string
): Promise<{
  total: number;
  planned: number;
  unplanned: number;
  transactions: Array<{
    amount: number;
    description?: string;
    date: string;
    is_planned?: boolean;
  }>;
}> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('amount, description, date, is_planned')
    .eq('user_id', userId)
    .eq('category_id', categoryId)
    .eq('type', 'expense')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });

  if (error) throw error;

  if (!data) {
    return {
      total: 0,
      planned: 0,
      unplanned: 0,
      transactions: []
    };
  }

  const total = data.reduce((sum, transaction) => sum + transaction.amount, 0);
  const planned = data
    .filter(t => t.is_planned)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const unplanned = total - planned;

  return {
    total,
    planned,
    unplanned,
    transactions: data
  };
};
