import { useState, useEffect, useRef } from 'react';
import * as Sensors from 'expo-sensors';
import * as Haptics from 'expo-haptics';

// Tipe data untuk data sensor
export interface SensorData {
  accelerometer: {
    x: number;
    y: number;
    z: number;
  } | null;
  gyroscope: {
    x: number;
    y: number;
    z: number;
  } | null;
  pedometer: {
    steps: number;
    startDate?: Date;
    endDate?: Date;
  } | null;
}

// Tipe data untuk opsi sensor
export interface SensorOptions {
  accelerometer?: {
    enabled: boolean;
    updateInterval?: number; // ms
  };
  gyroscope?: {
    enabled: boolean;
    updateInterval?: number; // ms
  };
  pedometer?: {
    enabled: boolean;
  };
}

// Tipe data untuk callback deteksi gerakan
export type MotionCallback = (motion: 'shake' | 'tilt' | 'flip' | 'walk' | 'run') => void;

export const useSensors = (options: SensorOptions = {}, onMotion?: MotionCallback) => {
  // Default options - dengan interval update yang lebih lambat untuk mengurangi sensitivitas
  const defaultOptions: SensorOptions = {
    accelerometer: {
      enabled: true,
      updateInterval: 1000, // Meningkatkan interval dari 500ms ke 1000ms
    },
    gyroscope: {
      enabled: true,
      updateInterval: 1000, // Meningkatkan interval dari 500ms ke 1000ms
    },
    pedometer: {
      enabled: true,
    },
  };

  // Merge options
  const mergedOptions = {
    accelerometer: {
      ...defaultOptions.accelerometer,
      ...options.accelerometer,
    },
    gyroscope: {
      ...defaultOptions.gyroscope,
      ...options.gyroscope,
    },
    pedometer: {
      ...defaultOptions.pedometer,
      ...options.pedometer,
    },
  };

  // State untuk data sensor
  const [sensorData, setSensorData] = useState<SensorData>({
    accelerometer: null,
    gyroscope: null,
    pedometer: null,
  });

  // State untuk ketersediaan sensor
  const [isAvailable, setIsAvailable] = useState({
    accelerometer: false,
    gyroscope: false,
    pedometer: false,
  });

  // State untuk status sensor
  const [isActive, setIsActive] = useState({
    accelerometer: false,
    gyroscope: false,
    pedometer: false,
  });

  // Ref untuk subscription
  const subscriptions = useRef<{
    accelerometer: any | null;
    gyroscope: any | null;
    pedometer: any | null;
  }>({
    accelerometer: null,
    gyroscope: null,
    pedometer: null,
  });

  // Ref untuk data sebelumnya (untuk deteksi gerakan)
  const prevData = useRef<SensorData>({
    accelerometer: null,
    gyroscope: null,
    pedometer: null,
  });

  // Ref untuk timestamp terakhir (untuk throttling)
  const lastShakeTimestamp = useRef<number>(0);
  const lastTiltTimestamp = useRef<number>(0);
  const lastFlipTimestamp = useRef<number>(0);

  // Fungsi untuk memeriksa ketersediaan sensor
  const checkAvailability = async () => {
    try {
      const accelerometerAvailable = await Sensors.Accelerometer.isAvailableAsync();
      const gyroscopeAvailable = await Sensors.Gyroscope.isAvailableAsync();
      const pedometerAvailable = await Sensors.Pedometer.isAvailableAsync();

      setIsAvailable({
        accelerometer: accelerometerAvailable,
        gyroscope: gyroscopeAvailable,
        pedometer: pedometerAvailable,
      });
    } catch (error) {
      console.error('Error checking sensor availability:', error);
    }
  };

  // Fungsi untuk memulai sensor
  const startSensors = async () => {
    try {
      // Mulai accelerometer jika diaktifkan dan tersedia
      if (mergedOptions.accelerometer?.enabled && isAvailable.accelerometer) {
        Sensors.Accelerometer.setUpdateInterval(
          mergedOptions.accelerometer.updateInterval || 500
        );

        subscriptions.current.accelerometer = Sensors.Accelerometer.addListener(data => {
          setSensorData(prev => ({
            ...prev,
            accelerometer: data,
          }));

          // Deteksi gerakan
          detectMotion('accelerometer', data);
        });

        setIsActive(prev => ({
          ...prev,
          accelerometer: true,
        }));
      }

      // Mulai gyroscope jika diaktifkan dan tersedia
      if (mergedOptions.gyroscope?.enabled && isAvailable.gyroscope) {
        Sensors.Gyroscope.setUpdateInterval(
          mergedOptions.gyroscope.updateInterval || 500
        );

        subscriptions.current.gyroscope = Sensors.Gyroscope.addListener(data => {
          setSensorData(prev => ({
            ...prev,
            gyroscope: data,
          }));

          // Deteksi gerakan
          detectMotion('gyroscope', data);
        });

        setIsActive(prev => ({
          ...prev,
          gyroscope: true,
        }));
      }

      // Mulai pedometer jika diaktifkan dan tersedia
      if (mergedOptions.pedometer?.enabled && isAvailable.pedometer) {
        subscriptions.current.pedometer = Sensors.Pedometer.watchStepCount(result => {
          setSensorData(prev => ({
            ...prev,
            pedometer: {
              steps: result.steps,
              startDate: new Date(),
              endDate: new Date(),
            },
          }));
        });

        setIsActive(prev => ({
          ...prev,
          pedometer: true,
        }));
      }
    } catch (error) {
      console.error('Error starting sensors:', error);
    }
  };

  // Fungsi untuk menghentikan sensor
  const stopSensors = () => {
    try {
      // Hentikan accelerometer
      if (subscriptions.current.accelerometer) {
        subscriptions.current.accelerometer.remove();
        subscriptions.current.accelerometer = null;

        setIsActive(prev => ({
          ...prev,
          accelerometer: false,
        }));
      }

      // Hentikan gyroscope
      if (subscriptions.current.gyroscope) {
        subscriptions.current.gyroscope.remove();
        subscriptions.current.gyroscope = null;

        setIsActive(prev => ({
          ...prev,
          gyroscope: false,
        }));
      }

      // Hentikan pedometer
      if (subscriptions.current.pedometer) {
        subscriptions.current.pedometer.remove();
        subscriptions.current.pedometer = null;

        setIsActive(prev => ({
          ...prev,
          pedometer: false,
        }));
      }
    } catch (error) {
      console.error('Error stopping sensors:', error);
    }
  };

  // Fungsi untuk deteksi gerakan
  const detectMotion = (
    sensorType: 'accelerometer' | 'gyroscope',
    data: { x: number; y: number; z: number }
  ) => {
    if (!onMotion) return;

    const now = Date.now();

    // Simpan data sebelumnya
    prevData.current = {
      ...prevData.current,
      [sensorType]: data,
    };

    // Deteksi shake (guncangan) - dengan sensitivitas yang dikurangi
    if (sensorType === 'accelerometer') {
      const { x, y, z } = data;
      const acceleration = Math.sqrt(x * x + y * y + z * z);

      // Meningkatkan threshold dan interval waktu untuk mengurangi sensitivitas
      if (acceleration > 2.0 && now - lastShakeTimestamp.current > 2000) {
        lastShakeTimestamp.current = now;
        onMotion('shake');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
    }

    // Deteksi tilt (kemiringan) - dengan sensitivitas yang dikurangi
    if (sensorType === 'accelerometer') {
      const { y } = data;

      // Meningkatkan threshold dan interval waktu untuk mengurangi sensitivitas
      if (Math.abs(y) > 1.2 && now - lastTiltTimestamp.current > 3000) {
        lastTiltTimestamp.current = now;
        onMotion('tilt');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }

    // Deteksi flip (pembalikan) - dengan sensitivitas yang dikurangi
    if (sensorType === 'accelerometer') {
      const { z } = data;

      // Meningkatkan threshold dan interval waktu untuk mengurangi sensitivitas
      if (z < -1.2 && now - lastFlipTimestamp.current > 3000) {
        lastFlipTimestamp.current = now;
        onMotion('flip');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  // Fungsi untuk memberikan umpan balik haptic
  const triggerHapticFeedback = (
    type: 'success' | 'warning' | 'error' | 'light' | 'medium' | 'heavy' = 'medium'
  ) => {
    try {
      switch (type) {
        case 'success':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'light':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
      }
    } catch (error) {
      console.error('Error triggering haptic feedback:', error);
    }
  };

  // Periksa ketersediaan sensor saat komponen dimount
  useEffect(() => {
    checkAvailability();

    return () => {
      stopSensors();
    };
  }, []);

  // Mulai sensor saat ketersediaan berubah
  useEffect(() => {
    if (
      isAvailable.accelerometer ||
      isAvailable.gyroscope ||
      isAvailable.pedometer
    ) {
      startSensors();
    }

    return () => {
      stopSensors();
    };
  }, [isAvailable]);

  return {
    sensorData,
    isAvailable,
    isActive,
    startSensors,
    stopSensors,
    triggerHapticFeedback,
  };
};
