import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Typography } from './Typography';
import { theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';

interface StaticMapPreviewProps {
  latitude: number;
  longitude: number;
  width?: number;
  height?: number;
  zoom?: number;
  onPress?: () => void;
  showMarker?: boolean;
  style?: any;
}

export const StaticMapPreview: React.FC<StaticMapPreviewProps> = ({
  latitude,
  longitude,
  width = 300,
  height = 200,
  zoom = 15,
  onPress,
  showMarker = true,
  style,
}) => {
  // Menggunakan OpenStreetMap static tiles (gratis)
  const getStaticMapUrl = () => {
    // Menggunakan service seperti MapBox Static API (dengan free tier)
    // Atau bisa menggunakan OpenStreetMap tiles
    const baseUrl = 'https://api.mapbox.com/styles/v1/mapbox/streets-v11/static';
    const marker = showMarker ? `pin-s+ff0000(${longitude},${latitude})/` : '';
    const mapboxToken = 'YOUR_MAPBOX_TOKEN'; // Free tier tersedia
    
    // Fallback ke OpenStreetMap jika tidak ada token
    if (!mapboxToken || mapboxToken === 'YOUR_MAPBOX_TOKEN') {
      // Menggunakan service gratis lainnya atau custom implementation
      return `https://via.placeholder.com/${width}x${height}/e3f2fd/6366f1?text=Map+Preview`;
    }
    
    return `${baseUrl}/${marker}${longitude},${latitude},${zoom}/${width}x${height}@2x?access_token=${mapboxToken}`;
  };

  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const renderFallback = () => (
    <View style={[styles.fallback, { width, height }]}>
      <Ionicons 
        name="map-outline" 
        size={32} 
        color={theme.colors.neutral[400]} 
      />
      <Typography 
        variant="caption" 
        color={theme.colors.neutral[500]}
        style={{ marginTop: 8, textAlign: 'center' }}
      >
        Map Preview
      </Typography>
      <Typography 
        variant="caption" 
        color={theme.colors.neutral[400]}
        style={{ textAlign: 'center' }}
      >
        Tap to view interactive map
      </Typography>
    </View>
  );

  const content = hasError ? (
    renderFallback()
  ) : (
    <View style={{ position: 'relative' }}>
      <Image
        source={{ uri: getStaticMapUrl() }}
        style={[styles.mapImage, { width, height }]}
        onLoad={handleImageLoad}
        onError={handleImageError}
        resizeMode="cover"
      />
      {isLoading && (
        <View style={[styles.loadingOverlay, { width, height }]}>
          <ActivityIndicator size="small" color={theme.colors.primary[500]} />
        </View>
      )}
      {onPress && (
        <View style={styles.overlay}>
          <View style={styles.overlayButton}>
            <Ionicons 
              name="expand-outline" 
              size={16} 
              color={theme.colors.white} 
            />
            <Typography 
              variant="caption" 
              color={theme.colors.white}
              weight="500"
              style={{ marginLeft: 4 }}
            >
              View Map
            </Typography>
          </View>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity 
        style={[styles.container, style]} 
        onPress={onPress}
        activeOpacity={0.8}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.neutral[100],
    ...theme.elevation.sm,
  },
  mapImage: {
    backgroundColor: theme.colors.neutral[100],
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: theme.colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallback: {
    backgroundColor: theme.colors.neutral[50],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    borderStyle: 'dashed',
  },
  overlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
  },
  overlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
});
