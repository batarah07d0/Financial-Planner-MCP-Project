import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../../config/supabase';

interface User {
  id: string;
  email: string | null;
  name?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<{
    success: boolean;
    user?: User;
    error?: string;
  }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  setOnboardingComplete: (completed: boolean) => void;
  clearError: () => void;
  initializeOnboardingStatus: () => Promise<void>;

  // State setters
  setUser: (user: User | null) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  hasCompletedOnboarding: false,
  error: null,

  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });

      // Validasi input
      if (!email.trim()) {
        throw new Error('Email tidak boleh kosong');
      }
      if (!password.trim()) {
        throw new Error('Password tidak boleh kosong');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        set({
          user: {
            id: data.user.id,
            email: data.user.email || null,
            name: data.user.user_metadata?.name,
          },
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        throw new Error('Gagal mendapatkan data pengguna');
      }
    } catch (error: unknown) {
      const errorObj = error as Error;

      // Pesan error yang lebih user-friendly
      let errorMessage = 'Gagal masuk. Silakan coba lagi.';

      if (errorObj.message.includes('Invalid login credentials')) {
        errorMessage = 'Email atau password salah. Silakan coba lagi.';
      } else if (errorObj.message.includes('Email not confirmed')) {
        errorMessage = 'Email belum dikonfirmasi. Silakan cek email Anda untuk konfirmasi atau hubungi admin.';
      } else if (errorObj.message.includes('Email')) {
        errorMessage = errorObj.message;
      } else if (errorObj.message.includes('Password')) {
        errorMessage = errorObj.message;
      }

      set({
        error: errorMessage,
        isLoading: false,
      });
    }
  },

  register: async (email, password, name) => {
    try {
      set({ isLoading: true, error: null });

      // Validasi input
      if (!name.trim()) {
        throw new Error('Nama tidak boleh kosong');
      }
      if (!email.trim()) {
        throw new Error('Email tidak boleh kosong');
      }
      if (!password.trim()) {
        throw new Error('Password tidak boleh kosong');
      }
      if (password.length < 8) {
        throw new Error('Password minimal 8 karakter');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Buat atau perbarui profil pengguna di database
        try {
          // Cek apakah profil sudah ada
          const { data: existingProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
            // Error checking existing profile, but continue
          }

          if (existingProfile) {
            // Profil sudah ada, perbarui saja
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                email: data.user.email || '',
                name,
                updated_at: new Date().toISOString()
              })
              .eq('id', data.user.id);

            if (updateError) {
              // Error updating profile, but continue
            }
          } else {
            // Profil belum ada, buat baru
            const { error: profileError } = await supabase
              .from('profiles')
              .insert([
                {
                  id: data.user.id,
                  email: data.user.email || '',
                  name,
                },
              ]);

            if (profileError) {
              // Jika error terkait kolom 'name' tidak ditemukan, coba tanpa kolom name
              if (profileError.message && profileError.message.includes("name")) {
                const { error: retryError } = await supabase
                  .from('profiles')
                  .insert([
                    {
                      id: data.user.id,
                      email: data.user.email || '',
                    },
                  ]);

                if (retryError) {
                  // Jika masih error dan terkait dengan duplicate key, abaikan saja
                  // karena kemungkinan profil sudah ada tetapi tidak terdeteksi
                  if (retryError.code === '23505') {
                    // Profile likely already exists, ignoring duplicate key error
                  }
                }
              } else if (profileError.code === '23505') {
                // Duplicate key error, profil sudah ada
                // Profile already exists (duplicate key), ignoring error
              }
            }
          }
        } catch (insertError) {
          // Exception during profile creation, but continue
        }

        // Tidak langsung set isAuthenticated = true
        // Biarkan pengguna login setelah registrasi
        set({
          isLoading: false,
          error: null,
        });

        // Konversi ke format User yang kita gunakan
        const user: User = {
          id: data.user.id,
          email: data.user.email || null,
          name: data.user.user_metadata?.name,
        };

        return { success: true, user };
      } else {
        throw new Error('Gagal mendapatkan data pengguna');
      }
    } catch (error: unknown) {
      const errorObj = error as Error;

      // Pesan error yang lebih user-friendly
      let errorMessage = 'Gagal mendaftar. Silakan coba lagi.';

      if (errorObj.message.includes('already registered')) {
        errorMessage = 'Email sudah terdaftar. Silakan gunakan email lain atau login.';
      } else if (errorObj.message.includes('Email')) {
        errorMessage = errorObj.message;
      } else if (errorObj.message.includes('Password')) {
        errorMessage = errorObj.message;
      } else if (errorObj.message.includes('Nama')) {
        errorMessage = errorObj.message;
      }

      set({
        error: errorMessage,
        isLoading: false,
      });

      return { success: false, error: errorMessage };
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true, error: null });

      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error: unknown) {
      const errorObj = error as Error;
      set({
        error: errorObj.message || 'Gagal keluar. Silakan coba lagi.',
        isLoading: false,
      });
    }
  },

  resetPassword: async (email) => {
    try {
      set({ isLoading: true, error: null });

      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) throw error;

      set({ isLoading: false });
    } catch (error: unknown) {
      const errorObj = error as Error;
      set({
        error: errorObj.message || 'Gagal mengirim email reset password. Silakan coba lagi.',
        isLoading: false,
      });
    }
  },

  setOnboardingComplete: async (completed) => {
    try {
      // Simpan ke AsyncStorage
      await AsyncStorage.setItem('@onboarding_completed', completed.toString());
      set({ hasCompletedOnboarding: completed });
    } catch (error) {
      // Tetap set state meskipun gagal simpan ke storage
      set({ hasCompletedOnboarding: completed });
    }
  },

  initializeOnboardingStatus: async () => {
    try {
      // Check if onboarding has been completed
      const completed = await AsyncStorage.getItem('@onboarding_completed');
      set({ hasCompletedOnboarding: completed === 'true' });
    } catch (error) {
      // Default ke false jika error
      set({ hasCompletedOnboarding: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  setUser: (user) => {
    set({ user });
  },

  setIsAuthenticated: (isAuthenticated) => {
    set({ isAuthenticated });
  },
}));
