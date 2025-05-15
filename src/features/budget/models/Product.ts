export interface Product {
  id: string;
  name: string;
  category: string;
  barcode?: string;
  description?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductPrice {
  id: string;
  productId: string;
  storeId: string;
  price: number;
  priceDate: string;
  userId: string;
  isVerified: boolean;
  upvotes: number;
  downvotes: number;
  createdAt: string;
  updatedAt: string;
}

export interface Store {
  id: string;
  name: string;
  address?: string;
  location: {
    latitude: number;
    longitude: number;
  };
  type: 'supermarket' | 'traditional_market' | 'convenience_store' | 'grocery' | 'other';
  operatingHours?: {
    open: string;
    close: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProductWithPrices extends Product {
  prices: (ProductPrice & { store: Store })[];
}

export interface ProductInput {
  name: string;
  category: string;
  barcode?: string;
  description?: string;
  imageUrl?: string;
}

export interface ProductPriceInput {
  productId: string;
  storeId: string;
  price: number;
  priceDate?: string;
}

export interface StoreInput {
  name: string;
  address?: string;
  location: {
    latitude: number;
    longitude: number;
  };
  type: 'supermarket' | 'traditional_market' | 'convenience_store' | 'grocery' | 'other';
  operatingHours?: {
    open: string;
    close: string;
  };
}

// Kategori produk bahan pokok
export const BASIC_PRODUCT_CATEGORIES = [
  'Beras',
  'Minyak Goreng',
  'Gula',
  'Telur',
  'Tepung',
  'Daging',
  'Ikan',
  'Sayuran',
  'Buah',
  'Bumbu Dapur',
  'Susu',
  'Kacang-kacangan',
  'Makanan Instan',
  'Minuman',
  'Lainnya',
];
