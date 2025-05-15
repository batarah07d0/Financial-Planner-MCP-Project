import { v4 as uuidv4 } from 'uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../../config/supabase';
import {
  Product,
  ProductInput,
  ProductPrice,
  ProductPriceInput,
  Store,
  StoreInput,
  ProductWithPrices
} from '../models/Product';
import { getDistance } from 'geolib';

// Kunci untuk penyimpanan lokal
const PRODUCTS_STORAGE_KEY = '@budgetwise:products';
const PRODUCT_PRICES_STORAGE_KEY = '@budgetwise:product_prices';
const STORES_STORAGE_KEY = '@budgetwise:stores';

// Fungsi untuk mendapatkan semua produk
export const getProducts = async (): Promise<Product[]> => {
  try {
    // Coba dapatkan dari Supabase terlebih dahulu
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    if (data && data.length > 0) {
      return data as Product[];
    }

    // Jika tidak ada data di Supabase atau terjadi error, gunakan data lokal
    const jsonValue = await AsyncStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (jsonValue) {
      return JSON.parse(jsonValue) as Product[];
    }

    return [];
  } catch (error) {
    console.error('Error getting products:', error);

    // Jika terjadi error, coba dapatkan dari penyimpanan lokal
    try {
      const jsonValue = await AsyncStorage.getItem(PRODUCTS_STORAGE_KEY);
      if (jsonValue) {
        return JSON.parse(jsonValue) as Product[];
      }
    } catch (localError) {
      console.error('Error getting products from local storage:', localError);
    }

    return [];
  }
};

// Fungsi untuk mendapatkan produk berdasarkan ID
export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    // Coba dapatkan dari Supabase terlebih dahulu
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    if (data) {
      return data as Product;
    }

    // Jika tidak ada data di Supabase atau terjadi error, gunakan data lokal
    const products = await getProducts();
    return products.find(product => product.id === id) || null;
  } catch (error) {
    console.error(`Error getting product with id ${id}:`, error);

    // Jika terjadi error, coba dapatkan dari penyimpanan lokal
    try {
      const products = await getProducts();
      return products.find(product => product.id === id) || null;
    } catch (localError) {
      console.error('Error getting product from local storage:', localError);
    }

    return null;
  }
};

// Fungsi untuk menambahkan produk baru
export const addProduct = async (productInput: ProductInput): Promise<Product> => {
  const now = new Date().toISOString();
  const newProduct: Product = {
    id: uuidv4(),
    ...productInput,
    createdAt: now,
    updatedAt: now,
  };

  try {
    // Coba simpan ke Supabase terlebih dahulu
    const { data, error } = await supabase
      .from('products')
      .insert(newProduct)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (data) {
      // Jika berhasil disimpan di Supabase, perbarui juga penyimpanan lokal
      const products = await getProducts();
      const updatedProducts = [...products, data as Product];
      await AsyncStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(updatedProducts));

      return data as Product;
    }

    throw new Error('Failed to add product to Supabase');
  } catch (error) {
    console.error('Error adding product to Supabase:', error);

    // Jika terjadi error, simpan ke penyimpanan lokal saja
    try {
      const products = await getProducts();
      const updatedProducts = [...products, newProduct];
      await AsyncStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(updatedProducts));

      return newProduct;
    } catch (localError) {
      console.error('Error adding product to local storage:', localError);
      throw localError;
    }
  }
};

// Fungsi untuk mendapatkan semua toko
export const getStores = async (): Promise<Store[]> => {
  try {
    // Coba dapatkan dari Supabase terlebih dahulu
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    if (data && data.length > 0) {
      return data as Store[];
    }

    // Jika tidak ada data di Supabase atau terjadi error, gunakan data lokal
    const jsonValue = await AsyncStorage.getItem(STORES_STORAGE_KEY);
    if (jsonValue) {
      return JSON.parse(jsonValue) as Store[];
    }

    return [];
  } catch (error) {
    console.error('Error getting stores:', error);

    // Jika terjadi error, coba dapatkan dari penyimpanan lokal
    try {
      const jsonValue = await AsyncStorage.getItem(STORES_STORAGE_KEY);
      if (jsonValue) {
        return JSON.parse(jsonValue) as Store[];
      }
    } catch (localError) {
      console.error('Error getting stores from local storage:', localError);
    }

    return [];
  }
};

// Fungsi untuk menambahkan toko baru
export const addStore = async (storeInput: StoreInput): Promise<Store> => {
  const now = new Date().toISOString();
  const newStore: Store = {
    id: uuidv4(),
    ...storeInput,
    createdAt: now,
    updatedAt: now,
  };

  try {
    // Coba simpan ke Supabase terlebih dahulu
    const { data, error } = await supabase
      .from('stores')
      .insert(newStore)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (data) {
      // Jika berhasil disimpan di Supabase, perbarui juga penyimpanan lokal
      const stores = await getStores();
      const updatedStores = [...stores, data as Store];
      await AsyncStorage.setItem(STORES_STORAGE_KEY, JSON.stringify(updatedStores));

      return data as Store;
    }

    throw new Error('Failed to add store to Supabase');
  } catch (error) {
    console.error('Error adding store to Supabase:', error);

    // Jika terjadi error, simpan ke penyimpanan lokal saja
    try {
      const stores = await getStores();
      const updatedStores = [...stores, newStore];
      await AsyncStorage.setItem(STORES_STORAGE_KEY, JSON.stringify(updatedStores));

      return newStore;
    } catch (localError) {
      console.error('Error adding store to local storage:', localError);
      throw localError;
    }
  }
};

// Fungsi untuk mendapatkan toko terdekat
export const getNearbyStores = async (
  latitude: number,
  longitude: number,
  maxDistance: number = 5000 // dalam meter
): Promise<Store[]> => {
  try {
    const stores = await getStores();

    // Filter toko berdasarkan jarak
    const nearbyStores = stores.filter(store => {
      const distance = getDistance(
        { latitude, longitude },
        { latitude: store.location.latitude, longitude: store.location.longitude }
      );

      return distance <= maxDistance;
    });

    // Urutkan berdasarkan jarak terdekat
    nearbyStores.sort((a, b) => {
      const distanceA = getDistance(
        { latitude, longitude },
        { latitude: a.location.latitude, longitude: a.location.longitude }
      );

      const distanceB = getDistance(
        { latitude, longitude },
        { latitude: b.location.latitude, longitude: b.location.longitude }
      );

      return distanceA - distanceB;
    });

    return nearbyStores;
  } catch (error) {
    console.error('Error getting nearby stores:', error);
    return [];
  }
};
