import { supabase } from '../../../config/supabase';

export interface UserSettings {
  notification_enabled: boolean;
  biometric_enabled: boolean;
  budget_alert_threshold: number;
}

export interface SecuritySettings {
  security_level: 'low' | 'medium' | 'high';
  privacy_mode: 'standard' | 'enhanced' | 'maximum';
  hide_balances: boolean;
  hide_transactions: boolean;
  hide_budgets: boolean;
  require_auth_for_sensitive_actions: boolean;
  auto_lock_timeout: number;
  failed_attempts_limit: number;
  session_timeout: number;
}

export interface BackupSettings {
  auto_backup_enabled: boolean;
  backup_frequency: 'daily' | 'weekly' | 'monthly';
  backup_location: 'cloud' | 'local' | 'both';
  include_transactions: boolean;
  include_budgets: boolean;
  include_challenges: boolean;
  include_settings: boolean;
  last_backup_at?: string;
  backup_size_mb?: number;
  encryption_enabled: boolean;
}

export interface BackupHistory {
  id: string;
  backup_type: 'manual' | 'automatic' | 'scheduled';
  backup_status: 'pending' | 'in_progress' | 'completed' | 'failed';
  backup_size_mb?: number;
  backup_location?: string;
  backup_file_path?: string;
  error_message?: string;
  started_at: string;
  completed_at?: string;
}

export const getUserSettings = async (userId: string): Promise<UserSettings | null> => {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Tidak ada data, buat pengaturan default
        const defaultSettings: UserSettings = {
          notification_enabled: true,
          biometric_enabled: false,
          budget_alert_threshold: 80,
        };

        await createUserSettings(userId, defaultSettings);
        return defaultSettings;
      }

      console.error('Error fetching user settings:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserSettings:', error);
    return null;
  }
};

export const createUserSettings = async (
  userId: string,
  settings: UserSettings
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_settings')
      .insert({
        user_id: userId,
        ...settings,
      });

    if (error) {
      console.error('Error creating user settings:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in createUserSettings:', error);
    return false;
  }
};

export const updateUserSettings = async (
  userId: string,
  settings: Partial<UserSettings>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_settings')
      .update(settings)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating user settings:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateUserSettings:', error);
    return false;
  }
};

// Security Settings Functions
export const getSecuritySettings = async (userId: string): Promise<SecuritySettings | null> => {
  try {
    const { data, error } = await supabase
      .from('security_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Tidak ada data, buat pengaturan default
        const defaultSettings: SecuritySettings = {
          security_level: 'medium',
          privacy_mode: 'standard',
          hide_balances: false,
          hide_transactions: false,
          hide_budgets: false,
          require_auth_for_sensitive_actions: true,
          auto_lock_timeout: 300,
          failed_attempts_limit: 5,
          session_timeout: 3600,
        };

        await createSecuritySettings(userId, defaultSettings);
        return defaultSettings;
      }

      console.error('Error fetching security settings:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getSecuritySettings:', error);
    return null;
  }
};

export const createSecuritySettings = async (
  userId: string,
  settings: SecuritySettings
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('security_settings')
      .insert({
        user_id: userId,
        ...settings,
      });

    if (error) {
      console.error('Error creating security settings:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in createSecuritySettings:', error);
    return false;
  }
};

export const updateSecuritySettings = async (
  userId: string,
  settings: Partial<SecuritySettings>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('security_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating security settings:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateSecuritySettings:', error);
    return false;
  }
};

// Backup Settings Functions
export const getBackupSettings = async (userId: string): Promise<BackupSettings | null> => {
  try {
    const { data, error } = await supabase
      .from('backup_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Tidak ada data, buat pengaturan default
        const defaultSettings: BackupSettings = {
          auto_backup_enabled: true,
          backup_frequency: 'weekly',
          backup_location: 'cloud',
          include_transactions: true,
          include_budgets: true,
          include_challenges: true,
          include_settings: true,
          encryption_enabled: true,
        };

        await createBackupSettings(userId, defaultSettings);
        return defaultSettings;
      }

      console.error('Error fetching backup settings:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getBackupSettings:', error);
    return null;
  }
};

export const createBackupSettings = async (
  userId: string,
  settings: BackupSettings
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('backup_settings')
      .insert({
        user_id: userId,
        ...settings,
      });

    if (error) {
      console.error('Error creating backup settings:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in createBackupSettings:', error);
    return false;
  }
};

export const updateBackupSettings = async (
  userId: string,
  settings: Partial<BackupSettings>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('backup_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating backup settings:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateBackupSettings:', error);
    return false;
  }
};

export const getBackupHistory = async (userId: string): Promise<BackupHistory[]> => {
  try {
    const { data, error } = await supabase
      .from('backup_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching backup history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getBackupHistory:', error);
    return [];
  }
};

export const createBackupRecord = async (
  userId: string,
  backupType: 'manual' | 'automatic' | 'scheduled'
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('backup_history')
      .insert({
        user_id: userId,
        backup_type: backupType,
        backup_status: 'pending',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating backup record:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Error in createBackupRecord:', error);
    return null;
  }
};

export const updateBackupRecord = async (
  backupId: string,
  updates: Partial<BackupHistory>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('backup_history')
      .update(updates)
      .eq('id', backupId);

    if (error) {
      console.error('Error updating backup record:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateBackupRecord:', error);
    return false;
  }
};
