import { supabase } from '../../../config/supabase';
import { Transaction } from './types';

/**
 * Mendapatkan semua transaksi pengguna
 * @param userId - ID pengguna
 * @param options - Opsi untuk query
 * @returns Promise yang berisi array transaksi
 */
export const getTransactions = async (
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
    type?: 'income' | 'expense';
    categoryId?: string;
  } = {}
): Promise<Transaction[]> => {
  const {
    limit = 10,
    offset = 0,
    startDate,
    endDate,
    type,
    categoryId,
  } = options;

  let query = supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(limit)
    .range(offset, offset + limit - 1);

  if (startDate) {
    query = query.gte('date', startDate);
  }

  if (endDate) {
    query = query.lte('date', endDate);
  }

  if (type) {
    query = query.eq('type', type);
  }

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data as Transaction[];
};

/**
 * Mendapatkan transaksi berdasarkan ID
 * @param id - ID transaksi
 * @returns Promise yang berisi transaksi
 */
export const getTransactionById = async (id: string): Promise<Transaction> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;

  if (!data) {
    throw new Error('Transaksi tidak ditemukan');
  }

  return data as Transaction;
};

/**
 * Membuat transaksi baru
 * @param transaction - Data transaksi
 * @returns Promise yang berisi transaksi yang dibuat
 */
export const createTransaction = async (
  transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>
): Promise<Transaction> => {
  const { data, error } = await supabase
    .from('transactions')
    .insert([transaction])
    .select()
    .single();

  if (error) throw error;

  if (!data) {
    throw new Error('Gagal membuat transaksi');
  }

  return data as Transaction;
};

/**
 * Memperbarui transaksi
 * @param id - ID transaksi
 * @param updates - Data yang akan diperbarui
 * @returns Promise yang berisi transaksi yang diperbarui
 */
export const updateTransaction = async (
  id: string,
  updates: Partial<Transaction>
): Promise<Transaction> => {
  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  if (!data) {
    throw new Error('Gagal memperbarui transaksi');
  }

  return data as Transaction;
};

/**
 * Menghapus transaksi
 * @param id - ID transaksi
 * @returns Promise yang menunjukkan keberhasilan operasi
 */
export const deleteTransaction = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
