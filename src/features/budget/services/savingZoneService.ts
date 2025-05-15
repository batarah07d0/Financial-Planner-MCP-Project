import { v4 as uuidv4 } from 'uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavingZone, SavingZoneInput } from '../models/SavingZone';
import { supabase } from '../../../config/supabase';

// Kunci untuk penyimpanan lokal
const SAVING_ZONES_STORAGE_KEY = '@budgetwise:saving_zones';

// Fungsi untuk mendapatkan semua zona hemat
export const getSavingZones = async (): Promise<SavingZone[]> => {
  try {
    // Coba dapatkan dari Supabase terlebih dahulu
    const { data, error } = await supabase
      .from('saving_zones')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    if (data && data.length > 0) {
      return data as SavingZone[];
    }

    // Jika tidak ada data di Supabase atau terjadi error, gunakan data lokal
    const jsonValue = await AsyncStorage.getItem(SAVING_ZONES_STORAGE_KEY);
    if (jsonValue) {
      return JSON.parse(jsonValue) as SavingZone[];
    }

    return [];
  } catch (error) {
    console.error('Error getting saving zones:', error);

    // Jika terjadi error, coba dapatkan dari penyimpanan lokal
    try {
      const jsonValue = await AsyncStorage.getItem(SAVING_ZONES_STORAGE_KEY);
      if (jsonValue) {
        return JSON.parse(jsonValue) as SavingZone[];
      }
    } catch (localError) {
      console.error('Error getting saving zones from local storage:', localError);
    }

    return [];
  }
};

// Fungsi untuk mendapatkan zona hemat berdasarkan ID
export const getSavingZoneById = async (id: string): Promise<SavingZone | null> => {
  try {
    // Coba dapatkan dari Supabase terlebih dahulu
    const { data, error } = await supabase
      .from('saving_zones')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    if (data) {
      return data as SavingZone;
    }

    // Jika tidak ada data di Supabase atau terjadi error, gunakan data lokal
    const zones = await getSavingZones();
    return zones.find(zone => zone.id === id) || null;
  } catch (error) {
    console.error(`Error getting saving zone with id ${id}:`, error);

    // Jika terjadi error, coba dapatkan dari penyimpanan lokal
    try {
      const zones = await getSavingZones();
      return zones.find(zone => zone.id === id) || null;
    } catch (localError) {
      console.error('Error getting saving zone from local storage:', localError);
    }

    return null;
  }
};

// Fungsi untuk menambahkan zona hemat baru
export const addSavingZone = async (zoneInput: SavingZoneInput): Promise<SavingZone> => {
  const now = new Date().toISOString();
  const newZone: SavingZone = {
    id: uuidv4(),
    ...zoneInput,
    createdAt: now,
    updatedAt: now,
  };

  try {
    // Coba simpan ke Supabase terlebih dahulu
    const { data, error } = await supabase
      .from('saving_zones')
      .insert(newZone)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (data) {
      // Jika berhasil disimpan di Supabase, perbarui juga penyimpanan lokal
      const zones = await getSavingZones();
      const updatedZones = [...zones, data as SavingZone];
      await AsyncStorage.setItem(SAVING_ZONES_STORAGE_KEY, JSON.stringify(updatedZones));

      return data as SavingZone;
    }

    throw new Error('Failed to add saving zone to Supabase');
  } catch (error) {
    console.error('Error adding saving zone to Supabase:', error);

    // Jika terjadi error, simpan ke penyimpanan lokal saja
    try {
      const zones = await getSavingZones();
      const updatedZones = [...zones, newZone];
      await AsyncStorage.setItem(SAVING_ZONES_STORAGE_KEY, JSON.stringify(updatedZones));

      return newZone;
    } catch (localError) {
      console.error('Error adding saving zone to local storage:', localError);
      throw localError;
    }
  }
};

// Fungsi untuk memperbarui zona hemat
export const updateSavingZone = async (id: string, zoneInput: Partial<SavingZoneInput>): Promise<SavingZone> => {
  try {
    const existingZone = await getSavingZoneById(id);

    if (!existingZone) {
      throw new Error(`Saving zone with id ${id} not found`);
    }

    const updatedZone: SavingZone = {
      ...existingZone,
      ...zoneInput,
      updatedAt: new Date().toISOString(),
    };

    // Coba perbarui di Supabase terlebih dahulu
    const { data, error } = await supabase
      .from('saving_zones')
      .update(updatedZone)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (data) {
      // Jika berhasil diperbarui di Supabase, perbarui juga penyimpanan lokal
      const zones = await getSavingZones();
      const updatedZones = zones.map(zone => (zone.id === id ? data as SavingZone : zone));
      await AsyncStorage.setItem(SAVING_ZONES_STORAGE_KEY, JSON.stringify(updatedZones));

      return data as SavingZone;
    }

    throw new Error('Failed to update saving zone in Supabase');
  } catch (error) {
    console.error(`Error updating saving zone with id ${id}:`, error);

    // Jika terjadi error, perbarui di penyimpanan lokal saja
    try {
      const zones = await getSavingZones();
      const existingZone = zones.find(zone => zone.id === id);

      if (!existingZone) {
        throw new Error(`Saving zone with id ${id} not found in local storage`);
      }

      const updatedZone: SavingZone = {
        ...existingZone,
        ...zoneInput,
        updatedAt: new Date().toISOString(),
      };

      const updatedZones = zones.map(zone => (zone.id === id ? updatedZone : zone));
      await AsyncStorage.setItem(SAVING_ZONES_STORAGE_KEY, JSON.stringify(updatedZones));

      return updatedZone;
    } catch (localError) {
      console.error('Error updating saving zone in local storage:', localError);
      throw localError;
    }
  }
};

// Fungsi untuk menghapus zona hemat
export const deleteSavingZone = async (id: string): Promise<boolean> => {
  try {
    // Coba hapus dari Supabase terlebih dahulu
    const { error } = await supabase
      .from('saving_zones')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    // Jika berhasil dihapus dari Supabase, hapus juga dari penyimpanan lokal
    const zones = await getSavingZones();
    const updatedZones = zones.filter(zone => zone.id !== id);
    await AsyncStorage.setItem(SAVING_ZONES_STORAGE_KEY, JSON.stringify(updatedZones));

    return true;
  } catch (error) {
    console.error(`Error deleting saving zone with id ${id}:`, error);

    // Jika terjadi error, hapus dari penyimpanan lokal saja
    try {
      const zones = await getSavingZones();
      const updatedZones = zones.filter(zone => zone.id !== id);
      await AsyncStorage.setItem(SAVING_ZONES_STORAGE_KEY, JSON.stringify(updatedZones));

      return true;
    } catch (localError) {
      console.error('Error deleting saving zone from local storage:', localError);
      return false;
    }
  }
};
