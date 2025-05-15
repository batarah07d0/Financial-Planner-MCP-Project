import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getDistance } from 'geolib';
import { SavingZone } from '../../features/budget/models/SavingZone';
import { useLocation } from './useLocation';

// Nama task untuk pemantauan lokasi di latar belakang
const LOCATION_TRACKING_TASK = 'background-location-tracking';

// Interval pembaruan lokasi (dalam milidetik)
const LOCATION_UPDATE_INTERVAL = 10000; // 10 detik

// Jarak minimum perubahan lokasi (dalam meter)
const LOCATION_DISTANCE_INTERVAL = 10; // 10 meter

// Interface untuk opsi geofencing
export interface GeofencingOptions {
  enableBackgroundTracking?: boolean;
  notifyOnEntry?: boolean;
  notifyOnExit?: boolean;
  minimumTriggerDistance?: number; // dalam meter
}

// Interface untuk status zona
export interface ZoneStatus {
  zoneId: string;
  isInside: boolean;
  distance: number; // dalam meter
  lastUpdated: Date;
}

export const useGeofencing = (
  zones: SavingZone[] = [],
  options: GeofencingOptions = {}
) => {
  const {
    enableBackgroundTracking = false,
    notifyOnEntry = true,
    notifyOnExit = false,
    minimumTriggerDistance = 50, // 50 meter
  } = options;

  const [isTracking, setIsTracking] = useState(false);
  const [zoneStatuses, setZoneStatuses] = useState<ZoneStatus[]>([]);
  const [currentZones, setCurrentZones] = useState<SavingZone[]>([]);
  const [error, setError] = useState<string | null>(null);

  const {
    location,
    hasPermission,
    requestPermission,
    startLocationWatch,
    stopLocationWatch
  } = useLocation({
    enableHighAccuracy: true,
    timeInterval: LOCATION_UPDATE_INTERVAL,
    distanceInterval: LOCATION_DISTANCE_INTERVAL,
  });

  // Ref untuk menyimpan zona yang sedang dipantau
  const monitoredZonesRef = useRef<SavingZone[]>([]);

  // Fungsi untuk menghitung jarak ke zona
  const calculateDistanceToZone = (
    userLat: number,
    userLng: number,
    zoneLat: number,
    zoneLng: number
  ): number => {
    return getDistance(
      { latitude: userLat, longitude: userLng },
      { latitude: zoneLat, longitude: zoneLng }
    );
  };

  // Fungsi untuk memeriksa apakah pengguna berada di dalam zona
  const checkIfInZone = (
    userLat: number,
    userLng: number,
    zone: SavingZone
  ): boolean => {
    const distance = calculateDistanceToZone(
      userLat,
      userLng,
      zone.location.latitude,
      zone.location.longitude
    );

    return distance <= zone.radius;
  };

  // Fungsi untuk memperbarui status zona
  const updateZoneStatuses = (
    userLat: number,
    userLng: number,
    zones: SavingZone[]
  ) => {
    const now = new Date();

    const newStatuses = zones.map(zone => {
      const distance = calculateDistanceToZone(
        userLat,
        userLng,
        zone.location.latitude,
        zone.location.longitude
      );

      const isInside = distance <= zone.radius;

      return {
        zoneId: zone.id,
        isInside,
        distance,
        lastUpdated: now,
      };
    });

    // Dapatkan status zona sebelumnya
    const prevStatuses = zoneStatuses;

    // Periksa perubahan status (masuk atau keluar zona)
    newStatuses.forEach(newStatus => {
      const prevStatus = prevStatuses.find(status => status.zoneId === newStatus.zoneId);
      const zone = zones.find(z => z.id === newStatus.zoneId);

      if (!zone || !zone.notificationEnabled) return;

      // Jika tidak ada status sebelumnya, anggap sebagai pertama kali
      if (!prevStatus) {
        if (newStatus.isInside && notifyOnEntry) {
          sendZoneNotification(zone, 'entry');
        }
        return;
      }

      // Jika status berubah dari luar ke dalam zona
      if (!prevStatus.isInside && newStatus.isInside && notifyOnEntry) {
        sendZoneNotification(zone, 'entry');
      }

      // Jika status berubah dari dalam ke luar zona
      if (prevStatus.isInside && !newStatus.isInside && notifyOnExit) {
        sendZoneNotification(zone, 'exit');
      }
    });

    setZoneStatuses(newStatuses);

    // Perbarui zona yang sedang dimasuki
    const insideZones = zones.filter((zone, index) => newStatuses[index].isInside);
    setCurrentZones(insideZones);
  };

  // Fungsi untuk mengirim notifikasi zona
  const sendZoneNotification = async (
    zone: SavingZone,
    type: 'entry' | 'exit'
  ) => {
    try {
      let title = '';
      let body = '';

      if (type === 'entry') {
        if (zone.type === 'high_expense') {
          title = 'Perhatian! Zona Pengeluaran Tinggi';
          body = `Anda memasuki ${zone.name}. Berhati-hatilah dengan pengeluaran Anda di area ini.`;
        } else {
          title = 'Peluang Hemat Terdeteksi';
          body = `Anda memasuki ${zone.name}. Ada peluang untuk menghemat di area ini.`;
        }
      } else {
        title = `Anda meninggalkan ${zone.name}`;
        body = 'Terima kasih telah berhati-hati dengan pengeluaran Anda.';
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { zoneId: zone.id },
        },
        trigger: null, // Kirim segera
      });
    } catch (error) {
      console.error('Error sending zone notification:', error);
    }
  };

  // Fungsi untuk memulai pemantauan zona
  const startGeofencing = async (): Promise<boolean> => {
    try {
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) {
          setError('Izin lokasi diperlukan untuk memantau zona');
          return false;
        }
      }

      // Simpan zona yang dipantau ke ref
      monitoredZonesRef.current = zones;

      if (enableBackgroundTracking && Platform.OS !== 'web') {
        // Daftarkan task untuk pemantauan lokasi di latar belakang
        TaskManager.defineTask(LOCATION_TRACKING_TASK, async ({ data, error }: TaskManager.TaskManagerTaskBody) => {
          if (error) {
            console.error('Background location task error:', error);
            return;
          }

          if (data) {
            const { locations } = data as { locations: Location.LocationObject[] };
            const latestLocation = locations[locations.length - 1];

            // Perbarui status zona
            updateZoneStatuses(
              latestLocation.coords.latitude,
              latestLocation.coords.longitude,
              monitoredZonesRef.current
            );
          }

          return Promise.resolve();
        });

        // Mulai pemantauan lokasi di latar belakang
        await Location.startLocationUpdatesAsync(LOCATION_TRACKING_TASK, {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: LOCATION_UPDATE_INTERVAL,
          distanceInterval: LOCATION_DISTANCE_INTERVAL,
          foregroundService: {
            notificationTitle: 'BudgetWise Aktif',
            notificationBody: 'Memantau zona pengeluaran Anda',
          },
        });
      } else {
        // Mulai pemantauan lokasi di latar depan
        await startLocationWatch();
      }

      setIsTracking(true);
      return true;
    } catch (error: any) {
      setError(error.message || 'Terjadi kesalahan saat memulai pemantauan zona');
      return false;
    }
  };

  // Fungsi untuk menghentikan pemantauan zona
  const stopGeofencing = async (): Promise<boolean> => {
    try {
      if (enableBackgroundTracking && Platform.OS !== 'web') {
        // Hentikan pemantauan lokasi di latar belakang
        const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TRACKING_TASK);

        if (isTaskRegistered) {
          await Location.stopLocationUpdatesAsync(LOCATION_TRACKING_TASK);
        }
      } else {
        // Hentikan pemantauan lokasi di latar depan
        stopLocationWatch();
      }

      setIsTracking(false);
      return true;
    } catch (error: any) {
      setError(error.message || 'Terjadi kesalahan saat menghentikan pemantauan zona');
      return false;
    }
  };

  // Perbarui status zona saat lokasi berubah
  useEffect(() => {
    if (location && isTracking) {
      updateZoneStatuses(
        location.latitude,
        location.longitude,
        zones
      );
    }
  }, [location, zones, isTracking]);

  // Perbarui zona yang dipantau saat zones berubah
  useEffect(() => {
    monitoredZonesRef.current = zones;
  }, [zones]);

  // Bersihkan saat komponen unmount
  useEffect(() => {
    return () => {
      stopGeofencing();
    };
  }, []);

  return {
    isTracking,
    zoneStatuses,
    currentZones,
    error,
    startGeofencing,
    stopGeofencing,
  };
};
