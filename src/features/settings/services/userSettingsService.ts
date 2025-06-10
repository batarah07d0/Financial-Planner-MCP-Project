import { supabase } from '../../../config/supabase';

export interface UserSettings {
  notification_enabled: boolean;
  biometric_enabled: boolean;
  budget_alert_threshold: number;
  daily_reminder_enabled: boolean;
  weekly_summary_enabled: boolean;
  saving_goal_alerts: boolean;
  transaction_reminders: boolean;
}

export interface SecuritySettings {
  security_level: 'low' | 'medium' | 'high';
  privacy_mode: 'standard' | 'enhanced' | 'maximum';
  hide_balances: boolean;
  hide_transactions: boolean;
  hide_budgets: boolean;
  require_auth_for_sensitive_actions: boolean;
  require_auth_for_edit: boolean;
  require_auth_for_delete: boolean;
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
          daily_reminder_enabled: true,
          weekly_summary_enabled: true,
          saving_goal_alerts: true,
          transaction_reminders: true,
        };

        await createUserSettings(userId, defaultSettings);
        return defaultSettings;
      }

      return null;
    }

    return data;
  } catch (error) {
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
      return false;
    }

    return true;
  } catch (error) {
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
      return false;
    }

    return true;
  } catch (error) {
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
        // Tidak ada data, return null agar UI menggunakan default
        return null;
      }

      return null;
    }

    return data;
  } catch (error) {
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
      return false;
    }

    return true;
  } catch (error) {
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
      .eq('user_id', userId)
      .select();

    if (error) {
      return false;
    }

    return true;
  } catch (error) {
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

      return null;
    }

    return data;
  } catch (error) {
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
      return false;
    }

    return true;
  } catch (error) {
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
      return false;
    }

    return true;
  } catch (error) {
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
      return [];
    }

    return data || [];
  } catch (error) {
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
      return null;
    }

    return data.id;
  } catch (error) {
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
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};
