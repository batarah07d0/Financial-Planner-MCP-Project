import { useState, useEffect, useRef, useCallback } from 'react';
import { Camera as ExpoCamera, BarcodeScanningResult, CameraView } from 'expo-camera';
import { BarcodeScanStatus, BarcodeScanResult } from '../../features/transactions/models/Barcode';
import { searchBarcode } from '../../features/transactions/services/barcodeService';
import { Vibration } from 'react-native';

interface BarcodeScannerOptions {
  onBarcodeScanned?: (result: BarcodeScanResult) => void;
  autoSearch?: boolean;
  vibrate?: boolean;
  searchDelay?: number;
  sources?: ('local' | 'community' | 'api')[];
}

export const useBarcodeScanner = (options: BarcodeScannerOptions = {}) => {
  const {
    onBarcodeScanned,
    autoSearch = true,
    vibrate = true,
    searchDelay = 500,
    sources = ['local', 'community', 'api'],
  } = options;

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<BarcodeScanResult>({
    status: BarcodeScanStatus.READY,
  });
  const [camera, setCamera] = useState<CameraView | null>(null);
  const [cameraType, setCameraType] = useState<'front' | 'back'>('back');
  const [flashMode, setFlashMode] = useState<'off' | 'on' | 'auto'>('off');

  // Ref untuk menyimpan timeout
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ref untuk menyimpan barcode terakhir yang dipindai
  const lastScannedBarcodeRef = useRef<string | null>(null);
  // Ref untuk menyimpan waktu terakhir pemindaian
  const lastScanTimeRef = useRef<number>(0);

  // Minta izin kamera saat komponen dimount
  useEffect(() => {
    (async () => {
      const { status } = await ExpoCamera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();

    // Cleanup
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Fungsi untuk memulai pemindaian
  const startScanning = useCallback(() => {
    setIsScanning(true);
    setScanResult({
      status: BarcodeScanStatus.SCANNING,
    });
  }, []);

  // Fungsi untuk menghentikan pemindaian
  const stopScanning = useCallback(() => {
    setIsScanning(false);
    setScanResult({
      status: BarcodeScanStatus.READY,
    });
  }, []);

  // Fungsi untuk menangani hasil pemindaian barcode
  const handleBarCodeScanned = useCallback(async ({ type: _type, data }: BarcodeScanningResult) => {
    // Periksa apakah sedang dalam mode pemindaian
    if (!isScanning) return;

    // Periksa apakah barcode sama dengan yang terakhir dipindai
    // dan apakah waktu sejak pemindaian terakhir kurang dari 2 detik
    const now = Date.now();
    if (
      lastScannedBarcodeRef.current === data &&
      now - lastScanTimeRef.current < 2000
    ) {
      return;
    }

    // Perbarui barcode terakhir dan waktu pemindaian
    lastScannedBarcodeRef.current = data;
    lastScanTimeRef.current = now;

    // Getarkan perangkat jika diizinkan
    if (vibrate) {
      Vibration.vibrate(100);
    }

    // Buat objek hasil pemindaian awal
    const initialResult: BarcodeScanResult = {
      status: BarcodeScanStatus.FOUND,
      barcode: data,
    };

    // Perbarui status pemindaian
    setScanResult(initialResult);

    // Jika autoSearch diaktifkan, cari data barcode
    if (autoSearch) {
      // Batalkan pencarian sebelumnya jika ada
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Tunda pencarian untuk menghindari terlalu banyak permintaan
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          // Cari data barcode
          const barcodeData = await searchBarcode(data, sources);

          // Buat objek hasil pemindaian baru berdasarkan hasil pencarian
          let updatedResult: BarcodeScanResult;

          if (barcodeData) {
            // Barcode ditemukan
            updatedResult = {
              status: BarcodeScanStatus.FOUND,
              barcode: data,
              data: barcodeData,
            };
          } else {
            // Barcode tidak ditemukan
            updatedResult = {
              status: BarcodeScanStatus.NOT_FOUND,
              barcode: data,
            };
          }

          // Perbarui state dengan hasil baru
          setScanResult(updatedResult);

          // Panggil callback jika ada dengan hasil yang baru saja dibuat
          // bukan menggunakan state scanResult yang mungkin belum diperbarui
          if (onBarcodeScanned) {
            onBarcodeScanned(updatedResult);
          }
        } catch (error) {
          // Terjadi kesalahan
          const errorResult: BarcodeScanResult = {
            status: BarcodeScanStatus.ERROR,
            barcode: data,
            error: error instanceof Error ? error.message : 'Unknown error',
          };

          setScanResult(errorResult);

          // Panggil callback dengan hasil error
          if (onBarcodeScanned) {
            onBarcodeScanned(errorResult);
          }
        }
      }, searchDelay);
    } else if (onBarcodeScanned) {
      // Jika autoSearch dinonaktifkan, panggil callback langsung dengan hasil awal
      onBarcodeScanned(initialResult);
    }
  }, [isScanning, vibrate, autoSearch, searchDelay, sources, onBarcodeScanned]);

  // Fungsi untuk mencari data barcode secara manual
  const searchBarcodeData = async (barcode: string) => {
    try {
      setScanResult({
        status: BarcodeScanStatus.SCANNING,
        barcode,
      });

      // Cari data barcode
      const barcodeData = await searchBarcode(barcode, sources);

      if (barcodeData) {
        // Barcode ditemukan
        setScanResult({
          status: BarcodeScanStatus.FOUND,
          barcode,
          data: barcodeData,
        });
      } else {
        // Barcode tidak ditemukan
        setScanResult({
          status: BarcodeScanStatus.NOT_FOUND,
          barcode,
        });
      }

      return barcodeData;
    } catch (error) {
      // Terjadi kesalahan
      setScanResult({
        status: BarcodeScanStatus.ERROR,
        barcode,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  };

  // Fungsi untuk mengambil gambar
  const takePicture = async () => {
    if (camera) {
      try {
        const photo = await camera.takePictureAsync();
        return photo;
      } catch (error) {
        // Error taking picture - silently handled
        return null;
      }
    }
    return null;
  };

  // Fungsi untuk mengganti tipe kamera
  const toggleCameraType = useCallback(() => {
    setCameraType(current =>
      current === 'back' ? 'front' : 'back'
    );
  }, []);

  // Fungsi untuk mengganti mode flash
  const toggleFlashMode = useCallback(() => {
    setFlashMode(current => {
      switch (current) {
        case 'off':
          return 'on';
        case 'on':
          return 'auto';
        case 'auto':
          return 'off';
        default:
          return 'off';
      }
    });
  }, []);

  return {
    hasPermission,
    isScanning,
    scanResult,
    camera,
    setCamera,
    cameraType,
    flashMode,
    startScanning,
    stopScanning,
    handleBarCodeScanned,
    searchBarcodeData,
    takePicture,
    toggleCameraType,
    toggleFlashMode,
  };
};
