import { useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '../services/store';
import { transactionReminderService } from '../services/transactionReminderService';

export const useTransactionReminder = () => {
  const { user } = useAuthStore();
  const appState = useRef(AppState.currentState);
  const reminderIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCheckRef = useRef<number>(0);

  // Check interval (every 2 hours)
  const CHECK_INTERVAL = 2 * 60 * 60 * 1000; // 2 jam
  const MIN_CHECK_INTERVAL = 30 * 60 * 1000; // Minimum 30 menit

  // Setup daily reminder
  const setupDailyReminder = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      return await transactionReminderService.setupDailyReminder(user.id);
    } catch (error) {
      // Error setting up daily reminder - silently handled
      return false;
    }
  }, [user]);

  // Cancel reminder
  const cancelReminder = useCallback(async (): Promise<boolean> => {
    try {
      return await transactionReminderService.cancelReminder();
    } catch (error) {
      // Error cancelling reminder - silently handled
      return false;
    }
  }, []);

  // Send smart reminder
  const sendSmartReminder = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    const now = Date.now();
    
    // Prevent too frequent checks
    if (now - lastCheckRef.current < MIN_CHECK_INTERVAL) {
      return false;
    }

    try {
      lastCheckRef.current = now;
      return await transactionReminderService.sendSmartReminder(user.id);
    } catch (error) {
      // Error sending smart reminder - silently handled
      return false;
    }
  }, [user, MIN_CHECK_INTERVAL]);

  // Check today's transactions
  const checkTodayTransactions = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      return await transactionReminderService.checkTodayTransactions(user.id);
    } catch (error) {
      // Error checking today transactions - silently handled
      return false;
    }
  }, [user]);

  // Send weekly summary
  const sendWeeklySummary = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      return await transactionReminderService.sendWeeklySummary(user.id);
    } catch (error) {
      // Error sending weekly summary - silently handled
      return false;
    }
  }, [user]);

  // Setup weekly summary
  const setupWeeklySummary = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      return await transactionReminderService.setupWeeklySummary(user.id);
    } catch (error) {
      // Error setting up weekly summary - silently handled
      return false;
    }
  }, [user]);

  // Periodic check for evening reminders
  const checkEveningReminder = useCallback(async () => {
    if (!user) return;

    try {
      if (transactionReminderService.shouldSendEveningReminder()) {
        const hasTransactions = await transactionReminderService.checkTodayTransactions(user.id);
        
        if (!hasTransactions) {
          await transactionReminderService.sendSmartReminder(user.id);
        }
      }
    } catch (error) {
      // Error in evening reminder check - silently handled
    }
  }, [user]);

  // Setup periodic checking
  const setupPeriodicCheck = useCallback(() => {
    if (reminderIntervalRef.current) {
      clearInterval(reminderIntervalRef.current);
    }

    if (user) {
      // Setting up transaction reminder monitoring

      // Initial check
      checkEveningReminder();

      // Setup interval for periodic checks
      reminderIntervalRef.current = setInterval(() => {
        checkEveningReminder();
      }, CHECK_INTERVAL);
    }
  }, [user, checkEveningReminder, CHECK_INTERVAL]);

  // Cleanup interval
  const cleanupPeriodicCheck = useCallback(() => {
    if (reminderIntervalRef.current) {
      clearInterval(reminderIntervalRef.current);
      reminderIntervalRef.current = null;
    }
  }, []);

  // Handle app state changes
  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App came to foreground, check if evening reminder needed
      checkEveningReminder();
    }
    appState.current = nextAppState;
  }, [checkEveningReminder]);

  // Setup monitoring when user is available
  useEffect(() => {
    if (user) {
      setupDailyReminder();
      setupWeeklySummary();
      setupPeriodicCheck();
    } else {
      cleanupPeriodicCheck();
    }

    return cleanupPeriodicCheck;
  }, [user, setupDailyReminder, setupWeeklySummary, setupPeriodicCheck, cleanupPeriodicCheck]);

  // Setup app state listener
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [handleAppStateChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupPeriodicCheck();
    };
  }, [cleanupPeriodicCheck]);

  return {
    setupDailyReminder,
    cancelReminder,
    sendSmartReminder,
    checkTodayTransactions,
    sendWeeklySummary,
    setupWeeklySummary,
    checkEveningReminder,
  };
};
