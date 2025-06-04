import { v4 as uuidv4 } from 'uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../../config/supabase';
import {
  BarcodeData,
  BarcodeDataInput,
  BarcodeHistoryItem,
  BarcodeHistoryItemInput,
  BarcodeSearchResult,
  BarcodeDataSource,
} from '../models/Barcode';

// Kunci untuk penyimpanan lokal
const BARCODE_DATA_STORAGE_KEY = '@budgetwise:barcode_data';
const BARCODE_HISTORY_STORAGE_KEY = '@budgetwise:barcode_history';

// Fungsi untuk mencari data barcode dari berbagai sumber
export const searchBarcode = async (
  barcode: string,
  sources: BarcodeDataSource[] = ['local', 'community', 'api']
): Promise<BarcodeSearchResult | null> => {
  try {
    // Cari di database lokal terlebih dahulu jika diizinkan
    if (sources.includes('local')) {
      const localData = await getLocalBarcodeData(barcode);
      if (localData) {
        return {
          barcode: localData.barcode,
          productName: localData.productName,
          category: localData.category,
          defaultPrice: localData.defaultPrice,
          imageUrl: localData.imageUrl,
          description: localData.description,
          source: 'local',
        };
      }
    }

    // Cari di database komunitas jika diizinkan
    if (sources.includes('community')) {
      const communityData = await getCommunityBarcodeData(barcode);
      if (communityData) {
        // Hitung skor kepercayaan
        const trustScore = communityData.upvotes - communityData.downvotes;

        return {
          barcode: communityData.barcode,
          productName: communityData.productName,
          category: communityData.category,
          defaultPrice: communityData.defaultPrice,
          imageUrl: communityData.imageUrl,
          description: communityData.description,
          source: 'community',
          trustScore,
        };
      }
    }

    // Cari di API eksternal jika diizinkan
    if (sources.includes('api')) {
      const apiData = await getApiBarcodeData(barcode);
      if (apiData) {
        return {
          barcode: apiData.barcode,
          productName: apiData.productName,
          category: apiData.category,
          defaultPrice: apiData.defaultPrice,
          imageUrl: apiData.imageUrl,
          description: apiData.description,
          source: 'api',
        };
      }
    }

    // Jika tidak ditemukan di semua sumber
    return null;
  } catch (error) {
    return null;
  }
};

// Fungsi untuk mendapatkan data barcode dari database lokal
const getLocalBarcodeData = async (barcode: string): Promise<BarcodeData | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(BARCODE_DATA_STORAGE_KEY);
    if (jsonValue) {
      const barcodeDataList = JSON.parse(jsonValue) as BarcodeData[];
      return barcodeDataList.find(data => data.barcode === barcode) || null;
    }
    return null;
  } catch (error) {
    return null;
  }
};

// Fungsi untuk mendapatkan data barcode dari database komunitas (Supabase)
const getCommunityBarcodeData = async (barcode: string): Promise<BarcodeData | null> => {
  try {
    const { data, error } = await supabase
      .from('barcode_data')
      .select('*')
      .eq('barcode', barcode)
      .order('upvotes', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      throw error;
    }

    return data as BarcodeData;
  } catch (error) {
    return null;
  }
};

// Fungsi untuk mendapatkan data barcode dari API eksternal
// Catatan: Ini adalah implementasi dummy, ganti dengan API yang sebenarnya
const getApiBarcodeData = async (_barcode: string): Promise<BarcodeData | null> => {
  try {
    // Implementasi dummy, selalu mengembalikan null
    // Dalam implementasi sebenarnya, ini akan memanggil API eksternal
    return null;
  } catch (error) {
    return null;
  }
};

// Fungsi untuk menambahkan data barcode baru ke database lokal
export const addLocalBarcodeData = async (
  input: BarcodeDataInput,
  userId: string
): Promise<BarcodeData> => {
  const now = new Date().toISOString();
  const newBarcodeData: BarcodeData = {
    id: uuidv4(),
    ...input,
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
    isVerified: false,
    upvotes: 0,
    downvotes: 0,
  };

  // Dapatkan data barcode yang ada
  const jsonValue = await AsyncStorage.getItem(BARCODE_DATA_STORAGE_KEY);
  const barcodeDataList = jsonValue ? JSON.parse(jsonValue) as BarcodeData[] : [];

  // Tambahkan data barcode baru
  barcodeDataList.push(newBarcodeData);

  // Simpan kembali ke penyimpanan lokal
  await AsyncStorage.setItem(BARCODE_DATA_STORAGE_KEY, JSON.stringify(barcodeDataList));

  return newBarcodeData;
};

