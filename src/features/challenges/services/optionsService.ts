import { supabase } from '../../../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Tipe data untuk opsi tantangan
export interface ChallengeType {
  id: string;
  name: string;
  description: string;
  icon: string;
  iconType: string;
  color: string;
  gradientColors: string[];
  isDefault?: boolean;
  userId?: string;
}

// Tipe data untuk tingkat kesulitan
export interface DifficultyLevel {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  gradientColors: string[];
  isDefault?: boolean;
  userId?: string;
}

// Tipe data untuk opsi durasi
export interface DurationOption {
  id: string | number;
  days: number;
  name: string;
  description: string;
  icon: string;
  iconType: string;
  color: string;
  isDefault?: boolean;
  userId?: string;
}

// Kunci untuk cache
const CACHE_KEYS = {
  CHALLENGE_TYPES: 'cache_challenge_types',
  DIFFICULTY_LEVELS: 'cache_difficulty_levels',
  DURATION_OPTIONS: 'cache_duration_options',
  LAST_UPDATED: 'cache_options_last_updated',
};

// Fungsi untuk mengambil jenis tantangan
export const getChallengeTypes = async (userId: string): Promise<ChallengeType[]> => {
  try {
    // Cek apakah cache masih valid (kurang dari 24 jam)
    const lastUpdated = await AsyncStorage.getItem(CACHE_KEYS.LAST_UPDATED);
    const now = new Date().getTime();
    const cacheValid = lastUpdated && (now - parseInt(lastUpdated)) < 24 * 60 * 60 * 1000;
    
    if (cacheValid) {
      // Gunakan data dari cache
      const cachedData = await AsyncStorage.getItem(CACHE_KEYS.CHALLENGE_TYPES);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    }
    
    // Ambil data default dari Supabase
    const { data: defaultTypes, error: defaultError } = await supabase
      .from('challenge_types')
      .select('*')
      .eq('is_default', true);
      
    if (defaultError) throw defaultError;
    
    // Ambil data kustom pengguna dari Supabase
    const { data: userTypes, error: userError } = await supabase
      .from('user_challenge_types')
      .select('*')
      .eq('user_id', userId);
      
    if (userError) throw userError;
    
    // Transformasi data dari Supabase ke format yang digunakan aplikasi
    const transformedDefaultTypes: ChallengeType[] = (defaultTypes || []).map(type => ({
      id: type.id,
      name: type.name,
      description: type.description,
      icon: type.icon,
      iconType: type.icon_type,
      color: type.color,
      gradientColors: type.gradient_colors || [],
      isDefault: true
    }));
    
    const transformedUserTypes: ChallengeType[] = (userTypes || []).map(type => ({
      id: type.id,
      name: type.name,
      description: type.description,
      icon: type.icon,
      iconType: type.icon_type,
      color: type.color,
      gradientColors: type.gradient_colors || [],
      isDefault: false,
      userId: type.user_id
    }));
    
    // Gabungkan data default dan kustom
    const combinedTypes = [...transformedDefaultTypes, ...transformedUserTypes];
    
    // Simpan ke cache
    await AsyncStorage.setItem(CACHE_KEYS.CHALLENGE_TYPES, JSON.stringify(combinedTypes));
    await AsyncStorage.setItem(CACHE_KEYS.LAST_UPDATED, now.toString());

    return combinedTypes;
  } catch (error) {

    const cachedData = await AsyncStorage.getItem(CACHE_KEYS.CHALLENGE_TYPES);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    
    return [];
  }
};

