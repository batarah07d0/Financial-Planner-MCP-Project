import { useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '../services/store';
import { savingGoalTrackerService, SavingGoalProgress } from '../services/savingGoalTrackerService';

export const useSavingGoalTracker = () => {
  const { user } = useAuthStore();
  const appState = useRef(AppState.currentState);
  const trackingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCheckRef = useRef<number>(0);

  // Check interval (every 6 hours)
  const CHECK_INTERVAL = 6 * 60 * 60 * 1000; // 6 jam
  const MIN_CHECK_INTERVAL = 60 * 60 * 1000; // Minimum 1 jam

  // Track all goals progress
  const trackAllGoalsProgress = useCallback(async (): Promise<SavingGoalProgress[]> => {
    if (!user) return [];

    const now = Date.now();
    
    // Prevent too frequent checks
    if (now - lastCheckRef.current < MIN_CHECK_INTERVAL) {
      return [];
    }

    try {
      lastCheckRef.current = now;
      // Tracking saving goals progress

      const progressList = await savingGoalTrackerService.trackAllGoalsProgress(user.id);

      const notifiedGoals = progressList.filter(progress => progress.shouldNotify);
      // Saving goal notifications processed silently
      if (notifiedGoals.length > 0) {
        // Notifications sent for goals
      }

      return progressList;
    } catch (error) {
      // Error tracking goals progress - silently handled
      return [];
    }
  }, [user, MIN_CHECK_INTERVAL]);

  // Update specific goal progress
  const updateGoalProgress = useCallback(async (
    goalId: string,
    newAmount: number
  ): Promise<SavingGoalProgress | null> => {
    if (!user) return null;

    try {
      return await savingGoalTrackerService.updateGoalProgress(
        user.id,
        goalId,
        newAmount
      );
    } catch (error) {
      // Error updating goal progress - silently handled
      return null;
    }
  }, [user]);

  // Send completion celebration
  const sendCompletionCelebration = useCallback(async (
    goalName: string,
    targetAmount: number
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      return await savingGoalTrackerService.sendCompletionCelebration(
        user.id,
        goalName,
        targetAmount
      );
    } catch (error) {
      // Error sending completion celebration - silently handled
      return false;
    }
  }, [user]);

  // Send motivation reminder
  const sendMotivationReminder = useCallback(async (
    goalName: string,
    daysWithoutProgress: number
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      return await savingGoalTrackerService.sendMotivationReminder(
        user.id,
        goalName,
        daysWithoutProgress
      );
    } catch (error) {
      // Error sending motivation reminder - silently handled
      return false;
    }
  }, [user]);

  // Get progress summary
  const getProgressSummary = useCallback(async () => {
    if (!user) return null;

    try {
      return await savingGoalTrackerService.getProgressSummary(user.id);
    } catch (error) {
      // Error getting progress summary - silently handled
      return null;
    }
  }, [user]);

  // Setup periodic tracking
  const setupPeriodicTracking = useCallback(() => {
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
    }

    if (user) {
      // Setting up saving goal tracking

      // Initial check
      trackAllGoalsProgress();

      // Setup interval
      trackingIntervalRef.current = setInterval(() => {
        trackAllGoalsProgress();
      }, CHECK_INTERVAL);
    }
  }, [user, trackAllGoalsProgress, CHECK_INTERVAL]);

  // Cleanup interval
  const cleanupPeriodicTracking = useCallback(() => {
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
  }, []);

  // Handle app state changes
  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App came to foreground, check goals progress
      trackAllGoalsProgress();
    }
    appState.current = nextAppState;
  }, [trackAllGoalsProgress]);

  // Setup tracking when user is available
  useEffect(() => {
    if (user) {
      setupPeriodicTracking();
    } else {
      cleanupPeriodicTracking();
    }

    return cleanupPeriodicTracking;
  }, [user, setupPeriodicTracking, cleanupPeriodicTracking]);

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
      cleanupPeriodicTracking();
    };
  }, [cleanupPeriodicTracking]);

  return {
    trackAllGoalsProgress,
    updateGoalProgress,
    sendCompletionCelebration,
    sendMotivationReminder,
    getProgressSummary,
  };
};
