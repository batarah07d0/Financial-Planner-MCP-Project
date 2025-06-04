/**
 * Mock untuk react-native-maps
 * Ini membantu mengatasi masalah "RNMapsAirModule could not be found"
 */
import React from 'react';
import { View, Text, ViewStyle } from 'react-native';

// Konstanta untuk provider
export const PROVIDER_GOOGLE = 'google';
export const PROVIDER_DEFAULT = 'default';

// Interface untuk props komponen
interface MarkerProps {
  children?: React.ReactNode;
  coordinate?: {
    latitude: number;
    longitude: number;
  };
  title?: string;
  description?: string;
}

interface CalloutProps {
  children?: React.ReactNode;
}

interface MapViewProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  region?: Region;
  initialRegion?: Region;
  provider?: string;
  onRegionChange?: (region: Region) => void;
  onRegionChangeComplete?: (region: Region) => void;
}

// Interface untuk region
interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

// Interface untuk timing config
interface TimingConfig {
  duration?: number;
  easing?: (value: number) => number;
}

// Interface untuk animation result
interface AnimationResult {
  start: (callback?: () => void) => void;
}

// Kelas untuk AnimatedRegion
export class AnimatedRegion {
  region: Region;

  constructor(region: Region) {
    this.region = region;
  }

  timing(_config: TimingConfig): AnimationResult {
    return {
      start: (callback?: () => void) => {
        if (callback) setTimeout(callback, 0);
      }
    };
  }

  stopAnimation(callback?: (region: Region) => void) {
    if (callback) callback(this.region);
  }

  addListener(_callback: (region: Region) => void): string {
    return '1';
  }

  removeListener(_id: string): void {
    // Mock implementation - no actual listener to remove
  }
}

// Komponen Marker
export const Marker: React.FC<MarkerProps> = ({ children }) => {
  return <View>{children}</View>;
};

// Komponen Callout
export const Callout: React.FC<CalloutProps> = ({ children }) => {
  return <View>{children}</View>;
};

// Komponen Polygon
export const Polygon: React.FC<Record<string, never>> = () => {
  return null;
};

// Komponen Polyline
export const Polyline: React.FC<Record<string, never>> = () => {
  return null;
};

// Komponen Circle
export const Circle: React.FC<Record<string, never>> = () => {
  return null;
};

// Komponen Overlay
export const Overlay: React.FC<Record<string, never>> = () => {
  return null;
};

// Komponen Heatmap
export const Heatmap: React.FC<Record<string, never>> = () => {
  return null;
};

// Komponen Geojson
export const Geojson: React.FC<Record<string, never>> = () => {
  return null;
};

// Komponen utama MapView
const MapView: React.FC<MapViewProps> & {
  Marker: typeof Marker;
  Callout: typeof Callout;
  Polygon: typeof Polygon;
  Polyline: typeof Polyline;
  Circle: typeof Circle;
  Overlay: typeof Overlay;
  Heatmap: typeof Heatmap;
  Geojson: typeof Geojson;
  PROVIDER_GOOGLE: typeof PROVIDER_GOOGLE;
  PROVIDER_DEFAULT: typeof PROVIDER_DEFAULT;
  AnimatedRegion: typeof AnimatedRegion;
} = ({ children, style }) => {
  return (
    <View style={[{ width: '100%', height: 300, backgroundColor: '#e0e0e0' }, style]}>
      <Text style={{ textAlign: 'center', marginTop: 20 }}>
        Map View (Mock)
      </Text>
      <View>{children}</View>
    </View>
  );
};

// Tambahkan properti statis ke MapView
MapView.Marker = Marker;
MapView.Callout = Callout;
MapView.Polygon = Polygon;
MapView.Polyline = Polyline;
MapView.Circle = Circle;
MapView.Overlay = Overlay;
MapView.Heatmap = Heatmap;
MapView.Geojson = Geojson;
MapView.PROVIDER_GOOGLE = PROVIDER_GOOGLE;
MapView.PROVIDER_DEFAULT = PROVIDER_DEFAULT;
MapView.AnimatedRegion = AnimatedRegion;

// Ekspor default
export default MapView;
