import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  Animated,
  StatusBar,
  Platform,
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
  SecuritySettings,
  UserSettings,
  getSecuritySettings,
  updateSecuritySettings,
  getUserSettings,
  updateUserSettings,
  createSecuritySettings,
  createUserSettings,
} from '../services/userSettingsService';
import { useBiometrics } from '../../../core/hooks/useBiometrics';
import {
  setSecurityLevel,
  setPrivacyMode,
  setSensitiveDataSettings,
} from '../../../core/services/security/securityService';
import { enableEncryption } from '../../../core/services/security/encryptionService';
import {
  enableBiometricLogin,
  disableBiometricLogin,
} from '../../../core/services/security/credentialService';

type SecurityLevel = 'low' | 'medium' | 'high';

export const SecuritySettingsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuthStore();

  // Default settings yang akan di-override dari database
  const defaultSecuritySettings = React.useMemo((): SecuritySettings => ({
    security_level: 'medium',
    privacy_mode: 'standard',
    hide_balances: false,
    hide_transactions: false,
    hide_budgets: false,
    require_auth_for_sensitive_actions: true,
    require_auth_for_edit: false,
    require_auth_for_delete: false,
    auto_lock_timeout: 300,
    failed_attempts_limit: 5,
    session_timeout: 3600,
  }), []);

  const defaultUserSettings = React.useMemo((): UserSettings => ({
    notification_enabled: true,
    biometric_enabled: false,
    budget_alert_threshold: 80,
    daily_reminder_enabled: true,
    weekly_summary_enabled: true,
    saving_goal_alerts: true,
    transaction_reminders: true,
  }), []);

  const [settings, setSettings] = useState<SecuritySettings>(defaultSecuritySettings);
  const [userSettings, setUserSettings] = useState<UserSettings>(defaultUserSettings);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Hook untuk biometrik
  const {
    isAvailable: biometricAvailable,
    enableBiometrics,
    disableBiometrics,
    authenticate
  } = useBiometrics((title: string, message: string) => {
    Alert.alert(title, message);
  });


  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const loadSettings = React.useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Load settings from database

      const [securitySettings, userSettingsData] = await Promise.all([
        getSecuritySettings(user.id),
        getUserSettings(user.id),
      ]);

      // Pastikan data dari database di-load dengan benar
      if (securitySettings) {
        setSettings(securitySettings);
      } else {
        // Jika belum ada data, gunakan default dan buat record baru
        setSettings(defaultSecuritySettings);
        // Buat record default di database
        await createSecuritySettings(user.id, defaultSecuritySettings);
      }

      if (userSettingsData) {
        setUserSettings(userSettingsData);
      } else {
        // Jika belum ada data, gunakan default dan buat record baru
        setUserSettings(defaultUserSettings);
        // Buat record default di database
        await createUserSettings(user.id, defaultUserSettings);
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal memuat pengaturan keamanan');
      // Fallback ke default settings
      setSettings(defaultSecuritySettings);
      setUserSettings(defaultUserSettings);
    } finally {
      setIsLoading(false);
    }
  }, [user, defaultSecuritySettings, defaultUserSettings]);

  // Helper functions
  const getSecurityLevelText = (level: SecurityLevel): string => {
    switch (level) {
      case 'low': return 'Rendah';
      case 'medium': return 'Sedang';
      case 'high': return 'Tinggi';
      default: return 'Sedang';
    }
  };

  const handleSecurityLevelChange = async (level: SecurityLevel) => {
    try {
      // Implementasi berdasarkan tingkat keamanan
      switch (level) {
        case 'high':
          // Tingkat tinggi: aktifkan enkripsi dan semua fitur keamanan
          await enableEncryption();
          Alert.alert(
            '🔒 Keamanan Tinggi Diaktifkan',
            'Enkripsi data telah diaktifkan. Data Anda akan dienkripsi untuk keamanan maksimal.'
          );
          break;

        case 'medium':
          // Tingkat sedang: keamanan standar dengan beberapa fitur tambahan
          Alert.alert(
            '🛡️ Keamanan Sedang',
            'Tingkat keamanan seimbang dengan verifikasi tambahan untuk tindakan sensitif.'
          );
          break;

        case 'low':
          // Tingkat rendah: keamanan dasar
          Alert.alert(
            '🔓 Keamanan Rendah',
            'Keamanan dasar diaktifkan. Beberapa fitur keamanan akan dinonaktifkan.'
          );
          break;
      }
    } catch (error) {
      // Error handling sudah ada di updateSetting
    }
  };

  // Load settings saat screen pertama kali mount
  useEffect(() => {
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
  }, [fadeAnim]);

  // Load settings hanya saat pertama kali mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSetting = async (key: keyof SecuritySettings, value: string | boolean | number) => {
    if (!user) return;

    const originalSettings = { ...settings };

    try {
      setIsUpdating(true);

      // Update state optimistically
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);

      // Update ke Supabase PERTAMA
      await updateSecuritySettings(user.id, { [key]: value });

      // Implementasi logic berdasarkan jenis setting
      if (key === 'security_level') {
        await handleSecurityLevelChange(value as SecurityLevel);
        await setSecurityLevel(value as SecurityLevel);
      }

      if (key === 'privacy_mode') {
        await setPrivacyMode(value as 'standard' | 'enhanced' | 'maximum');
      }

      // Update sensitive data settings
      if (['hide_balances', 'hide_transactions', 'hide_budgets', 'require_auth_for_sensitive_actions', 'require_auth_for_edit', 'require_auth_for_delete'].includes(key)) {
        await setSensitiveDataSettings({
          hideBalances: newSettings.hide_balances,
          hideTransactions: newSettings.hide_transactions,
          hideBudgets: newSettings.hide_budgets,
          requireAuthForSensitiveActions: newSettings.require_auth_for_sensitive_actions,
        });
      }

      // Show success message for important changes
      if (key === 'security_level') {
        Alert.alert(
          '✅ Berhasil!',
          `Tingkat keamanan berhasil diubah ke ${getSecurityLevelText(value as SecurityLevel)}`
        );
      }

      // JANGAN reload settings karena akan override perubahan user
      // Settings sudah di-update optimistically di state

    } catch (error) {
      Alert.alert('Error', 'Gagal memperbarui pengaturan');
      // Revert state on error
      setSettings(originalSettings);
    } finally {
      setIsUpdating(false);
    }
  };

  const updateUserSetting = async (key: keyof UserSettings, value: boolean | number) => {
    if (!user) return;

    try {
      setIsUpdating(true);

      // Handle biometric setting dengan validasi
      if (key === 'biometric_enabled') {
        if (value === true) {
          // Cek ketersediaan biometrik
          if (!biometricAvailable) {
            Alert.alert(
              'Biometrik Tidak Tersedia',
              'Perangkat Anda tidak mendukung autentikasi biometrik atau belum ada data biometrik yang terdaftar.'
            );
            return;
          }

          // Minta autentikasi untuk mengaktifkan biometrik
          const authSuccess = await authenticate({
            promptMessage: 'Autentikasi untuk mengaktifkan biometrik',
            fallbackLabel: 'Gunakan PIN',
          });

          if (!authSuccess) {
            Alert.alert('Gagal', 'Autentikasi biometrik gagal. Pengaturan tidak diubah.');
            return;
          }

          // Aktifkan biometrik di sistem
          const enableSuccess = await enableBiometrics();
          if (!enableSuccess) {
            Alert.alert('Error', 'Gagal mengaktifkan autentikasi biometrik');
            return;
          }

          // Aktifkan biometric login (menggunakan credentials yang tersimpan)
          const biometricLoginEnabled = await enableBiometricLogin();
          if (!biometricLoginEnabled) {
            Alert.alert(
              'Peringatan',
              'Biometrik diaktifkan, tetapi Anda perlu login ulang untuk mengaktifkan login biometrik.'
            );
          } else {
            Alert.alert(
              '✅ Berhasil!',
              'Autentikasi biometrik berhasil diaktifkan. Anda dapat menggunakan sidik jari atau wajah untuk login.'
            );
          }
        } else {
          // Nonaktifkan biometrik
          const disableSuccess = await disableBiometrics();
          if (!disableSuccess) {
            Alert.alert('Error', 'Gagal menonaktifkan autentikasi biometrik');
            return;
          }

          // Nonaktifkan biometric login dan hapus credentials
          await disableBiometricLogin();

          Alert.alert(
            '✅ Berhasil!',
            'Autentikasi biometrik berhasil dinonaktifkan.'
          );
        }
      }

      const newSettings = { ...userSettings, [key]: value };
      setUserSettings(newSettings);

      await updateUserSettings(user.id, { [key]: value });
    } catch (error) {
      Alert.alert('Error', 'Gagal memperbarui pengaturan');
      // Revert state on error
      setUserSettings(userSettings);
    } finally {
      setIsUpdating(false);
    }
  };

  const SecurityLevelCard = () => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={[theme.colors.primary[500], theme.colors.primary[600]]}
            style={styles.iconGradient}
          >
            <Ionicons name="shield-checkmark" size={24} color="white" />
          </LinearGradient>
        </View>
        <View style={styles.headerText}>
          <Typography variant="h5" weight="600">Tingkat Keamanan</Typography>
          <Typography variant="body2" color={theme.colors.neutral[600]}>
            Pilih tingkat keamanan yang sesuai
          </Typography>
        </View>
      </View>

      <View style={styles.optionsContainer}>
        {(['low', 'medium', 'high'] as SecurityLevel[]).map((level) => (
          <TouchableOpacity
            key={level}
            style={[
              styles.optionItem,
              settings.security_level === level && styles.optionItemActive,
              (isUpdating || isLoading) && styles.optionItemDisabled
            ]}
            onPress={() => !(isUpdating || isLoading) && updateSetting('security_level', level)}
            disabled={isUpdating || isLoading}
          >
            <View style={styles.optionContent}>
              <Typography
                variant="body1"
                weight={settings.security_level === level ? '600' : '400'}
                color={settings.security_level === level ? theme.colors.primary[600] : theme.colors.neutral[800]}
              >
                {level === 'low' ? 'Rendah' : level === 'medium' ? 'Sedang' : 'Tinggi'}
              </Typography>
              <Typography
                variant="body2"
                color={settings.security_level === level ? theme.colors.primary[500] : theme.colors.neutral[600]}
              >
                {level === 'low'
                  ? 'Keamanan dasar dengan autentikasi standar'
                  : level === 'medium'
                  ? 'Keamanan seimbang dengan verifikasi tambahan'
                  : 'Keamanan maksimal dengan enkripsi penuh'
                }
              </Typography>
            </View>
            {settings.security_level === level && (
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary[500]} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </Card>
  );

  const BiometricCard = () => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={[theme.colors.success[500], theme.colors.success[600]]}
            style={styles.iconGradient}
          >
            <Ionicons name="finger-print" size={24} color="white" />
          </LinearGradient>
        </View>
        <View style={styles.headerText}>
          <Typography variant="h5" weight="600">Autentikasi Biometrik</Typography>
          <Typography variant="body2" color={theme.colors.neutral[600]}>
            Gunakan sidik jari atau wajah untuk login
          </Typography>
        </View>
      </View>

      <View style={styles.biometricOptions}>
        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Typography variant="body1" weight="500">Aktifkan Biometrik</Typography>
            <Typography variant="body2" color={theme.colors.neutral[600]}>
              {biometricAvailable
                ? 'Gunakan sidik jari atau wajah untuk login'
                : 'Biometrik tidak tersedia di perangkat ini'
              }
            </Typography>
            {!biometricAvailable && (
              <Typography variant="caption" color={theme.colors.warning[600]} style={{ marginTop: 4 }}>
                Pastikan Anda telah mendaftarkan sidik jari atau wajah di pengaturan perangkat
              </Typography>
            )}
          </View>
          <Switch
            value={userSettings.biometric_enabled}
            onValueChange={(value) => updateUserSetting('biometric_enabled', value)}
            disabled={isUpdating || isLoading || !biometricAvailable}
            trackColor={{
              false: theme.colors.neutral[300],
              true: theme.colors.success[300],
            }}
            thumbColor={
              userSettings.biometric_enabled
                ? theme.colors.success[500]
                : theme.colors.neutral[100]
            }
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Typography variant="body1" weight="500">Autentikasi untuk Tindakan Sensitif</Typography>
            <Typography variant="body2" color={theme.colors.neutral[600]}>
              Minta autentikasi untuk melihat data sensitif
            </Typography>
          </View>
          <Switch
            value={settings.require_auth_for_sensitive_actions}
            onValueChange={(value) => updateSetting('require_auth_for_sensitive_actions', value)}
            disabled={isUpdating || isLoading}
            trackColor={{
              false: theme.colors.neutral[300],
              true: theme.colors.success[300],
            }}
            thumbColor={
              settings.require_auth_for_sensitive_actions
                ? theme.colors.success[500]
                : theme.colors.neutral[100]
            }
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Typography variant="body1" weight="500">Autentikasi untuk Edit Data</Typography>
            <Typography variant="body2" color={theme.colors.neutral[600]}>
              Minta autentikasi saat mengedit transaksi, anggaran, dll
            </Typography>
          </View>
          <Switch
            value={settings.require_auth_for_edit}
            onValueChange={(value) => updateSetting('require_auth_for_edit', value)}
            disabled={isUpdating || isLoading}
            trackColor={{
              false: theme.colors.neutral[300],
              true: theme.colors.success[300],
            }}
            thumbColor={
              settings.require_auth_for_edit
                ? theme.colors.success[500]
                : theme.colors.neutral[100]
            }
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Typography variant="body1" weight="500">Autentikasi untuk Hapus Data</Typography>
            <Typography variant="body2" color={theme.colors.neutral[600]}>
              Minta autentikasi saat menghapus transaksi, anggaran, dll
            </Typography>
          </View>
          <Switch
            value={settings.require_auth_for_delete}
            onValueChange={(value) => updateSetting('require_auth_for_delete', value)}
            disabled={isUpdating || isLoading}
            trackColor={{
              false: theme.colors.neutral[300],
              true: theme.colors.success[300],
            }}
            thumbColor={
              settings.require_auth_for_delete
                ? theme.colors.success[500]
                : theme.colors.neutral[100]
            }
          />
        </View>
      </View>
    </Card>
  );

  const PrivacyCard = () => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={[theme.colors.warning[500], theme.colors.warning[600]]}
            style={styles.iconGradient}
          >
            <Ionicons name="eye-off" size={24} color="white" />
          </LinearGradient>
        </View>
        <View style={styles.headerText}>
          <Typography variant="h5" weight="600">Privasi Data</Typography>
          <Typography variant="body2" color={theme.colors.neutral[600]}>
            Kontrol visibilitas data sensitif
          </Typography>
        </View>
      </View>

      <View style={styles.privacyOptions}>
        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Typography variant="body1" weight="500">Sembunyikan Saldo</Typography>
            <Typography variant="body2" color={theme.colors.neutral[600]}>
              Sembunyikan saldo di dashboard
            </Typography>
          </View>
          <Switch
            value={settings.hide_balances}
            onValueChange={(value) => updateSetting('hide_balances', value)}
            disabled={isUpdating || isLoading}
            trackColor={{
              false: theme.colors.neutral[300],
              true: theme.colors.warning[300],
            }}
            thumbColor={
              settings.hide_balances
                ? theme.colors.warning[500]
                : theme.colors.neutral[100]
            }
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Typography variant="body1" weight="500">Sembunyikan Transaksi</Typography>
            <Typography variant="body2" color={theme.colors.neutral[600]}>
              Sembunyikan detail transaksi
            </Typography>
          </View>
          <Switch
            value={settings.hide_transactions}
            onValueChange={(value) => updateSetting('hide_transactions', value)}
            disabled={isUpdating || isLoading}
            trackColor={{
              false: theme.colors.neutral[300],
              true: theme.colors.warning[300],
            }}
            thumbColor={
              settings.hide_transactions
                ? theme.colors.warning[500]
                : theme.colors.neutral[100]
            }
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Typography variant="body1" weight="500">Sembunyikan Anggaran</Typography>
            <Typography variant="body2" color={theme.colors.neutral[600]}>
              Sembunyikan detail anggaran
            </Typography>
          </View>
          <Switch
            value={settings.hide_budgets}
            onValueChange={(value) => updateSetting('hide_budgets', value)}
            disabled={isUpdating || isLoading}
            trackColor={{
              false: theme.colors.neutral[300],
              true: theme.colors.warning[300],
            }}
            thumbColor={
              settings.hide_budgets
                ? theme.colors.warning[500]
                : theme.colors.neutral[100]
            }
          />
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
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary[500]} />
        </TouchableOpacity>

        <Typography
          variant="h5"
          weight="700"
          color={theme.colors.primary[500]}
          style={{
            fontSize: 18,
            textAlign: 'center',
            lineHeight: 22,
            includeFontPadding: false,
            textAlignVertical: 'center',
          }}
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.8}
        >
          Pengaturan Keamanan
        </Typography>

        <View style={styles.headerRight} />
      </View>

      <Animated.ScrollView
        style={[styles.scrollView, { opacity: fadeAnim }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SecurityLevelCard />
        <BiometricCard />
        <PrivacyCard />
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
    paddingVertical: theme.spacing.lg, // Diperbesar dari md ke lg
    paddingHorizontal: theme.spacing.layout.sm,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
    minHeight: 64, // Tambahkan minimum height
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
  optionsContainer: {
    gap: theme.spacing.sm,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.neutral[200],
    backgroundColor: theme.colors.white,
  },
  optionItemActive: {
    borderColor: theme.colors.primary[300],
    backgroundColor: theme.colors.primary[50],
  },
  optionItemDisabled: {
    opacity: 0.5,
    backgroundColor: theme.colors.neutral[100],
  },
  optionContent: {
    flex: 1,
  },
  switchContainer: {
    alignItems: 'flex-end',
  },
  biometricOptions: {
    gap: theme.spacing.xs,
  },
  privacyOptions: {
    gap: theme.spacing.xs,
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
});
