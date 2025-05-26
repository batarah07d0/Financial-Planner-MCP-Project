import { useState, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import {
  DeviceMotion,
  Accelerometer,
  Gyroscope,
  Magnetometer,
} from 'expo-sensors';

// Tipe data untuk haptic feedback
export type HapticFeedbackType =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'selection';

// Tipe data untuk sensor data (menggunakan tipe dari expo-sensors)
export interface SensorData {
  x: number;
  y: number;
  z: number;
}

// Tipe data untuk device motion (sesuai dengan expo-sensors)
export interface DeviceMotionData {
  acceleration: SensorData | null;
  accelerationIncludingGravity: SensorData | null;
  rotation: SensorData | null;
  rotationRate: SensorData | null;
  orientation: number;
}

export const useSensors = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [accelerometerData, setAccelerometerData] = useState<SensorData>({ x: 0, y: 0, z: 0 });
  const [gyroscopeData, setGyroscopeData] = useState<SensorData>({ x: 0, y: 0, z: 0 });
  const [magnetometerData, setMagnetometerData] = useState<SensorData>({ x: 0, y: 0, z: 0 });
  const [deviceMotionData, setDeviceMotionData] = useState<DeviceMotionData | null>(null);
  const [isListening, setIsListening] = useState(false);

  // Cek ketersediaan sensor saat hook dimount
  useEffect(() => {
    checkSensorAvailability();
  }, []);

  // Fungsi untuk mengecek ketersediaan sensor
  const checkSensorAvailability = async () => {
    try {
      const accelerometerAvailable = await Accelerometer.isAvailableAsync();
      const gyroscopeAvailable = await Gyroscope.isAvailableAsync();
      const magnetometerAvailable = await Magnetometer.isAvailableAsync();
      const deviceMotionAvailable = await DeviceMotion.isAvailableAsync();

      setIsAvailable(
        accelerometerAvailable ||
        gyroscopeAvailable ||
        magnetometerAvailable ||
        deviceMotionAvailable
      );
    } catch (error) {
      console.warn('Error checking sensor availability:', error);
      setIsAvailable(false);
    }
  };

  // Fungsi untuk trigger haptic feedback
  const triggerHapticFeedback = async (type: HapticFeedbackType = 'medium') => {
    try {
      switch (type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'selection':
          await Haptics.selectionAsync();
          break;
        default:
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      console.warn('Error triggering haptic feedback:', error);
    }
  };

  // Fungsi untuk memulai listening sensor
  const startListening = (updateInterval: number = 100) => {
    if (!isAvailable || isListening) return;

    try {
      // Set update interval untuk semua sensor
      Accelerometer.setUpdateInterval(updateInterval);
      Gyroscope.setUpdateInterval(updateInterval);
      Magnetometer.setUpdateInterval(updateInterval);
      DeviceMotion.setUpdateInterval(updateInterval);

      // Subscribe ke accelerometer
      const accelerometerSubscription = Accelerometer.addListener((data) => {
        setAccelerometerData({ x: data.x, y: data.y, z: data.z });
      });

      // Subscribe ke gyroscope
      const gyroscopeSubscription = Gyroscope.addListener((data) => {
        setGyroscopeData({ x: data.x, y: data.y, z: data.z });
      });

      // Subscribe ke magnetometer
      const magnetometerSubscription = Magnetometer.addListener((data) => {
        setMagnetometerData({ x: data.x, y: data.y, z: data.z });
      });

      // Subscribe ke device motion
      const deviceMotionSubscription = DeviceMotion.addListener((data) => {
        setDeviceMotionData({
          acceleration: data.acceleration ? {
            x: data.acceleration.x,
            y: data.acceleration.y,
            z: data.acceleration.z
          } : null,
          accelerationIncludingGravity: data.accelerationIncludingGravity ? {
            x: data.accelerationIncludingGravity.x,
            y: data.accelerationIncludingGravity.y,
            z: data.accelerationIncludingGravity.z
          } : null,
          rotation: data.rotation ? {
            x: data.rotation.beta,
            y: data.rotation.gamma,
            z: data.rotation.alpha
          } : null,
          rotationRate: data.rotationRate ? {
            x: data.rotationRate.beta,
            y: data.rotationRate.gamma,
            z: data.rotationRate.alpha
          } : null,
          orientation: data.orientation || 0
        });
      });

      setIsListening(true);

      // Return cleanup function
      return () => {
        accelerometerSubscription?.remove();
        gyroscopeSubscription?.remove();
        magnetometerSubscription?.remove();
        deviceMotionSubscription?.remove();
        setIsListening(false);
      };
    } catch (error) {
      console.warn('Error starting sensor listening:', error);
      setIsListening(false);
    }
  };

  // Fungsi untuk menghentikan listening sensor
  const stopListening = () => {
    if (!isListening) return;

    try {
      // Remove semua listener
      Accelerometer.removeAllListeners();
      Gyroscope.removeAllListeners();
      Magnetometer.removeAllListeners();
      DeviceMotion.removeAllListeners();

      setIsListening(false);
    } catch (error) {
      console.warn('Error stopping sensor listening:', error);
    }
  };

  // Fungsi untuk mendapatkan data sensor saat ini
  const getSensorSnapshot = () => {
    return {
      accelerometer: accelerometerData,
      gyroscope: gyroscopeData,
      magnetometer: magnetometerData,
      deviceMotion: deviceMotionData,
    };
  };

  // Fungsi untuk mendeteksi gerakan shake
  const detectShake = (threshold: number = 15) => {
    const { x, y, z } = accelerometerData;
    const acceleration = Math.sqrt(x * x + y * y + z * z);
    return acceleration > threshold;
  };

  // Cleanup saat unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  return {
    // Status
    isAvailable,
    isListening,

    // Data sensor
    accelerometerData,
    gyroscopeData,
    magnetometerData,
    deviceMotionData,

    // Fungsi kontrol
    startListening,
    stopListening,
    getSensorSnapshot,

    // Haptic feedback
    triggerHapticFeedback,

    // Utility functions
    detectShake,
    checkSensorAvailability,
  };
};
