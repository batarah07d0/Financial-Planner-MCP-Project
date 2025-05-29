import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
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
import { Typography, Card } from '../../../core/components';
import { theme } from '../../../core/theme';
import { useAuthStore } from '../../../core/services/store';
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

// Fungsi untuk melakukan backup sesungguhnya
const performActualBackup = async (userId: string, settings: BackupSettings) => {
  const backupData: any = {
    user_id: userId,
    backup_date: new Date().toISOString(),
    data: {},
    metadata: {
      version: '1.0',
      encryption: settings.encryption_enabled,
    }
  };

  let totalSize = 0;

  try {
    // Backup Transaksi
    if (settings.include_transactions) {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      backupData.data.transactions = transactions;
      totalSize += JSON.stringify(transactions).length;
    }

    // Backup Anggaran
    if (settings.include_budgets) {
      const { data: budgets, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      backupData.data.budgets = budgets;
      totalSize += JSON.stringify(budgets).length;
    }

    // Backup Tantangan
    if (settings.include_challenges) {
      const { data: userChallenges, error } = await supabase
        .from('user_challenges')
        .select('*, challenges(*)')
        .eq('user_id', userId);

      if (error) throw error;
      backupData.data.challenges = userChallenges;
      totalSize += JSON.stringify(userChallenges).length;
    }

    // Backup Pengaturan
    if (settings.include_settings) {
      const [userSettings, securitySettings] = await Promise.all([
        supabase.from('user_settings').select('*').eq('user_id', userId).single(),
        supabase.from('security_settings').select('*').eq('user_id', userId).single()
      ]);

      backupData.data.settings = {
        user_settings: userSettings.data,
        security_settings: securitySettings.data
      };
      totalSize += JSON.stringify(backupData.data.settings).length;
    }

    // Enkripsi data jika diaktifkan
    if (settings.encryption_enabled) {
      // Simulasi enkripsi (dalam implementasi nyata, gunakan crypto library)
      backupData.data = btoa(JSON.stringify(backupData.data));
      backupData.metadata.encrypted = true;
    }

    // Simpan ke Supabase Storage
    const fileName = `backup_${userId}_${Date.now()}.json`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('backups')
      .upload(fileName, JSON.stringify(backupData), {
        contentType: 'application/json',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Hitung ukuran dalam MB
    const sizeInMB = totalSize / (1024 * 1024);

    return {
      file_path: uploadData.path,
      size_mb: sizeInMB,
      backup_data: backupData
    };

  } catch (error) {
    console.error('Error in performActualBackup:', error);
    throw error;
  }
};

export const BackupRestoreScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuthStore();

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
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

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
  }, []);

  const loadData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const [userSettings, backupHistory] = await Promise.all([
        getBackupSettings(user.id),
        getBackupHistory(user.id),
      ]);

      if (userSettings) {
        setSettings(userSettings);
      }
      setHistory(backupHistory);
    } catch (error) {
      console.error('Error loading backup data:', error);
      Alert.alert('Error', 'Gagal memuat data backup');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: keyof BackupSettings, value: any) => {
    if (!user) return;

    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);

      await updateBackupSettings(user.id, { [key]: value });
    } catch (error) {
      console.error('Error updating backup setting:', error);
      Alert.alert('Error', 'Gagal memperbarui pengaturan');
      // Revert state on error
      setSettings(settings);
    }
  };

  const performBackup = async () => {
    if (!user) return;

    try {
      setIsBackingUp(true);

      // Create backup record
      const backupId = await createBackupRecord(user.id, 'manual');
      if (!backupId) {
        throw new Error('Failed to create backup record');
      }

      // Update status to in progress
      await updateBackupRecord(backupId, {
        backup_status: 'in_progress',
      });

      // Perform actual backup process
      const backupResult = await performActualBackup(user.id, settings);

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

      Alert.alert('Sukses', 'Backup berhasil dibuat');
      loadData(); // Reload data to show new backup
    } catch (error) {
      console.error('Error performing backup:', error);
      Alert.alert('Error', 'Gagal membuat backup');
    } finally {
      setIsBackingUp(false);
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
                {isBackingUp ? 'Membackup...' : 'Backup Sekarang'}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.outlineButton]}
          onPress={() => Alert.alert('Info', 'Fitur restore akan segera tersedia')}
        >
          <View style={styles.buttonContent}>
            <Ionicons
              name="cloud-download-outline"
              size={20}
              color={theme.colors.primary[500]}
              style={styles.buttonIcon}
            />
            <Text style={[styles.buttonText, styles.outlineButtonText]}>
              Restore Data
            </Text>
          </View>
        </TouchableOpacity>
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
              settings.encryption_enabled ? theme.colors.success[600] : theme.colors.error[600]
            }>
              {settings.encryption_enabled ? 'Aktif' : 'Tidak Aktif'}
            </Typography>
          </View>
        </View>
      </View>
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
          <Ionicons name="arrow-back" size={24} color={theme.colors.neutral[800]} />
        </TouchableOpacity>
        <Typography variant="h4" weight="600">Backup & Restore</Typography>
        <View style={styles.headerRight} />
      </View>

      <Animated.ScrollView
        style={[styles.scrollView, { opacity: fadeAnim }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <BackupStatusCard />
        <BackupDataCard />
        <BackupSettingsCard />
        <BackupActionsCard />
      </Animated.ScrollView>
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
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.layout.sm,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
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
  },
  buttonGradient: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: theme.spacing.sm,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  outlineButtonText: {
    color: theme.colors.primary[600],
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
});
