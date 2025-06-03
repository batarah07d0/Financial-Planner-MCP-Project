import { supabase } from '../../../config/supabase';
import { Category } from './types';

/**
 * Mendapatkan semua kategori
 * @param options - Opsi untuk query
 * @returns Promise yang berisi array kategori
 */
export const getCategories = async (
  options: {
    userId?: string;
    type?: 'income' | 'expense';
    isDefault?: boolean;
  } = {}
): Promise<Category[]> => {
  const { userId, type, isDefault } = options;

  let query = supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  if (userId) {
    query = query.or(`user_id.eq.${userId},is_default.eq.true`);
  } else {
    query = query.eq('is_default', true);
  }

  if (type) {
    query = query.eq('type', type);
  }

  if (isDefault !== undefined) {
    query = query.eq('is_default', isDefault);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data as Category[];
};

/**
 * Mendapatkan kategori berdasarkan ID
 * @param id - ID kategori
 * @returns Promise yang berisi kategori
 */
export const getCategoryById = async (id: string): Promise<Category> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;

  if (!data) {
    throw new Error('Kategori tidak ditemukan');
  }

  return data as Category;
};

/**
 * Membuat kategori baru
 * @param category - Data kategori
 * @returns Promise yang berisi kategori yang dibuat
 */
export const createCategory = async (
  category: Omit<Category, 'id' | 'created_at' | 'updated_at'>
): Promise<Category> => {
  const { data, error } = await supabase
    .from('categories')
    .insert([category])
    .select()
    .single();

  if (error) throw error;

  if (!data) {
    throw new Error('Gagal membuat kategori');
  }

  return data as Category;
};

/**
 * Memperbarui kategori
 * @param id - ID kategori
 * @param updates - Data yang akan diperbarui
 * @returns Promise yang berisi kategori yang diperbarui
 */
export const updateCategory = async (
  id: string,
  updates: Partial<Category>
): Promise<Category> => {
  // Pastikan kategori bukan kategori default
  const { data: categoryData } = await supabase
    .from('categories')
    .select('is_default')
    .eq('id', id)
    .single();

  if (categoryData && categoryData.is_default) {
    throw new Error('Kategori default tidak dapat diubah');
  }

  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  if (!data) {
    throw new Error('Gagal memperbarui kategori');
  }

  return data as Category;
};

/**
 * Menghapus kategori
 * @param id - ID kategori
 * @returns Promise yang menunjukkan keberhasilan operasi
 */
export const deleteCategory = async (id: string): Promise<void> => {
  // Pastikan kategori bukan kategori default
  const { data: categoryData } = await supabase
    .from('categories')
    .select('is_default')
    .eq('id', id)
    .single();

  if (categoryData && categoryData.is_default) {
    throw new Error('Kategori default tidak dapat dihapus');
  }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
