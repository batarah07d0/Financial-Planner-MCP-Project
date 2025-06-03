import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

export interface CameraOptions {
  quality?: number;
  allowsEditing?: boolean;
  aspect?: [number, number];
  requestPermissionOnMount?: boolean;
}

export interface ImageResult {
  uri: string;
  width: number;
  height: number;
  type?: 'image' | 'video';
  base64?: string | null | undefined;
}

export const useCamera = (options: CameraOptions = {}) => {
  const {
    quality = 0.8,
    allowsEditing = false,
    aspect = [4, 3],
    requestPermissionOnMount = true,
  } = options;

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [hasMediaLibraryPermission, setHasMediaLibraryPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fungsi untuk meminta izin kamera
  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      const permissionGranted = status === 'granted';
      setHasCameraPermission(permissionGranted);

      if (!permissionGranted) {
        setErrorMsg('Izin kamera tidak diberikan');
        Alert.alert(
          'Izin Kamera Diperlukan',
          'Aplikasi memerlukan izin kamera untuk fitur ini. Silakan aktifkan izin kamera di pengaturan perangkat Anda.'
        );
      }

      return permissionGranted;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat meminta izin kamera';
      setErrorMsg(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fungsi untuk meminta izin media library
  const requestMediaLibraryPermission = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      const permissionGranted = status === 'granted';
      setHasMediaLibraryPermission(permissionGranted);

      if (!permissionGranted) {
        setErrorMsg('Izin media library tidak diberikan');
        Alert.alert(
          'Izin Media Library Diperlukan',
          'Aplikasi memerlukan izin media library untuk fitur ini. Silakan aktifkan izin media library di pengaturan perangkat Anda.'
        );
      }

      return permissionGranted;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat meminta izin media library';
      setErrorMsg(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fungsi untuk mengambil gambar dari kamera
  const takePicture = async (): Promise<ImageResult | null> => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (hasCameraPermission === null) {
        const permissionGranted = await requestCameraPermission();
        if (!permissionGranted) return null;
      } else if (!hasCameraPermission) {
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing,
        aspect,
        quality,
        base64: true,
      });

      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0];

      return {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        type: 'image',
        base64: asset.base64,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat mengambil gambar';
      setErrorMsg(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi untuk memilih gambar dari galeri
  const pickImage = async (): Promise<ImageResult | null> => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (hasMediaLibraryPermission === null) {
        const permissionGranted = await requestMediaLibraryPermission();
        if (!permissionGranted) return null;
      } else if (!hasMediaLibraryPermission) {
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing,
        aspect,
        quality,
        base64: true,
      });

      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0];

      return {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        type: 'image',
        base64: asset.base64,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat memilih gambar';
      setErrorMsg(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi untuk menyimpan gambar ke galeri
  const saveImageToGallery = async (uri: string): Promise<boolean> => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (hasMediaLibraryPermission === null) {
        const permissionGranted = await requestMediaLibraryPermission();
        if (!permissionGranted) return false;
      } else if (!hasMediaLibraryPermission) {
        return false;
      }

      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('BudgetWise', asset, false);

      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan gambar';
      setErrorMsg(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi untuk menghapus file gambar
  const deleteImage = async (uri: string): Promise<boolean> => {
    try {
      await FileSystem.deleteAsync(uri);
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat menghapus gambar';
      setErrorMsg(errorMessage);
      return false;
    }
  };

  // Meminta izin saat komponen dimount
  useEffect(() => {
    if (requestPermissionOnMount) {
      requestCameraPermission();
      requestMediaLibraryPermission();
    }
  }, [requestPermissionOnMount, requestCameraPermission, requestMediaLibraryPermission]);

  return {
    hasCameraPermission,
    hasMediaLibraryPermission,
    isLoading,
    errorMsg,
    requestCameraPermission,
    requestMediaLibraryPermission,
    takePicture,
    pickImage,
    saveImageToGallery,
    deleteImage,
  };
};
