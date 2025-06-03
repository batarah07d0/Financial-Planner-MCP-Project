import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../services/store';

export const useSupabaseAuth = () => {
  const [isLoading, setIsLoading] = useState(true);
  const {
    user,
    isAuthenticated,
    login,
    logout,
    register,
    resetPassword,
    setUser,
    setIsAuthenticated
  } = useAuthStore();

  // Cek status autentikasi saat hook dimuat
  useEffect(() => {
    const checkSession = async () => {
      try {
        setIsLoading(true);
        const { data } = await supabase.auth.getSession();

        // Jika ada sesi aktif, update state
        if (data.session) {
          const { user: authUser } = data.session;

          if (authUser) {
            setUser({
              id: authUser.id,
              email: authUser.email || '',
              name: authUser.user_metadata?.name,
            });
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        // Error checking auth session - silently handled
      } finally {
        setIsLoading(false);
      }
    };

    // Setup listener untuk perubahan autentikasi
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const { user: authUser } = session;

          if (authUser) {
            setUser({
              id: authUser.id,
              email: authUser.email || '',
              name: authUser.user_metadata?.name,
            });
            setIsAuthenticated(true);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    );

    checkSession();

    // Cleanup listener saat komponen unmount
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [setUser, setIsAuthenticated, setIsLoading]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    register,
    resetPassword,
  };
};
