export interface BarcodeData {
  id: string;
  barcode: string;
  productName: string;
  category: string;
  defaultPrice?: number;
  imageUrl?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isVerified: boolean;
  upvotes: number;
  downvotes: number;
}

export interface BarcodeDataInput {
  barcode: string;
  productName: string;
  category: string;
  defaultPrice?: number;
  imageUrl?: string;
  description?: string;
}

export interface BarcodeHistoryItem {
  id: string;
  barcode: string;
  productName: string;
  price: number;
  storeId?: string;
  storeName?: string;
  scannedAt: string;
  addedToTransaction: boolean;
  transactionId?: string;
}

export interface BarcodeHistoryItemInput {
  barcode: string;
  productName: string;
  price: number;
  storeId?: string;
  storeName?: string;
  addedToTransaction?: boolean;
  transactionId?: string;
}

export interface BarcodeSearchResult {
  barcode: string;
  productName: string;
  category: string;
  defaultPrice?: number;
  imageUrl?: string;
  description?: string;
  source: 'local' | 'community' | 'api';
  trustScore?: number; // Untuk data komunitas, berdasarkan upvotes/downvotes
}

// Tipe sumber data barcode
export type BarcodeDataSource = 'local' | 'community' | 'api';

// Status pemindaian barcode
export enum BarcodeScanStatus {
  READY = 'ready',
  SCANNING = 'scanning',
  FOUND = 'found',
  NOT_FOUND = 'not_found',
  ERROR = 'error',
}

// Hasil pemindaian barcode
export interface BarcodeScanResult {
  status: BarcodeScanStatus;
  barcode?: string;
  data?: BarcodeSearchResult;
  error?: string;
}
