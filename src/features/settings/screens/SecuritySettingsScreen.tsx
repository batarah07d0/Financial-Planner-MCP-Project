import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Typography, Card, BiometricAuth } from '../../../core/components';
import { theme } from '../../../core/theme';
import { useBiometrics } from '../../../core/hooks';
import {
  SecurityLevel,
  PrivacyMode,
  SensitiveData,
  getSecurityLevel,
  setSecurityLevel,
  getPrivacyMode,
  setPrivacyMode,
  getSensitiveDataSettings,
  setSensitiveDataSettings,
} from '../../../core/services/security';
import { Ionicons } from '@expo/vector-icons';

export const SecuritySettingsScreen = () => {
  const navigation = useNavigation();
  const { isAvailable, isEnabled, enableBiometrics, disableBiometrics } = useBiometrics();
  
  const [securityLevel, setSecurityLevelState] = useState<SecurityLevel>('medium');
  const [privacyMode, setPrivacyModeState] = useState<PrivacyMode>('standard');
  const [sensitiveData, setSensitiveDataState] = useState<SensitiveData>({
    hideBalances: false,
    hideTransactions: false,
    hideBudgets: false,
    requireAuthForSensitiveActions: true,
  });
  
  const [showBiometricAuth, setShowBiometricAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Memuat pengaturan keamanan
  const loadSecuritySettings = async () => {
    try {
      setIsLoading(true);
      
      const level = await getSecurityLevel();
      const mode = await getPrivacyMode();
      const settings = await getSensitiveDataSettings();
      
      setSecurityLevelState(level);
      setPrivacyModeState(mode);
      setSensitiveDataState(settings);
    } catch (error) {
      console.error('Error loading security settings:', error);
      Alert.alert('Error', 'Gagal memuat pengaturan keamanan');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Memuat pengaturan saat komponen dimount
  useEffect(() => {
    loadSecuritySettings();
  }, []);
  
  // Fungsi untuk menangani perubahan tingkat keamanan
  const handleSecurityLevelChange = async (level: SecurityLevel) => {
    try {
      // Jika tingkat keamanan tinggi, tampilkan autentikasi biometrik
      if (level === 'high' && isAvailable) {
        setShowBiometricAuth(true);
        return;
      }
      
      // Simpan tingkat keamanan
      const success = await setSecurityLevel(level);
      
      if (success) {
        setSecurityLevelState(level);
        Alert.alert('Sukses', 'Tingkat keamanan berhasil diperbarui');
      } else {
        Alert.alert('Error', 'Gagal memperbarui tingkat keamanan');
      }
    } catch (error) {
      console.error('Error changing security level:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat mengubah tingkat keamanan');
    }
  };
  
  // Fungsi untuk menangani perubahan mode privasi
  const handlePrivacyModeChange = async (mode: PrivacyMode) => {
    try {
      // Jika mode privasi maksimum, tampilkan autentikasi biometrik
      if (mode === 'maximum' && isAvailable) {
        setShowBiometricAuth(true);
        return;
      }
      
      // Simpan mode privasi
      const success = await setPrivacyMode(mode);
      
      if (success) {
        setPrivacyModeState(mode);
        Alert.alert('Sukses', 'Mode privasi berhasil diperbarui');
      } else {
        Alert.alert('Error', 'Gagal memperbarui mode privasi');
      }
    } catch (error) {
      console.error('Error changing privacy mode:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat mengubah mode privasi');
    }
  };
  
  // Fungsi untuk menangani perubahan pengaturan data sensitif
  const handleSensitiveDataChange = async (key: keyof SensitiveData, value: boolean) => {
    try {
      const newSettings = {
        ...sensitiveData,
        [key]: value,
      };
      
      // Simpan pengaturan data sensitif
      const success = await setSensitiveDataSettings(newSettings);
      
      if (success) {
        setSensitiveDataState(newSettings);
      } else {
        Alert.alert('Error', 'Gagal memperbarui pengaturan data sensitif');
      }
    } catch (error) {
      console.error('Error changing sensitive data settings:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat mengubah pengaturan data sensitif');
    }
  };
  
  // Fungsi untuk menangani perubahan biometrik
  const handleBiometricChange = async (enabled: boolean) => {
    try {
      if (enabled) {
        const success = await enableBiometrics();
        
        if (!success) {
          Alert.alert('Error', 'Gagal mengaktifkan biometrik');
        }
      } else {
        const success = await disableBiometrics();
        
        if (!success) {
          Alert.alert('Error', 'Gagal menonaktifkan biometrik');
        }
      }
    } catch (error) {
      console.error('Error changing biometric settings:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat mengubah pengaturan biometrik');
    }
  };
  
  // Fungsi untuk menangani keberhasilan autentikasi biometrik
  const handleBiometricSuccess = async () => {
    setShowBiometricAuth(false);
    
    // Simpan tingkat keamanan tinggi
    const success = await setSecurityLevel('high');
    
    if (success) {
      setSecurityLevelState('high');
      Alert.alert('Sukses', 'Tingkat keamanan berhasil diperbarui');
    } else {
      Alert.alert('Error', 'Gagal memperbarui tingkat keamanan');
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Typography variant="body1" color={theme.colors.primary[500]}>
            Kembali
          </Typography>
        </TouchableOpacity>
        <Typography variant="h4">Pengaturan Keamanan</Typography>
        <View style={{ width: 50 }} />
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.section}>
          <Typography variant="h5" style={styles.sectionTitle}>
            Tingkat Keamanan
          </Typography>
          
          <TouchableOpacity
            style={[
              styles.optionItem,
              securityLevel === 'low' && styles.selectedOption,
            ]}
            onPress={() => handleSecurityLevelChange('low')}
          >
            <View style={styles.optionContent}>
              <Typography variant="body1" weight="600">
                Rendah
              </Typography>
              <Typography variant="body2" color={theme.colors.neutral[600]}>
                Autentikasi minimal, tidak ada enkripsi
              </Typography>
            </View>
            {securityLevel === 'low' && (
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={theme.colors.primary[500]}
              />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.optionItem,
              securityLevel === 'medium' && styles.selectedOption,
            ]}
            onPress={() => handleSecurityLevelChange('medium')}
          >
            <View style={styles.optionContent}>
              <Typography variant="body1" weight="600">
                Menengah
              </Typography>
              <Typography variant="body2" color={theme.colors.neutral[600]}>
                Autentikasi untuk tindakan sensitif
              </Typography>
            </View>
            {securityLevel === 'medium' && (
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={theme.colors.primary[500]}
              />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.optionItem,
              securityLevel === 'high' && styles.selectedOption,
            ]}
            onPress={() => handleSecurityLevelChange('high')}
          >
            <View style={styles.optionContent}>
              <Typography variant="body1" weight="600">
                Tinggi
              </Typography>
              <Typography variant="body2" color={theme.colors.neutral[600]}>
                Autentikasi untuk semua tindakan, enkripsi data
              </Typography>
            </View>
            {securityLevel === 'high' && (
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={theme.colors.primary[500]}
              />
            )}
          </TouchableOpacity>
        </Card>
        
        <Card style={styles.section}>
          <Typography variant="h5" style={styles.sectionTitle}>
            Biometrik
          </Typography>
          
          <View style={styles.switchItem}>
            <View style={styles.switchContent}>
              <Typography variant="body1">
                Aktifkan Autentikasi Biometrik
              </Typography>
              <Typography variant="body2" color={theme.colors.neutral[600]}>
                {isAvailable
                  ? 'Gunakan sidik jari atau wajah untuk autentikasi'
                  : 'Perangkat Anda tidak mendukung biometrik'}
              </Typography>
            </View>
            <Switch
              value={isEnabled}
              onValueChange={handleBiometricChange}
              disabled={!isAvailable}
              trackColor={{
                false: theme.colors.neutral[300],
                true: theme.colors.primary[300],
              }}
              thumbColor={
                isEnabled ? theme.colors.primary[500] : theme.colors.neutral[100]
              }
            />
          </View>
        </Card>
        
        <Card style={styles.section}>
          <Typography variant="h5" style={styles.sectionTitle}>
            Mode Privasi
          </Typography>
          
          <TouchableOpacity
            style={[
              styles.optionItem,
              privacyMode === 'standard' && styles.selectedOption,
            ]}
            onPress={() => handlePrivacyModeChange('standard')}
          >
            <View style={styles.optionContent}>
              <Typography variant="body1" weight="600">
                Standar
              </Typography>
              <Typography variant="body2" color={theme.colors.neutral[600]}>
                Tampilkan semua data keuangan
              </Typography>
            </View>
            {privacyMode === 'standard' && (
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={theme.colors.primary[500]}
              />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.optionItem,
              privacyMode === 'enhanced' && styles.selectedOption,
            ]}
            onPress={() => handlePrivacyModeChange('enhanced')}
          >
            <View style={styles.optionContent}>
              <Typography variant="body1" weight="600">
                Ditingkatkan
              </Typography>
              <Typography variant="body2" color={theme.colors.neutral[600]}>
                Sembunyikan data sensitif, enkripsi data
              </Typography>
            </View>
            {privacyMode === 'enhanced' && (
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={theme.colors.primary[500]}
              />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.optionItem,
              privacyMode === 'maximum' && styles.selectedOption,
            ]}
            onPress={() => handlePrivacyModeChange('maximum')}
          >
            <View style={styles.optionContent}>
              <Typography variant="body1" weight="600">
                Maksimum
              </Typography>
              <Typography variant="body2" color={theme.colors.neutral[600]}>
                Autentikasi untuk semua tindakan, enkripsi semua data
              </Typography>
            </View>
            {privacyMode === 'maximum' && (
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={theme.colors.primary[500]}
              />
            )}
          </TouchableOpacity>
        </Card>
        
        <Card style={styles.section}>
          <Typography variant="h5" style={styles.sectionTitle}>
            Data Sensitif
          </Typography>
          
          <View style={styles.switchItem}>
            <View style={styles.switchContent}>
              <Typography variant="body1">
                Sembunyikan Saldo
              </Typography>
              <Typography variant="body2" color={theme.colors.neutral[600]}>
                Sembunyikan saldo di dashboard
              </Typography>
            </View>
            <Switch
              value={sensitiveData.hideBalances}
              onValueChange={value => handleSensitiveDataChange('hideBalances', value)}
              trackColor={{
                false: theme.colors.neutral[300],
                true: theme.colors.primary[300],
              }}
              thumbColor={
                sensitiveData.hideBalances
                  ? theme.colors.primary[500]
                  : theme.colors.neutral[100]
              }
            />
          </View>
          
          <View style={styles.switchItem}>
            <View style={styles.switchContent}>
              <Typography variant="body1">
                Sembunyikan Transaksi
              </Typography>
              <Typography variant="body2" color={theme.colors.neutral[600]}>
                Sembunyikan detail transaksi
              </Typography>
            </View>
            <Switch
              value={sensitiveData.hideTransactions}
              onValueChange={value => handleSensitiveDataChange('hideTransactions', value)}
              trackColor={{
                false: theme.colors.neutral[300],
                true: theme.colors.primary[300],
              }}
              thumbColor={
                sensitiveData.hideTransactions
                  ? theme.colors.primary[500]
                  : theme.colors.neutral[100]
              }
            />
          </View>
          
          <View style={styles.switchItem}>
            <View style={styles.switchContent}>
              <Typography variant="body1">
                Sembunyikan Anggaran
              </Typography>
              <Typography variant="body2" color={theme.colors.neutral[600]}>
                Sembunyikan detail anggaran
              </Typography>
            </View>
            <Switch
              value={sensitiveData.hideBudgets}
              onValueChange={value => handleSensitiveDataChange('hideBudgets', value)}
              trackColor={{
                false: theme.colors.neutral[300],
                true: theme.colors.primary[300],
              }}
              thumbColor={
                sensitiveData.hideBudgets
                  ? theme.colors.primary[500]
                  : theme.colors.neutral[100]
              }
            />
          </View>
          
          <View style={styles.switchItem}>
            <View style={styles.switchContent}>
              <Typography variant="body1">
                Autentikasi untuk Tindakan Sensitif
              </Typography>
              <Typography variant="body2" color={theme.colors.neutral[600]}>
                Minta autentikasi untuk tindakan sensitif
              </Typography>
            </View>
            <Switch
              value={sensitiveData.requireAuthForSensitiveActions}
              onValueChange={value => handleSensitiveDataChange('requireAuthForSensitiveActions', value)}
              trackColor={{
                false: theme.colors.neutral[300],
                true: theme.colors.primary[300],
              }}
              thumbColor={
                sensitiveData.requireAuthForSensitiveActions
                  ? theme.colors.primary[500]
                  : theme.colors.neutral[100]
              }
            />
          </View>
        </Card>
      </ScrollView>
      
      <BiometricAuth
        visible={showBiometricAuth}
        onSuccess={handleBiometricSuccess}
        onCancel={() => setShowBiometricAuth(false)}
        promptMessage="Autentikasi untuk mengaktifkan keamanan tingkat tinggi"
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
    padding: theme.spacing.layout.sm,
    paddingBottom: theme.spacing.md,
  },
  content: {
    padding: theme.spacing.layout.sm,
    paddingBottom: theme.spacing.layout.lg,
  },
  section: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  sectionTitle: {
    marginBottom: theme.spacing.md,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  optionContent: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  selectedOption: {
    backgroundColor: theme.colors.primary[50],
  },
  switchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  switchContent: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
});