// Fungsi untuk menambahkan data barcode baru ke database komunitas (Supabase)
export const addCommunityBarcodeData = async (
  input: BarcodeDataInput,
  userId: string
): Promise<BarcodeData> => {
  try {
    const now = new Date().toISOString();
    const newBarcodeData: BarcodeData = {
      id: uuidv4(),
      ...input,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      isVerified: false,
      upvotes: 0,
      downvotes: 0,
    };

    const { data, error } = await supabase
      .from('barcode_data')
      .insert(newBarcodeData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Tambahkan juga ke database lokal
    await addLocalBarcodeData(input, userId);

    return data as BarcodeData;
  } catch (error) {
    // Jika gagal menambahkan ke Supabase, tambahkan ke lokal saja
    return addLocalBarcodeData(input, userId);
  }
};

// Fungsi untuk memberikan vote pada data barcode di database komunitas
export const voteBarcodeData = async (
  barcodeDataId: string,
  vote: 'up' | 'down'
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('barcode_data')
      .select('upvotes, downvotes')
      .eq('id', barcodeDataId)
      .single();

    if (error) {
      throw error;
    }

    const { upvotes, downvotes } = data as { upvotes: number; downvotes: number };

    const updateData = vote === 'up'
      ? { upvotes: upvotes + 1 }
      : { downvotes: downvotes + 1 };

    const { error: updateError } = await supabase
      .from('barcode_data')
      .update(updateData)
      .eq('id', barcodeDataId);

    if (updateError) {
      throw updateError;
    }

    return true;
  } catch (error) {
    return false;
  }
};

// Fungsi untuk mendapatkan riwayat pemindaian barcode
export const getBarcodeHistory = async (): Promise<BarcodeHistoryItem[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(BARCODE_HISTORY_STORAGE_KEY);
    if (jsonValue) {
      const history = JSON.parse(jsonValue) as BarcodeHistoryItem[];
      // Urutkan berdasarkan waktu pemindaian terbaru
      return history.sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime());
    }
    return [];
  } catch (error) {
    return [];
  }
};

// Fungsi untuk menambahkan riwayat pemindaian barcode
export const addBarcodeHistory = async (
  input: BarcodeHistoryItemInput
): Promise<BarcodeHistoryItem> => {
  const now = new Date().toISOString();
  const newHistoryItem: BarcodeHistoryItem = {
    id: uuidv4(),
    ...input,
    scannedAt: now,
    addedToTransaction: input.addedToTransaction || false,
  };

  // Dapatkan riwayat yang ada
  const history = await getBarcodeHistory();

  // Tambahkan item baru
  history.unshift(newHistoryItem);

  // Batasi jumlah riwayat (misalnya 100 item terakhir)
  const limitedHistory = history.slice(0, 100);

  // Simpan kembali ke penyimpanan lokal
  await AsyncStorage.setItem(BARCODE_HISTORY_STORAGE_KEY, JSON.stringify(limitedHistory));

  return newHistoryItem;
};

// Fungsi untuk memperbarui status "ditambahkan ke transaksi" pada riwayat pemindaian
export const updateBarcodeHistoryTransactionStatus = async (
  historyId: string,
  transactionId: string
): Promise<boolean> => {
  try {
    // Dapatkan riwayat yang ada
    const history = await getBarcodeHistory();

    // Cari dan perbarui item
    const updatedHistory = history.map(item => {
      if (item.id === historyId) {
        return {
          ...item,
          addedToTransaction: true,
          transactionId,
        };
      }
      return item;
    });

    // Simpan kembali ke penyimpanan lokal
    await AsyncStorage.setItem(BARCODE_HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));

    return true;
  } catch (error) {
    return false;
  }
};
