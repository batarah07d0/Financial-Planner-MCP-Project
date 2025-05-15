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
  };
};
