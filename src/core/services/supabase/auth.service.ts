import { supabase } from '../../../config/supabase';
import { User } from './types';

/**
 * Mendaftarkan pengguna baru
 * @param email - Email pengguna
 * @param password - Password pengguna
 * @param name - Nama pengguna
 * @returns Promise yang berisi data pengguna
 */
export const registerUser = async (
  email: string,
  password: string,
  name: string
): Promise<User> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  });

  if (error) throw error;

  if (!data.user) {
    throw new Error('Gagal mendaftarkan pengguna');
  }

  // Buat profil pengguna di database
  const { error: profileError } = await supabase
    .from('profiles')
    .insert([
      {
        id: data.user.id,
        email: data.user.email,
        name,
      },
    ]);

  if (profileError) throw profileError;

  return {
    id: data.user.id,
    email: data.user.email || '',
    name: data.user.user_metadata?.name,
    created_at: data.user.created_at || new Date().toISOString(),
    updated_at: data.user.updated_at || new Date().toISOString(),
  };
};

/**
 * Login pengguna
 * @param email - Email pengguna
 * @param password - Password pengguna
 * @returns Promise yang berisi data pengguna
 */
export const loginUser = async (
  email: string,
  password: string
): Promise<User> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  if (!data.user) {
    throw new Error('Gagal login');
  }

  return {
    id: data.user.id,
    email: data.user.email || '',
    name: data.user.user_metadata?.name,
    created_at: data.user.created_at || new Date().toISOString(),
    updated_at: data.user.updated_at || new Date().toISOString(),
  };
};

/**
 * Logout pengguna
 * @returns Promise yang menunjukkan keberhasilan operasi
 */
export const logoutUser = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

/**
 * Reset password pengguna
 * @param email - Email pengguna
 * @returns Promise yang menunjukkan keberhasilan operasi
 */
export const resetPassword = async (email: string): Promise<void> => {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
};

/**
 * Mendapatkan pengguna saat ini
 * @returns Promise yang berisi data pengguna
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) throw error;

    if (!data.user) {
      return null;
    }

    return {
      id: data.user.id,
      email: data.user.email || '',
      name: data.user.user_metadata?.name,
      created_at: data.user.created_at || new Date().toISOString(),
      updated_at: data.user.updated_at || new Date().toISOString(),
    };
  } catch (error: unknown) {
    return null;
  }
};

/**
 * Memperbarui profil pengguna
 * @param userId - ID pengguna
 * @param updates - Data yang akan diperbarui
 * @returns Promise yang berisi data pengguna yang diperbarui
 */
export const updateUserProfile = async (
  userId: string,
  updates: Partial<User>
): Promise<User> => {
  // Update metadata pengguna
  const { error: authError } = await supabase.auth.updateUser({
    data: {
      name: updates.name,
    },
  });

  if (authError) throw authError;

  // Update profil pengguna di database
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;

  if (!data) {
    throw new Error('Gagal memperbarui profil pengguna');
  }

  return data as User;
};
