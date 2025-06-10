import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Alert,
  StatusBar,
  Animated,
  Platform,
  View,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Typography } from '../../../core/components';
import { theme } from '../../../core/theme';
import { useAuthStore } from '../../../core/services/store';
import { RootStackParamList } from '../../../core/navigation/types';
import { formatCurrency } from '../../../core/utils';
import {
  ProfileHeader,
  SettingItem,
  SettingSection,
  StatisticsCard
} from '../components';
import { getUserStats, getUserSettings, updateUserSettings } from '../services';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SuperiorDialog } from '../../../core/components/SuperiorDialog';
import { useBiometrics } from '../../../core/hooks/useBiometrics';
import { supabase } from '../../../config/supabase';

export const SettingsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, logout } = useAuthStore();

  // State untuk pengaturan pengguna
  const [settings, setSettings] = useState({
    notificationsEnabled: true,
  });

  // State untuk statistik pengguna
  const [stats, setStats] = useState({
    transactionCount: 0,
    challengeCount: 0,
    completedChallenges: 0,
    savingZones: 0,
    totalSavings: 0,
  });

  // State untuk loading (digunakan di ProfileHeader dan StatisticsCard)
  const [isLoading, setIsLoading] = useState(true);

  // State untuk dialog
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // State untuk biometrik
  const [userBiometricEnabled, setUserBiometricEnabled] = useState(false);

  // Animasi untuk scroll
  const scrollY = React.useRef(new Animated.Value(0)).current;

  // Hook untuk biometrik
  const { authenticate } = useBiometrics((title: string, message: string) => {
    Alert.alert(title, message);
  });

  // Fungsi untuk memuat data pengguna
  const loadUserData = React.useCallback(async () => {
    try {
      setIsLoading(true);

      if (!user) return;

      // Memuat pengaturan pengguna
      const userSettings = await getUserSettings(user.id);

      if (userSettings) {
        setSettings({
          notificationsEnabled: userSettings.notification_enabled,
        });
        // Set status biometrik dari database
        setUserBiometricEnabled(userSettings.biometric_enabled);
      }

      // Memuat statistik pengguna
      const userStats = await getUserStats(user.id);

      setStats(userStats);
    } catch (error) {
      // Error handling tanpa console.error
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Efek untuk memuat pengaturan dan statistik pengguna
  useEffect(() => {
    if (user) {
      loadUserData();
    }

    // Mengatur status bar
    StatusBar.setBarStyle('dark-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('transparent');
      StatusBar.setTranslucent(true);
    }

    return () => {
      // Reset status bar saat unmount
      StatusBar.setBarStyle('default');
    };
  }, [user, loadUserData]);

  // Fungsi untuk menangani toggle notifikasi
  const handleToggleNotifications = async (value: boolean) => {
    try {
      if (!user) return;

      setSettings(prev => ({ ...prev, notificationsEnabled: value }));

      await updateUserSettings(user.id, {
        notification_enabled: value,
      });
    } catch (error) {
      // Error handling tanpa console.error
    }
  };

  // Fungsi untuk menangani logout
  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  // Fungsi untuk konfirmasi logout
  const confirmLogout = async () => {
    try {
      setShowLogoutDialog(false);
      await logout();
    } catch (error) {
      Alert.alert('Error', 'Gagal logout. Silakan coba lagi.');
    }
  };

  // Fungsi untuk menangani hapus akun
  const handleDeleteAccount = () => {
    setShowDeleteDialog(true);
  };

  // Fungsi untuk menghapus semua data pengguna dari database
  const deleteUserData = async (userId: string) => {
    // Hapus data dari semua tabel yang terkait dengan user
    const tables = [
      'transactions',
      'budgets',
      'challenges',
      'saving_zones',
      'user_settings',
      'backup_history',
      'security_settings',
      'profiles'
    ];

    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('user_id', userId);

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        // Error handling tanpa console.error
      }
    }

    // Hapus data dari tabel profiles jika menggunakan id langsung
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError && profileError.code !== 'PGRST116') {
      // Error handling tanpa console.error
    }
  };

  // Fungsi untuk konfirmasi hapus akun
  const confirmDeleteAccount = async () => {
    try {
      if (!user) return;

      // Jika biometrik diaktifkan, lakukan autentikasi terlebih dahulu
      if (userBiometricEnabled) {
        const authSuccess = await authenticate({
          promptMessage: 'Autentikasi untuk menghapus akun',
          fallbackLabel: 'Gunakan PIN',
          cancelLabel: 'Batal',
        });

        if (!authSuccess) {
          Alert.alert(
            'Autentikasi Gagal',
            'Autentikasi biometrik diperlukan untuk menghapus akun.'
          );
          setShowDeleteDialog(false);
          return;
        }
      }

      setIsDeleting(true);

      // 1. Hapus semua data pengguna dari database
      await deleteUserData(user.id);

      // 2. Hapus akun dari Supabase Auth
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

      if (deleteError) {
        // Jika gagal hapus dari auth, coba dengan metode lain
        // Logout user dan biarkan mereka tidak bisa login lagi
        await logout();
        Alert.alert(
          'Akun Dihapus',
          'Data Anda telah dihapus dari sistem. Akun Anda tidak dapat digunakan lagi.',
          [{ text: 'OK' }]
        );
        return;
      }

      // 3. Logout dan tampilkan pesan sukses
      await logout();
      Alert.alert(
        'Akun Berhasil Dihapus',
        'Akun dan semua data Anda telah dihapus secara permanen.',
        [{ text: 'OK' }]
      );

    } catch (error) {
      Alert.alert(
        'Error',
        'Gagal menghapus akun. Silakan coba lagi atau hubungi dukungan.'
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Render statistik pengguna
  const renderUserStats = () => {
    const statItems = [
      {
        icon: 'receipt-outline',
        title: 'Transaksi',
        value: stats.transactionCount,
        color: theme.colors.primary[500],
      },
      {
        icon: 'flag-outline',
        title: 'Tujuan Tabungan',
        value: stats.savingZones,
        color: theme.colors.success[500],
      },
      {
        icon: 'checkmark-circle-outline',
        title: 'Tantangan Selesai',
        value: stats.completedChallenges,
        color: theme.colors.warning[500],
      },
      {
        icon: 'wallet-outline',
        title: 'Total Tabungan',
        value: formatCurrency(stats.totalSavings),
        color: theme.colors.info[500],
      },
    ];

    return <StatisticsCard stats={statItems} isLoading={isLoading} />;
  };

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
            fontSize: 20,
            textAlign: 'center',
            lineHeight: 24,
            includeFontPadding: false,
            textAlignVertical: 'center',
          }}
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.8}
        >
          Pengaturan
        </Typography>
        <View style={styles.headerRight} />
      </View>

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <ProfileHeader isLoading={isLoading} />

        {renderUserStats()}

        <SettingSection title="Profil" delay={200}>
          <SettingItem
            title="Informasi Akun"
            description="Lihat dan edit informasi akun Anda"
            icon="person-outline"
            value={user?.email?.split('@')[0] || 'User'}
            onPress={() => navigation.navigate('AccountInfo')}
          />
          <SettingItem
            title="Ubah Password"
            description="Ubah password akun Anda"
            icon="key-outline"
            onPress={() => navigation.navigate('ChangePassword')}
          />
        </SettingSection>

        <SettingSection title="Preferensi" delay={400}>
          <SettingItem
            title="Notifikasi"
            description="Aktifkan notifikasi untuk pengingat dan pembaruan"
            icon="notifications-outline"
            isSwitch
            switchValue={settings.notificationsEnabled}
            onSwitchChange={handleToggleNotifications}
          />
        </SettingSection>

        <SettingSection title="Keamanan" delay={600}>
          <SettingItem
            title="Pengaturan Keamanan"
            description="Kelola tingkat keamanan dan privasi"
            icon="shield-outline"
            onPress={() => navigation.navigate('SecuritySettings')}
          />
          <SettingItem
            title="Backup & Restore"
            description="Backup dan restore data Anda"
            icon="cloud-upload-outline"
            onPress={() => navigation.navigate('BackupRestore')}
          />
        </SettingSection>



        <SettingSection title="Tentang" delay={800}>
          <SettingItem
            title="Tentang Aplikasi"
            description="Informasi tentang aplikasi"
            icon="information-circle-outline"
            value="v1.0.0"
            onPress={() => navigation.navigate('AboutApp')}
          />
          <SettingItem
            title="Kebijakan Privasi"
            description="Baca kebijakan privasi kami"
            icon="document-text-outline"
            onPress={() => navigation.navigate('PrivacyPolicy')}
          />
          <SettingItem
            title="Syarat & Ketentuan"
            description="Baca syarat dan ketentuan kami"
            icon="document-outline"
            onPress={() => navigation.navigate('TermsConditions')}
          />
        </SettingSection>

        <SettingSection title="Aksi" delay={1000}>
          <SettingItem
            title="Logout"
            description="Keluar dari aplikasi"
            icon="log-out-outline"
            onPress={handleLogout}
            isDanger
          />
          <SettingItem
            title="Hapus Akun"
            description="Hapus akun dan semua data Anda"
            icon="trash-outline"
            onPress={handleDeleteAccount}
            isDanger
          />
        </SettingSection>
      </Animated.ScrollView>

      {/* Superior Logout Dialog */}
      <SuperiorDialog
        visible={showLogoutDialog}
        type="confirm"
        title="Konfirmasi Logout"
        message="Apakah Anda yakin ingin keluar dari aplikasi? Anda perlu login kembali untuk mengakses akun Anda."
        icon="log-out"
        actions={[
          {
            text: 'Batal',
            onPress: () => setShowLogoutDialog(false),
            style: 'cancel',
          },
          {
            text: 'Logout',
            onPress: confirmLogout,
            style: 'destructive',
          },
        ]}
        onClose={() => setShowLogoutDialog(false)}
      />

      {/* Superior Delete Account Dialog */}
      <Modal
        visible={showDeleteDialog}
        transparent
        animationType="fade"
        onRequestClose={() => !isDeleting && setShowDeleteDialog(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dialogContainer}>
            <LinearGradient
              colors={[theme.colors.secondary[50], theme.colors.secondary[100]]}
              style={styles.dialogGradient}
            >
              <View style={styles.dialogHeader}>
                <View style={styles.dialogIcon}>
                  <LinearGradient
                    colors={[theme.colors.secondary[600], theme.colors.secondary[700]]}
                    style={styles.iconGradient}
                  >
                    <Ionicons name="trash" size={28} color="white" />
                  </LinearGradient>
                </View>
                <Typography variant="h5" weight="700" color={theme.colors.neutral[800]}>
                  Hapus Akun Permanen
                </Typography>
              </View>

              <View style={styles.dialogContent}>
                <Typography variant="body1" color={theme.colors.neutral[700]} style={styles.dialogText}>
                  ⚠️ Tindakan ini akan menghapus akun dan semua data Anda secara permanen dari sistem kami.
                </Typography>
                <Typography variant="body2" color={theme.colors.secondary[600]} style={styles.warningText}>
                  Data yang akan dihapus: transaksi, budget, tantangan, tabungan, pengaturan, dan profil.
                </Typography>
                <Typography variant="body2" weight="600" color={theme.colors.secondary[700]} style={styles.finalWarning}>
                  Tindakan ini TIDAK DAPAT dibatalkan!
                </Typography>
              </View>

              <View style={styles.dialogActions}>
                <TouchableOpacity
                  style={[styles.cancelButton, isDeleting && styles.disabledButton]}
                  onPress={() => !isDeleting && setShowDeleteDialog(false)}
                  disabled={isDeleting}
                >
                  <Typography variant="body1" weight="600" color={isDeleting ? theme.colors.neutral[400] : theme.colors.neutral[600]}>
                    Batal
                  </Typography>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.confirmButton, isDeleting && styles.disabledButton]}
                  onPress={confirmDeleteAccount}
                  disabled={isDeleting}
                >
                  <LinearGradient
                    colors={isDeleting ? [theme.colors.neutral[400], theme.colors.neutral[500]] : [theme.colors.secondary[600], theme.colors.secondary[700]]}
                    style={styles.confirmButtonGradient}
                  >
                    {isDeleting ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="white" />
                        <Typography variant="body1" weight="600" color="white" style={styles.loadingText}>
                          Menghapus...
                        </Typography>
                      </View>
                    ) : (
                      <Typography variant="body1" weight="600" color="white">
                        Hapus Akun
                      </Typography>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>
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
  scrollContent: {
    paddingHorizontal: theme.spacing.layout.sm,
    paddingBottom: theme.spacing.layout.xl,
    paddingTop: theme.spacing.sm,
  },

  // Dialog Styles untuk Delete Account (masih menggunakan custom dialog)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    ...theme.elevation.lg,
  },
  dialogGradient: {
    paddingTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },
  dialogHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  dialogIcon: {
    marginBottom: theme.spacing.md,
  },
  iconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogContent: {
    marginBottom: theme.spacing.lg,
  },
  dialogText: {
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.md,
  },
  warningText: {
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  finalWarning: {
    textAlign: 'center',
    lineHeight: 20,
  },
  dialogActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.neutral[300],
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  confirmButton: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    minHeight: 48,
  },
  confirmButtonGradient: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  loadingText: {
    marginLeft: theme.spacing.xs,
  },
});
