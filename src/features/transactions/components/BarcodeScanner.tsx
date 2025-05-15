import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Animated,
} from 'react-native';
// import { Camera, CameraType, FlashMode } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../../../core/components';
import { theme } from '../../../core/theme';
import { useBarcodeScanner } from '../../../core/hooks/useBarcodeScanner';
import { BarcodeScanStatus, BarcodeScanResult } from '../models/Barcode';

interface BarcodeScannerProps {
  onBarcodeScanned?: (result: BarcodeScanResult) => void;
  onClose?: () => void;
  autoSearch?: boolean;
  vibrate?: boolean;
  searchDelay?: number;
  sources?: ('local' | 'community' | 'api')[];
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onBarcodeScanned,
  onClose,
  autoSearch = true,
  vibrate = true,
  searchDelay = 500,
  sources = ['local', 'community', 'api'],
}) => {
  const {
    hasPermission,
    scanResult,
    flashMode,
    startScanning,
    stopScanning,
    takePicture,
    toggleCameraType,
    toggleFlashMode,
  } = useBarcodeScanner({
    onBarcodeScanned,
    autoSearch,
    vibrate,
    searchDelay,
    sources,
  });

  // Animasi untuk kotak pemindaian
  const scanBoxAnimation = useRef(new Animated.Value(0)).current;
  const [isScanBoxAnimating, setIsScanBoxAnimating] = useState(false);

  // Mulai pemindaian saat komponen dimount
  useEffect(() => {
    if (hasPermission) {
      startScanning();
      startScanBoxAnimation();
    }

    return () => {
      stopScanning();
    };
  }, [hasPermission]);

  // Fungsi untuk memulai animasi kotak pemindaian
  const startScanBoxAnimation = () => {
    if (isScanBoxAnimating) return;

    setIsScanBoxAnimating(true);
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanBoxAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(scanBoxAnimation, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Jika izin belum diberikan
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        <Typography variant="body1" style={styles.permissionText}>
          Meminta izin kamera...
        </Typography>
      </View>
    );
  }

  // Jika izin ditolak
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Ionicons name="camera-outline" size={48} color={theme.colors.neutral[500]} />
        <Typography variant="body1" style={styles.permissionText}>
          Akses ke kamera ditolak. Silakan berikan izin di pengaturan perangkat Anda.
        </Typography>
      </View>
    );
  }

  // Transformasi untuk animasi kotak pemindaian
  const scanBoxScale = scanBoxAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.97, 1.03],
  });

  const scanBoxOpacity = scanBoxAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.5, 1, 0.5],
  });

  return (
    <View style={styles.container}>
      <View style={styles.camera}>
        <View style={styles.overlay}>
          {/* Kotak pemindaian */}
          <Animated.View
            style={[
              styles.scanBox,
              {
                transform: [{ scale: scanBoxScale }],
                opacity: scanBoxOpacity,
              },
            ]}
          >
            <View style={styles.scanBoxCorner} />
            <View style={[styles.scanBoxCorner, styles.topRight]} />
            <View style={[styles.scanBoxCorner, styles.bottomRight]} />
            <View style={[styles.scanBoxCorner, styles.bottomLeft]} />
          </Animated.View>

          {/* Status pemindaian */}
          <View style={styles.statusContainer}>
            <Typography
              variant="body1"
              color={theme.colors.white}
              align="center"
              style={styles.statusText}
            >
              {scanResult.status === BarcodeScanStatus.READY && 'Siap memindai barcode'}
              {scanResult.status === BarcodeScanStatus.SCANNING && 'Memindai...'}
              {scanResult.status === BarcodeScanStatus.FOUND && scanResult.data &&
                `Ditemukan: ${scanResult.data.productName}`}
              {scanResult.status === BarcodeScanStatus.FOUND && !scanResult.data &&
                `Barcode: ${scanResult.barcode}`}
              {scanResult.status === BarcodeScanStatus.NOT_FOUND &&
                `Barcode tidak ditemukan: ${scanResult.barcode}`}
              {scanResult.status === BarcodeScanStatus.ERROR &&
                `Error: ${scanResult.error || 'Unknown error'}`}
            </Typography>
          </View>

          {/* Tombol kontrol */}
          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleFlashMode}
            >
              <Ionicons
                name={
                  flashMode === 'off'
                    ? 'flash-off'
                    : flashMode === 'on'
                      ? 'flash'
                      : 'flash-outline'
                }
                size={24}
                color={theme.colors.white}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.captureButton}
              onPress={async () => {
                try {
                  await takePicture();
                  // Handle photo if needed
                } catch (error) {
                  console.error('Error taking picture:', error);
                }
              }}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleCameraType}
            >
              <Ionicons
                name="camera-reverse-outline"
                size={24}
                color={theme.colors.white}
              />
            </TouchableOpacity>
          </View>

          {/* Tombol tutup */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons
              name="close"
              size={24}
              color={theme.colors.white}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const { width, height } = Dimensions.get('window');
const scanBoxSize = width * 0.7;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanBox: {
    width: scanBoxSize,
    height: scanBoxSize,
    borderRadius: 16,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  scanBoxCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: theme.colors.white,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    top: 0,
    left: 0,
  },
  topRight: {
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderLeftWidth: 0,
    right: 0,
    left: undefined,
  },
  bottomRight: {
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    right: 0,
    bottom: 0,
    top: undefined,
    left: undefined,
  },
  bottomLeft: {
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderTopWidth: 0,
    bottom: 0,
    top: undefined,
  },
  statusContainer: {
    position: 'absolute',
    bottom: height * 0.25,
    left: 0,
    right: 0,
    padding: theme.spacing.md,
  },
  statusText: {
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: theme.spacing.layout.lg,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.layout.md,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: theme.colors.white,
  },
  closeButton: {
    position: 'absolute',
    top: theme.spacing.layout.md,
    right: theme.spacing.layout.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionText: {
    color: theme.colors.neutral[500],
    textAlign: 'center',
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.layout.md,
  },
});
