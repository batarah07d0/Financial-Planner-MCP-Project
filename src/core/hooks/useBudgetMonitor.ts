import { useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '../services/store';
import { budgetMonitorService, BudgetStatus } from '../services/budgetMonitorService';

export const useBudgetMonitor = () => {
  const { user } = useAuthStore();
  const appState = useRef(AppState.currentState);
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCheckRef = useRef<number>(0);

  // Interval untuk checking (setiap 30 menit)
  const CHECK_INTERVAL = 30 * 60 * 1000; // 30 menit
  const MIN_CHECK_INTERVAL = 5 * 60 * 1000; // Minimum 5 menit antara check

  // Fungsi untuk mengecek budget thresholds
  const checkBudgetThresholds = useCallback(async (): Promise<BudgetStatus[]> => {
    if (!user) return [];

    const now = Date.now();

    // Prevent too frequent checks
    if (now - lastCheckRef.current < MIN_CHECK_INTERVAL) {
      // Budget check skipped - too frequent
      return [];
    }

    try {
      // Checking budget thresholds
      lastCheckRef.current = now;

      const budgetStatuses = await budgetMonitorService.checkBudgetThresholds(user.id);

      // Budget alerts processed silently
      budgetStatuses.filter(status => status.shouldAlert);

      return budgetStatuses;
    } catch (error) {
      // Error in budget threshold check - silently handled
      return [];
    }
  }, [user, MIN_CHECK_INTERVAL]);

  // Fungsi untuk mengecek budget tertentu (real-time)
  const checkSpecificBudget = useCallback(async (
    categoryId: string,
    budgetAmount: number
  ): Promise<BudgetStatus | null> => {
    if (!user) return null;

    try {
      return await budgetMonitorService.checkSpecificBudget(
        user.id,
        categoryId,
        budgetAmount
      );
    } catch (error) {
      // Error checking specific budget - silently handled
      return null;
    }
  }, [user]);

  // Fungsi untuk mendapatkan status budget tanpa alert
  const getBudgetStatuses = useCallback(async (): Promise<BudgetStatus[]> => {
    if (!user) return [];

    try {
      return await budgetMonitorService.getBudgetStatuses(user.id);
    } catch (error) {
      // Error getting budget statuses - silently handled
      return [];
    }
  }, [user]);

  // Setup periodic checking
  const setupPeriodicCheck = useCallback(() => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
    }

    if (user) {
      // Setting up budget monitoring

      // Initial check
      checkBudgetThresholds();

      // Setup interval
      checkIntervalRef.current = setInterval(() => {
        checkBudgetThresholds();
      }, CHECK_INTERVAL);
    }
  }, [user, checkBudgetThresholds, CHECK_INTERVAL]);

  // Cleanup interval
  const cleanupPeriodicCheck = useCallback(() => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }
  }, []);

  // Handle app state changes
  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App came to foreground, check budgets
      checkBudgetThresholds();
    }
    appState.current = nextAppState;
  }, [checkBudgetThresholds]);

  // Setup monitoring when user is available
  useEffect(() => {
    if (user) {
      setupPeriodicCheck();
    } else {
      cleanupPeriodicCheck();
    }

    return cleanupPeriodicCheck;
  }, [user, setupPeriodicCheck, cleanupPeriodicCheck]);

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
    checkBudgetThresholds,
    checkSpecificBudget,
    getBudgetStatuses,
    setupPeriodicCheck,
    cleanupPeriodicCheck,
  };
};
