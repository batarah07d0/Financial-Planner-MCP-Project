import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Typography, Card, Switch } from '../../../core/components';
import { theme } from '../../../core/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNotificationManager } from '../../../core/hooks/useNotificationManager';
import { useAuthStore } from '../../../core/services/store/authStore';
import { getUserSettings, updateUserSettings } from '../services';

interface NotificationSettings {
  notification_enabled: boolean;
  budget_alert_threshold: number;
  daily_reminder_enabled: boolean;
  weekly_summary_enabled: boolean;
  saving_goal_alerts: boolean;
  transaction_reminders: boolean;
}

export const NotificationSettingsScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { hasPermission, requestPermission, cancelAllNotifications } = useNotificationManager();
  
  const [settings, setSettings] = useState<NotificationSettings>({
    notification_enabled: true,
    budget_alert_threshold: 80,
    daily_reminder_enabled: true,
    weekly_summary_enabled: true,
    saving_goal_alerts: true,
    transaction_reminders: true,
  });
  
  const [isLoading, setIsLoading] = useState(false);

  // Load user settings
  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.id) return;
      
      try {
        const userSettings = await getUserSettings(user.id);
        if (userSettings) {
          setSettings({
            notification_enabled: userSettings.notification_enabled ?? true,
            budget_alert_threshold: userSettings.budget_alert_threshold ?? 80,
            daily_reminder_enabled: userSettings.daily_reminder_enabled ?? true,
            weekly_summary_enabled: userSettings.weekly_summary_enabled ?? true,
            saving_goal_alerts: userSettings.saving_goal_alerts ?? true,
            transaction_reminders: userSettings.transaction_reminders ?? true,
          });
        }
      } catch (error) {
        // Error loading settings
      }
    };

    loadSettings();
  }, [user?.id]);

  // Update setting
  const updateSetting = async (key: keyof NotificationSettings, value: boolean | number) => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);

      // Update in database
      await updateUserSettings(user.id, {
        [key]: value,
      });

      // If disabling all notifications, cancel all scheduled notifications
      if (key === 'notification_enabled' && !value) {
        await cancelAllNotifications();
        Alert.alert(
          'Notifikasi Dinonaktifkan',
          'Semua notifikasi terjadwal telah dibatalkan.'
        );
      }

      // If enabling notifications, request permission
      if (key === 'notification_enabled' && value && !hasPermission) {
        const granted = await requestPermission();
        if (!granted) {
          Alert.alert(
            'Izin Diperlukan',
            'Untuk mengaktifkan notifikasi, berikan izin notifikasi di pengaturan aplikasi.'
          );
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal menyimpan pengaturan');
      // Revert the change
      setSettings(prev => ({ ...prev, [key]: !value }));
    } finally {
      setIsLoading(false);
    }
  };

  // Clear all notifications
  const handleClearAllNotifications = () => {
    Alert.alert(
      'Hapus Semua Notifikasi',
      'Apakah Anda yakin ingin menghapus semua notifikasi yang terjadwal?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            const success = await cancelAllNotifications();
            if (success) {
              Alert.alert('Berhasil', 'Semua notifikasi telah dihapus');
            } else {
              Alert.alert('Error', 'Gagal menghapus notifikasi');
            }
          },
        },
      ]
    );
  };

  const renderSettingItem = (
    title: string,
    description: string,
    value: boolean,
    onToggle: () => void,
    icon: keyof typeof Ionicons.glyphMap,
    disabled = false
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <Ionicons 
          name={icon} 
          size={24} 
          color={disabled ? theme.colors.neutral[400] : theme.colors.primary[500]} 
        />
      </View>
      <View style={styles.settingContent}>
        <Typography 
          variant="body1" 
          weight="500" 
          color={disabled ? theme.colors.neutral[400] : theme.colors.neutral[900]}
        >
          {title}
        </Typography>
        <Typography 
          variant="body2" 
          color={disabled ? theme.colors.neutral[400] : theme.colors.neutral[600]}
          style={styles.settingDescription}
        >
          {description}
        </Typography>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled || isLoading}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[theme.colors.white, theme.colors.neutral[50]]}
        style={styles.headerContainer}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color={theme.colors.primary[500]} />
          </TouchableOpacity>
          <Typography
            variant="h4"
            color={theme.colors.primary[700]}
            weight="600"
            style={styles.headerTitle}
          >
            Pengaturan Notifikasi
          </Typography>
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Permission Status */}
        <Card style={styles.card}>
          <View style={styles.permissionStatus}>
            <View style={styles.permissionIcon}>
              <Ionicons 
                name={hasPermission ? "checkmark-circle" : "alert-circle"} 
                size={24} 
                color={hasPermission ? theme.colors.success[500] : theme.colors.warning[500]} 
              />
            </View>
            <View style={styles.permissionContent}>
              <Typography variant="body1" weight="500">
                Status Izin Notifikasi
              </Typography>
              <Typography 
                variant="body2" 
                color={hasPermission ? theme.colors.success[600] : theme.colors.warning[600]}
              >
                {hasPermission ? 'Diizinkan' : 'Tidak Diizinkan'}
              </Typography>
            </View>
            {!hasPermission && (
              <TouchableOpacity
                style={styles.permissionButton}
                onPress={requestPermission}
              >
                <Typography variant="body2" color={theme.colors.primary[500]} weight="500">
                  Aktifkan
                </Typography>
              </TouchableOpacity>
            )}
          </View>
        </Card>

        {/* Main Settings */}
        <Card style={styles.card}>
          <Typography variant="h6" weight="600" style={styles.sectionTitle}>
            Pengaturan Utama
          </Typography>
          
          {renderSettingItem(
            'Aktifkan Notifikasi',
            'Master switch untuk semua notifikasi aplikasi',
            settings.notification_enabled,
            () => updateSetting('notification_enabled', !settings.notification_enabled),
            'notifications-outline'
          )}

          {renderSettingItem(
            'Pengingat Harian',
            'Pengingat untuk review keuangan harian',
            settings.daily_reminder_enabled,
            () => updateSetting('daily_reminder_enabled', !settings.daily_reminder_enabled),
            'time-outline',
            !settings.notification_enabled
          )}

          {renderSettingItem(
            'Ringkasan Mingguan',
            'Ringkasan transaksi dan keuangan mingguan',
            settings.weekly_summary_enabled,
            () => updateSetting('weekly_summary_enabled', !settings.weekly_summary_enabled),
            'calendar-outline',
            !settings.notification_enabled
          )}
        </Card>

        {/* Feature-specific Settings */}
        <Card style={styles.card}>
          <Typography variant="h6" weight="600" style={styles.sectionTitle}>
            Notifikasi Fitur
          </Typography>
          
          {renderSettingItem(
            'Alert Anggaran',
            'Peringatan ketika anggaran hampir habis',
            settings.saving_goal_alerts,
            () => updateSetting('saving_goal_alerts', !settings.saving_goal_alerts),
            'wallet-outline',
            !settings.notification_enabled
          )}

          {renderSettingItem(
            'Progress Tabungan',
            'Update progress dan milestone tabungan',
            settings.saving_goal_alerts,
            () => updateSetting('saving_goal_alerts', !settings.saving_goal_alerts),
            'trending-up-outline',
            !settings.notification_enabled
          )}

          {renderSettingItem(
            'Pengingat Transaksi',
            'Pengingat untuk mencatat transaksi harian',
            settings.transaction_reminders,
            () => updateSetting('transaction_reminders', !settings.transaction_reminders),
            'receipt-outline',
            !settings.notification_enabled
          )}
        </Card>

        {/* Actions */}
        <Card style={styles.card}>
          <Typography variant="h6" weight="600" style={styles.sectionTitle}>
            Aksi
          </Typography>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleClearAllNotifications}
            activeOpacity={0.7}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="trash-outline" size={24} color={theme.colors.danger[500]} />
            </View>
            <View style={styles.actionContent}>
              <Typography variant="body1" weight="500" color={theme.colors.danger[600]}>
                Hapus Semua Notifikasi
              </Typography>
              <Typography variant="body2" color={theme.colors.neutral[600]}>
                Batalkan semua notifikasi yang terjadwal
              </Typography>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.neutral[400]} />
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  headerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
    ...theme.elevation.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.layout.sm,
    paddingBottom: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: theme.spacing.layout.sm,
  },
  card: {
    padding: theme.spacing.layout.md,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    ...theme.elevation.md,
  },
  sectionTitle: {
    marginBottom: theme.spacing.md,
    color: theme.colors.neutral[800],
  },
  permissionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  permissionIcon: {
    marginRight: theme.spacing.sm,
  },
  permissionContent: {
    flex: 1,
  },
  permissionButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary[50],
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[100],
  },
  settingIcon: {
    marginRight: theme.spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingDescription: {
    marginTop: theme.spacing.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  actionIcon: {
    marginRight: theme.spacing.md,
  },
  actionContent: {
    flex: 1,
  },
});
