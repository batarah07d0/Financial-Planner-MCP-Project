import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  TextInput,
  Animated,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Typography } from './Typography';
import { Button } from './Button';
import { theme } from '../theme';
import { useLocation, LocationData, LocationAddress } from '../hooks';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

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
  const [mapRegion] = useState<Region>({
    latitude: initialLocation?.latitude || -6.2088,  // Default: Jakarta
    longitude: initialLocation?.longitude || 106.8456,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const {
    getCurrentLocation,
    getAddressFromCoordinates,
  } = useLocation();

  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;

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

  // Fungsi untuk animasi masuk
  const startEntranceAnimation = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: theme.duration.normal,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: theme.duration.normal,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Fungsi untuk toggle search bar
  const toggleSearchBar = () => {
    setShowSearchBar(!showSearchBar);
  };

  // Fungsi untuk handle map ready
  const handleMapReady = () => {
    setIsMapLoading(false);
    startEntranceAnimation();
  };

  // Dapatkan lokasi saat ini saat komponen dimount jika tidak ada lokasi awal
  useEffect(() => {
    if (!initialLocation) {
      handleGetCurrentLocation();
    }
    // Start entrance animation
    setTimeout(() => {
      startEntranceAnimation();
    }, 100);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header dengan Gradient */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={[theme.colors.primary[500], theme.colors.primary[600]]}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={theme.colors.white} />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Typography
                variant="h3"
                color={theme.colors.white}
                weight="600"
              >
                Pilih Lokasi
              </Typography>
              <Typography
                variant="body2"
                color={theme.colors.white}
                style={{ opacity: 0.9 }}
              >
                Ketuk pada peta untuk memilih lokasi
              </Typography>
            </View>

            <TouchableOpacity
              style={styles.searchButton}
              onPress={toggleSearchBar}
              activeOpacity={0.7}
            >
              <Ionicons
                name={showSearchBar ? "search" : "search-outline"}
                size={24}
                color={theme.colors.white}
              />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Search Bar (Conditional) */}
      {showSearchBar && (
        <Animated.View style={[styles.searchContainer, { opacity: fadeAnim }]}>
          <View style={styles.searchInputContainer}>
            <Ionicons
              name="search"
              size={20}
              color={theme.colors.neutral[400]}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari alamat atau tempat..."
              placeholderTextColor={theme.colors.neutral[400]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={theme.colors.neutral[400]}
                />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}

      {/* Map Container */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={mapRegion}
          onPress={handleMapPress}
          onMapReady={handleMapReady}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass={false}
          rotateEnabled={true}
          zoomEnabled={true}
          scrollEnabled={true}
          pitchEnabled={true}
        >
          {selectedLocation && (
            <Marker
              coordinate={{
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
              }}
            >
              <View style={styles.customMarker}>
                <View style={styles.markerInner}>
                  <Ionicons
                    name="location"
                    size={20}
                    color={theme.colors.white}
                  />
                </View>
                <View style={styles.markerShadow} />
              </View>
            </Marker>
          )}
        </MapView>

        {/* Map Loading Overlay */}
        {isMapLoading && (
          <View style={styles.mapLoadingOverlay}>
            <ActivityIndicator size="large" color={theme.colors.primary[500]} />
            <Typography
              variant="body2"
              color={theme.colors.neutral[600]}
              style={styles.loadingText}
            >
              Memuat peta...
            </Typography>
          </View>
        )}

        {/* Floating Action Buttons */}
        <Animated.View
          style={[
            styles.floatingButtons,
            { opacity: fadeAnim }
          ]}
        >
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={handleGetCurrentLocation}
            activeOpacity={0.8}
          >
            <Ionicons
              name="locate"
              size={24}
              color={theme.colors.primary[500]}
            />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Address Display Card */}
      <Animated.View
        style={[
          styles.addressCard,
          { opacity: fadeAnim }
        ]}
      >
        <View style={styles.addressHeader}>
          <Ionicons
            name="location-outline"
            size={20}
            color={theme.colors.primary[500]}
          />
          <Typography
            variant="body1"
            weight="600"
            color={theme.colors.neutral[800]}
            style={styles.addressTitle}
          >
            Alamat Terpilih
          </Typography>
        </View>

        <View style={styles.addressContent}>
          {isAddressLoading ? (
            <View style={styles.addressLoading}>
              <ActivityIndicator size="small" color={theme.colors.primary[500]} />
              <Typography
                variant="body2"
                color={theme.colors.neutral[500]}
                style={styles.loadingText}
              >
                Mencari alamat...
              </Typography>
            </View>
          ) : selectedAddress ? (
            <Typography
              variant="body2"
              color={theme.colors.neutral[700]}
              style={styles.addressText}
            >
              {selectedAddress}
            </Typography>
          ) : (
            <Typography
              variant="body2"
              color={theme.colors.neutral[400]}
              style={styles.addressPlaceholder}
            >
              {selectedLocation
                ? 'Alamat tidak ditemukan'
                : 'Belum ada lokasi yang dipilih'}
            </Typography>
          )}
        </View>
      </Animated.View>

      {/* Action Buttons */}
      <Animated.View
        style={[
          styles.actionContainer,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity
          style={[styles.actionButton, styles.cancelButton]}
          onPress={handleCancel}
          activeOpacity={0.8}
        >
          <Ionicons
            name="close-outline"
            size={20}
            color={theme.colors.neutral[600]}
          />
          <Typography
            variant="body1"
            weight="500"
            color={theme.colors.neutral[600]}
            style={styles.buttonText}
          >
            Batal
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.resetButton]}
          onPress={handleReset}
          activeOpacity={0.8}
        >
          <Ionicons
            name="refresh-outline"
            size={20}
            color={theme.colors.neutral[600]}
          />
          <Typography
            variant="body1"
            weight="500"
            color={theme.colors.neutral[600]}
            style={styles.buttonText}
          >
            Reset
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.confirmButton,
            !selectedLocation && styles.disabledButton
          ]}
          onPress={handleConfirm}
          disabled={!selectedLocation}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={
              selectedLocation
                ? [theme.colors.primary[500], theme.colors.primary[600]]
                : [theme.colors.neutral[300], theme.colors.neutral[400]]
            }
            style={styles.confirmGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons
              name="checkmark-outline"
              size={20}
              color={theme.colors.white}
            />
            <Typography
              variant="body1"
              weight="600"
              color={theme.colors.white}
              style={styles.buttonText}
            >
              Konfirmasi
            </Typography>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

const { height, width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },

  // Header Styles
  header: {
    zIndex: 1000,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 0 : theme.spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: theme.spacing.md,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Search Styles
  searchContainer: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
    ...theme.elevation.xs,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral[100],
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.neutral[800],
    paddingVertical: theme.spacing.xs,
  },
  clearButton: {
    padding: theme.spacing.xs,
  },

  // Map Styles
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: theme.spacing.sm,
  },

  // Custom Marker Styles
  customMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: theme.colors.white,
    ...theme.elevation.md,
  },
  markerShadow: {
    position: 'absolute',
    bottom: -5,
    width: 20,
    height: 10,
    borderRadius: 10,
    backgroundColor: theme.colors.black,
    opacity: 0.2,
  },

  // Floating Button Styles
  floatingButtons: {
    position: 'absolute',
    top: theme.spacing.lg,
    right: theme.spacing.lg,
  },
  floatingButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
    ...theme.elevation.md,
  },

  // Address Card Styles
  addressCard: {
    backgroundColor: theme.colors.white,
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.elevation.sm,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  addressTitle: {
    marginLeft: theme.spacing.sm,
  },
  addressContent: {
    minHeight: 50,
    justifyContent: 'center',
  },
  addressLoading: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressText: {
    lineHeight: 22,
  },
  addressPlaceholder: {
    fontStyle: 'italic',
  },

  // Action Button Styles
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.xs,
    minHeight: 50,
  },
  cancelButton: {
    backgroundColor: theme.colors.neutral[100],
    borderWidth: 1,
    borderColor: theme.colors.neutral[300],
  },
  resetButton: {
    backgroundColor: theme.colors.neutral[100],
    borderWidth: 1,
    borderColor: theme.colors.neutral[300],
  },
  confirmButton: {
    flex: 1.5,
  },
  confirmGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    minHeight: 50,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    marginLeft: theme.spacing.xs,
  },
});
