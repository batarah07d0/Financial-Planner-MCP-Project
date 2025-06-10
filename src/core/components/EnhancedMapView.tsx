import React, { forwardRef, useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Platform,
  ViewStyle,
  useColorScheme,
} from 'react-native';
import MapView, {
  Region,
  MapPressEvent,
  MarkerPressEvent,
  PROVIDER_GOOGLE,
  PROVIDER_DEFAULT,
} from 'react-native-maps';
import { theme } from '../theme';
import { MAPS_CONFIG } from '../../config/maps';

// Enhanced Map View Props
export interface EnhancedMapViewProps {
  style?: ViewStyle;
  initialRegion?: Region;
  region?: Region;
  onRegionChange?: (region: Region) => void;
  onRegionChangeComplete?: (region: Region) => void;
  onPress?: (event: MapPressEvent) => void;
  onMarkerPress?: (event: MarkerPressEvent) => void;
  onMapReady?: () => void;
  showsUserLocation?: boolean;
  followsUserLocation?: boolean;
  children?: React.ReactNode;
  mapType?: 'standard' | 'satellite' | 'hybrid' | 'terrain';
  customMapStyle?: 'modern' | 'dark' | 'auto' | 'none';
  animationDuration?: number;
  zoomEnabled?: boolean;
  scrollEnabled?: boolean;
  rotateEnabled?: boolean;
  pitchEnabled?: boolean;
  showsCompass?: boolean;
  showsScale?: boolean;
  showsBuildings?: boolean;
  showsTraffic?: boolean;
  showsIndoors?: boolean;
  loadingEnabled?: boolean;
  cacheEnabled?: boolean;
  enhancedVisuals?: boolean;
}

export const EnhancedMapView = forwardRef<MapView, EnhancedMapViewProps>(
  ({
    style,
    initialRegion = MAPS_CONFIG.DEFAULT_REGION,
    region,
    onRegionChange,
    onRegionChangeComplete,
    onPress,
    onMarkerPress,
    onMapReady,
    showsUserLocation = true,
    followsUserLocation = false,
    children,
    mapType = 'standard',
    customMapStyle = 'auto',
    zoomEnabled = true,
    scrollEnabled = true,
    rotateEnabled = true,
    pitchEnabled = true,
    showsCompass = true,
    showsScale = true,
    showsBuildings = true,
    showsTraffic = false,
    showsIndoors = true,
    loadingEnabled = true,
    cacheEnabled = true,
    enhancedVisuals = true,
  }, ref) => {
    const [isMapReady, setIsMapReady] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const colorScheme = useColorScheme();

    // Get custom map style based on preference and system theme
    const getCustomMapStyle = () => {
      if (customMapStyle === 'none') return [];
      
      if (customMapStyle === 'auto') {
        return colorScheme === 'dark' 
          ? MAPS_CONFIG.CUSTOM_STYLES.DARK_MODE 
          : MAPS_CONFIG.CUSTOM_STYLES.MODERN_LIGHT;
      }
      
      if (customMapStyle === 'dark') {
        return MAPS_CONFIG.CUSTOM_STYLES.DARK_MODE;
      }
      
      return MAPS_CONFIG.CUSTOM_STYLES.MODERN_LIGHT;
    };

    // Enhanced animation on map ready
    useEffect(() => {
      if (isMapReady && enhancedVisuals) {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      } else if (!enhancedVisuals) {
        fadeAnim.setValue(1);
      }
    }, [isMapReady, enhancedVisuals, fadeAnim]);

    // Handle map ready with enhanced features
    const handleMapReady = () => {
      setIsMapReady(true);
      if (onMapReady) {
        onMapReady();
      }
    };

    // Get provider based on platform
    const getProvider = () => {
      if (Platform.OS === 'android') {
        return PROVIDER_GOOGLE;
      }
      return PROVIDER_DEFAULT;
    };

    return (
      <View style={[styles.container, style]}>
        <Animated.View 
          style={[
            styles.mapContainer, 
            enhancedVisuals && { opacity: fadeAnim },
            enhancedVisuals && styles.enhancedContainer
          ]}
        >
          <MapView
            ref={ref}
            style={styles.map}
            provider={getProvider()}
            initialRegion={initialRegion}
            region={region}
            onRegionChange={onRegionChange}
            onRegionChangeComplete={onRegionChangeComplete}
            onPress={onPress}
            onMarkerPress={onMarkerPress}
            onMapReady={handleMapReady}
            showsUserLocation={showsUserLocation}
            followsUserLocation={followsUserLocation}
            mapType={mapType}
            customMapStyle={getCustomMapStyle()}
            zoomEnabled={zoomEnabled}
            scrollEnabled={scrollEnabled}
            rotateEnabled={rotateEnabled}
            pitchEnabled={pitchEnabled}
            showsCompass={showsCompass}
            showsScale={showsScale}
            showsBuildings={showsBuildings}
            showsTraffic={showsTraffic}
            showsIndoors={showsIndoors}
            loadingEnabled={loadingEnabled}
            cacheEnabled={cacheEnabled}
            loadingIndicatorColor={theme.colors.primary[500]}
            loadingBackgroundColor={colorScheme === 'dark' ? theme.colors.neutral[900] : theme.colors.white}
          >
            {children}
          </MapView>
        </Animated.View>
      </View>
    );
  }
);

EnhancedMapView.displayName = 'EnhancedMapView';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[100],
  },
  mapContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  enhancedContainer: {
    elevation: 12,
    shadowColor: theme.colors.neutral[900],
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  map: {
    flex: 1,
  },
});
