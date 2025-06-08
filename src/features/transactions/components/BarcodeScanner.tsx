import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Animated,
  StatusBar,
  Platform,
  Easing,
} from 'react-native';
import { CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Card } from '../../../core/components';
import { theme } from '../../../core/theme';
import { useBarcodeScanner } from '../../../core/hooks/useBarcodeScanner';
import { BarcodeScanStatus, BarcodeScanResult } from '../models/Barcode';
import { LinearGradient } from 'expo-linear-gradient';

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
    isScanning,
    cameraType,
    flashMode,
    startScanning,
    stopScanning,
    takePicture,
    toggleCameraType,
    toggleFlashMode,
    handleBarCodeScanned
  } = useBarcodeScanner({
    onBarcodeScanned,
    autoSearch,
    vibrate,
    searchDelay,
    sources,
  });

  // Animasi untuk berbagai elemen UI
  const scanBoxAnimation = useRef(new Animated.Value(0)).current;
  const scanLineAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const [isScanBoxAnimating, setIsScanBoxAnimating] = useState(false);
  const [showTip, setShowTip] = useState(true);

  // Fungsi untuk memulai semua animasi
  const startScanAnimations = useCallback(() => {
    if (isScanBoxAnimating) return;
    setIsScanBoxAnimating(true);

    // Animasi kotak pemindaian
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanBoxAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.cubic),
        }),
        Animated.timing(scanBoxAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.cubic),
        }),
      ])
    ).start();

    // Animasi garis pemindaian
    Animated.loop(
      Animated.timing(scanLineAnimation, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    ).start();

    // Animasi pulsa untuk tombol
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();
  }, [isScanBoxAnimating]); // Hapus animated values dari dependency karena mereka stabil

  // Efek untuk menampilkan/menyembunyikan tip secara otomatis
  useEffect(() => {
    const tipTimer = setTimeout(() => {
      setShowTip(false);
    }, 5000);

    return () => clearTimeout(tipTimer);
  }, []);

  // Mulai pemindaian saat komponen dimount
  useEffect(() => {
    if (hasPermission) {
      startScanning();

      // Animasi fade in untuk UI
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start();
    }

    // Sembunyikan status bar saat kamera aktif
    StatusBar.setHidden(true);

    return () => {
      stopScanning();
      StatusBar.setHidden(false);
    };
  }, [hasPermission, startScanning, stopScanning, fadeAnimation]);

  // Mulai animasi secara terpisah untuk menghindari dependency loop
  useEffect(() => {
    if (hasPermission) {
      startScanAnimations();
    }
  }, [hasPermission, startScanAnimations]);

  // Fungsi untuk menangani tombol ambil gambar
  const handleCapture = async () => {
    // Animasi flash saat mengambil gambar
    Animated.sequence([
      Animated.timing(fadeAnimation, {
        toValue: 0.5,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      await takePicture();
      // Haptic feedback bisa ditambahkan di sini jika diperlukan
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Error taking picture:', error);
      }
    }
  };

  // Jika izin belum diberikan
  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <LinearGradient
          colors={[theme.colors.primary[700], theme.colors.primary[900]]}
          style={styles.permissionGradient}
        >
          <ActivityIndicator size="large" color={theme.colors.white} />
          <Typography
            variant="body1"
            color={theme.colors.white}
            style={styles.permissionText}
          >
            Meminta izin kamera...
          </Typography>
        </LinearGradient>
      </View>
    );
  }

  // Jika izin ditolak
  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <LinearGradient
          colors={[theme.colors.primary[700], theme.colors.primary[900]]}
          style={styles.permissionGradient}
        >
          <Ionicons name="camera-outline" size={64} color={theme.colors.white} />
          <Typography
            variant="h4"
            color={theme.colors.white}
            style={styles.permissionTitle}
          >
            Akses Kamera Ditolak
          </Typography>
          <Typography
            variant="body1"
            color={theme.colors.white}
            style={styles.permissionText}
          >
            Aplikasi memerlukan akses kamera untuk fitur pemindaian.
            Silakan berikan izin di pengaturan perangkat Anda.
          </Typography>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={onClose}
          >
            <Typography variant="body1" weight="600" color={theme.colors.primary[900]}>
              Kembali
            </Typography>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  // Transformasi untuk animasi
  const scanBoxScale = scanBoxAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.98, 1.02],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnimation }
      ]}
    >
      <View style={styles.camera}>
        {hasPermission && (
          <CameraView
            style={{ flex: 1, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            facing={cameraType}
            enableTorch={flashMode === 'on' || flashMode === 'auto'}
            zoom={0.1}
            barcodeScannerSettings={{
              barcodeTypes: [
                'qr',
                'code39',
                'code128',
                'ean13',
                'ean8',
                'upc_e',
              ],
            }}
            onBarcodeScanned={isScanning ? handleBarCodeScanned : undefined}
            onCameraReady={() => {
              // Camera is ready for scanning
            }}
            onMountError={(_error) => {
              // Handle camera mount error silently or log to crash reporting service
            }}
          />
        )}
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.4)']}
          style={styles.overlay}
        >
          {/* Panduan pemindaian */}
          {showTip && (
            <Animated.View
              style={[
                styles.tipContainer,
                { opacity: fadeAnimation }
              ]}
            >
              <Card style={styles.tipCard}>
                <Ionicons name="information-circle" size={24} color={theme.colors.primary[500]} />
                <Typography variant="body2" style={styles.tipText}>
                  Arahkan kamera ke barcode untuk memindai secara otomatis
                </Typography>
              </Card>
            </Animated.View>
          )}

          {/* Kotak pemindaian dengan animasi */}
          <Animated.View
            style={[
              styles.scanBox,
              {
                transform: [{ scale: scanBoxScale }],
                borderColor: theme.colors.primary[400],
              },
            ]}
          >
            {/* Sudut-sudut kotak pemindaian */}
            <View style={[styles.scanBoxCorner, styles.topLeft]} />
            <View style={[styles.scanBoxCorner, styles.topRight]} />
            <View style={[styles.scanBoxCorner, styles.bottomRight]} />
            <View style={[styles.scanBoxCorner, styles.bottomLeft]} />

            {/* Garis pemindaian dengan animasi */}
            <Animated.View
              style={[
                styles.scanLine,
                {
                  transform: [{
                    translateY: scanLineAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-scanBoxSize / 2 + 2, scanBoxSize / 2 - 2],
                    })
                  }],
                }
              ]}
            />
          </Animated.View>

          {/* Status pemindaian dengan efek bayangan */}
          <View style={styles.statusContainer}>
            <LinearGradient
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']}
              style={styles.statusGradient}
            >
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
            </LinearGradient>
          </View>

          {/* Tombol kontrol dengan efek visual yang lebih baik */}
          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleFlashMode}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={
                  flashMode === 'off'
                    ? ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']
                    : ['rgba(255,255,100,0.4)', 'rgba(255,255,0,0.2)']
                }
                style={styles.controlButtonGradient}
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
                  color={flashMode === 'off' ? theme.colors.white : '#FFFF00'}
                />
              </LinearGradient>
            </TouchableOpacity>

            <Animated.View
              style={[
                styles.captureButtonContainer,
                {
                  transform: [{
                    scale: pulseAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.05],
                    })
                  }]
                }
              ]}
            >
              <TouchableOpacity
                style={styles.captureButton}
                onPress={handleCapture}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[theme.colors.primary[300], theme.colors.primary[500]]}
                  style={styles.captureButtonInner}
                >
                  <View style={styles.captureButtonCenter} />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleCameraType}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                style={styles.controlButtonGradient}
              >
                <Ionicons
                  name="camera-reverse-outline"
                  size={24}
                  color={theme.colors.white}
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Tombol tutup dengan desain yang lebih baik */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.4)']}
              style={styles.closeButtonGradient}
            >
              <Ionicons
                name="close"
                size={24}
                color={theme.colors.white}
              />
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </Animated.View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Kotak pemindaian
  scanBox: {
    width: scanBoxSize,
    height: scanBoxSize,
    borderRadius: 16,
    backgroundColor: 'transparent',
    position: 'relative',
    borderWidth: 2,
    borderColor: theme.colors.primary[400],
    overflow: 'hidden',
  },
  scanBoxCorner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: theme.colors.primary[300],
    borderWidth: 3,
  },
  topLeft: {
    borderBottomWidth: 0,
    borderRightWidth: 0,
    top: 0,
    left: 0,
  },
  topRight: {
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    top: 0,
    right: 0,
  },
  bottomRight: {
    borderTopWidth: 0,
    borderLeftWidth: 0,
    bottom: 0,
    right: 0,
  },
  bottomLeft: {
    borderTopWidth: 0,
    borderRightWidth: 0,
    bottom: 0,
    left: 0,
  },
  // Garis pemindaian
  scanLine: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: theme.colors.primary[300],
    shadowColor: theme.colors.primary[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 5,
  },
  // Tip/Panduan
  tipContainer: {
    position: 'absolute',
    top: theme.spacing.layout.lg,
    left: theme.spacing.layout.md,
    right: theme.spacing.layout.md,
    zIndex: 10,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: theme.borderRadius.md,
    ...theme.elevation.md,
  },
  tipText: {
    marginLeft: theme.spacing.sm,
    flex: 1,
    color: theme.colors.neutral[800],
  },
  // Status pemindaian
  statusContainer: {
    position: 'absolute',
    bottom: height * 0.22,
    left: 0,
    right: 0,
    zIndex: 5,
  },
  statusGradient: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.layout.md,
  },
  statusText: {
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    fontWeight: '600',
  },
  // Tombol kontrol
  controlsContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? theme.spacing.layout.xl : theme.spacing.layout.lg,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.layout.md,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  controlButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
  },
  captureButtonContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  captureButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonCenter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.white,
  },
  // Tombol tutup
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? theme.spacing.layout.lg : theme.spacing.layout.md,
    right: theme.spacing.layout.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    zIndex: 10,
  },
  closeButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  // Layar izin
  permissionContainer: {
    flex: 1,
    backgroundColor: theme.colors.primary[900],
  },
  permissionGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.layout.lg,
  },
  permissionTitle: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  permissionText: {
    textAlign: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    opacity: 0.9,
  },
  permissionButton: {
    backgroundColor: theme.colors.white,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.layout.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.lg,
  },
});
