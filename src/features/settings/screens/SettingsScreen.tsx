import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Typography, Card } from '../../../core/components';
import { theme } from '../../../core/theme';
import { useAuthStore, useThemeStore } from '../../../core/services/store';
import { RootStackParamList } from '../../../core/navigation/types';
import { Ionicons } from '@expo/vector-icons';

export const SettingsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { logout } = useAuthStore();
  const { mode, setThemeMode, motionDetectionEnabled, setMotionDetectionEnabled } = useThemeStore();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [darkMode, setDarkMode] = useState(mode === 'dark');
  const [currency, setCurrency] = useState('IDR');
  const [language, setLanguage] = useState('id');

  // Fungsi untuk menangani toggle notifikasi
  const handleToggleNotifications = (value: boolean) => {
    setNotificationsEnabled(value);
  };

  // Fungsi untuk menangani toggle biometrik
  const handleToggleBiometrics = (value: boolean) => {
    setBiometricsEnabled(value);
  };

  // Fungsi untuk menangani toggle dark mode
  const handleToggleDarkMode = (value: boolean) => {
    setDarkMode(value);
    setThemeMode(value ? 'dark' : 'light');
  };

  // Fungsi untuk menangani toggle deteksi gerakan
  const handleToggleMotionDetection = (value: boolean) => {
    setMotionDetectionEnabled(value);
  };

  // Fungsi untuk menangani logout
  const handleLogout = () => {
    Alert.alert(
      'Konfirmasi Logout',
      'Apakah Anda yakin ingin keluar dari aplikasi?',
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Error logging out:', error);
            }
          },
        },
      ]
    );
  };

  // Fungsi untuk menangani hapus akun
  const handleDeleteAccount = () => {
    Alert.alert(
      'Konfirmasi Hapus Akun',
      'Apakah Anda yakin ingin menghapus akun Anda? Tindakan ini tidak dapat dibatalkan.',
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Hapus Akun',
          style: 'destructive',
          onPress: () => {
            // Implementasi hapus akun akan ditambahkan nanti
            console.log('Delete account');
          },
        },
      ]
    );
  };

  // Render section header
  const renderSectionHeader = (title: string) => (
    <Typography variant="h6" style={styles.sectionHeader}>
      {title}
    </Typography>
  );

  // Render setting item with switch
  const renderSwitchItem = (
    title: string,
    description: string,
    value: boolean,
    onValueChange: (value: boolean) => void
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingTextContainer}>
        <Typography variant="body1">{title}</Typography>
        <Typography variant="body2" color={theme.colors.neutral[600]}>
          {description}
        </Typography>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: theme.colors.neutral[300],
          true: theme.colors.primary[500],
        }}
        thumbColor={theme.colors.white}
      />
    </View>
  );

  // Render setting item with navigation
  const renderNavigationItem = (
    title: string,
    description: string,
    onPress: () => void,
    value?: string
  ) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingTextContainer}>
        <Typography variant="body1">{title}</Typography>
        <Typography variant="body2" color={theme.colors.neutral[600]}>
          {description}
        </Typography>
      </View>
      <View style={styles.settingValueContainer}>
        {value && (
          <Typography variant="body2" color={theme.colors.neutral[600]}>
            {value}
          </Typography>
        )}
        <Typography variant="body1" color={theme.colors.primary[500]}>
          &gt;
        </Typography>
      </View>
    </TouchableOpacity>
  );

  // Render danger button
  const renderDangerButton = (title: string, onPress: () => void) => (
    <TouchableOpacity style={styles.dangerButton} onPress={onPress}>
      <Typography variant="body1" color={theme.colors.danger[500]}>
        {title}
      </Typography>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Typography variant="h4">Pengaturan</Typography>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profil */}
        {renderSectionHeader('Profil')}
        <Card style={styles.card}>
          {renderNavigationItem(
            'Informasi Akun',
            'Lihat dan edit informasi akun Anda',
            () => console.log('Navigate to account info'),
            'John Doe'
          )}
          {renderNavigationItem(
            'Ubah Password',
            'Ubah password akun Anda',
            () => console.log('Navigate to change password')
          )}
        </Card>

        {/* Preferensi */}
        {renderSectionHeader('Preferensi')}
        <Card style={styles.card}>
          {renderSwitchItem(
            'Notifikasi',
            'Aktifkan notifikasi untuk pengingat dan pembaruan',
            notificationsEnabled,
            handleToggleNotifications
          )}
          {renderSwitchItem(
            'Mode Gelap',
            'Aktifkan mode gelap untuk tampilan aplikasi',
            darkMode,
            handleToggleDarkMode
          )}
          {renderSwitchItem(
            'Deteksi Gerakan',
            'Aktifkan deteksi gerakan perangkat (tilt, shake, flip)',
            motionDetectionEnabled,
            handleToggleMotionDetection
          )}
          {renderNavigationItem(
            'Mata Uang',
            'Pilih mata uang yang digunakan',
            () => console.log('Navigate to currency settings'),
            currency
          )}
          {renderNavigationItem(
            'Bahasa',
            'Pilih bahasa aplikasi',
            () => console.log('Navigate to language settings'),
            language === 'id' ? 'Indonesia' : 'English'
          )}
        </Card>

        {/* Keamanan */}
        {renderSectionHeader('Keamanan')}
        <Card style={styles.card}>
          {renderSwitchItem(
            'Autentikasi Biometrik',
            'Gunakan sidik jari atau wajah untuk login',
            biometricsEnabled,
            handleToggleBiometrics
          )}
          {renderNavigationItem(
            'Pengaturan Keamanan',
            'Kelola tingkat keamanan dan privasi',
            () => navigation.navigate('SecuritySettings')
          )}
          {renderNavigationItem(
            'Backup & Restore',
            'Backup dan restore data Anda',
            () => console.log('Navigate to backup settings')
          )}
        </Card>

        {/* Tentang */}
        {renderSectionHeader('Tentang')}
        <Card style={styles.card}>
          {renderNavigationItem(
            'Tentang Aplikasi',
            'Informasi tentang aplikasi',
            () => console.log('Navigate to about app'),
            'v1.0.0'
          )}
          {renderNavigationItem(
            'Kebijakan Privasi',
            'Baca kebijakan privasi kami',
            () => console.log('Navigate to privacy policy')
          )}
          {renderNavigationItem(
            'Syarat & Ketentuan',
            'Baca syarat dan ketentuan kami',
            () => console.log('Navigate to terms and conditions')
          )}
        </Card>

        {/* Aksi Berbahaya */}
        {renderSectionHeader('Aksi')}
        <Card style={styles.card}>
          {renderDangerButton('Logout', handleLogout)}
          {renderDangerButton('Hapus Akun', handleDeleteAccount)}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.layout.sm,
    paddingBottom: theme.spacing.md,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.layout.sm,
    paddingBottom: theme.spacing.layout.lg,
  },
  sectionHeader: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    marginLeft: theme.spacing.sm,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  settingTextContainer: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  settingValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dangerButton: {
    padding: theme.spacing.md,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
});
