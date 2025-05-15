import { v4 as uuidv4 } from 'uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../../config/supabase';
import {
  ProductPrice,
  ProductPriceInput,
  Store,
  Product,
  ProductWithPrices
} from '../models/Product';
import { getProducts, getProductById } from './productService';
import { getStores } from './productService';

// Kunci untuk penyimpanan lokal
const PRODUCT_PRICES_STORAGE_KEY = '@budgetwise:product_prices';

// Fungsi untuk mendapatkan semua harga produk
export const getProductPrices = async (): Promise<ProductPrice[]> => {
  try {
    // Coba dapatkan dari Supabase terlebih dahulu
    const { data, error } = await supabase
      .from('product_prices')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    if (data && data.length > 0) {
      return data as ProductPrice[];
    }

    // Jika tidak ada data di Supabase atau terjadi error, gunakan data lokal
    const jsonValue = await AsyncStorage.getItem(PRODUCT_PRICES_STORAGE_KEY);
    if (jsonValue) {
      return JSON.parse(jsonValue) as ProductPrice[];
    }

    return [];
  } catch (error) {
    console.error('Error getting product prices:', error);

    // Jika terjadi error, coba dapatkan dari penyimpanan lokal
    try {
      const jsonValue = await AsyncStorage.getItem(PRODUCT_PRICES_STORAGE_KEY);
      if (jsonValue) {
        return JSON.parse(jsonValue) as ProductPrice[];
      }
    } catch (localError) {
      console.error('Error getting product prices from local storage:', localError);
    }

    return [];
  }
};

// Fungsi untuk mendapatkan harga produk berdasarkan ID produk
export const getProductPricesByProductId = async (productId: string): Promise<ProductPrice[]> => {
  try {
    // Coba dapatkan dari Supabase terlebih dahulu
    const { data, error } = await supabase
      .from('product_prices')
      .select('*')
      .eq('product_id', productId)
      .order('price_date', { ascending: false });

    if (error) {
      throw error;
    }

    if (data && data.length > 0) {
      return data as ProductPrice[];
    }

    // Jika tidak ada data di Supabase atau terjadi error, gunakan data lokal
    const prices = await getProductPrices();
    return prices.filter(price => price.productId === productId);
  } catch (error) {
    console.error(`Error getting product prices for product ${productId}:`, error);

    // Jika terjadi error, coba dapatkan dari penyimpanan lokal
    try {
      const prices = await getProductPrices();
      return prices.filter(price => price.productId === productId);
    } catch (localError) {
      console.error('Error getting product prices from local storage:', localError);
    }

    return [];
  }
};

// Fungsi untuk menambahkan harga produk baru
export const addProductPrice = async (
  priceInput: ProductPriceInput,
  userId: string
): Promise<ProductPrice> => {
  const now = new Date().toISOString();
  const newPrice: ProductPrice = {
    id: uuidv4(),
    ...priceInput,
    priceDate: priceInput.priceDate || now,
    userId,
    isVerified: false,
    upvotes: 0,
    downvotes: 0,
    createdAt: now,
    updatedAt: now,
  };

  try {
    // Coba simpan ke Supabase terlebih dahulu
    const { data, error } = await supabase
      .from('product_prices')
      .insert(newPrice)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (data) {
      // Jika berhasil disimpan di Supabase, perbarui juga penyimpanan lokal
      const prices = await getProductPrices();
      const updatedPrices = [...prices, data as ProductPrice];
      await AsyncStorage.setItem(PRODUCT_PRICES_STORAGE_KEY, JSON.stringify(updatedPrices));

      return data as ProductPrice;
    }

    throw new Error('Failed to add product price to Supabase');
  } catch (error) {
    console.error('Error adding product price to Supabase:', error);

    // Jika terjadi error, simpan ke penyimpanan lokal saja
    try {
      const prices = await getProductPrices();
      const updatedPrices = [...prices, newPrice];
      await AsyncStorage.setItem(PRODUCT_PRICES_STORAGE_KEY, JSON.stringify(updatedPrices));

      return newPrice;
    } catch (localError) {
      console.error('Error adding product price to local storage:', localError);
      throw localError;
    }
  }
};

