import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Animated,
  Platform,
} from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { EnhancedMapView } from './EnhancedMapView';
import { Typography } from './Typography';
import { theme } from '../theme';
import { useLocation, LocationData, LocationAddress } from '../hooks';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MAPS_CONFIG } from '../../config/maps';
// Hapus import Location - tidak digunakan lagi

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
    latitude: initialLocation?.latitude || MAPS_CONFIG.DEFAULT_REGION.latitude,
    longitude: initialLocation?.longitude || MAPS_CONFIG.DEFAULT_REGION.longitude,
    latitudeDelta: MAPS_CONFIG.DEFAULT_REGION.latitudeDelta,
    longitudeDelta: MAPS_CONFIG.DEFAULT_REGION.longitudeDelta,
  });

  const {
    getCurrentLocation,
    getAddressFromCoordinates,
  } = useLocation();

  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(true);

  // State untuk tracking current region untuk zoom
  const [currentRegion, setCurrentRegion] = useState<Region>(mapRegion);

  // State untuk tracking location loading
  const [isTrackingLocation, setIsTrackingLocation] = useState<boolean>(false);

  // State untuk user location yang stabil - ini adalah lokasi GPS aktual (SINGLE SOURCE OF TRUTH)
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);

  // Hapus state yang tidak digunakan - simplified untuk native controls only

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;

  // Refs untuk kontrol lifecycle dan stabilitas
  const isInitializedRef = useRef(false);
  const getCurrentLocationRef = useRef(getCurrentLocation);
  const getAddressFromCoordinatesRef = useRef(getAddressFromCoordinates);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleGetAddressRef = useRef<((lat: number, lng: number) => Promise<void>) | null>(null);
  const startEntranceAnimationRef = useRef<(() => void) | null>(null);

  // Update refs ketika fungsi berubah
  useEffect(() => {
    getCurrentLocationRef.current = getCurrentLocation;
    getAddressFromCoordinatesRef.current = getAddressFromCoordinates;
  }, [getCurrentLocation, getAddressFromCoordinates]);

  // Update function refs
  useEffect(() => {
    handleGetAddressRef.current = handleGetAddress;
    startEntranceAnimationRef.current = startEntranceAnimation;
  });

  // Fungsi untuk mendapatkan alamat dari koordinat dengan debounce
  const handleGetAddress = useCallback(async (latitude: number, longitude: number) => {
    // Clear previous debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Cegah multiple concurrent requests
    if (isAddressLoading) return;

    // Debounce untuk mengurangi API calls
    debounceTimeoutRef.current = setTimeout(async () => {
      setIsAddressLoading(true);

      try {
        const addressData = await getAddressFromCoordinatesRef.current(latitude, longitude);

        if (addressData) {
          // Format alamat
          const formattedAddress = formatAddress(addressData);
          setSelectedAddress(formattedAddress);
        } else {
          setSelectedAddress(undefined);
        }
      } catch (error) {
        // Error getting address - silently fail
        setSelectedAddress(undefined);
      } finally {
        setIsAddressLoading(false);
      }
    }, 500); // 500ms debounce
  }, [isAddressLoading]);

  // Hapus utility functions - simplified untuk native controls only

  // Hapus handleGetCurrentLocation - biarkan menggunakan native location controls

  // Hapus custom zoom functions - biarkan menggunakan native Google Maps controls

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

  // Fungsi untuk menangani perubahan region map
  const handleRegionChangeComplete = useCallback((region: Region) => {
    // Update current region untuk tracking zoom
    setCurrentRegion(region);

    // HANYA update selected location jika tidak ada user location aktif
    // Ini mencegah konflik dengan GPS location yang sudah akurat
    if (!userLocation && !isTrackingLocation) {
      const centerLocation: LocationData = {
        latitude: region.latitude,
        longitude: region.longitude,
        accuracy: undefined,
        altitude: undefined,
        heading: undefined,
        speed: undefined,
        timestamp: Date.now()
      };

      setSelectedLocation(centerLocation);

      // Dapatkan alamat dari koordinat dengan debounce yang lebih lama
      setTimeout(() => {
        if (!userLocation && !isTrackingLocation) {
          handleGetAddress(region.latitude, region.longitude);
        }
      }, 500); // Increase debounce untuk mengurangi API calls
    }
  }, [userLocation, isTrackingLocation, handleGetAddress]);

  // Fungsi untuk menangani tap pada peta - update center dan alamat saja (tanpa marker tambahan)
  const handleMapPress = useCallback(async (event: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
    const { coordinate } = event.nativeEvent;
    const { latitude, longitude } = coordinate;

    // Update selectedLocation untuk alamat, tapi tetap prioritaskan userLocation untuk display
    const newLocation: LocationData = {
      latitude,
      longitude,
      accuracy: undefined,
      altitude: undefined,
      heading: undefined,
      speed: undefined,
      timestamp: Date.now()
    };

    // Hanya update selectedLocation untuk alamat, jangan ubah userLocation
    setSelectedLocation(newLocation);

    // Update region untuk center ke posisi baru dengan zoom yang sesuai
    const newRegion: Region = {
      latitude,
      longitude,
      latitudeDelta: currentRegion.latitudeDelta,
      longitudeDelta: currentRegion.longitudeDelta
    };

    setCurrentRegion(newRegion);

    // Animasikan map ke lokasi yang diklik
    if (mapRef.current) {
      mapRef.current.animateToRegion(newRegion, 500);
    }

    // Dapatkan alamat dari koordinat
    await handleGetAddress(latitude, longitude);
  }, [currentRegion, handleGetAddress]);

  // Fungsi untuk menangani konfirmasi lokasi - prioritas userLocation (blue dot)
  const handleConfirm = useCallback(() => {
    // Prioritas MUTLAK: userLocation (blue dot GPS) untuk akurasi maksimal
    // Fallback: selectedLocation jika tidak ada GPS
    const finalLocation = userLocation || selectedLocation;

    if (finalLocation) {
      onLocationSelected({
        latitude: finalLocation.latitude,
        longitude: finalLocation.longitude,
        address: selectedAddress,
      });
    } else {
      onLocationSelected(null);
    }
  }, [userLocation, selectedLocation, selectedAddress, onLocationSelected]);

  // Fungsi untuk menangani pembatalan
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  // Fungsi untuk menangani reset lokasi - simplified
  const handleReset = useCallback(() => {
    // Reset semua state location
    setUserLocation(null);
    setSelectedLocation(null);
    setSelectedAddress(undefined);

    // Reset loading states
    setIsTrackingLocation(false);
    setIsAddressLoading(false);

    // Clear any pending debounce
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }

    // Reset region ke initial dengan smooth animation
    setCurrentRegion(mapRegion);
    if (mapRef.current) {
      mapRef.current.animateToRegion(mapRegion, 1500);
    }
  }, [mapRegion]);

  // Fungsi untuk animasi masuk - menggunakan useRef untuk stabilitas
  const startEntranceAnimation = useCallback(() => {
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
  }, [fadeAnim, slideAnim]);

  // Fungsi untuk toggle search bar
  const toggleSearchBar = () => {
    setShowSearchBar(!showSearchBar);
  };

  // Fungsi untuk handle map ready
  const handleMapReady = useCallback(() => {
    setIsMapLoading(false);

    if (startEntranceAnimationRef.current) {
      startEntranceAnimationRef.current();
    }

    if (__DEV__) {
      // console.log('Map loaded successfully');
    }
  }, []);



  // Effect untuk inisialisasi komponen - hanya dijalankan sekali
  useEffect(() => {
    // Cegah multiple initialization
    if (isInitializedRef.current) return;

    let isMounted = true;
    let animationTimeout: ReturnType<typeof setTimeout>;
    let mapLoadingTimeout: ReturnType<typeof setTimeout>;

    const initializeComponent = async () => {
      isInitializedRef.current = true;

      // Start entrance animation
      animationTimeout = setTimeout(() => {
        if (isMounted && startEntranceAnimationRef.current) {
          startEntranceAnimationRef.current();
        }
      }, 100);

      // Set timeout untuk loading peta (fallback jika onMapReady tidak dipanggil)
      mapLoadingTimeout = setTimeout(() => {
        if (isMounted) {
          setIsMapLoading(false);
          if (__DEV__) {
            // console.log('Map loading timeout - forcing completion');
          }
        }
      }, MAPS_CONFIG.TIMEOUTS.MAP_LOADING);

      // Dapatkan lokasi saat ini jika tidak ada lokasi awal
      if (!initialLocation && isMounted) {
        try {
          const currentLocation = await getCurrentLocationRef.current();
          if (currentLocation && isMounted) {
            const locationWithTimestamp = {
              ...currentLocation,
              timestamp: Date.now()
            };

            setUserLocation(locationWithTimestamp);
            setSelectedLocation(locationWithTimestamp);

            // Pindahkan peta ke lokasi saat ini
            if (mapRef.current) {
              const newRegion = {
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              };
              setCurrentRegion(newRegion);
              mapRef.current.animateToRegion(newRegion);
            }

            // Dapatkan alamat dari koordinat
            if (handleGetAddressRef.current) {
              await handleGetAddressRef.current(currentLocation.latitude, currentLocation.longitude);
            }
          }
        } catch (error) {
          if (__DEV__) {
            // console.log('Error getting initial location:', error);
          }
        }
      }
    };

    initializeComponent();

    return () => {
      isMounted = false;
      if (animationTimeout) {
        clearTimeout(animationTimeout);
      }
      if (mapLoadingTimeout) {
        clearTimeout(mapLoadingTimeout);
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [initialLocation]); // Hanya dependency yang benar-benar diperlukan

  // Effect untuk cleanup saat unmount
  useEffect(() => {
    return () => {
      // Reset loading states
      setIsAddressLoading(false);
      setIsMapLoading(false);

      // Clear debounce timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
    };
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
                variant="h5"
                color={theme.colors.white}
                weight="600"
              >
                Pilih Lokasi
              </Typography>
              <Typography
                variant="body2"
                color={theme.colors.white}
                style={{ opacity: 0.9, textAlign: 'center' }}
              >
                Tap pada peta untuk memilih
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
        <EnhancedMapView
          ref={mapRef}
          style={styles.map}
          initialRegion={mapRegion}
          onPress={handleMapPress}
          onRegionChangeComplete={handleRegionChangeComplete}
          onMapReady={handleMapReady}
          showsUserLocation={true} // Gunakan marker bawaan Google Maps untuk akurasi maksimal
          followsUserLocation={false}
          showsCompass={true}
          showsScale={true}
          showsBuildings={true}
          rotateEnabled={true}
          zoomEnabled={true}
          scrollEnabled={true}
          pitchEnabled={true}
          loadingEnabled={true}
          cacheEnabled={true}
          customMapStyle="auto"
          enhancedVisuals={true}

        >
          {/*
            TIDAK ADA MARKER TAMBAHAN - Hanya gunakan blue dot native Google Maps
            Ini memberikan akurasi maksimal dan pengalaman yang clean
          */}
        </EnhancedMapView>



        {/* Map Loading Overlay */}
        {isMapLoading && (
          <View style={styles.mapLoadingOverlay}>
            <View style={styles.loadingContent}>
              <ActivityIndicator size="large" color={theme.colors.primary[500]} />
              <Typography
                variant="body1"
                color={theme.colors.neutral[700]}
                weight="500"
                style={styles.loadingTitle}
              >
                Memuat Peta
              </Typography>
              <Typography
                variant="body2"
                color={theme.colors.neutral[500]}
                style={styles.loadingSubtitle}
              >
                Mohon tunggu sebentar...
              </Typography>
              <View style={styles.loadingProgress}>
                <View style={styles.progressBar}>
                  <View style={styles.progressFill} />
                </View>
              </View>
            </View>
          </View>
        )}

        {/*
          HAPUS SEMUA CUSTOM CONTROLS - Biarkan menggunakan native Google Maps controls
          Ini memberikan konsistensi dan behavior yang optimal
        */}
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
              {(userLocation || selectedLocation)
                ? 'Alamat tidak ditemukan'
                : 'Tap pada peta atau gunakan tombol lokasi'}
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
            !(userLocation || selectedLocation) && styles.disabledButton
          ]}
          onPress={handleConfirm}
          disabled={!(userLocation || selectedLocation)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={
              (userLocation || selectedLocation)
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
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    position: 'relative',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: theme.spacing.lg,
    zIndex: 1,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 60, // Space for buttons on both sides
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: theme.spacing.lg,
    zIndex: 1,
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
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  loadingTitle: {
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  loadingSubtitle: {
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  loadingProgress: {
    marginTop: theme.spacing.lg,
    width: 200,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '60%',
    backgroundColor: theme.colors.primary[500],
    borderRadius: 2,
  },

  // Crosshair Styles (menggantikan marker)


  // Hapus floating button styles - tidak digunakan lagi

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
    height: 50, // Fixed height instead of minHeight
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
    height: 50, // Fixed height instead of minHeight
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    marginLeft: theme.spacing.xs,
  },
});
