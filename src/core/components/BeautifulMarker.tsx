import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from './Typography';
import { theme } from '../theme';

// Types
export interface BeautifulMarkerProps {
  // Required coordinate property
  coordinate: {
    latitude: number;
    longitude: number;
  };

  // Optional MarkerProps
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
  onPress?: () => void;
  onSelect?: () => void;
  onDeselect?: () => void;
  onCalloutPress?: () => void;
  onDragStart?: () => void;
  onDrag?: () => void;
  onDragEnd?: () => void;
  zIndex?: number;
  opacity?: number;

  // Custom properties
  type?: 'default' | 'selected' | 'user' | 'expense' | 'income' | 'custom';
  size?: 'small' | 'medium' | 'large';
  color?: string;
  borderColor?: string;
  borderWidth?: number;
  shadowColor?: string;
  shadowOpacity?: number;
  shadowRadius?: number;
  icon?: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  iconColor?: string;
  label?: string;
  labelStyle?: ViewStyle;
  showAnimation?: boolean;
  animationDelay?: number;
  children?: React.ReactNode;
}

// Size configurations
const SIZE_CONFIG = {
  small: {
    container: 32,
    icon: 16,
    border: 2,
  },
  medium: {
    container: 40,
    icon: 20,
    border: 3,
  },
  large: {
    container: 50,
    icon: 24,
    border: 4,
  },
};

// Type configurations
const TYPE_CONFIG = {
  default: {
    color: theme.colors.primary[500],
    borderColor: theme.colors.white,
    icon: 'location' as keyof typeof Ionicons.glyphMap,
    iconColor: theme.colors.white,
  },
  selected: {
    color: theme.colors.danger[500],
    borderColor: theme.colors.white,
    icon: 'location' as keyof typeof Ionicons.glyphMap,
    iconColor: theme.colors.white,
  },
  user: {
    color: theme.colors.success[500],
    borderColor: theme.colors.white,
    icon: 'person' as keyof typeof Ionicons.glyphMap,
    iconColor: theme.colors.white,
  },
  expense: {
    color: theme.colors.danger[500],
    borderColor: theme.colors.white,
    icon: 'remove-circle' as keyof typeof Ionicons.glyphMap,
    iconColor: theme.colors.white,
  },
  income: {
    color: theme.colors.success[500],
    borderColor: theme.colors.white,
    icon: 'add-circle' as keyof typeof Ionicons.glyphMap,
    iconColor: theme.colors.white,
  },
  custom: {
    color: theme.colors.neutral[500],
    borderColor: theme.colors.white,
    icon: 'ellipse' as keyof typeof Ionicons.glyphMap,
    iconColor: theme.colors.white,
  },
};

export const BeautifulMarker: React.FC<BeautifulMarkerProps> = ({
  coordinate,
  type = 'default',
  size = 'medium',
  color,
  borderColor,
  borderWidth,
  shadowColor = theme.colors.neutral[900],
  shadowOpacity = 0.3,
  shadowRadius: _shadowRadius,
  icon,
  iconSize,
  iconColor,
  label,
  labelStyle,
  showAnimation = true,
  animationDelay = 0,
  children,
  // Marker props
  title,
  description,
  image,
  pinColor,
  anchor,
  calloutAnchor,
  flat,
  identifier,
  rotation,
  draggable,
  onPress,
  onSelect,
  onDeselect,
  onCalloutPress,
  onDragStart,
  onDrag,
  onDragEnd,
  zIndex,
  opacity,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  // Get configurations
  const sizeConfig = SIZE_CONFIG[size];
  const typeConfig = TYPE_CONFIG[type];

  // Final styles
  const finalColor = color || typeConfig.color;
  const finalBorderColor = borderColor || typeConfig.borderColor;
  const finalBorderWidth = borderWidth || sizeConfig.border;
  const finalIcon = icon || typeConfig.icon;
  const finalIconSize = iconSize || sizeConfig.icon;
  const finalIconColor = iconColor || typeConfig.iconColor;

  // Animation effects
  useEffect(() => {
    if (showAnimation) {
      // Initial scale animation
      Animated.sequence([
        Animated.delay(animationDelay),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Bounce animation for selected type
      if (type === 'selected') {
        const bounceAnimation = Animated.loop(
          Animated.sequence([
            Animated.timing(bounceAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(bounceAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        );
        bounceAnimation.start();

        return () => {
          bounceAnimation.stop();
        };
      }
    } else {
      scaleAnim.setValue(1);
    }
  }, [showAnimation, animationDelay, type, scaleAnim, bounceAnim]);

  // Custom marker view
  const renderCustomMarker = () => {
    const bounceScale = bounceAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.2],
    });

    const animatedStyle = {
      transform: [
        { scale: scaleAnim },
        ...(type === 'selected' ? [{ scale: bounceScale }] : []),
      ],
    };

    return (
      <Animated.View style={[styles.markerContainer, animatedStyle]}>
        {/* Shadow */}
        <View
          style={[
            styles.markerShadow,
            {
              width: sizeConfig.container + 8,
              height: sizeConfig.container + 8,
              borderRadius: (sizeConfig.container + 8) / 2,
              backgroundColor: shadowColor,
              opacity: shadowOpacity,
            },
          ]}
        />
        
        {/* Main marker */}
        <View
          style={[
            styles.marker,
            {
              width: sizeConfig.container,
              height: sizeConfig.container,
              borderRadius: sizeConfig.container / 2,
              backgroundColor: finalColor,
              borderColor: finalBorderColor,
              borderWidth: finalBorderWidth,
            },
          ]}
        >
          {children || (
            <Ionicons
              name={finalIcon}
              size={finalIconSize}
              color={finalIconColor}
            />
          )}
        </View>

        {/* Label */}
        {label && (
          <View style={[styles.labelContainer, labelStyle]}>
            <Typography
              variant="caption"
              color={theme.colors.white}
              style={styles.labelText}
            >
              {label}
            </Typography>
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <Marker
      coordinate={coordinate}
      title={title}
      description={description}
      image={image}
      pinColor={pinColor}
      anchor={anchor}
      calloutAnchor={calloutAnchor}
      flat={flat}
      identifier={identifier}
      rotation={rotation}
      draggable={draggable}
      onPress={onPress}
      onSelect={onSelect}
      onDeselect={onDeselect}
      onCalloutPress={onCalloutPress}
      onDragStart={onDragStart}
      onDrag={onDrag}
      onDragEnd={onDragEnd}
      zIndex={zIndex}
      opacity={opacity}
    >
      {renderCustomMarker()}
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerShadow: {
    position: 'absolute',
    top: 2,
  },
  marker: {
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: theme.colors.neutral[900],
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  labelContainer: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: theme.colors.neutral[800],
    borderRadius: 12,
    minWidth: 40,
    alignItems: 'center',
  },
  labelText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
});
