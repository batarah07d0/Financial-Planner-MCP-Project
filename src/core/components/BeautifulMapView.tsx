import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Platform,
  ViewStyle,
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

// Types
export interface BeautifulMapViewProps {
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
  customMapStyle?: MapStyleElement[];
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
}

// Types for map boundaries
interface MapBoundaries {
  northEast: { latitude: number; longitude: number };
  southWest: { latitude: number; longitude: number };
}

// Types for camera
interface Camera {
  center: { latitude: number; longitude: number };
  pitch?: number;
  heading?: number;
  altitude?: number;
  zoom?: number;
}

// Types for coordinates and points
interface Coordinate {
  latitude: number;
  longitude: number;
}

interface Point {
  x: number;
  y: number;
}

// Types for snapshot options
interface SnapshotOptions {
  format?: 'png' | 'jpg';
  quality?: number;
  result?: 'file' | 'base64';
  width?: number;
  height?: number;
}

// Types for fit options
interface FitOptions {
  animated?: boolean;
  edgePadding?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
}

// Types for react-native-maps fitToCoordinates
interface MapFitOptions {
  animated?: boolean;
  edgePadding?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

// Types for map style
interface MapStyleElement {
  featureType?: string;
  elementType?: string;
  stylers: Array<{
    [key: string]: string | number | boolean;
  }>;
}

export interface BeautifulMapViewRef {
  animateToRegion: (region: Region, duration?: number) => void;
  animateToCoordinate: (coordinate: Coordinate, duration?: number) => void;
  fitToElements: (animated?: boolean) => void;
  fitToSuppliedMarkers: (markers: string[], animated?: boolean) => void;
  fitToCoordinates: (coordinates: Coordinate[], options?: FitOptions) => void;
  getMapBoundaries: () => Promise<MapBoundaries | null>;
  setMapBoundaries: (northEast: Coordinate, southWest: Coordinate) => void;
  takeSnapshot: (options?: SnapshotOptions) => Promise<string>;
  pointForCoordinate: (coordinate: Coordinate) => Promise<Point | null>;
  coordinateForPoint: (point: Point) => Promise<Coordinate | null>;
  getCamera: () => Promise<Camera | null>;
  setCamera: (camera: Camera) => void;
  animateCamera: (camera: Camera, duration?: number) => void;
}

// Beautiful MapView Component
export const BeautifulMapView = forwardRef<BeautifulMapViewRef, BeautifulMapViewProps>(
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
    customMapStyle = [],
    animationDuration = MAPS_CONFIG.ANIMATIONS.REGION_CHANGE_DURATION,
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
  }, ref) => {
    const mapRef = useRef<MapView>(null);
    const [isMapReady, setIsMapReady] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Expose methods through ref
    useImperativeHandle(ref, () => ({
      animateToRegion: (targetRegion: Region, duration = animationDuration) => {
        if (mapRef.current && isMapReady) {
          mapRef.current.animateToRegion(targetRegion, duration);
        }
      },
      animateToCoordinate: (coordinate: { latitude: number; longitude: number }, duration = animationDuration) => {
        if (mapRef.current && isMapReady) {
          // Use animateToRegion instead of animateToCoordinate
          mapRef.current.animateToRegion({
            latitude: coordinate.latitude,
            longitude: coordinate.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }, duration);
        }
      },
      fitToElements: (animated = true) => {
        if (mapRef.current && isMapReady) {
          mapRef.current.fitToElements({ animated });
        }
      },
      fitToSuppliedMarkers: (markers: string[], animated = true) => {
        if (mapRef.current && isMapReady) {
          mapRef.current.fitToSuppliedMarkers(markers, { animated });
        }
      },
      fitToCoordinates: (coordinates: { latitude: number; longitude: number }[], options = {}) => {
        if (mapRef.current && isMapReady) {
          const defaultOptions = {
            animated: true,
            edgePadding: {
              top: 50,
              right: 50,
              bottom: 50,
              left: 50,
            },
          };

          mapRef.current.fitToCoordinates(coordinates, {
            ...defaultOptions,
            ...options,
          } as MapFitOptions);
        }
      },
      getMapBoundaries: async () => {
        if (mapRef.current && isMapReady) {
          return await mapRef.current.getMapBoundaries();
        }
        return null;
      },
      setMapBoundaries: (northEast: Coordinate, southWest: Coordinate) => {
        if (mapRef.current && isMapReady) {
          mapRef.current.setMapBoundaries(northEast, southWest);
        }
      },
      takeSnapshot: async (options: SnapshotOptions = {}) => {
        if (mapRef.current && isMapReady) {
          return await mapRef.current.takeSnapshot({
            format: 'png',
            quality: 0.8,
            result: 'file',
            ...options,
          });
        }
        return '';
      },
      pointForCoordinate: async (coordinate: Coordinate) => {
        if (mapRef.current && isMapReady) {
          return await mapRef.current.pointForCoordinate(coordinate);
        }
        return null;
      },
      coordinateForPoint: async (point: Point) => {
        if (mapRef.current && isMapReady) {
          return await mapRef.current.coordinateForPoint(point);
        }
        return null;
      },
      getCamera: async () => {
        if (mapRef.current && isMapReady) {
          return await mapRef.current.getCamera();
        }
        return null;
      },
      setCamera: (camera: Camera) => {
        if (mapRef.current && isMapReady) {
          mapRef.current.setCamera(camera);
        }
      },
      animateCamera: (camera: Camera, duration = animationDuration) => {
        if (mapRef.current && isMapReady) {
          mapRef.current.animateCamera(camera, { duration });
        }
      },
    }));

    // Handle map ready
    const handleMapReady = () => {
      setIsMapReady(true);
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      // Call external onMapReady if provided
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
        <Animated.View style={[styles.mapContainer, { opacity: fadeAnim }]}>
          <MapView
            ref={mapRef}
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
            customMapStyle={customMapStyle}
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
            loadingBackgroundColor={theme.colors.white}
          >
            {children}
          </MapView>
        </Animated.View>
      </View>
    );
  }
);

BeautifulMapView.displayName = 'BeautifulMapView';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[100],
  },
  mapContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: theme.colors.neutral[900],
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  map: {
    flex: 1,
  },
});
