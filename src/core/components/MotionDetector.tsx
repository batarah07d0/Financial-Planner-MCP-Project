import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import { Typography } from './Typography';
import { Button } from './Button';
import { theme } from '../theme';
import { useSensors } from '../hooks';
import { Ionicons } from '@expo/vector-icons';

interface MotionDetectorProps {
  onMotionDetected?: (motion: 'shake' | 'tilt' | 'flip' | 'walk' | 'run') => void;
  children?: React.ReactNode;
}

export const MotionDetector: React.FC<MotionDetectorProps> = ({
  onMotionDetected,
  children,
}) => {
  const [detectedMotion, setDetectedMotion] = useState<'shake' | 'tilt' | 'flip' | 'walk' | 'run' | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [animatedValue] = useState(new Animated.Value(0));

  // Gunakan hook sensor
  const { sensorData, isAvailable, isActive, triggerHapticFeedback } = useSensors(
    {
      accelerometer: {
        enabled: true,
        updateInterval: 300,
      },
      gyroscope: {
        enabled: true,
        updateInterval: 300,
      },
      pedometer: {
        enabled: true,
      },
    },
    (motion) => {
      // Callback saat gerakan terdeteksi
      setDetectedMotion(motion);
      setShowModal(true);

      // Panggil callback jika ada
      if (onMotionDetected) {
        onMotionDetected(motion);
      }
    }
  );

  // Animasi untuk modal
  useEffect(() => {
    if (showModal) {
      // Reset animasi
      animatedValue.setValue(0);

      // Mulai animasi
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      // Tutup modal setelah 3 detik
      const timer = setTimeout(() => {
        setShowModal(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showModal]);

  // Animasi untuk scale dan opacity
  const scale = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 1.1, 1],
  });

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // Mendapatkan ikon berdasarkan gerakan
  const getMotionIcon = () => {
    switch (detectedMotion) {
      case 'shake':
        return 'hand-right-outline';
      case 'tilt':
        return 'phone-portrait-outline';
      case 'flip':
        return 'sync-outline';
      case 'walk':
        return 'walk-outline';
      case 'run':
        return 'fitness-outline';
      default:
        return 'help-outline';
    }
  };

  // Mendapatkan teks berdasarkan gerakan
  const getMotionText = () => {
    switch (detectedMotion) {
      case 'shake':
        return 'Guncangan Terdeteksi';
      case 'tilt':
        return 'Kemiringan Terdeteksi';
      case 'flip':
        return 'Pembalikan Terdeteksi';
      case 'walk':
        return 'Berjalan Terdeteksi';
      case 'run':
        return 'Berlari Terdeteksi';
      default:
        return 'Gerakan Terdeteksi';
    }
  };

  // Mendapatkan deskripsi berdasarkan gerakan
  const getMotionDescription = () => {
    switch (detectedMotion) {
      case 'shake':
        return 'Anda telah mengguncangkan perangkat';
      case 'tilt':
        return 'Anda telah memiringkan perangkat';
      case 'flip':
        return 'Anda telah membalikkan perangkat';
      case 'walk':
        return 'Anda sedang berjalan';
      case 'run':
        return 'Anda sedang berlari';
      default:
        return 'Gerakan tidak dikenali';
    }
  };

  return (
    <View style={styles.container}>
      {children}

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <Animated.View
            style={[
              styles.motionAlert,
              {
                transform: [{ scale }],
                opacity,
              },
            ]}
          >
            <Ionicons
              name={getMotionIcon() as any}
              size={48}
              color={theme.colors.primary[500]}
              style={styles.icon}
            />

            <Typography variant="h5" align="center" style={styles.title}>
              {getMotionText()}
            </Typography>

            <Typography variant="body1" align="center" color={theme.colors.neutral[600]}>
              {getMotionDescription()}
            </Typography>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowModal(false)}
            >
              <Typography variant="body2" color={theme.colors.primary[500]}>
                Tutup
              </Typography>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: theme.spacing.layout.md,
  },
  motionAlert: {
    width: '80%',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    ...theme.elevation.md,
  },
  icon: {
    marginBottom: theme.spacing.md,
  },
  title: {
    marginBottom: theme.spacing.sm,
  },
  closeButton: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
  },
});
