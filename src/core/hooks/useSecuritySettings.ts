import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../services/store';
import {
  SecuritySettings,
  getSecuritySettings,
} from '../../features/settings/services/userSettingsService';
import {
  getSecurityLevel,
  getPrivacyMode,
  getSensitiveDataSettings,
  shouldHideData,
  requiresAuthentication,
} from '../services/security/securityService';

export const useSecuritySettings = () => {
  const { user } = useAuthStore();
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const securitySettings = await getSecuritySettings(user.id);
      setSettings(securitySettings);
    } catch (error) {
      // Error loading security settings - silently handled
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Helper functions untuk komponen lain
  const shouldHideBalance = useCallback(async (): Promise<boolean> => {
    return await shouldHideData('balances');
  }, []);

  const shouldHideTransactions = useCallback(async (): Promise<boolean> => {
    return await shouldHideData('transactions');
  }, []);

  const shouldHideBudgets = useCallback(async (): Promise<boolean> => {
    return await shouldHideData('budgets');
  }, []);

  const checkAuthRequired = useCallback(async (action: string): Promise<boolean> => {
    return await requiresAuthentication(action);
  }, []);

  const getSecurityInfo = useCallback(async () => {
    const [level, mode, sensitiveData] = await Promise.all([
      getSecurityLevel(),
      getPrivacyMode(),
      getSensitiveDataSettings(),
    ]);

    return {
      securityLevel: level,
      privacyMode: mode,
      sensitiveDataSettings: sensitiveData,
    };
  }, []);

  return {
    settings,
    isLoading,
    shouldHideBalance,
    shouldHideTransactions,
    shouldHideBudgets,
    checkAuthRequired,
    getSecurityInfo,
    refreshSettings: loadSettings,
  };
};
