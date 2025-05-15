/**
 * Mock untuk react-native-maps
 * Ini membantu mengatasi masalah "RNMapsAirModule could not be found"
 */
import React from 'react';
import { View, Text } from 'react-native';

// Konstanta untuk provider
export const PROVIDER_GOOGLE = 'google';
export const PROVIDER_DEFAULT = 'default';

// Kelas untuk AnimatedRegion
export class AnimatedRegion {
  region: any;

  constructor(region: any) {
    this.region = region;
  }

  timing(config: any) {
    return {
      start: (callback?: () => void) => {
        if (callback) setTimeout(callback, 0);
      }
    };
  }

  stopAnimation(callback?: (region: any) => void) {
    if (callback) callback(this.region);
  }

  addListener(callback: (region: any) => void) {
    return '1';
  }

  removeListener(id: string) { }
}

// Komponen Marker
export const Marker: React.FC<any> = ({ children }) => {
  return <View>{children}</View>;
};

// Komponen Callout
export const Callout: React.FC<any> = ({ children }) => {
  return <View>{children}</View>;
};

// Komponen Polygon
export const Polygon: React.FC<any> = () => {
  return null;
};

// Komponen Polyline
export const Polyline: React.FC<any> = () => {
  return null;
};

// Komponen Circle
export const Circle: React.FC<any> = () => {
  return null;
};

// Komponen Overlay
export const Overlay: React.FC<any> = () => {
  return null;
};

// Komponen Heatmap
export const Heatmap: React.FC<any> = () => {
  return null;
};

// Komponen Geojson
export const Geojson: React.FC<any> = () => {
  return null;
};

// Komponen utama MapView
const MapView: React.FC<any> & {
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
} = ({ children, style, ...props }) => {
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
