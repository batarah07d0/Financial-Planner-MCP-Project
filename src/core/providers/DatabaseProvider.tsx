import React, { createContext, useContext, ReactNode } from 'react';
import { supabase } from '../../config/supabase';
import { v4 as uuidv4 } from 'uuid';

// Interface untuk database service
interface DatabaseService {
  // Operasi dasar database
  getAll: <T>(tableName: string) => Promise<T[]>;
  getById: <T>(tableName: string, id: string) => Promise<T | null>;
  getWhere: <T>(tableName: string, conditions: Record<string, any>) => Promise<T[]>;
  create: <T>(tableName: string, data: Record<string, any>) => Promise<T>;
  update: <T>(tableName: string, id: string, data: Record<string, any>) => Promise<T | null>;
  delete: (tableName: string, id: string) => Promise<boolean>;
}

// Context untuk database
const DatabaseContext = createContext<DatabaseService | null>(null);

// Tipe untuk Provider
interface DatabaseProviderProps {
  children: ReactNode;
}

// Provider untuk database
export const DatabaseProvider = ({ children }: DatabaseProviderProps): React.ReactNode => {
  // Implementasi service database menggunakan Supabase
  const databaseService: DatabaseService = {
    // Mendapatkan semua data dari tabel
    getAll: async <T,>(tableName: string): Promise<T[]> => {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error(`Error fetching data from ${tableName}:`, error);
          throw error;
        }

        return (data || []) as T[];
      } catch (error) {
        console.error(`Error in getAll for ${tableName}:`, error);
        return [];
      }
    },

    // Mendapatkan data berdasarkan ID
    getById: async <T,>(tableName: string, id: string): Promise<T | null> => {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // PGRST116 adalah kode untuk "tidak ditemukan"
            return null;
          }
          console.error(`Error fetching data by ID from ${tableName}:`, error);
          throw error;
        }

        return data as T;
      } catch (error) {
        console.error(`Error in getById for ${tableName}:`, error);
        return null;
      }
    },

    // Mendapatkan data berdasarkan kondisi
    getWhere: async <T,>(tableName: string, conditions: Record<string, any>): Promise<T[]> => {
      try {
        let query = supabase.from(tableName).select('*');

        // Tambahkan semua kondisi ke query
        Object.entries(conditions).forEach(([key, value]) => {
          query = query.eq(key, value);
        });

        const { data, error } = await query;

        if (error) {
          console.error(`Error fetching data with conditions from ${tableName}:`, error);
          throw error;
        }

        return (data || []) as T[];
      } catch (error) {
        console.error(`Error in getWhere for ${tableName}:`, error);
        return [];
      }
    },

    // Membuat data baru
    create: async <T,>(tableName: string, data: Record<string, any>): Promise<T> => {
      try {
        const now = new Date().toISOString();
        const newData = {
          id: data.id || uuidv4(),
          ...data,
          created_at: now,
          updated_at: now,
        };

        const { data: result, error } = await supabase
          .from(tableName)
          .insert([newData])
          .select()
          .single();

        if (error) {
          console.error(`Error creating data in ${tableName}:`, error);
          throw error;
        }

        if (!result) {
          throw new Error(`Failed to create data in ${tableName}`);
        }

        return result as T;
      } catch (error) {
        console.error(`Error in create for ${tableName}:`, error);
        throw error as Error;
      }
    },

    // Memperbarui data
    update: async <T,>(tableName: string, id: string, data: Record<string, any>): Promise<T | null> => {
      try {
        const now = new Date().toISOString();
        const updateData = {
          ...data,
          updated_at: now,
        };

        const { data: result, error } = await supabase
          .from(tableName)
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error(`Error updating data in ${tableName}:`, error);
          throw error;
        }

        return result as T;
      } catch (error) {
        console.error(`Error in update for ${tableName}:`, error);
        return null;
      }
    },

    // Menghapus data
    delete: async (tableName: string, id: string): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('id', id);

        if (error) {
          console.error(`Error deleting data from ${tableName}:`, error);
          throw error;
        }

        return true;
      } catch (error) {
        console.error(`Error in delete for ${tableName}:`, error);
        return false;
      }
    },
  };

  return (
    <DatabaseContext.Provider value={databaseService}>
      {children}
    </DatabaseContext.Provider>
  );
};

// Hook untuk menggunakan database
export const useDatabase = (): DatabaseService => {
  const context = useContext(DatabaseContext);

  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }

  return context;
};
