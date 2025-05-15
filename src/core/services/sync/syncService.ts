import { supabase } from '../../../config/supabase';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Tipe untuk status sinkronisasi
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

// Tipe untuk hasil sinkronisasi
export interface SyncResult {
  status: SyncStatus;
  error?: string;
  lastSyncedAt?: Date;
  syncedItems?: number;
}

// Kelas untuk layanan sinkronisasi
export class SyncService {
  private static instance: SyncService;
  private isSyncing: boolean = false;
  private lastSyncedAt: Date | null = null;
  private syncStatus: SyncStatus = 'idle';
  private syncListeners: ((status: SyncStatus) => void)[] = [];

  // Singleton pattern
  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  // Private constructor untuk singleton
  private constructor() { }

  // Mendapatkan status sinkronisasi saat ini
  public getStatus(): SyncStatus {
    return this.syncStatus;
  }

  // Mendapatkan waktu sinkronisasi terakhir
  public getLastSyncedAt(): Date | null {
    return this.lastSyncedAt;
  }

  // Menambahkan listener untuk perubahan status sinkronisasi
  public addSyncListener(listener: (status: SyncStatus) => void): () => void {
    this.syncListeners.push(listener);
    return () => {
      this.syncListeners = this.syncListeners.filter(l => l !== listener);
    };
  }

  // Memperbarui status sinkronisasi dan memberi tahu listener
  private updateStatus(status: SyncStatus): void {
    this.syncStatus = status;
    this.syncListeners.forEach(listener => listener(status));
  }

  // Memeriksa apakah perangkat online
  private async isOnline(): Promise<boolean> {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected === true;
  }

  // Sinkronisasi data
  public async sync(forceSync: boolean = false): Promise<SyncResult> {
    // Jika sudah sedang sinkronisasi, kembalikan status saat ini
    if (this.isSyncing && !forceSync) {
      return {
        status: this.syncStatus,
        lastSyncedAt: this.lastSyncedAt || undefined,
      };
    }

    // Periksa koneksi internet
    const isOnline = await this.isOnline();
    if (!isOnline) {
      this.updateStatus('error');
      return {
        status: 'error',
        error: 'Tidak ada koneksi internet',
      };
    }

    try {
      this.isSyncing = true;
      this.updateStatus('syncing');

      // Proses antrean sinkronisasi
      await this.processSyncQueue();

      // Tarik data baru dari server
      await this.pullChangesFromServer();

      // Perbarui waktu sinkronisasi terakhir
      this.lastSyncedAt = new Date();
      this.updateStatus('success');

      return {
        status: 'success',
        lastSyncedAt: this.lastSyncedAt,
      };
    } catch (error: any) {
      console.error('Sync error:', error);
      this.updateStatus('error');

      return {
        status: 'error',
        error: error.message || 'Terjadi kesalahan saat sinkronisasi',
      };
    } finally {
      this.isSyncing = false;
    }
  }

  // Proses antrean sinkronisasi
  private async processSyncQueue(): Promise<void> {
    try {
      // Dapatkan semua item dalam antrean sinkronisasi dari AsyncStorage
      const syncQueueKey = '@budgetwise/sync_queue';
      const syncQueueStr = await AsyncStorage.getItem(syncQueueKey);
      const syncQueueItems = syncQueueStr ? JSON.parse(syncQueueStr) : [];

      // Urutkan berdasarkan prioritas
      const sortedItems = syncQueueItems.sort((a: any, b: any) => a.priority - b.priority);

      // Proses setiap item
      for (const item of sortedItems) {
        try {
          const { table_name, record_id, operation, data } = item;
          const parsedData = typeof data === 'string' ? JSON.parse(data) : data;

          // Lakukan aksi berdasarkan jenis aksi
          switch (operation) {
            case 'create':
              await this.createRecord(table_name, parsedData);
              break;
            case 'update':
              await this.updateRecord(table_name, record_id, parsedData);
              break;
            case 'delete':
              await this.deleteRecord(table_name, record_id);
              break;
          }

          // Hapus item dari antrean setelah berhasil
          const updatedQueue = syncQueueItems.filter((queueItem: any) => queueItem.id !== item.id);
          await AsyncStorage.setItem(syncQueueKey, JSON.stringify(updatedQueue));
        } catch (error) {
          console.error('Error processing sync queue item:', error);

          // Perbarui jumlah percobaan
          item.retry_count = (item.retry_count || 0) + 1;
          item.updated_at = new Date().toISOString();

          // Simpan kembali antrean yang diperbarui
          await AsyncStorage.setItem(syncQueueKey, JSON.stringify(syncQueueItems));
        }
      }
    } catch (error) {
      console.error('Error in processSyncQueue:', error);
    }
  }

  // Tarik perubahan dari server
  private async pullChangesFromServer(): Promise<void> {
    // Implementasi untuk menarik perubahan dari server akan ditambahkan nanti
  }

  // Buat record di server
  private async createRecord(tableName: string, data: any): Promise<void> {
    const { error } = await supabase.from(tableName).insert([data]);

    if (error) {
      throw error;
    }
  }

  // Perbarui record di server
  private async updateRecord(tableName: string, recordId: string, data: any): Promise<void> {
    const { error } = await supabase.from(tableName).update(data).eq('id', recordId);

    if (error) {
      throw error;
    }
  }

  // Hapus record di server
  private async deleteRecord(tableName: string, recordId: string): Promise<void> {
    const { error } = await supabase.from(tableName).delete().eq('id', recordId);

    if (error) {
      throw error;
    }
  }

  // Tambahkan item ke antrean sinkronisasi
  public async addToSyncQueue(
    tableName: string,
    recordId: string,
    action: 'create' | 'update' | 'delete',
    payload: any,
    priority: number = 5
  ): Promise<void> {
    try {
      const syncQueueKey = '@budgetwise/sync_queue';
      const syncQueueStr = await AsyncStorage.getItem(syncQueueKey);
      const syncQueueItems = syncQueueStr ? JSON.parse(syncQueueStr) : [];

      // Buat item baru untuk antrean
      const newItem = {
        id: Math.random().toString(36).substring(2, 15),
        table_name: tableName,
        record_id: recordId,
        operation: action,
        data: typeof payload === 'string' ? payload : JSON.stringify(payload),
        status: 'pending',
        error: null,
        retry_count: 0,
        priority,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Tambahkan ke antrean
      syncQueueItems.push(newItem);

      // Simpan kembali antrean
      await AsyncStorage.setItem(syncQueueKey, JSON.stringify(syncQueueItems));
    } catch (error) {
      console.error('Error adding to sync queue:', error);
      throw error;
    }
  }
}

// Ekspor instance singleton
export const syncService = SyncService.getInstance();