// Fungsi untuk mendapatkan produk dengan harga dari toko terdekat
export const getProductsWithPricesFromNearbyStores = async (
  latitude: number,
  longitude: number,
  maxDistance: number = 5000, // dalam meter
  maxDaysOld: number = 30 // harga maksimal berumur 30 hari
): Promise<ProductWithPrices[]> => {
  try {
    const products = await getProducts();
    const stores = await getStores();
    const prices = await getProductPrices();

    // Filter toko berdasarkan jarak
    const nearbyStoreIds = stores
      .filter(store => {
        const distance = getDistance(
          { latitude, longitude },
          { latitude: store.location.latitude, longitude: store.location.longitude }
        );

        return distance <= maxDistance;
      })
      .map(store => store.id);

    // Filter harga berdasarkan toko terdekat dan tanggal
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() - maxDaysOld);
    const maxDateString = maxDate.toISOString();

    const relevantPrices = prices.filter(price => {
      return (
        nearbyStoreIds.includes(price.storeId) &&
        price.priceDate >= maxDateString
      );
    });

    // Gabungkan produk dengan harga
    const productsWithPrices: ProductWithPrices[] = products.map(product => {
      const productPrices = relevantPrices
        .filter(price => price.productId === product.id)
        .map(price => {
          const store = stores.find(s => s.id === price.storeId);
          return {
            ...price,
            store: store!,
          };
        });

      return {
        ...product,
        prices: productPrices,
      };
    });

    // Filter produk yang memiliki harga
    return productsWithPrices.filter(product => product.prices.length > 0);
  } catch (error) {
    console.error('Error getting products with prices from nearby stores:', error);
    return [];
  }
};

// Fungsi untuk memberikan vote pada harga produk
export const voteProductPrice = async (
  priceId: string,
  vote: 'up' | 'down'
): Promise<ProductPrice | null> => {
  try {
    const prices = await getProductPrices();
    const priceIndex = prices.findIndex(price => price.id === priceId);

    if (priceIndex === -1) {
      return null;
    }

    const price = prices[priceIndex];
    const updatedPrice: ProductPrice = {
      ...price,
      upvotes: vote === 'up' ? price.upvotes + 1 : price.upvotes,
      downvotes: vote === 'down' ? price.downvotes + 1 : price.downvotes,
      updatedAt: new Date().toISOString(),
    };

    // Coba perbarui di Supabase terlebih dahulu
    const { data, error } = await supabase
      .from('product_prices')
      .update(updatedPrice)
      .eq('id', priceId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (data) {
      // Jika berhasil diperbarui di Supabase, perbarui juga penyimpanan lokal
      prices[priceIndex] = data as ProductPrice;
      await AsyncStorage.setItem(PRODUCT_PRICES_STORAGE_KEY, JSON.stringify(prices));

      return data as ProductPrice;
    }

    throw new Error('Failed to update product price in Supabase');
  } catch (error) {
    console.error(`Error voting product price ${priceId}:`, error);

    // Jika terjadi error, perbarui di penyimpanan lokal saja
    try {
      const prices = await getProductPrices();
      const priceIndex = prices.findIndex(price => price.id === priceId);

      if (priceIndex === -1) {
        return null;
      }

      const price = prices[priceIndex];
      const updatedPrice: ProductPrice = {
        ...price,
        upvotes: vote === 'up' ? price.upvotes + 1 : price.upvotes,
        downvotes: vote === 'down' ? price.downvotes + 1 : price.downvotes,
        updatedAt: new Date().toISOString(),
      };

      prices[priceIndex] = updatedPrice;
      await AsyncStorage.setItem(PRODUCT_PRICES_STORAGE_KEY, JSON.stringify(prices));

      return updatedPrice;
    } catch (localError) {
      console.error('Error updating product price in local storage:', localError);
      return null;
    }
  }
};

// Fungsi helper untuk menghitung jarak
const getDistance = (
  point1: { latitude: number; longitude: number },
  point2: { latitude: number; longitude: number }
): number => {
  const R = 6371e3; // radius bumi dalam meter
  const φ1 = (point1.latitude * Math.PI) / 180;
  const φ2 = (point2.latitude * Math.PI) / 180;
  const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;

  return d; // dalam meter
};
