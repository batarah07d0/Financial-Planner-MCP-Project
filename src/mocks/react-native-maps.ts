/**
 * Mock untuk react-native-maps
 * Ini membantu mengatasi masalah import react-native-maps di environment testing
 */

import React from 'react';
import { View, ViewProps } from 'react-native';

// Mock types
export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface MapPressEvent {
  nativeEvent: {
    coordinate: LatLng;
    position: {
      x: number;
      y: number;
    };
  };
}

export interface MarkerPressEvent {
  nativeEvent: {
    coordinate: LatLng;
    position: {
      x: number;
      y: number;
    };
    id: string;
  };
}

export interface MarkerProps extends ViewProps {
  coordinate: LatLng;
  title?: string;
  description?: string;
  image?: object;
  pinColor?: string;
  anchor?: { x: number; y: number };
  calloutAnchor?: { x: number; y: number };
  flat?: boolean;
  identifier?: string;
  rotation?: number;
  draggable?: boolean;
  onPress?: (event: MarkerPressEvent) => void;
  onSelect?: (event: MarkerPressEvent) => void;
  onDeselect?: (event: MarkerPressEvent) => void;
  onCalloutPress?: () => void;
  onDragStart?: (event: MarkerPressEvent) => void;
  onDrag?: (event: MarkerPressEvent) => void;
  onDragEnd?: (event: MarkerPressEvent) => void;
  zIndex?: number;
  opacity?: number;
}

interface Camera {
  center: LatLng;
  pitch?: number;
  heading?: number;
  altitude?: number;
  zoom?: number;
}

export interface MapViewProps extends ViewProps {
  provider?: 'google' | 'default';
  region?: Region;
  initialRegion?: Region;
  camera?: Camera;
  initialCamera?: Camera;
  mapType?: 'standard' | 'satellite' | 'hybrid' | 'terrain';
  customMapStyle?: object[];
  userLocationAnnotationTitle?: string;
  showsUserLocation?: boolean;
  followsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  showsPointsOfInterest?: boolean;
  showsCompass?: boolean;
  showsScale?: boolean;
  showsBuildings?: boolean;
  showsTraffic?: boolean;
  showsIndoors?: boolean;
  zoomEnabled?: boolean;
  zoomTapEnabled?: boolean;
  zoomControlEnabled?: boolean;
  scrollEnabled?: boolean;
  scrollDuringRotateOrZoomEnabled?: boolean;
  rotateEnabled?: boolean;
  pitchEnabled?: boolean;
  toolbarEnabled?: boolean;
  cacheEnabled?: boolean;
  loadingEnabled?: boolean;
  loadingIndicatorColor?: string;
  loadingBackgroundColor?: string;
  moveOnMarkerPress?: boolean;
  liteMode?: boolean;
  mapPadding?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  maxDelta?: number;
  minDelta?: number;
  legalLabelInsets?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  onRegionChange?: (region: Region) => void;
  onRegionChangeComplete?: (region: Region) => void;
  onPress?: (event: MapPressEvent) => void;
  onLongPress?: (event: MapPressEvent) => void;
  onMarkerPress?: (event: MarkerPressEvent) => void;
  onMarkerSelect?: (event: MarkerPressEvent) => void;
  onMarkerDeselect?: (event: MarkerPressEvent) => void;
  onCalloutPress?: () => void;
  onMarkerDragStart?: (event: MarkerPressEvent) => void;
  onMarkerDrag?: (event: MarkerPressEvent) => void;
  onMarkerDragEnd?: (event: MarkerPressEvent) => void;
  onPanDrag?: (event: MapPressEvent) => void;
  onUserLocationChange?: (event: object) => void;
  onMapReady?: () => void;
  onKmlReady?: () => void;
  onPoiClick?: (event: object) => void;
  onIndoorLevelActivated?: (event: object) => void;
  onIndoorBuildingFocused?: (event: object) => void;
  minZoomLevel?: number;
  maxZoomLevel?: number;
}

// Mock components
export const MapView = React.forwardRef<View, MapViewProps>((props, ref) => {
  return React.createElement(View, { ...props, ref });
});

MapView.displayName = 'MapView';

export const Marker: React.FC<MarkerProps> = (props) => {
  return React.createElement(View, props);
};

export const Callout: React.FC<ViewProps> = (props) => {
  return React.createElement(View, props);
};

export const Polygon: React.FC<ViewProps> = (props) => {
  return React.createElement(View, props);
};

export const Polyline: React.FC<ViewProps> = (props) => {
  return React.createElement(View, props);
};

export const Circle: React.FC<ViewProps> = (props) => {
  return React.createElement(View, props);
};

export const Overlay: React.FC<ViewProps> = (props) => {
  return React.createElement(View, props);
};

export const Heatmap: React.FC<ViewProps> = (props) => {
  return React.createElement(View, props);
};

export const Geojson: React.FC<ViewProps> = (props) => {
  return React.createElement(View, props);
};

// Constants
export const PROVIDER_GOOGLE = 'google';
export const PROVIDER_DEFAULT = 'default';

// Default export
export default MapView;
