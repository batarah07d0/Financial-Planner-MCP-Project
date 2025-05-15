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
  try {
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
  } catch (error: any) {
    console.error('Error registering user:', error.message);
    throw error;
  }
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
  try {
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
  } catch (error: any) {
    console.error('Error logging in:', error.message);
    throw error;
  }
};

/**
 * Logout pengguna
 * @returns Promise yang menunjukkan keberhasilan operasi
 */
export const logoutUser = async (): Promise<void> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error: any) {
    console.error('Error logging out:', error.message);
    throw error;
  }
};

/**
 * Reset password pengguna
 * @param email - Email pengguna
 * @returns Promise yang menunjukkan keberhasilan operasi
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  } catch (error: any) {
    console.error('Error resetting password:', error.message);
    throw error;
  }
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
  } catch (error: any) {
    console.error('Error getting current user:', error.message);
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
  try {
    // Update metadata pengguna
    const { data: authData, error: authError } = await supabase.auth.updateUser({
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
  } catch (error: any) {
    console.error('Error updating user profile:', error.message);
    throw error;
  }
};
