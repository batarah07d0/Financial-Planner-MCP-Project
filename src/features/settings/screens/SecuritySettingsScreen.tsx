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
} from '../services/userSettingsService';

type SecurityLevel = 'low' | 'medium' | 'high';

export const SecuritySettingsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuthStore();

  const [settings, setSettings] = useState<SecuritySettings>({
    security_level: 'medium',
    privacy_mode: 'standard',
    hide_balances: false,
    hide_transactions: false,
    hide_budgets: false,
    require_auth_for_sensitive_actions: true,
    auto_lock_timeout: 300,
    failed_attempts_limit: 5,
    session_timeout: 3600,
  });

  const [userSettings, setUserSettings] = useState<UserSettings>({
    notification_enabled: true,
    biometric_enabled: false,
    budget_alert_threshold: 80,
    daily_reminder_enabled: true,
    weekly_summary_enabled: true,
    saving_goal_alerts: true,
    transaction_reminders: true,
  });


  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const loadSettings = React.useCallback(async () => {
    if (!user) return;

    try {
      const [securitySettings, userSettingsData] = await Promise.all([
        getSecuritySettings(user.id),
        getUserSettings(user.id),
      ]);

      if (securitySettings) {
        setSettings(securitySettings);
      }
      if (userSettingsData) {
        setUserSettings(userSettingsData);
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal memuat pengaturan keamanan');
    }
  }, [user]);

  useEffect(() => {
    loadSettings();

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
  }, [loadSettings, fadeAnim]);

  const updateSetting = async (key: keyof SecuritySettings, value: string | boolean | number) => {
    if (!user) return;

    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);

      await updateSecuritySettings(user.id, { [key]: value });
    } catch (error) {
      Alert.alert('Error', 'Gagal memperbarui pengaturan');
      // Revert state on error
      setSettings(settings);
    }
  };

  const updateUserSetting = async (key: keyof UserSettings, value: boolean | number) => {
    if (!user) return;

    try {
      const newSettings = { ...userSettings, [key]: value };
      setUserSettings(newSettings);

      await updateUserSettings(user.id, { [key]: value });
    } catch (error) {
      Alert.alert('Error', 'Gagal memperbarui pengaturan');
      // Revert state on error
      setUserSettings(userSettings);
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
              settings.security_level === level && styles.optionItemActive
            ]}
            onPress={() => updateSetting('security_level', level)}
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
              Gunakan sidik jari atau wajah untuk login
            </Typography>
          </View>
          <Switch
            value={userSettings.biometric_enabled}
            onValueChange={(value) => updateUserSetting('biometric_enabled', value)}
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
              Minta autentikasi untuk tindakan sensitif
            </Typography>
          </View>
          <Switch
            value={settings.require_auth_for_sensitive_actions}
            onValueChange={(value) => updateSetting('require_auth_for_sensitive_actions', value)}
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
