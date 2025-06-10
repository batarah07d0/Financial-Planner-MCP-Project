import { useEffect } from 'react';
import { useNotifications } from './useNotifications';
import { useBudgetMonitor } from './useBudgetMonitor';
import { useTransactionReminder } from './useTransactionReminder';
import { useSavingGoalTracker } from './useSavingGoalTracker';
import { notificationService } from '../services/notificationService';
import { useAuthStore } from '../services/store';

export const useNotificationManager = () => {
  const notificationHook = useNotifications();
  const { user } = useAuthStore();

  // Initialize all monitoring hooks
  const budgetMonitor = useBudgetMonitor();
  const transactionReminder = useTransactionReminder();
  const savingGoalTracker = useSavingGoalTracker();

  // Setup notification service dengan hook
  useEffect(() => {
    notificationService.setNotificationHook(notificationHook);
  }, [notificationHook]);

  // Setup daily reminder saat user login dan bersihkan notifikasi test
  useEffect(() => {
    if (user && notificationHook.hasPermission) {
      // Bersihkan semua notifikasi terjadwal terlebih dahulu untuk menghapus notifikasi test
      notificationService.cancelAllNotifications().then(() => {
        // Setup daily reminder jam 8 malam setelah pembersihan
        notificationService.setupDailyReminder(user.id, 20, 0);
      });
    }
  }, [user, notificationHook.hasPermission]);

  // Fungsi helper untuk mengirim berbagai jenis notifikasi
  const sendBudgetAlert = async (
    budgetName: string,
    percentageUsed: number,
    remainingAmount: number
  ) => {
    if (!user) return false;
    return await notificationService.sendBudgetAlert(
      user.id,
      budgetName,
      percentageUsed,
      remainingAmount
    );
  };

  const sendChallengeReminder = async (
    challengeTitle: string,
    daysLeft: number
  ) => {
    if (!user) return false;
    return await notificationService.sendChallengeReminder(
      user.id,
      challengeTitle,
      daysLeft
    );
  };

  const sendSavingGoalProgress = async (
    goalName: string,
    progressPercentage: number,
    currentAmount: number,
    targetAmount: number
  ) => {
    if (!user) return false;
    return await notificationService.sendSavingGoalProgress(
      user.id,
      goalName,
      progressPercentage,
      currentAmount,
      targetAmount
    );
  };

  const sendAccountUpdateNotification = async (
    updateType: 'password' | 'email' | 'profile',
    success: boolean = true
  ) => {
    if (!user) return false;
    return await notificationService.sendAccountUpdateNotification(
      user.id,
      updateType,
      success
    );
  };

  const sendTransactionReminder = async () => {
    if (!user) return false;
    return await notificationService.sendTransactionReminder(user.id);
  };

  const cancelAllNotifications = async () => {
    return await notificationService.cancelAllNotifications();
  };

  const setupChallengeReminders = async (
    challengeTitle: string,
    endDate: string
  ) => {
    if (!user) return false;
    return await notificationService.setupChallengeReminders(
      user.id,
      challengeTitle,
      endDate
    );
  };

  const sendChallengeCompletion = async (
    challengeTitle: string,
    isSuccess: boolean,
    targetAmount?: number,
    currentAmount?: number
  ) => {
    if (!user) return false;
    return await notificationService.sendChallengeCompletion(
      user.id,
      challengeTitle,
      isSuccess,
      targetAmount,
      currentAmount
    );
  };

  return {
    // Status notifikasi
    hasPermission: notificationHook.hasPermission,
    isLoading: notificationHook.isLoading,

    // Fungsi notifikasi dasar
    sendBudgetAlert,
    sendChallengeReminder,
    sendSavingGoalProgress,
    sendAccountUpdateNotification,
    sendTransactionReminder,
    cancelAllNotifications,

    // Fungsi challenge
    setupChallengeReminders,
    sendChallengeCompletion,

    // Fungsi budget monitoring
    checkBudgetThresholds: budgetMonitor.checkBudgetThresholds,
    checkSpecificBudget: budgetMonitor.checkSpecificBudget,
    getBudgetStatuses: budgetMonitor.getBudgetStatuses,

    // Fungsi transaction reminder
    setupDailyTransactionReminder: transactionReminder.setupDailyReminder,
    sendSmartTransactionReminder: transactionReminder.sendSmartReminder,
    checkTodayTransactions: transactionReminder.checkTodayTransactions,
    sendWeeklySummary: transactionReminder.sendWeeklySummary,

    // Fungsi saving goal tracking
    trackAllGoalsProgress: savingGoalTracker.trackAllGoalsProgress,
    updateGoalProgress: savingGoalTracker.updateGoalProgress,
    sendCompletionCelebration: savingGoalTracker.sendCompletionCelebration,
    sendMotivationReminder: savingGoalTracker.sendMotivationReminder,
    getProgressSummary: savingGoalTracker.getProgressSummary,

    // Fungsi dasar
    requestPermission: notificationHook.requestPermission,
  };
};
