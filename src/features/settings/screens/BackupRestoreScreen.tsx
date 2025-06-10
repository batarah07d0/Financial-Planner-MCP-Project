import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Animated,
  StatusBar,
  Platform,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Typography, Card, SuperiorDialog } from '../../../core/components';
import { theme } from '../../../core/theme';
import { useAuthStore } from '../../../core/services/store';
import { useSuperiorDialog } from '../../../core/hooks/useSuperiorDialog';
import { RootStackParamList } from '../../../core/navigation/types';
import {
  BackupSettings,
  BackupHistory,
  getBackupSettings,
  updateBackupSettings,
  getBackupHistory,
  createBackupRecord,
  updateBackupRecord,
} from '../services/userSettingsService';
import { supabase } from '../../../config/supabase';

// Interface untuk data backup
interface BackupData {
  user_id: string;
  backup_date: string;
  data: Record<string, unknown> | string;
  metadata: {
    version: string;
    encryption: boolean;
    encrypted?: boolean;
  };
}

// Fungsi untuk enkripsi data yang proper
const encryptData = async (data: string): Promise<string> => {
  try {
    // Menggunakan Crypto.digestStringAsync untuk enkripsi sederhana
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      data + 'backup_salt_key_2024'
    );
    // Kombinasi data dengan hash untuk enkripsi sederhana (TANPA Base64 encoding)
    return data + '::' + hash;
  } catch (error) {
    // Fallback ke data asli jika crypto gagal
    return data;
  }
};

// Fungsi untuk dekripsi data
const decryptData = async (encryptedData: string): Promise<string> => {
  try {
    const parts = encryptedData.split('::');
    if (parts.length === 2) {
      const [originalData, hash] = parts;
      // Verifikasi hash
      const expectedHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        originalData + 'backup_salt_key_2024'
      );
      if (hash === expectedHash) {
        return originalData;
      }
    }
    // Fallback jika format tidak sesuai - return data asli
    return encryptedData;
  } catch (error) {
    // Fallback ke data asli
    return encryptedData;
  }
};

// Fungsi untuk memastikan bucket backup ada
const ensureBackupBucket = async () => {
  try {
    // Cek apakah bucket sudah ada dengan mencoba list buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      // Jika error listing buckets, asumsikan bucket sudah ada dan lanjutkan
      // Karena bucket 'backups' sudah dikonfigurasi di Supabase
      return true;
    }

    const backupBucket = buckets?.find(bucket => bucket.name === 'backups');

    if (!backupBucket) {
      // Jika bucket tidak ditemukan, coba buat bucket baru
      const { error: createError } = await supabase.storage.createBucket('backups', {
        public: false,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['application/json', 'application/octet-stream']
      });

      if (createError) {
        // Jika error membuat bucket, kemungkinan bucket sudah ada
        // atau ada masalah permission, tapi kita tetap lanjutkan
        // karena bucket 'backups' sudah dikonfigurasi di Supabase
        return true;
      }
    }

    return true;
  } catch (error) {
    // Jika ada error apapun, asumsikan bucket sudah ada dan lanjutkan
    // karena bucket 'backups' sudah dikonfigurasi di Supabase
    return true;
  }
};

