import { useState, useEffect, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Konfigurasi notifikasi
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Tipe data untuk notifikasi
export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
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

export const useNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Gunakan any untuk menghindari masalah dengan tipe yang deprecated
  const notificationListener = useRef<any>(undefined);
  const responseListener = useRef<any>(undefined);

  // Fungsi untuk meminta izin notifikasi
  const requestPermission = async (): Promise<boolean> => {
    setIsLoading(true);

    try {
      if (!Device.isDevice) {
        Alert.alert(
          'Notifikasi tidak tersedia',
          'Notifikasi hanya tersedia pada perangkat fisik'
        );
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert(
          'Izin Notifikasi Diperlukan',
          'Aplikasi memerlukan izin notifikasi untuk fitur ini. Silakan aktifkan izin notifikasi di pengaturan perangkat Anda.'
        );
        setHasPermission(false);
        return false;
      }

      const token = await registerForPushNotificationsAsync();
      setExpoPushToken(token);
      setHasPermission(true);
      return true;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

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
        console.log('Push notifications tidak didukung di Expo Go SDK 53+');
        return 'expo-go-unsupported';
      }

      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        const { data } = await Notifications.getExpoPushTokenAsync({
          projectId,
        });
        return data;
      } catch (tokenError) {
        console.log('Tidak dapat mendapatkan token push notification:', tokenError);
        return undefined;
      }
    } catch (error) {
      console.error('Error registering for push notifications:', error);
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
      console.error('Error sending local notification:', error);
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

      const trigger: any = {};

      if (schedule.seconds !== undefined) trigger.seconds = schedule.seconds;
      if (schedule.minutes !== undefined) trigger.minute = schedule.minutes;
      if (schedule.hours !== undefined) trigger.hour = schedule.hours;
      if (schedule.day !== undefined) trigger.day = schedule.day;
      if (schedule.month !== undefined) trigger.month = schedule.month;
      if (schedule.year !== undefined) trigger.year = schedule.year;
      if (schedule.repeats !== undefined) trigger.repeats = schedule.repeats;

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
      console.error('Error scheduling notification:', error);
      return null;
    }
  };

  // Fungsi untuk membatalkan notifikasi
  const cancelNotification = async (notificationId: string): Promise<boolean> => {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      return true;
    } catch (error) {
      console.error('Error canceling notification:', error);
      return false;
    }
  };

  // Fungsi untuk membatalkan semua notifikasi
  const cancelAllNotifications = async (): Promise<boolean> => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      return true;
    } catch (error) {
      console.error('Error canceling all notifications:', error);
      return false;
    }
  };

  // Fungsi untuk mendapatkan semua notifikasi terjadwal
  const getAllScheduledNotifications = async (): Promise<Notifications.NotificationRequest[]> => {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
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
      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification response:', response);
      });
    } catch (error) {
      console.log('Error setting up notification listeners:', error);
    }

    return () => {
      try {
        // Gunakan try-catch untuk menangani error pada API yang deprecated
        if (notificationListener.current) {
          // @ts-ignore - Abaikan error tipe karena API deprecated
          Notifications.removeNotificationSubscription(notificationListener.current);
        }

        if (responseListener.current) {
          // @ts-ignore - Abaikan error tipe karena API deprecated
          Notifications.removeNotificationSubscription(responseListener.current);
        }
      } catch (error) {
        console.log('Error removing notification listeners:', error);
      }
    };
  }, []);

  // Fungsi khusus untuk notifikasi budget alert
  const sendBudgetAlert = async (
    budgetName: string,
    percentageUsed: number,
    remainingAmount: number
  ): Promise<string | null> => {
    try {
      let title = '';
      let body = '';

      if (percentageUsed >= 90) {
        title = '🚨 Anggaran Hampir Habis!';
        body = `${budgetName}: ${percentageUsed.toFixed(0)}% terpakai. Sisa Rp ${remainingAmount.toLocaleString('id-ID')}`;
      } else if (percentageUsed >= 75) {
        title = '⚠️ Peringatan Anggaran';
        body = `${budgetName}: ${percentageUsed.toFixed(0)}% terpakai. Berhati-hatilah dengan pengeluaran.`;
      } else {
        title = '💰 Update Anggaran';
        body = `${budgetName}: ${percentageUsed.toFixed(0)}% terpakai. Anggaran masih aman.`;
      }

      return await sendLocalNotification({
        title,
        body,
        data: { type: 'budget_alert', budgetName, percentageUsed },
      });
    } catch (error) {
      console.error('Error sending budget alert:', error);
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
      console.error('Error sending challenge reminder:', error);
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

      if (progressPercentage >= 100) {
        title = '🎉 Target Tabungan Tercapai!';
        body = `Selamat! Anda telah mencapai target "${goalName}" sebesar Rp ${targetAmount.toLocaleString('id-ID')}`;
      } else if (progressPercentage >= 75) {
        title = '🌟 Hampir Mencapai Target!';
        body = `"${goalName}": ${progressPercentage.toFixed(0)}% tercapai. Sisa Rp ${(targetAmount - currentAmount).toLocaleString('id-ID')} lagi!`;
      } else if (progressPercentage >= 50) {
        title = '💪 Setengah Perjalanan!';
        body = `"${goalName}": ${progressPercentage.toFixed(0)}% tercapai. Tetap konsisten menabung!`;
      } else {
        title = '📈 Progress Tabungan';
        body = `"${goalName}": ${progressPercentage.toFixed(0)}% tercapai. Terus tingkatkan!`;
      }

      return await sendLocalNotification({
        title,
        body,
        data: { type: 'saving_goal', goalName, progressPercentage },
      });
    } catch (error) {
      console.error('Error sending saving goal progress:', error);
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
      console.error('Error sending account update notification:', error);
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
      console.error('Error sending transaction reminder:', error);
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
      console.error('Error scheduling daily reminder:', error);
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
