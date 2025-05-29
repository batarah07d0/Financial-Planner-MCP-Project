import { useDatabase } from '../../../providers/DatabaseProvider';
import { TABLES } from '../supabase-tables';

// Model untuk SyncQueue
export interface SyncQueueModel {
  id: string;
  user_id: string;
  table_name: string;
  record_id: string;
  operation: 'create' | 'update' | 'delete';
  data: string;
  status: 'pending' | 'processing' | 'failed';
  error: string | null;
  retry_count: number;
  priority: number;
  created_at: string;
  updated_at: string;
}

/**
 * Adapter untuk model SyncQueue
 * Menyediakan metode untuk mengakses dan memanipulasi data antrian sinkronisasi
 */
export const useSyncQueueAdapter = () => {
  const db = useDatabase();

  return {
    /**
     * Mendapatkan semua item dalam antrian sinkronisasi
     */
    getAll: async (): Promise<SyncQueueModel[]> => {
      return await db.getAll<SyncQueueModel>(TABLES.SYNC_QUEUE);
    },

    /**
     * Mendapatkan item antrian berdasarkan ID
     */
    getById: async (id: string): Promise<SyncQueueModel | null> => {
      return await db.getById<SyncQueueModel>(TABLES.SYNC_QUEUE, id);
    },

    /**
     * Mendapatkan item antrian berdasarkan status
     */
    getByStatus: async (status: 'pending' | 'processing' | 'failed'): Promise<SyncQueueModel[]> => {
      return await db.getWhere<SyncQueueModel>(TABLES.SYNC_QUEUE, { status });
    },

    /**
     * Mendapatkan item antrian berdasarkan tabel dan ID record
     */
    getByRecord: async (tableName: string, recordId: string): Promise<SyncQueueModel[]> => {
      return await db.getWhere<SyncQueueModel>(TABLES.SYNC_QUEUE, {
        table_name: tableName,
        record_id: recordId
      });
    },

    /**
     * Menambahkan item ke antrian sinkronisasi
     */
    enqueue: async (data: Omit<SyncQueueModel, 'id' | 'created_at' | 'updated_at'>): Promise<SyncQueueModel> => {
      return await db.create<SyncQueueModel>(TABLES.SYNC_QUEUE, data);
    },

    /**
     * Memperbarui status item antrian
     */
    updateStatus: async (id: string, status: 'pending' | 'processing' | 'failed', error?: string): Promise<SyncQueueModel | null> => {
      const item = await db.getById<SyncQueueModel>(TABLES.SYNC_QUEUE, id);
      return await db.update<SyncQueueModel>(TABLES.SYNC_QUEUE, id, {
        status,
        error: error || null,
        retry_count: status === 'failed' ? (item?.retry_count || 0) + 1 : 0
      });
    },

    /**
     * Menghapus item dari antrian
     */
    dequeue: async (id: string): Promise<boolean> => {
      return await db.delete(TABLES.SYNC_QUEUE, id);
    },

    /**
     * Menghapus semua item yang sudah berhasil diproses
     */
    clearProcessed: async (): Promise<void> => {
      const processed = await db.getWhere<SyncQueueModel>(TABLES.SYNC_QUEUE, { status: 'processing' });
      for (const item of processed) {
        await db.delete(TABLES.SYNC_QUEUE, item.id);
      }
    }
  };
};
