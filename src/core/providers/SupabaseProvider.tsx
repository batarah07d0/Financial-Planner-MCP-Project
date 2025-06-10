import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { supabase } from '../../config/supabase';

// Buat context untuk Supabase
interface SupabaseContextType {
  supabase: typeof supabase;
  isReady: boolean;
}

const SupabaseContext = createContext<SupabaseContextType>({
  supabase,
  isReady: false,
});

// Provider untuk Supabase
export const SupabaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Inisialisasi koneksi Supabase
    const initSupabase = async () => {
      try {
        // Cek koneksi ke Supabase
        const { error } = await supabase.from('health_check').select('*').limit(1);
        
        if (error) {
          // Tetap lanjutkan karena mungkin offline
          // Logging dihapus untuk mengurangi noise di console
        }

        // Supabase connection initialized successfully
        // Logging dihapus untuk mengurangi noise di console
        setIsReady(true);

      } catch (err: unknown) {
        // Error handled silently
        // Tetap set isReady ke true agar aplikasi bisa berjalan dalam mode offline
        setIsReady(true);
      }
    };

    initSupabase();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ marginTop: 10 }}>Menghubungkan ke database...</Text>
      </View>
    );
  }

  return (
    <SupabaseContext.Provider value={{
      supabase,
      isReady
    }}>
      {children}
    </SupabaseContext.Provider>
  );
};

// Hook untuk menggunakan Supabase
export const useSupabase = () => {
  const context = useContext(SupabaseContext);

  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }

  return context.supabase;
};
