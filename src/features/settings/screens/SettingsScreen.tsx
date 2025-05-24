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

  // Animasi untuk scroll
  const scrollY = React.useRef(new Animated.Value(0)).current;

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
  }, [user]);

  // Fungsi untuk memuat data pengguna
  const loadUserData = async () => {
    try {
      setIsLoading(true);

      if (!user) return;

      // Memuat pengaturan pengguna
      const userSettings = await getUserSettings(user.id);

      if (userSettings) {
        setSettings({
          notificationsEnabled: userSettings.notification_enabled,
        });
      }

      // Memuat statistik pengguna
      const userStats = await getUserStats(user.id);

      setStats(userStats);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi untuk menangani toggle notifikasi
  const handleToggleNotifications = async (value: boolean) => {
    try {
      if (!user) return;

      setSettings(prev => ({ ...prev, notificationsEnabled: value }));

      await updateUserSettings(user.id, {
        notification_enabled: value,
      });
    } catch (error) {
      console.error('Error toggling notifications:', error);
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
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Gagal logout. Silakan coba lagi.');
    }
  };

  // Fungsi untuk menangani hapus akun
  const handleDeleteAccount = () => {
    setShowDeleteDialog(true);
  };

  // Fungsi untuk menghapus semua data pengguna dari database
  const deleteUserData = async (userId: string) => {
    try {
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
          console.error(`Error deleting from ${table}:`, error);
        }
      }

      // Hapus data dari tabel profiles jika menggunakan id langsung
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error deleting profile:', profileError);
      }

    } catch (error) {
      console.error('Error deleting user data:', error);
      throw error;
    }
  };

  // Fungsi untuk konfirmasi hapus akun
  const confirmDeleteAccount = async () => {
    try {
      if (!user) return;

      setIsDeleting(true);

      // 1. Hapus semua data pengguna dari database
      await deleteUserData(user.id);

      // 2. Hapus akun dari Supabase Auth
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

      if (deleteError) {
        // Jika gagal hapus dari auth, coba dengan metode lain
        console.error('Error deleting user from auth:', deleteError);

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
      console.error('Error deleting account:', error);
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
        icon: 'trophy-outline',
        title: 'Tantangan',
        value: stats.challengeCount,
        color: theme.colors.success[500],
      },
      {
        icon: 'checkmark-circle-outline',
        title: 'Selesai',
        value: stats.completedChallenges,
        color: theme.colors.warning[500],
      },
      {
        icon: 'wallet-outline',
        title: 'Tabungan',
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
          <Ionicons name="arrow-back" size={24} color={theme.colors.neutral[800]} />
        </TouchableOpacity>
        <Typography variant="h4" weight="600">Pengaturan</Typography>
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
      <Modal
        visible={showLogoutDialog}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutDialog(false)}
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
                    colors={[theme.colors.secondary[500], theme.colors.secondary[600]]}
                    style={styles.iconGradient}
                  >
                    <Ionicons name="log-out" size={28} color="white" />
                  </LinearGradient>
                </View>
                <Typography variant="h5" weight="700" color={theme.colors.neutral[800]}>
                  Konfirmasi Logout
                </Typography>
              </View>

              <View style={styles.dialogContent}>
                <Typography variant="body1" color={theme.colors.neutral[700]} style={styles.dialogText}>
                  Apakah Anda yakin ingin keluar dari aplikasi? Anda perlu login kembali untuk mengakses akun Anda.
                </Typography>
              </View>

              <View style={styles.dialogActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowLogoutDialog(false)}
                >
                  <Typography variant="body1" weight="600" color={theme.colors.neutral[600]}>
                    Batal
                  </Typography>
                </TouchableOpacity>

                <TouchableOpacity style={styles.confirmButton} onPress={confirmLogout}>
                  <LinearGradient
                    colors={[theme.colors.secondary[500], theme.colors.secondary[600]]}
                    style={styles.confirmButtonGradient}
                  >
                    <Typography variant="body1" weight="600" color="white">
                      Logout
                    </Typography>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>

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
  scrollContent: {
    paddingHorizontal: theme.spacing.layout.sm,
    paddingBottom: theme.spacing.layout.xl,
    paddingTop: theme.spacing.sm,
  },

  // Dialog Styles
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
    padding: theme.spacing.xl,
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
    marginBottom: theme.spacing.xl,
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
  },
  confirmButton: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  confirmButtonGradient: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
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
