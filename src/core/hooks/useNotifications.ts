import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Konfigurasi notifikasi
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Tipe data untuk notifikasi
export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

// Tipe data untuk jadwal notifikasi
export interface NotificationSchedule {
  seconds?: number;
  minutes?: number;
  hours?: number;
  day?: number;
  month?: number;
  year?: number;
  repeats?: boolean;
}

export const useNotifications = (showErrorDialog?: (title: string, message: string) => void) => {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Ref untuk listener notifikasi
  const notificationListener = useRef<{ remove: () => void } | undefined>(undefined);
  const responseListener = useRef<{ remove: () => void } | undefined>(undefined);

  // Fungsi untuk meminta izin notifikasi
  const requestPermission = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);

    try {
      if (!Device.isDevice) {
        if (showErrorDialog) {
          showErrorDialog(
            'Notifikasi tidak tersedia',
            'Notifikasi hanya tersedia pada perangkat fisik'
          );
        }
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        if (showErrorDialog) {
          showErrorDialog(
            'Izin Notifikasi Diperlukan',
            'Aplikasi memerlukan izin notifikasi untuk fitur ini. Silakan aktifkan izin notifikasi di pengaturan perangkat Anda.'
          );
        }
        setHasPermission(false);
        return false;
      }

      const token = await registerForPushNotificationsAsync();
      setExpoPushToken(token);
      setHasPermission(true);
      return true;
    } catch (error) {
      // Error requesting notification permission - silently handled
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [showErrorDialog]);

  // Fungsi untuk mendaftarkan token push notification
  const registerForPushNotificationsAsync = async (): Promise<string | undefined> => {
    try {
      if (!Device.isDevice) {
        return undefined;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return undefined;
      }

      // Dapatkan token push notification
      // Catatan: Push notifications tidak didukung di Expo Go SDK 53+
      // Kode ini hanya akan berfungsi di build standalone
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      // Cek apakah kita berada di Expo Go
      const appConfig = Constants.expoConfig;
      // Gunakan metode alternatif untuk mendeteksi Expo Go
      const isExpoGo = appConfig?.extra?.isExpoGo ||
        Constants.executionEnvironment === 'storeClient' ||
        !Device.isDevice;

      if (isExpoGo) {
        // Push notifications tidak didukung di Expo Go SDK 53+
        return 'expo-go-unsupported';
      }

      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        const { data } = await Notifications.getExpoPushTokenAsync({
          projectId,
        });
        return data;
      } catch (tokenError) {
        // Tidak dapat mendapatkan token push notification - silently handled
        return undefined;
      }
    } catch (error) {
      // Error registering for push notifications - silently handled
      return undefined;
    }
  };

  // Fungsi untuk mengirim notifikasi lokal
  const sendLocalNotification = async (
    notificationData: NotificationData
  ): Promise<string | null> => {
    try {
      if (!hasPermission) {
        const permissionGranted = await requestPermission();
        if (!permissionGranted) return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationData.title,
          body: notificationData.body,
          data: notificationData.data || {},
        },
        trigger: null, // Kirim segera
      });

      return notificationId;
    } catch (error) {
      // Error sending local notification - silently handled
      return null;
    }
  };

  // Fungsi untuk menjadwalkan notifikasi
  const scheduleNotification = async (
    notificationData: NotificationData,
    schedule: NotificationSchedule
  ): Promise<string | null> => {
    try {
      if (!hasPermission) {
        const permissionGranted = await requestPermission();
        if (!permissionGranted) return null;
      }

      // Trigger object untuk notifikasi terjadwal
      let trigger: Notifications.NotificationTriggerInput;

      if (schedule.seconds !== undefined) {
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: schedule.seconds
        };
      } else {
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          ...(schedule.minutes !== undefined && { minute: schedule.minutes }),
          ...(schedule.hours !== undefined && { hour: schedule.hours }),
          ...(schedule.day !== undefined && { day: schedule.day }),
          ...(schedule.month !== undefined && { month: schedule.month }),
          ...(schedule.year !== undefined && { year: schedule.year }),
          ...(schedule.repeats !== undefined && { repeats: schedule.repeats }),
        };
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationData.title,
          body: notificationData.body,
          data: notificationData.data || {},
        },
        trigger,
      });

      return notificationId;
    } catch (error) {
      // Error scheduling notification - silently handled
      return null;
    }
  };

  // Fungsi untuk membatalkan notifikasi
  const cancelNotification = async (notificationId: string): Promise<boolean> => {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      return true;
    } catch (error) {
      // Error canceling notification - silently handled
      return false;
    }
  };

  // Fungsi untuk membatalkan semua notifikasi
  const cancelAllNotifications = async (): Promise<boolean> => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      return true;
    } catch (error) {
      // Error canceling all notifications - silently handled
      return false;
    }
  };

  // Fungsi untuk mendapatkan semua notifikasi terjadwal
  const getAllScheduledNotifications = async (): Promise<Notifications.NotificationRequest[]> => {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      // Error getting scheduled notifications - silently handled
      return [];
    }
  };

  // Efek untuk menginisialisasi listener notifikasi
  useEffect(() => {
    requestPermission();

    try {
      // Listener untuk notifikasi yang diterima saat aplikasi berjalan
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        setNotification(notification);
      });

      // Listener untuk respons terhadap notifikasi
      responseListener.current = Notifications.addNotificationResponseReceivedListener(_response => {
        // Notification response handled silently
      });
    } catch (error) {
      // Error setting up notification listeners - silently handled
    }

    return () => {
      try {
        // Cleanup notification listeners
        if (notificationListener.current) {
          notificationListener.current.remove();
        }

        if (responseListener.current) {
          responseListener.current.remove();
        }
      } catch (error) {
        // Error removing notification listeners - silently handled
      }
    };
  }, [requestPermission]);

  // Helper function untuk format currency yang robust
  const formatCurrencyForNotification = (amount: number): string => {
    // Pastikan amount adalah number dan tidak NaN
    const safeAmount = isNaN(amount) ? 0 : Math.max(0, amount);

    // Format dengan pemisah ribuan Indonesia
    return new Intl.NumberFormat('id-ID', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(safeAmount);
  };

  // Fungsi khusus untuk notifikasi budget alert
  const sendBudgetAlert = async (
    budgetName: string,
    percentageUsed: number,
    remainingAmount: number
  ): Promise<string | null> => {
    try {
      let title = '';
      let body = '';

      // Pastikan remainingAmount tidak negatif untuk notifikasi
      const safeRemainingAmount = Math.max(0, remainingAmount);
      const formattedAmount = formatCurrencyForNotification(safeRemainingAmount);

      if (percentageUsed >= 100) {
        title = '🚨 Anggaran Sudah Habis!';
        body = `${budgetName}: ${percentageUsed.toFixed(0)}% terpakai. Anggaran telah terlampaui!`;
      } else if (percentageUsed >= 90) {
        title = '🚨 Anggaran Hampir Habis!';
        body = `${budgetName}: ${percentageUsed.toFixed(0)}% terpakai. Sisa Rp ${formattedAmount}`;
      } else if (percentageUsed >= 75) {
        title = '⚠️ Peringatan Anggaran';
        body = `${budgetName}: ${percentageUsed.toFixed(0)}% terpakai. Sisa Rp ${formattedAmount}`;
      } else {
        title = '💰 Update Anggaran';
        body = `${budgetName}: ${percentageUsed.toFixed(0)}% terpakai. Sisa Rp ${formattedAmount}`;
      }

      return await sendLocalNotification({
        title,
        body,
        data: { type: 'budget_alert', budgetName, percentageUsed, remainingAmount: safeRemainingAmount },
      });
    } catch (error) {
      // Error sending budget alert - silently handled
      return null;
    }
  };

  // Fungsi untuk notifikasi challenge reminder
  const sendChallengeReminder = async (
    challengeTitle: string,
    daysLeft: number
  ): Promise<string | null> => {
    try {
      let title = '';
      let body = '';

      if (daysLeft === 0) {
        title = '🏁 Tantangan Berakhir Hari Ini!';
        body = `"${challengeTitle}" berakhir hari ini. Selesaikan sekarang!`;
      } else if (daysLeft === 1) {
        title = '⏰ Tantangan Berakhir Besok';
        body = `"${challengeTitle}" berakhir besok. Jangan sampai terlewat!`;
      } else {
        title = '🎯 Pengingat Tantangan';
        body = `"${challengeTitle}" berakhir dalam ${daysLeft} hari. Tetap semangat!`;
      }

      return await sendLocalNotification({
        title,
        body,
        data: { type: 'challenge_reminder', challengeTitle, daysLeft },
      });
    } catch (error) {
      // Error sending challenge reminder - silently handled
      return null;
    }
  };

  // Fungsi untuk notifikasi saving goal progress
  const sendSavingGoalProgress = async (
    goalName: string,
    progressPercentage: number,
    currentAmount: number,
    targetAmount: number
  ): Promise<string | null> => {
    try {
      let title = '';
      let body = '';

      const formattedTarget = formatCurrencyForNotification(targetAmount);
      const formattedCurrent = formatCurrencyForNotification(currentAmount);
      const remainingAmount = Math.max(0, targetAmount - currentAmount);
      const formattedRemaining = formatCurrencyForNotification(remainingAmount);

      if (progressPercentage >= 100) {
        title = '🎉 Target Tabungan Tercapai!';
        body = `Selamat! Anda telah mencapai target "${goalName}" sebesar Rp ${formattedTarget}`;
      } else if (progressPercentage >= 75) {
        title = '🌟 Hampir Mencapai Target!';
        body = `"${goalName}": ${progressPercentage.toFixed(0)}% tercapai. Sisa Rp ${formattedRemaining} lagi!`;
      } else if (progressPercentage >= 50) {
        title = '💪 Setengah Perjalanan!';
        body = `"${goalName}": ${progressPercentage.toFixed(0)}% tercapai (Rp ${formattedCurrent}). Tetap konsisten menabung!`;
      } else if (progressPercentage >= 25) {
        title = '🎯 Seperempat Jalan Tercapai!';
        body = `"${goalName}": ${progressPercentage.toFixed(0)}% tercapai (Rp ${formattedCurrent}). Terus tingkatkan!`;
      } else {
        title = '📈 Progress Tabungan';
        body = `"${goalName}": ${progressPercentage.toFixed(0)}% tercapai (Rp ${formattedCurrent}). Terus tingkatkan!`;
      }

      return await sendLocalNotification({
        title,
        body,
        data: { type: 'saving_goal', goalName, progressPercentage, currentAmount, targetAmount },
      });
    } catch (error) {
      // Error sending saving goal progress - silently handled
      return null;
    }
  };

  // Fungsi untuk notifikasi account update
  const sendAccountUpdateNotification = async (
    updateType: 'password' | 'email' | 'profile',
    success: boolean = true
  ): Promise<string | null> => {
    try {
      let title = '';
      let body = '';

      if (success) {
        switch (updateType) {
          case 'password':
            title = '🔐 Password Berhasil Diubah';
            body = 'Password akun Anda telah berhasil diperbarui. Akun Anda tetap aman.';
            break;
          case 'email':
            title = '📧 Email Berhasil Diubah';
            body = 'Alamat email akun Anda telah berhasil diperbarui.';
            break;
          case 'profile':
            title = '👤 Profil Berhasil Diperbarui';
            body = 'Informasi profil Anda telah berhasil disimpan.';
            break;
        }
      } else {
        title = '❌ Gagal Memperbarui Akun';
        body = 'Terjadi kesalahan saat memperbarui informasi akun. Silakan coba lagi.';
      }

      return await sendLocalNotification({
        title,
        body,
        data: { type: 'account_update', updateType, success },
      });
    } catch (error) {
      // Error sending account update notification - silently handled
      return null;
    }
  };

  // Fungsi untuk notifikasi transaction reminder
  const sendTransactionReminder = async (): Promise<string | null> => {
    try {
      const title = '📝 Jangan Lupa Catat Transaksi';
      const body = 'Sudahkah Anda mencatat semua pengeluaran hari ini? Catat sekarang untuk tracking yang akurat.';

      return await sendLocalNotification({
        title,
        body,
        data: { type: 'transaction_reminder' },
      });
    } catch (error) {
      // Error sending transaction reminder - silently handled
      return null;
    }
  };

  // Fungsi untuk menjadwalkan reminder harian
  const scheduleDailyReminder = async (
    hour: number = 20, // Default jam 8 malam
    minute: number = 0
  ): Promise<string | null> => {
    try {
      return await scheduleNotification(
        {
          title: '📊 Review Keuangan Harian',
          body: 'Waktunya review pengeluaran dan progress keuangan Anda hari ini!',
          data: { type: 'daily_review' },
        },
        {
          hours: hour,
          minutes: minute,
          repeats: true,
        }
      );
    } catch (error) {
      // Error scheduling daily reminder - silently handled
      return null;
    }
  };

  return {
    expoPushToken,
    notification,
    hasPermission,
    isLoading,
    requestPermission,
    sendLocalNotification,
    scheduleNotification,
    cancelNotification,
    cancelAllNotifications,
    getAllScheduledNotifications,
    // Fungsi notifikasi khusus
    sendBudgetAlert,
    sendChallengeReminder,
    sendSavingGoalProgress,
    sendAccountUpdateNotification,
    sendTransactionReminder,
    scheduleDailyReminder,
  };
};
