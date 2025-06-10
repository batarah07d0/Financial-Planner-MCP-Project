import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | undefined;
  altitude: number | undefined;
  heading: number | undefined;
  speed: number | undefined;
  timestamp: number | undefined;
}

export interface LocationAddress {
  city?: string;
  country?: string;
  district?: string;
  isoCountryCode?: string;
  name?: string;
  postalCode?: string;
  region?: string;
  street?: string;
  streetNumber?: string;
  subregion?: string;
}

export interface UseLocationOptions {
  enableHighAccuracy?: boolean;
  timeInterval?: number;
  distanceInterval?: number;
  requestPermissionOnMount?: boolean;
}

export const useLocation = (options: UseLocationOptions = {}) => {
  const {
    enableHighAccuracy = true,
    timeInterval = 5000,
    distanceInterval = 10,
    requestPermissionOnMount = true,
  } = options;

  const [location, setLocation] = useState<LocationData | null>(null);
  const [address, setAddress] = useState<LocationAddress | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isWatching, setIsWatching] = useState<boolean>(false);
  const [watchId, setWatchId] = useState<Location.LocationSubscription | null>(null);

  // Fungsi untuk meminta izin lokasi
  const requestPermission = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const permissionGranted = status === 'granted';
      setHasPermission(permissionGranted);

      if (!permissionGranted) {
        setErrorMsg('Izin lokasi tidak diberikan');
        Alert.alert(
          'Izin Lokasi Diperlukan',
          'Aplikasi memerlukan izin lokasi untuk fitur ini. Silakan aktifkan izin lokasi di pengaturan perangkat Anda.'
        );
      }

      return permissionGranted;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat meminta izin lokasi';
      setErrorMsg(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fungsi untuk mendapatkan lokasi saat ini dengan akurasi maksimal
  const getCurrentLocation = async (): Promise<LocationData | null> => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (hasPermission === null) {
        const permissionGranted = await requestPermission();
        if (!permissionGranted) return null;
      } else if (!hasPermission) {
        return null;
      }

      // Gunakan akurasi terbaik yang tersedia
      const accuracy = enableHighAccuracy
        ? Location.Accuracy.BestForNavigation
        : Location.Accuracy.High;

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy,
      });

      const locationData: LocationData = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        accuracy: currentLocation.coords.accuracy || undefined,
        altitude: currentLocation.coords.altitude || undefined,
        heading: currentLocation.coords.heading || undefined,
        speed: currentLocation.coords.speed || undefined,
        timestamp: currentLocation.timestamp,
      };

      setLocation(locationData);
      return locationData;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat mendapatkan lokasi';
      setErrorMsg(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi untuk mendapatkan alamat dari koordinat
  const getAddressFromCoordinates = async (
    latitude: number,
    longitude: number
  ): Promise<LocationAddress | null> => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addressResponse && addressResponse.length > 0) {
        const addressData: LocationAddress = {
          city: addressResponse[0].city || undefined,
          country: addressResponse[0].country || undefined,
          district: addressResponse[0].district || undefined,
          isoCountryCode: addressResponse[0].isoCountryCode || undefined,
          name: addressResponse[0].name || undefined,
          postalCode: addressResponse[0].postalCode || undefined,
          region: addressResponse[0].region || undefined,
          street: addressResponse[0].street || undefined,
          streetNumber: addressResponse[0].streetNumber || undefined,
          subregion: addressResponse[0].subregion || undefined,
        };

        setAddress(addressData);
        return addressData;
      }

      return null;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat mendapatkan alamat';
      setErrorMsg(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi untuk memulai pemantauan lokasi
  const startLocationWatch = async (): Promise<boolean> => {
    if (isWatching) return true;

    try {
      if (hasPermission === null) {
        const permissionGranted = await requestPermission();
        if (!permissionGranted) return false;
      } else if (!hasPermission) {
        return false;
      }

      // Gunakan akurasi terbaik untuk tracking
      const accuracy = enableHighAccuracy
        ? Location.Accuracy.BestForNavigation
        : Location.Accuracy.High;

      const subscription = await Location.watchPositionAsync(
        {
          accuracy,
          timeInterval: Math.max(timeInterval, 3000), // Minimal 3 detik untuk akurasi
          distanceInterval: Math.max(distanceInterval, 5), // Minimal 5 meter untuk akurasi
        },
        (newLocation) => {
          const locationData: LocationData = {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
            accuracy: newLocation.coords.accuracy || undefined,
            altitude: newLocation.coords.altitude || undefined,
            heading: newLocation.coords.heading || undefined,
            speed: newLocation.coords.speed || undefined,
            timestamp: newLocation.timestamp,
          };

          setLocation(locationData);
        }
      );

      setWatchId(subscription);
      setIsWatching(true);
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat memantau lokasi';
      setErrorMsg(errorMessage);
      return false;
    }
  };

  // Fungsi untuk menghentikan pemantauan lokasi
  const stopLocationWatch = (): void => {
    if (watchId) {
      watchId.remove();
      setWatchId(null);
      setIsWatching(false);
    }
  };

  // Meminta izin lokasi saat komponen dimount
  useEffect(() => {
    if (requestPermissionOnMount) {
      requestPermission();
    }

    return () => {
      if (watchId) {
        watchId.remove();
      }
    };
  }, [requestPermissionOnMount, requestPermission, watchId]);

  return {
    location,
    address,
    errorMsg,
    isLoading,
    hasPermission,
    isWatching,
    requestPermission,
    getCurrentLocation,
    getAddressFromCoordinates,
    startLocationWatch,
    stopLocationWatch,
  };
};
