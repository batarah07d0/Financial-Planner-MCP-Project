import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
// Import dari mock untuk Expo Go
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Typography } from './Typography';
import { Button } from './Button';
import { theme } from '../theme';
import { useLocation, LocationData, LocationAddress } from '../hooks';

interface LocationPickerProps {
  initialLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  } | null;
  onLocationSelected: (location: {
    latitude: number;
    longitude: number;
    address?: string;
  } | null) => void;
  onCancel?: () => void;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  initialLocation,
  onLocationSelected,
  onCancel,
}) => {
  const mapRef = useRef<MapView>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(
    initialLocation
      ? {
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
        accuracy: undefined,
        altitude: undefined,
        heading: undefined,
        speed: undefined,
        timestamp: undefined
      }
      : null
  );
  const [selectedAddress, setSelectedAddress] = useState<string | undefined>(
    initialLocation?.address || undefined
  );
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: initialLocation?.latitude || -6.2088,  // Default: Jakarta
    longitude: initialLocation?.longitude || 106.8456,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const {
    location,
    isLoading: isLocationLoading,
    errorMsg,
    getCurrentLocation,
    getAddressFromCoordinates,
  } = useLocation();

  const [isAddressLoading, setIsAddressLoading] = useState(false);

  // Fungsi untuk mendapatkan lokasi saat ini
  const handleGetCurrentLocation = async () => {
    const currentLocation = await getCurrentLocation();

    if (currentLocation) {
      setSelectedLocation(currentLocation);

      // Pindahkan peta ke lokasi saat ini
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }

      // Dapatkan alamat dari koordinat
      await handleGetAddress(currentLocation.latitude, currentLocation.longitude);
    }
  };

  // Fungsi untuk mendapatkan alamat dari koordinat
  const handleGetAddress = async (latitude: number, longitude: number) => {
    setIsAddressLoading(true);

    try {
      const addressData = await getAddressFromCoordinates(latitude, longitude);

      if (addressData) {
        // Format alamat
        const formattedAddress = formatAddress(addressData);
        setSelectedAddress(formattedAddress);
      } else {
        setSelectedAddress(undefined);
      }
    } catch (error) {
      console.error('Error getting address:', error);
      setSelectedAddress(undefined);
    } finally {
      setIsAddressLoading(false);
    }
  };

  // Fungsi untuk memformat alamat
  const formatAddress = (address: LocationAddress): string => {
    const parts = [];

    if (address.street) {
      let streetPart = address.street;
      if (address.streetNumber) {
        streetPart += ` ${address.streetNumber}`;
      }
      parts.push(streetPart);
    }

    if (address.district) {
      parts.push(address.district);
    }

    if (address.city) {
      parts.push(address.city);
    }

    if (address.region) {
      parts.push(address.region);
    }

    if (address.postalCode) {
      parts.push(address.postalCode);
    }

    if (address.country) {
      parts.push(address.country);
    }

    return parts.join(', ');
  };

  // Fungsi untuk menangani klik pada peta
  const handleMapPress = (event: any) => {
    const { coordinate } = event.nativeEvent;

    setSelectedLocation({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      accuracy: undefined,
      altitude: undefined,
      heading: undefined,
      speed: undefined,
      timestamp: undefined
    });

    // Dapatkan alamat dari koordinat
    handleGetAddress(coordinate.latitude, coordinate.longitude);
  };

  // Fungsi untuk menangani konfirmasi lokasi
  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelected({
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        address: selectedAddress,
      });
    } else {
      onLocationSelected(null);
    }
  };

  // Fungsi untuk menangani pembatalan
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  // Fungsi untuk menangani reset lokasi
  const handleReset = () => {
    setSelectedLocation(null);
    setSelectedAddress(undefined);
  };

  // Dapatkan lokasi saat ini saat komponen dimount jika tidak ada lokasi awal
  useEffect(() => {
    if (!initialLocation) {
      handleGetCurrentLocation();
    }
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={mapRegion}
          onPress={handleMapPress}
        >
          {selectedLocation && (
            <Marker
              coordinate={{
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
              }}
            />
          )}
        </MapView>

        <View style={styles.mapOverlay}>
          <TouchableOpacity
            style={styles.currentLocationButton}
            onPress={handleGetCurrentLocation}
          >
            <Typography variant="body2" color={theme.colors.primary[500]}>
              Lokasi Saat Ini
            </Typography>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.addressContainer}>
        {isAddressLoading ? (
          <ActivityIndicator size="small" color={theme.colors.primary[500]} />
        ) : selectedAddress ? (
          <Typography variant="body1">{selectedAddress}</Typography>
        ) : (
          <Typography variant="body1" color={theme.colors.neutral[500]}>
            {selectedLocation
              ? 'Alamat tidak ditemukan'
              : 'Pilih lokasi pada peta'}
          </Typography>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Batal"
          variant="outline"
          onPress={handleCancel}
          style={styles.button}
        />
        <Button
          title="Reset"
          variant="ghost"
          onPress={handleReset}
          style={styles.button}
        />
        <Button
          title="Konfirmasi"
          onPress={handleConfirm}
          disabled={!selectedLocation}
          style={styles.button}
        />
      </View>
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  mapContainer: {
    height: height * 0.5,
    width: '100%',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  currentLocationButton: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    ...theme.elevation.sm,
  },
  addressContainer: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
    minHeight: 60,
    justifyContent: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
  },
  button: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
});
