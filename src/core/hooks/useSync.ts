import { useState, useEffect, useCallback } from 'react';
import { syncService, SyncStatus } from '../services/sync';
import NetInfo from '@react-native-community/netinfo';

export const useSync = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncService.getStatus());
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(syncService.getLastSyncedAt());
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  
  // Memantau status koneksi internet
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
    });
    
    // Periksa status koneksi saat ini
    NetInfo.fetch().then(state => {
      setIsOnline(state.isConnected);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Memantau status sinkronisasi
  useEffect(() => {
    const unsubscribe = syncService.addSyncListener(status => {
      setSyncStatus(status);
      if (status === 'success') {
        setLastSyncedAt(syncService.getLastSyncedAt());
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Fungsi untuk memulai sinkronisasi
  const sync = useCallback(async (forceSync: boolean = false) => {
    if (!isOnline) {
      return {
        status: 'error' as SyncStatus,
        error: 'Tidak ada koneksi internet',
      };
    }
    
    return await syncService.sync(forceSync);
  }, [isOnline]);
  
  // Fungsi untuk menambahkan item ke antrean sinkronisasi
  const addToSyncQueue = useCallback(
    async (
      tableName: string,
      recordId: string,
      action: 'create' | 'update' | 'delete',
      payload: any,
      priority: number = 5
    ) => {
      await syncService.addToSyncQueue(tableName, recordId, action, payload, priority);
    },
    []
  );
  
  return {
    syncStatus,
    lastSyncedAt,
    isOnline,
    sync,
    addToSyncQueue,
  };
};
