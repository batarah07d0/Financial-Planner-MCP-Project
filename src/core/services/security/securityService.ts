import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  enableEncryption,
  isEncryptionEnabled,
  encryptObject,
  decryptObject,
} from './encryptionService';

// Kunci untuk penyimpanan pengaturan keamanan
const SECURITY_LEVEL_KEY = '@budgetwise:security_level';
const PRIVACY_MODE_KEY = '@budgetwise:privacy_mode';
const SENSITIVE_DATA_KEY = '@budgetwise:sensitive_data';

// Tipe untuk tingkat keamanan
export type SecurityLevel = 'low' | 'medium' | 'high';

// Tipe untuk mode privasi
export type PrivacyMode = 'standard' | 'enhanced' | 'maximum';

// Tipe untuk data sensitif
export interface SensitiveData {
  hideBalances: boolean;
  hideTransactions: boolean;
  hideBudgets: boolean;
  requireAuthForSensitiveActions: boolean;
}

// Fungsi untuk mendapatkan tingkat keamanan
export const getSecurityLevel = async (): Promise<SecurityLevel> => {
  try {
    const level = await AsyncStorage.getItem(SECURITY_LEVEL_KEY);
    return (level as SecurityLevel) || 'medium';
  } catch (error) {
    return 'medium'; // Default ke medium jika terjadi kesalahan
  }
};

// Fungsi untuk mengatur tingkat keamanan
export const setSecurityLevel = async (level: SecurityLevel): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(SECURITY_LEVEL_KEY, level);

    // Jika tingkat keamanan tinggi, aktifkan enkripsi
    if (level === 'high') {
      await enableEncryption();
    }

    return true;
  } catch (error) {
    return false;
  }
};

// Fungsi untuk mendapatkan mode privasi
export const getPrivacyMode = async (): Promise<PrivacyMode> => {
  try {
    const mode = await AsyncStorage.getItem(PRIVACY_MODE_KEY);
    return (mode as PrivacyMode) || 'standard';
  } catch (error) {
    return 'standard'; // Default ke standard jika terjadi kesalahan
  }
};

// Fungsi untuk mengatur mode privasi
export const setPrivacyMode = async (mode: PrivacyMode): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(PRIVACY_MODE_KEY, mode);

    // Jika mode privasi enhanced atau maximum, aktifkan enkripsi
    if (mode === 'enhanced' || mode === 'maximum') {
      await enableEncryption();
    }

    return true;
  } catch (error) {
    return false;
  }
};

// Fungsi untuk mendapatkan pengaturan data sensitif
export const getSensitiveDataSettings = async (): Promise<SensitiveData> => {
  try {
    const dataStr = await AsyncStorage.getItem(SENSITIVE_DATA_KEY);
    
    if (dataStr) {
      // Periksa apakah enkripsi diaktifkan
      const encryptionEnabled = await isEncryptionEnabled();
      
      if (encryptionEnabled) {
        // Dekripsi data jika enkripsi diaktifkan
        const decryptedData = await decryptObject<SensitiveData>(dataStr);
        if (decryptedData) {
          return decryptedData;
        }
      } else {
        // Parse data jika enkripsi tidak diaktifkan
        return JSON.parse(dataStr);
      }
    }
    
    // Default settings
    return {
      hideBalances: false,
      hideTransactions: false,
      hideBudgets: false,
      requireAuthForSensitiveActions: true,
    };
  } catch (error) {
    // Default settings jika terjadi kesalahan
    return {
      hideBalances: false,
      hideTransactions: false,
      hideBudgets: false,
      requireAuthForSensitiveActions: true,
    };
  }
};

// Fungsi untuk mengatur pengaturan data sensitif
export const setSensitiveDataSettings = async (settings: SensitiveData): Promise<boolean> => {
  try {
    // Periksa apakah enkripsi diaktifkan
    const encryptionEnabled = await isEncryptionEnabled();

    let dataToSave: string;

    if (encryptionEnabled) {
      // Enkripsi data jika enkripsi diaktifkan
      const encryptedData = await encryptObject(settings);
      if (!encryptedData) {
        return false;
      }

      dataToSave = encryptedData;
    } else {
      // Simpan data sebagai JSON jika enkripsi tidak diaktifkan
      dataToSave = JSON.stringify(settings);
    }

    await AsyncStorage.setItem(SENSITIVE_DATA_KEY, dataToSave);
    return true;
  } catch (error) {
    return false;
  }
};

// Fungsi untuk memeriksa apakah tindakan memerlukan autentikasi
export const requiresAuthentication = async (action: string): Promise<boolean> => {
  try {
    // Import di dalam fungsi untuk menghindari circular dependency
    const { useAuthStore } = await import('../store');
    const { getSecuritySettings } = await import('../../../features/settings/services/userSettingsService');

    // Get current user
    const { user } = useAuthStore.getState();
    if (!user) return false;

    // Get settings from database (most up-to-date)
    const securitySettings = await getSecuritySettings(user.id);
    if (!securitySettings) {
      // Jika tidak ada settings, gunakan default yang aman
      return true;
    }

    // Dapatkan tingkat keamanan dan mode privasi dari database
    const securityLevel = securitySettings.security_level;
    const privacyMode = securitySettings.privacy_mode;
    
    // Tindakan yang selalu memerlukan autentikasi pada tingkat keamanan tinggi
    const highSecurityActions = [
      'delete_account',
      'change_password',
      'export_data',
      'change_security_settings',
    ];
    
    // Tindakan yang memerlukan autentikasi pada tingkat keamanan menengah atau tinggi
    const mediumSecurityActions = [
      'add_payment_method',
      'delete_transaction',
      'delete_budget',
      'change_privacy_settings',
    ];
    
    // Tindakan yang memerlukan autentikasi jika requireAuthForSensitiveActions diaktifkan
    const sensitiveActions = [
      'view_balance',
      'view_transactions',
      'view_budgets',
      'add_transaction',
      'edit_transaction',
      'add_budget',
      'edit_budget',
    ];
    
    // Periksa berdasarkan tingkat keamanan dan mode privasi
    if (securityLevel === 'high' && highSecurityActions.includes(action)) {
      return true;
    }
    
    if ((securityLevel === 'medium' || securityLevel === 'high') && 
        mediumSecurityActions.includes(action)) {
      return true;
    }
    
    if (securitySettings.require_auth_for_sensitive_actions &&
        sensitiveActions.includes(action)) {
      return true;
    }
    
    if (privacyMode === 'maximum') {
      return true; // Mode privasi maksimum memerlukan autentikasi untuk semua tindakan
    }
    
    return false;
  } catch (error) {
    return true; // Default ke true jika terjadi kesalahan (lebih aman)
  }
};

// Fungsi untuk memeriksa apakah data harus disembunyikan
export const shouldHideData = async (dataType: 'balances' | 'transactions' | 'budgets'): Promise<boolean> => {
  try {
    // Import di dalam fungsi untuk menghindari circular dependency
    const { useAuthStore } = await import('../store');
    const { getSecuritySettings } = await import('../../../features/settings/services/userSettingsService');

    // Get current user
    const { user } = useAuthStore.getState();
    if (!user) return false;

    // Get settings from database (most up-to-date)
    const securitySettings = await getSecuritySettings(user.id);
    if (!securitySettings) return false;

    // Check based on data type
    switch (dataType) {
      case 'balances':
        return securitySettings.hide_balances;
      case 'transactions':
        return securitySettings.hide_transactions;
      case 'budgets':
        return securitySettings.hide_budgets;
      default:
        return false;
    }
  } catch (error) {
    // Error checking if data should be hidden - silently handled
    return false;
  }
};