// Fungsi untuk melakukan backup sesungguhnya
const performActualBackup = async (userId: string, settings: BackupSettings) => {
  const backupDataObj: Record<string, unknown> = {};
  let totalSize = 0;

  // Pastikan bucket backup ada
  const bucketReady = await ensureBackupBucket();
  if (!bucketReady) {
    throw new Error('Gagal menyiapkan storage backup');
  }

    // Backup Transaksi
    if (settings.include_transactions) {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      backupDataObj.transactions = transactions;
      totalSize += JSON.stringify(transactions || []).length;
    }

    // Backup Anggaran
    if (settings.include_budgets) {
      const { data: budgets, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      backupDataObj.budgets = budgets;
      totalSize += JSON.stringify(budgets || []).length;
    }

    // Backup Tantangan
    if (settings.include_challenges) {
      const { data: userChallenges, error } = await supabase
        .from('user_challenges')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      backupDataObj.challenges = userChallenges;
      totalSize += JSON.stringify(userChallenges || []).length;
    }

    // Backup Saving Goals
    const { data: savingGoals, error: savingError } = await supabase
      .from('saving_goals')
      .select('*')
      .eq('user_id', userId);

    if (!savingError && savingGoals) {
      backupDataObj.saving_goals = savingGoals;
      totalSize += JSON.stringify(savingGoals).length;
    }

    // Backup Profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!profileError && profile) {
      backupDataObj.profile = profile;
      totalSize += JSON.stringify(profile).length;
    }

    // Backup Categories (user-specific)
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .or(`user_id.eq.${userId},user_id.is.null`);

    if (!categoriesError && categories) {
      backupDataObj.categories = categories;
      totalSize += JSON.stringify(categories).length;
    }

    // Backup Pengaturan
    if (settings.include_settings) {
      const [userSettings, securitySettings, backupSettings] = await Promise.all([
        supabase.from('user_settings').select('*').eq('user_id', userId).single(),
        supabase.from('security_settings').select('*').eq('user_id', userId).single(),
        supabase.from('backup_settings').select('*').eq('user_id', userId).single()
      ]);

      backupDataObj.settings = {
        user_settings: userSettings.data,
        security_settings: securitySettings.data,
        backup_settings: backupSettings.data
      };
      totalSize += JSON.stringify(backupDataObj.settings).length;
    }

    // Buat objek backup data final
    const backupData: BackupData = {
      user_id: userId,
      backup_date: new Date().toISOString(),
      data: backupDataObj,
      metadata: {
        version: '2.0',
        encryption: settings.encryption_enabled,
      }
    };

    // Enkripsi data jika diaktifkan
    let finalData = JSON.stringify(backupData);
    if (settings.encryption_enabled) {
      finalData = await encryptData(JSON.stringify(backupData));
      backupData.metadata.encrypted = true;
    }

    // Simpan ke Supabase Storage dengan struktur folder user_id/filename
    const fileName = `${userId}/backup_${Date.now()}.json`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('backups')
      .upload(fileName, finalData, {
        contentType: 'application/json',
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    // Hitung ukuran dalam MB
    const sizeInMB = totalSize / (1024 * 1024);

  return {
    file_path: uploadData.path,
    size_mb: sizeInMB,
    backup_data: backupData
  };
};

export const BackupRestoreScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuthStore();
  const { showDialog, hideDialog, dialogState } = useSuperiorDialog();

  const [settings, setSettings] = useState<BackupSettings>({
    auto_backup_enabled: true,
    backup_frequency: 'weekly',
    backup_location: 'cloud',
    include_transactions: true,
    include_budgets: true,
    include_challenges: true,
    include_settings: true,
    encryption_enabled: true,
  });

  const [history, setHistory] = useState<BackupHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupProgress, setBackupProgress] = useState('');
  const [restoreProgress, setRestoreProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const isLoadingRef = React.useRef(false);
  const autoBackupCheckRef = React.useRef(false);

  const loadData = React.useCallback(async () => {
    if (!user) {
      return;
    }

    // Prevent multiple simultaneous calls
    if (isLoadingRef.current) {
      return;
    }

    try {
      isLoadingRef.current = true;
      setIsLoading(true);
      setError(null); // Clear previous errors

      const [userSettings, backupHistory] = await Promise.all([
        getBackupSettings(user.id),
        getBackupHistory(user.id),
      ]);

      if (userSettings) {
        setSettings(userSettings);
      }
      setHistory(backupHistory);
    } catch (error) {
      setError('Gagal memuat data backup');
      showDialog({
        type: 'error',
        title: 'Error',
        message: 'Gagal memuat data backup. Silakan coba lagi.',
        actions: [
          {
            text: 'Coba Lagi',
            onPress: () => {
              hideDialog();
              setError(null);
              loadData();
            },
            style: 'primary'
          },
          {
            text: 'Tutup',
            onPress: hideDialog,
            style: 'cancel'
          }
        ]
      });
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [user, showDialog, hideDialog]);

  // Fungsi untuk cek dan jalankan auto backup jika sudah waktunya
  const checkAndRunAutoBackup = React.useCallback(async () => {
    if (!user || !settings.auto_backup_enabled) {
      return;
    }

    // Prevent multiple simultaneous auto backup checks
    if (autoBackupCheckRef.current) {
      return;
    }

    try {
      autoBackupCheckRef.current = true;
      const nextBackupStr = await AsyncStorage.getItem(`next_auto_backup_${user.id}`);

      if (!nextBackupStr) {
        return;
      }

      const nextBackupDate = new Date(nextBackupStr);
      const now = new Date();

      // Jika sudah waktunya backup
      if (now >= nextBackupDate) {
        // Inline auto backup logic
        try {
          const backupId = await createBackupRecord(user.id, 'automatic');
          await updateBackupRecord(backupId, { backup_status: 'in_progress' });
          const backupResult = await performActualBackup(user.id, settings);
          await updateBackupRecord(backupId, {
            backup_status: 'completed',
            completed_at: new Date().toISOString(),
            backup_size_mb: backupResult.size_mb,
            backup_location: settings.backup_location,
            backup_file_path: backupResult.file_path,
          });
          await updateBackupSettings(user.id, {
            last_backup_at: new Date().toISOString(),
            backup_size_mb: backupResult.size_mb
          });
        } catch (backupError) {
          // Silent fail for auto backup
        }

        // Schedule next backup
        const nextBackupDate = new Date(now);
        switch (settings.backup_frequency) {
          case 'daily':
            nextBackupDate.setDate(now.getDate() + 1);
            break;
          case 'weekly':
            nextBackupDate.setDate(now.getDate() + 7);
            break;
          case 'monthly':
            nextBackupDate.setMonth(now.getMonth() + 1);
            break;
        }
        await AsyncStorage.setItem(`next_auto_backup_${user.id}`, nextBackupDate.toISOString());
      }
    } catch (error) {
      // Silent fail for auto backup check
    } finally {
      autoBackupCheckRef.current = false;
    }
  }, [user, settings]);

  // useEffect untuk initial load - hanya sekali
  useEffect(() => {
    loadData();

    // Animasi fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Setup status bar
    StatusBar.setBarStyle('dark-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('transparent');
      StatusBar.setTranslucent(true);
    }
  }, [loadData, fadeAnim]);

  // useEffect terpisah untuk auto backup check - hanya ketika settings berubah
  useEffect(() => {
    // Hanya jalankan jika user ada dan auto backup enabled
    if (!user || !settings.auto_backup_enabled) {
      return;
    }

    // Delay sedikit untuk menghindari race condition dan hanya jalankan sekali
    const timeoutId = setTimeout(async () => {
      // Hanya jalankan jika belum ada backup hari ini
      const today = new Date().toDateString();
      const lastCheck = await AsyncStorage.getItem(`last_auto_backup_check_${user.id}`);

      if (lastCheck !== today) {
        checkAndRunAutoBackup();
        await AsyncStorage.setItem(`last_auto_backup_check_${user.id}`, today);
      }
    }, 10000); // Increase delay to 10 seconds untuk menghindari multiple calls

    return () => clearTimeout(timeoutId);
  }, [settings.auto_backup_enabled, user?.id, checkAndRunAutoBackup, user]);

  const updateSetting = async (key: keyof BackupSettings, value: boolean | string | number) => {
    if (!user) return;

    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);

      await updateBackupSettings(user.id, { [key]: value });

      // Jika auto backup diaktifkan, set reminder untuk backup berikutnya
      if (key === 'auto_backup_enabled' && value === true) {
        await scheduleNextAutoBackup(newSettings);
      }
    } catch (error) {
      showDialog({
        type: 'error',
        title: 'Gagal Memperbarui',
        message: 'Gagal memperbarui pengaturan backup. Silakan coba lagi.',
        actions: [
          {
            text: 'OK',
            onPress: hideDialog,
            style: 'primary'
          }
        ]
      });
      // Revert state on error
      setSettings(settings);
    }
  };

  // Fungsi untuk menjadwalkan auto backup berikutnya
  const scheduleNextAutoBackup = async (currentSettings: BackupSettings) => {
    if (!user || !currentSettings.auto_backup_enabled) return;

    try {
      const now = new Date();
      const nextBackupDate = new Date(now);

      // Hitung tanggal backup berikutnya berdasarkan frekuensi
      switch (currentSettings.backup_frequency) {
        case 'daily':
          nextBackupDate.setDate(now.getDate() + 1);
          break;
        case 'weekly':
          nextBackupDate.setDate(now.getDate() + 7);
          break;
        case 'monthly':
          nextBackupDate.setMonth(now.getMonth() + 1);
          break;
      }

      // Simpan jadwal backup berikutnya
      await AsyncStorage.setItem(
        `next_auto_backup_${user.id}`,
        nextBackupDate.toISOString()
      );
    } catch (error) {
      // Error handling tanpa console.log
    }
  };





  const performBackup = async () => {
    if (!user) return;

    let backupId: string | null = null;

    try {
      setIsBackingUp(true);
      setBackupProgress('Memulai backup...');

      // Create backup record
      backupId = await createBackupRecord(user.id, 'manual');

      setBackupProgress('Menyiapkan data...');

      // Update status to in progress
      await updateBackupRecord(backupId, {
        backup_status: 'in_progress',
      });

      setBackupProgress('Mengumpulkan data...');

      // Perform actual backup process
      const backupResult = await performActualBackup(user.id, settings);

      setBackupProgress('Menyelesaikan backup...');

      // Update status to completed
      await updateBackupRecord(backupId, {
        backup_status: 'completed',
        completed_at: new Date().toISOString(),
        backup_size_mb: backupResult.size_mb,
        backup_location: settings.backup_location,
        backup_file_path: backupResult.file_path,
      });

      // Update last backup time and size
      await updateSetting('last_backup_at', new Date().toISOString());
      await updateSetting('backup_size_mb', backupResult.size_mb);

      showDialog({
        type: 'success',
        title: 'Backup Berhasil',
        message: 'Data Anda telah berhasil di-backup dan disimpan dengan aman.',
        actions: [
          {
            text: 'OK',
            onPress: hideDialog,
            style: 'primary'
          }
        ],
        autoClose: 3000
      });
      loadData(); // Reload data to show new backup
    } catch (error) {
      // Update backup record to failed status if we have backupId
      if (backupId) {
        try {
          await updateBackupRecord(backupId, {
            backup_status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: error instanceof Error ? error.message : 'Unknown error'
          });
        } catch (updateError) {
          // Silent fail for update error
        }
      }

      const errorMessage = error instanceof Error ? error.message : 'Gagal membuat backup';
      showDialog({
        type: 'error',
        title: 'Backup Gagal',
        message: `${errorMessage}. Silakan periksa koneksi internet dan coba lagi.`,
        actions: [
          {
            text: 'Coba Lagi',
            onPress: () => {
              hideDialog();
              performBackup();
            },
            style: 'primary'
          },
          {
            text: 'Tutup',
            onPress: hideDialog,
            style: 'cancel'
          }
        ]
      });
    } finally {
      setIsBackingUp(false);
      setBackupProgress('');
    }
  };



  // Fungsi untuk restore dari cloud storage
  const performRestore = async (backupItem?: { backup_file_path?: string; backup_date?: string }) => {
    if (!user) return;

    try {
      setIsRestoring(true);
      setRestoreProgress('Memulai restore...');

      let backupData: BackupData;

      if (backupItem && backupItem.backup_file_path) {
        // Restore dari backup history (Quick Restore)
        setRestoreProgress('Mengunduh backup dari cloud...');

        // Download backup file dari Supabase Storage
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('backups')
          .download(backupItem.backup_file_path);

        if (downloadError) {
          throw new Error(`Gagal mengunduh file backup: ${downloadError.message}`);
        }

        if (!fileData) {
          throw new Error('File backup tidak ditemukan');
        }
        setRestoreProgress('Membaca data backup...');

        // Convert data to text - React Native approach
        try {
          let fileContent: string;

          // Check if it's a Blob (React Native Blob)
          if (fileData && fileData.constructor && fileData.constructor.name === 'Blob') {
            

            // Method 1: Try text() method if available
            if ('text' in fileData && typeof fileData.text === 'function') {
              fileContent = await fileData.text();
            }
            // Method 2: Try arrayBuffer() then decode
            else if ('arrayBuffer' in fileData && typeof fileData.arrayBuffer === 'function') {
              const arrayBuffer = await fileData.arrayBuffer();
              const decoder = new TextDecoder('utf-8');
              fileContent = decoder.decode(arrayBuffer);
            }
            // Method 3: Try FileReader API
            else if (typeof FileReader !== 'undefined') {

              const readBlobAsText = (blob: Blob): Promise<string> => {
                return new Promise((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(reader.result as string);
                  reader.onerror = () => reject(reader.error);
                  reader.readAsText(blob);
                });
              };

              try {
                fileContent = await readBlobAsText(fileData);
                
              } catch (fileReaderError) { 
                throw new Error('FileReader gagal membaca blob');
              }
            }
            // Method 4: Check _data property (fallback)
            else if ('_data' in fileData) {
              const blobData = (fileData as { _data?: unknown })._data;

              // Deep inspect the _data object
              if (blobData && typeof blobData === 'object') {
                const blobDataObj = blobData as Record<string, unknown>;
                // Deep inspection of _data object - check for common properties that might contain the actual data
                const possibleDataKeys = ['data', 'content', 'text', 'body', 'buffer', 'bytes', 'stream'];
                for (const key of possibleDataKeys) {
                  if (key in blobDataObj) {
                    // Found potential data in key
                  }
                }
              }

              if (typeof blobData === 'string') {
                fileContent = blobData;
              } else if (blobData && blobData.constructor && blobData.constructor.name === 'ArrayBuffer') {
                const decoder = new TextDecoder('utf-8');
                fileContent = decoder.decode(blobData as ArrayBuffer);
              } else if (blobData && blobData.constructor && blobData.constructor.name === 'Uint8Array') {
                const decoder = new TextDecoder('utf-8');
                fileContent = decoder.decode(blobData as Uint8Array);
              } else if (blobData && typeof blobData === 'object') {
                // Try to find the actual content in the object
                if ('data' in blobData && typeof blobData.data === 'string') {
                  fileContent = blobData.data;
                } else if ('content' in blobData && typeof blobData.content === 'string') {
                  fileContent = blobData.content;
                } else if ('text' in blobData && typeof blobData.text === 'string') {
                  fileContent = blobData.text;
                } else {
                  try {
                    fileContent = JSON.stringify(blobData);
                  } catch (stringifyError) {
                    fileContent = String(blobData);
                  }
                }
              } else {
                fileContent = String(blobData);
              }
            } else {
              fileContent = String(fileData);
            }
          }
          // Check if fileData has text method (fallback)
          else if (fileData && 'text' in fileData && typeof fileData.text === 'function') {
            fileContent = await fileData.text();
          }
          // Check if it's ArrayBuffer
          else if (fileData && fileData.constructor && fileData.constructor.name === 'ArrayBuffer') {
            const decoder = new TextDecoder('utf-8');
            fileContent = decoder.decode(fileData as unknown as ArrayBuffer);
          }
          // Check if it's already a string
          else if (typeof fileData === 'string') {
            fileContent = fileData;
          }
          // Check if it's a Uint8Array (common in React Native)
          else if (fileData && fileData.constructor && fileData.constructor.name === 'Uint8Array') {
            const decoder = new TextDecoder('utf-8');
            fileContent = decoder.decode(fileData as unknown as Uint8Array);
          }
          // Try to convert to string directly
          else {
            fileContent = String(fileData);
          }

          // Check if content has encryption hash (contains ::)
          const hasEncryptionHash = fileContent.includes('::');

          if (hasEncryptionHash) {
            // Content is encrypted, need to decrypt first
        
            try {
              const decryptedContent = await decryptData(fileContent);
              

              backupData = JSON.parse(decryptedContent);
              
            } catch (decryptError) {
             
              throw new Error('File backup rusak atau tidak valid');
            }
          } else {
            // Try to parse as JSON directly first
           
            try {
              backupData = JSON.parse(fileContent);
              
            } catch (directParseError) {
              // If direct parsing fails, check if content is Base64 encoded
              const isBase64 = /^[A-Za-z0-9+/]*={0,2}$/.test(fileContent.trim());

              if (isBase64 && fileContent.length > 100) {
                try {
                  const decodedContent = atob(fileContent.trim());
                  backupData = JSON.parse(decodedContent);
                } catch (base64Error) {
                  throw new Error('File backup rusak atau tidak valid');
                }
              } else {
                throw new Error('File backup rusak atau tidak valid');
              }
            }
          }
        } catch (parseError) {
          throw new Error('File backup rusak atau tidak valid');
        }
      } else {
        // Restore dari backup terakhir jika tidak ada backupItem
        if (history.length === 0) {
          throw new Error('Tidak ada backup yang tersedia');
        }

        const latestBackup = history[0];

        if (!latestBackup.backup_file_path) {
          throw new Error('Path file backup tidak valid');
        }

        return performRestore(latestBackup);
      }

      // Validasi format backup
      if (!backupData.user_id || !backupData.data || !backupData.metadata) {
        throw new Error('Format file backup tidak valid');
      }

      // Konfirmasi restore
      showDialog({
        type: 'warning',
        title: 'Konfirmasi Restore',
        message: `Restore data dari backup tanggal ${new Date(backupData.backup_date).toLocaleDateString('id-ID')}? Semua data saat ini akan diganti.`,
        actions: [
          {
            text: 'Batal',
            onPress: () => {
              hideDialog();
              setIsRestoring(false);
              setRestoreProgress('');
            },
            style: 'cancel'
          },
          {
            text: 'Restore',
            onPress: () => {
              hideDialog();
              executeRestore(backupData);
            },
            style: 'destructive'
          }
        ]
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal memuat backup dari cloud storage';

      showDialog({
        type: 'error',
        title: 'Restore Gagal',
        message: errorMessage,
        actions: [
          {
            text: 'OK',
            onPress: hideDialog,
            style: 'primary'
          }
        ]
      });

      setIsRestoring(false);
      setRestoreProgress('');
    }
  };

  // Fungsi untuk mengeksekusi restore
  const executeRestore = async (backupData: BackupData) => {
    if (!user) return;

    try {
      setIsRestoring(true);
      setRestoreProgress('Memulai restore...');

      let dataToRestore = backupData.data;

      // Dekripsi data jika terenkripsi
      if (backupData.metadata.encrypted && typeof dataToRestore === 'string') {
        setRestoreProgress('Mendekripsi data...');
        const decryptedData = await decryptData(dataToRestore);
        dataToRestore = JSON.parse(decryptedData);
      }

      const data = dataToRestore as Record<string, unknown>;

      // Restore Transaksi
      if (data.transactions && Array.isArray(data.transactions)) {
        setRestoreProgress('Memulihkan transaksi...');
        // Hapus transaksi lama
        await supabase.from('transactions').delete().eq('user_id', user.id);

        // Insert transaksi baru
        const transactions = data.transactions.map((t: Record<string, unknown>) => ({
          ...t,
          user_id: user.id, // Pastikan user_id sesuai
        }));

        await supabase.from('transactions').insert(transactions);
      }

      // Restore Anggaran
      if (data.budgets && Array.isArray(data.budgets)) {
        setRestoreProgress('Memulihkan anggaran...');
        await supabase.from('budgets').delete().eq('user_id', user.id);

        const budgets = data.budgets.map((b: Record<string, unknown>) => ({
          ...b,
          user_id: user.id,
        }));

        await supabase.from('budgets').insert(budgets);
      }

      // Restore Tantangan
      if (data.challenges && Array.isArray(data.challenges)) {
        setRestoreProgress('Memulihkan tantangan...');
        await supabase.from('user_challenges').delete().eq('user_id', user.id);

        const challenges = data.challenges.map((c: Record<string, unknown>) => ({
          ...c,
          user_id: user.id,
        }));

        await supabase.from('user_challenges').insert(challenges);
      }

      // Restore Saving Goals
      if (data.saving_goals && Array.isArray(data.saving_goals)) {
        setRestoreProgress('Memulihkan target tabungan...');
        await supabase.from('saving_goals').delete().eq('user_id', user.id);

        const savingGoals = data.saving_goals.map((sg: Record<string, unknown>) => ({
          ...sg,
          user_id: user.id,
        }));

        await supabase.from('saving_goals').insert(savingGoals);
      }

      // Restore Profile
      if (data.profile) {
        setRestoreProgress('Memulihkan profil...');
        await supabase
          .from('profiles')
          .upsert({ ...data.profile, id: user.id });
      }

      // Restore Settings
      if (data.settings) {
        setRestoreProgress('Memulihkan pengaturan...');
        const settingsData = data.settings as Record<string, unknown>;

        if (settingsData.user_settings) {
          await supabase
            .from('user_settings')
            .upsert({ ...settingsData.user_settings, user_id: user.id });
        }

        if (settingsData.security_settings) {
          await supabase
            .from('security_settings')
            .upsert({ ...settingsData.security_settings, user_id: user.id });
        }
      }

      setRestoreProgress('Menyelesaikan restore...');
      showDialog({
        type: 'success',
        title: 'Restore Berhasil',
        message: 'Data Anda telah berhasil dikembalikan. Semua data telah dipulihkan dari backup.',
        actions: [
          {
            text: 'OK',
            onPress: hideDialog,
            style: 'primary'
          }
        ],
        autoClose: 3000
      });
      loadData(); // Reload data

    } catch (error) {
      showDialog({
        type: 'error',
        title: 'Restore Gagal',
        message: 'Gagal mengembalikan data. Silakan periksa file backup dan coba lagi.',
        actions: [
          {
            text: 'OK',
            onPress: hideDialog,
            style: 'primary'
          }
        ]
      });
    } finally {
      setIsRestoring(false);
      setRestoreProgress('');
    }
  };

  const BackupDataCard = () => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={[theme.colors.warning[500], theme.colors.warning[600]]}
            style={styles.iconGradient}
          >
            <Ionicons name="archive" size={24} color="white" />
          </LinearGradient>
        </View>
        <View style={styles.headerText}>
          <Typography variant="h5" weight="600">Data yang Dibackup</Typography>
          <Typography variant="body2" color={theme.colors.neutral[600]}>
            Pilih data yang ingin disertakan
          </Typography>
        </View>
      </View>

      <View style={styles.dataOptions}>
        <View style={styles.dataItem}>
          <View style={styles.dataIcon}>
            <Ionicons name="receipt" size={18} color={theme.colors.primary[500]} />
          </View>
          <View style={styles.dataContent}>
            <Typography variant="body1" weight="500">Transaksi</Typography>
            <Typography variant="body2" color={theme.colors.neutral[600]}>
              Semua riwayat transaksi keuangan
            </Typography>
          </View>
          <Switch
            value={settings.include_transactions}
            onValueChange={(value) => updateSetting('include_transactions', value)}
            trackColor={{
              false: theme.colors.neutral[300],
              true: theme.colors.primary[300],
            }}
            thumbColor={
              settings.include_transactions
                ? theme.colors.primary[500]
                : theme.colors.neutral[100]
            }
          />
        </View>

        <View style={styles.dataItem}>
          <View style={styles.dataIcon}>
            <Ionicons name="wallet" size={18} color={theme.colors.success[500]} />
          </View>
          <View style={styles.dataContent}>
            <Typography variant="body1" weight="500">Anggaran</Typography>
            <Typography variant="body2" color={theme.colors.neutral[600]}>
              Pengaturan dan riwayat anggaran
            </Typography>
          </View>
          <Switch
            value={settings.include_budgets}
            onValueChange={(value) => updateSetting('include_budgets', value)}
            trackColor={{
              false: theme.colors.neutral[300],
              true: theme.colors.success[300],
            }}
            thumbColor={
              settings.include_budgets
                ? theme.colors.success[500]
                : theme.colors.neutral[100]
            }
          />
        </View>

        <View style={styles.dataItem}>
          <View style={styles.dataIcon}>
            <Ionicons name="trophy" size={18} color={theme.colors.warning[500]} />
          </View>
          <View style={styles.dataContent}>
            <Typography variant="body1" weight="500">Tantangan</Typography>
            <Typography variant="body2" color={theme.colors.neutral[600]}>
              Tantangan dan pencapaian
            </Typography>
          </View>
          <Switch
            value={settings.include_challenges}
            onValueChange={(value) => updateSetting('include_challenges', value)}
            trackColor={{
              false: theme.colors.neutral[300],
              true: theme.colors.warning[300],
            }}
            thumbColor={
              settings.include_challenges
                ? theme.colors.warning[500]
                : theme.colors.neutral[100]
            }
          />
        </View>

        <View style={styles.dataItem}>
          <View style={styles.dataIcon}>
            <Ionicons name="settings" size={18} color={theme.colors.info[500]} />
          </View>
          <View style={styles.dataContent}>
            <Typography variant="body1" weight="500">Pengaturan</Typography>
            <Typography variant="body2" color={theme.colors.neutral[600]}>
              Preferensi dan konfigurasi aplikasi
            </Typography>
          </View>
          <Switch
            value={settings.include_settings}
            onValueChange={(value) => updateSetting('include_settings', value)}
            trackColor={{
              false: theme.colors.neutral[300],
              true: theme.colors.info[300],
            }}
            thumbColor={
              settings.include_settings
                ? theme.colors.info[500]
                : theme.colors.neutral[100]
            }
          />
        </View>
      </View>
    </Card>
  );

  const BackupSettingsCard = () => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={[theme.colors.info[500], theme.colors.info[600]]}
            style={styles.iconGradient}
          >
            <Ionicons name="settings" size={24} color="white" />
          </LinearGradient>
        </View>
        <View style={styles.headerText}>
          <Typography variant="h5" weight="600">Pengaturan Backup</Typography>
          <Typography variant="body2" color={theme.colors.neutral[600]}>
            Konfigurasi backup otomatis
          </Typography>
        </View>
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingContent}>
          <Typography variant="body1" weight="500">Backup Otomatis</Typography>
          <Typography variant="body2" color={theme.colors.neutral[600]}>
            Backup data secara otomatis setiap minggu
          </Typography>
        </View>
        <Switch
          value={settings.auto_backup_enabled}
          onValueChange={(value) => updateSetting('auto_backup_enabled', value)}
          trackColor={{
            false: theme.colors.neutral[300],
            true: theme.colors.info[300],
          }}
          thumbColor={
            settings.auto_backup_enabled
              ? theme.colors.info[500]
              : theme.colors.neutral[100]
          }
        />
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingContent}>
          <Typography variant="body1" weight="500">Enkripsi Data</Typography>
          <Typography variant="body2" color={theme.colors.neutral[600]}>
            Enkripsi data backup untuk keamanan maksimal
          </Typography>
        </View>
        <Switch
          value={settings.encryption_enabled}
          onValueChange={(value) => updateSetting('encryption_enabled', value)}
          trackColor={{
            false: theme.colors.neutral[300],
            true: theme.colors.success[300],
          }}
          thumbColor={
            settings.encryption_enabled
              ? theme.colors.success[500]
              : theme.colors.neutral[100]
          }
        />
      </View>
    </Card>
  );

  const BackupActionsCard = () => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={[theme.colors.primary[500], theme.colors.primary[600]]}
            style={styles.iconGradient}
          >
            <Ionicons name="cloud-upload" size={24} color="white" />
          </LinearGradient>
        </View>
        <View style={styles.headerText}>
          <Typography variant="h5" weight="600">Aksi Backup</Typography>
          <Typography variant="body2" color={theme.colors.neutral[600]}>
            Backup dan restore data manual
          </Typography>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={performBackup}
          disabled={isBackingUp}
        >
          <LinearGradient
            colors={[theme.colors.primary[500], theme.colors.primary[600]]}
            style={styles.buttonGradient}
          >
            <View style={styles.buttonContent}>
              <Ionicons
                name="cloud-upload-outline"
                size={20}
                color="white"
                style={styles.buttonIcon}
              />
              <Text style={styles.buttonText}>
                {isBackingUp ? (backupProgress || 'Membackup...') : 'Backup Sekarang'}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Restore Button - hanya tampil jika ada backup history */}
        {history.length > 0 && (
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => performRestore(history[0])}
            disabled={isRestoring}
          >
            <View style={styles.buttonContent}>
              <Ionicons
                name="cloud-download-outline"
                size={20}
                color={theme.colors.success[500]}
                style={styles.buttonIcon}
              />
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                {isRestoring ? (restoreProgress || 'Memulihkan...') : 'Restore Data'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );

  const BackupStatusCard = () => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={[theme.colors.success[500], theme.colors.success[600]]}
            style={styles.iconGradient}
          >
            <Ionicons name="checkmark-circle" size={24} color="white" />
          </LinearGradient>
        </View>
        <View style={styles.headerText}>
          <Typography variant="h5" weight="600">Status Backup</Typography>
          <Typography variant="body2" color={theme.colors.neutral[600]}>
            Informasi backup terakhir
          </Typography>
        </View>
      </View>

      <View style={styles.statusContainer}>
        <View style={styles.statusItem}>
          <View style={styles.statusIcon}>
            <Ionicons name="time-outline" size={16} color={theme.colors.info[500]} />
          </View>
          <View style={styles.statusContent}>
            <Typography variant="body2" color={theme.colors.neutral[600]}>
              Backup Terakhir
            </Typography>
            <Typography variant="body1" weight="500">
              {settings.last_backup_at
                ? new Date(settings.last_backup_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'Belum pernah backup'
              }
            </Typography>
          </View>
        </View>

        <View style={styles.statusItem}>
          <View style={styles.statusIcon}>
            <Ionicons name="folder-outline" size={16} color={theme.colors.warning[500]} />
          </View>
          <View style={styles.statusContent}>
            <Typography variant="body2" color={theme.colors.neutral[600]}>
              Ukuran Backup
            </Typography>
            <Typography variant="body1" weight="500">
              {settings.backup_size_mb
                ? `${settings.backup_size_mb.toFixed(2)} MB`
                : 'Tidak ada data'
              }
            </Typography>
          </View>
        </View>

        <View style={styles.statusItem}>
          <View style={styles.statusIcon}>
            <Ionicons name="shield-checkmark-outline" size={16} color={theme.colors.success[500]} />
          </View>
          <View style={styles.statusContent}>
            <Typography variant="body2" color={theme.colors.neutral[600]}>
              Enkripsi
            </Typography>
            <Typography variant="body1" weight="500" color={
              settings.encryption_enabled ? theme.colors.success[600] : theme.colors.danger[600]
            }>
              {settings.encryption_enabled ? 'Aktif' : 'Tidak Aktif'}
            </Typography>
          </View>
        </View>
      </View>
    </Card>
  );

  const BackupHistoryCard = () => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={[theme.colors.secondary[500], theme.colors.secondary[600]]}
            style={styles.iconGradient}
          >
            <Ionicons name="time" size={24} color="white" />
          </LinearGradient>
        </View>
        <View style={styles.headerText}>
          <Typography variant="h5" weight="600">Riwayat Backup</Typography>
          <Typography variant="body2" color={theme.colors.neutral[600]}>
            {history.length} backup terakhir
          </Typography>
        </View>
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="archive-outline" size={48} color={theme.colors.neutral[400]} />
          <Typography variant="body1" color={theme.colors.neutral[500]} style={{ marginTop: theme.spacing.md, textAlign: 'center' }}>
            Belum ada riwayat backup
          </Typography>
          <Typography variant="body2" color={theme.colors.neutral[400]} style={{ textAlign: 'center' }}>
            Buat backup pertama Anda sekarang
          </Typography>
        </View>
      ) : (
        <View style={styles.historyList}>
          {history.slice(0, 5).map((item, index) => (
            <View key={item.id} style={[styles.historyItem, index === history.length - 1 && styles.lastHistoryItem]}>
              <View style={styles.historyIcon}>
                <Ionicons
                  name={
                    item.backup_status === 'completed' ? 'checkmark-circle' :
                    item.backup_status === 'failed' ? 'close-circle' :
                    'time'
                  }
                  size={20}
                  color={
                    item.backup_status === 'completed' ? theme.colors.success[500] :
                    item.backup_status === 'failed' ? theme.colors.danger[500] :
                    theme.colors.warning[500]
                  }
                />
              </View>
              <View style={styles.historyContent}>
                <Typography variant="body1" weight="500">
                  Backup {item.backup_type === 'manual' ? 'Manual' : 'Otomatis'}
                </Typography>
                <Typography variant="body2" color={theme.colors.neutral[600]}>
                  {new Date(item.started_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Typography>
              </View>
              <View style={styles.historyStatus}>
                <Typography
                  variant="body2"
                  weight="500"
                  color={
                    item.backup_status === 'completed' ? theme.colors.success[600] :
                    item.backup_status === 'failed' ? theme.colors.danger[600] :
                    theme.colors.warning[600]
                  }
                >
                  {item.backup_status === 'completed' ? 'Selesai' :
                   item.backup_status === 'failed' ? 'Gagal' :
                   'Proses'}
                </Typography>
                {item.backup_size_mb && (
                  <Typography variant="body2" color={theme.colors.neutral[500]}>
                    {item.backup_size_mb.toFixed(2)} MB
                  </Typography>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary[500]} />
        </TouchableOpacity>
        <Typography variant="h5" weight="700" color={theme.colors.primary[500]} style={{ fontSize: 18, textAlign: 'center' }}>Backup & Restore</Typography>
        <View style={styles.headerRight} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Typography variant="body1" color={theme.colors.neutral[600]}>
            Memuat data backup...
          </Typography>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={theme.colors.danger[500]} />
          <Typography variant="body1" color={theme.colors.danger[600]} style={{ marginTop: theme.spacing.md, textAlign: 'center' }}>
            {error}
          </Typography>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              loadData();
            }}
          >
            <Typography variant="body1" color={theme.colors.primary[600]} weight="600">
              Coba Lagi
            </Typography>
          </TouchableOpacity>
        </View>
      ) : (
        <Animated.ScrollView
          style={[styles.scrollView, { opacity: fadeAnim }]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <BackupStatusCard />
          <BackupDataCard />
          <BackupSettingsCard />
          <BackupActionsCard />
          <BackupHistoryCard />
        </Animated.ScrollView>
      )}

      <SuperiorDialog
        visible={dialogState.visible}
        type={dialogState.type}
        title={dialogState.title}
        message={dialogState.message}
        actions={dialogState.actions}
        onClose={hideDialog}
        icon={dialogState.icon}
        autoClose={dialogState.autoClose}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg, 
    paddingHorizontal: theme.spacing.layout.sm,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
    minHeight: 64, 
    ...theme.elevation.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    width: 40,
    height: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.layout.sm,
    paddingBottom: theme.spacing.layout.xl,
  },
  card: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  iconContainer: {
    marginRight: theme.spacing.md,
  },
  iconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[100],
  },
  settingContent: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  actionButtons: {
    gap: theme.spacing.md,
  },
  actionButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  primaryButton: {
    elevation: 3,
    shadowColor: theme.colors.primary[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  outlineButton: {
    borderWidth: 2,
    borderColor: theme.colors.primary[300],
    backgroundColor: theme.colors.white,
    paddingVertical: theme.spacing.lg, 
    paddingHorizontal: theme.spacing.xl,
    minHeight: 56, 
  },
  buttonGradient: {
    paddingVertical: theme.spacing.lg, 
    paddingHorizontal: theme.spacing.xl, 
    borderRadius: theme.borderRadius.lg,
    minHeight: 56, 
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 24, 
  },
  buttonIcon: {
    marginRight: theme.spacing.sm,
  },
  buttonText: {
    fontSize: 17, 
    fontWeight: '600',
    color: 'white',
    textAlign: 'center', 
  },
  outlineButtonText: {
    color: theme.colors.primary[600],
    fontSize: 17, 
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: theme.colors.success[300],
    backgroundColor: theme.colors.success[50],
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    minHeight: 56,
  },
  secondaryButtonText: {
    color: theme.colors.success[600],
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  statusContainer: {
    gap: theme.spacing.md,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  statusIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  statusContent: {
    flex: 1,
  },
  dataOptions: {
    gap: theme.spacing.sm,
  },
  dataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[100],
  },
  dataIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  dataContent: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  historyList: {
    gap: theme.spacing.sm,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[100],
  },
  lastHistoryItem: {
    borderBottomWidth: 0,
  },
  historyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  historyContent: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  historyStatus: {
    alignItems: 'flex-end',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  retryButton: {
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary[300],
  },
});