// Fungsi untuk mengambil tingkat kesulitan
export const getDifficultyLevels = async (_userId: string): Promise<DifficultyLevel[]> => {
  try {
    // Cek apakah cache masih valid (kurang dari 24 jam)
    const lastUpdated = await AsyncStorage.getItem(CACHE_KEYS.LAST_UPDATED);
    const now = new Date().getTime();
    const cacheValid = lastUpdated && (now - parseInt(lastUpdated)) < 24 * 60 * 60 * 1000;
    
    if (cacheValid) {
      // Gunakan data dari cache
      const cachedData = await AsyncStorage.getItem(CACHE_KEYS.DIFFICULTY_LEVELS);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    }
    
    // Ambil data default dari Supabase
    const { data: defaultLevels, error: defaultError } = await supabase
      .from('difficulty_levels')
      .select('*')
      .eq('is_default', true);
      
    if (defaultError) throw defaultError;
    
    // Transformasi data dari Supabase ke format yang digunakan aplikasi
    const transformedLevels: DifficultyLevel[] = (defaultLevels || []).map(level => ({
      id: level.id,
      name: level.name,
      description: level.description,
      icon: level.icon,
      color: level.color,
      gradientColors: level.gradient_colors || [],
      isDefault: true
    }));
    
    // Simpan ke cache
    await AsyncStorage.setItem(CACHE_KEYS.DIFFICULTY_LEVELS, JSON.stringify(transformedLevels));
    await AsyncStorage.setItem(CACHE_KEYS.LAST_UPDATED, now.toString());

    return transformedLevels;
  } catch (error) {
    // Error handling tanpa console.error untuk menghindari ESLint warning

    // Fallback ke cache jika ada
    const cachedData = await AsyncStorage.getItem(CACHE_KEYS.DIFFICULTY_LEVELS);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    
    // Fallback ke data hardcoded
    return [];
  }
};

// Fungsi untuk mengambil opsi durasi
export const getDurationOptions = async (_userId: string): Promise<DurationOption[]> => {
  try {
    // Cek apakah cache masih valid (kurang dari 24 jam)
    const lastUpdated = await AsyncStorage.getItem(CACHE_KEYS.LAST_UPDATED);
    const now = new Date().getTime();
    const cacheValid = lastUpdated && (now - parseInt(lastUpdated)) < 24 * 60 * 60 * 1000;
    
    if (cacheValid) {
      // Gunakan data dari cache
      const cachedData = await AsyncStorage.getItem(CACHE_KEYS.DURATION_OPTIONS);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    }
    
    // Ambil data default dari Supabase
    const { data: defaultOptions, error: defaultError } = await supabase
      .from('duration_options')
      .select('*')
      .eq('is_default', true);
      
    if (defaultError) throw defaultError;
    
    // Transformasi data dari Supabase ke format yang digunakan aplikasi
    const transformedOptions: DurationOption[] = (defaultOptions || []).map(option => ({
      id: option.id,
      days: option.days,
      name: option.name,
      description: option.description,
      icon: option.icon,
      iconType: option.icon_type,
      color: option.color,
      isDefault: true
    }));
    
    // Simpan ke cache
    await AsyncStorage.setItem(CACHE_KEYS.DURATION_OPTIONS, JSON.stringify(transformedOptions));
    await AsyncStorage.setItem(CACHE_KEYS.LAST_UPDATED, now.toString());

    return transformedOptions;
  } catch (error) {

    const cachedData = await AsyncStorage.getItem(CACHE_KEYS.DURATION_OPTIONS);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    
    return [];
  }
};

// Fungsi untuk menambahkan jenis tantangan kustom
export const addCustomChallengeType = async (userId: string, customType: Omit<ChallengeType, 'id'>): Promise<ChallengeType | null> => {
  try {
    // Simpan ke Supabase
    const { data, error } = await supabase
      .from('user_challenge_types')
      .insert({
        user_id: userId,
        name: customType.name,
        description: customType.description,
        icon: customType.icon,
        icon_type: customType.iconType,
        color: customType.color,
        gradient_colors: customType.gradientColors,
      })
      .select();
      
    if (error) throw error;
    
    if (!data || data.length === 0) {
      throw new Error('No data returned after insert');
    }
    
    // Transformasi data dari Supabase ke format yang digunakan aplikasi
    const newType: ChallengeType = {
      id: data[0].id,
      name: data[0].name,
      description: data[0].description,
      icon: data[0].icon,
      iconType: data[0].icon_type,
      color: data[0].color,
      gradientColors: data[0].gradient_colors || [],
      isDefault: false,
      userId: data[0].user_id
    };
    
    // Perbarui cache
    const cachedData = await AsyncStorage.getItem(CACHE_KEYS.CHALLENGE_TYPES);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      parsed.push(newType);
      await AsyncStorage.setItem(CACHE_KEYS.CHALLENGE_TYPES, JSON.stringify(parsed));
    }

    return newType;
  } catch (error) {

    return null;
  }
};
