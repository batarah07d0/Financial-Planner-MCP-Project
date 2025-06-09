import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
} from 'react-native';
import { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography } from './Typography';
import { theme } from '../theme';

export interface EnhancedMarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  type?: 'default' | 'selected' | 'user' | 'expense' | 'income' | 'custom';
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  color?: string;
  gradientColors?: string[];
  borderColor?: string;
  borderWidth?: number;
  icon?: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  iconColor?: string;
  label?: string;
  amount?: number;
  showPulse?: boolean;
  showGlow?: boolean;
  showAnimation?: boolean;
  animationDelay?: number;
  onPress?: () => void;
  children?: React.ReactNode;
  // Standard marker props
  title?: string;
  description?: string;
  draggable?: boolean;
  zIndex?: number;
  opacity?: number;
}

// Enhanced size configurations
const SIZE_CONFIG = {
  small: {
    container: 36,
    icon: 18,
    border: 2,
    pulse: 60,
  },
  medium: {
    container: 48,
    icon: 24,
    border: 3,
    pulse: 80,
  },
  large: {
    container: 60,
    icon: 30,
    border: 4,
    pulse: 100,
  },
  xlarge: {
    container: 72,
    icon: 36,
    border: 5,
    pulse: 120,
  },
};

// Enhanced type configurations with gradients
const TYPE_CONFIG = {
  default: {
    gradientColors: [theme.colors.primary[400], theme.colors.primary[600]],
    borderColor: theme.colors.white,
    icon: 'location' as keyof typeof Ionicons.glyphMap,
    iconColor: theme.colors.white,
    glowColor: theme.colors.primary[300],
  },
  selected: {
    gradientColors: [theme.colors.danger[400], theme.colors.danger[600]],
    borderColor: theme.colors.white,
    icon: 'location' as keyof typeof Ionicons.glyphMap,
    iconColor: theme.colors.white,
    glowColor: theme.colors.danger[300],
  },
  user: {
    gradientColors: [theme.colors.success[400], theme.colors.success[600]],
    borderColor: theme.colors.white,
    icon: 'person' as keyof typeof Ionicons.glyphMap,
    iconColor: theme.colors.white,
    glowColor: theme.colors.success[300],
  },
  expense: {
    gradientColors: [theme.colors.danger[400], theme.colors.danger[600]],
    borderColor: theme.colors.white,
    icon: 'trending-down' as keyof typeof Ionicons.glyphMap,
    iconColor: theme.colors.white,
    glowColor: theme.colors.danger[300],
  },
  income: {
    gradientColors: [theme.colors.success[400], theme.colors.success[600]],
    borderColor: theme.colors.white,
    icon: 'trending-up' as keyof typeof Ionicons.glyphMap,
    iconColor: theme.colors.white,
    glowColor: theme.colors.success[300],
  },
  custom: {
    gradientColors: [theme.colors.neutral[400], theme.colors.neutral[600]],
    borderColor: theme.colors.white,
    icon: 'ellipse' as keyof typeof Ionicons.glyphMap,
    iconColor: theme.colors.white,
    glowColor: theme.colors.neutral[300],
  },
};

export const EnhancedMarker: React.FC<EnhancedMarkerProps> = ({
  coordinate,
  type = 'default',
  size = 'medium',
  color: _color,
  gradientColors,
  borderColor,
  borderWidth,
  icon,
  iconSize,
  iconColor,
  label,
  amount,
  showPulse = false,
  showGlow = false,
  showAnimation = true,
  animationDelay = 0,
  onPress,
  children,
  title,
  description,
  draggable,
  zIndex,
  opacity,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Get configurations
  const sizeConfig = SIZE_CONFIG[size];
  const typeConfig = TYPE_CONFIG[type];

  // Final styles
  const baseGradientColors = gradientColors || typeConfig.gradientColors;
  const finalGradientColors = Array.isArray(baseGradientColors) && baseGradientColors.length >= 2
    ? baseGradientColors as [string, string, ...string[]]
    : [theme.colors.primary[400], theme.colors.primary[600]] as [string, string];
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
          tension: 120,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(1);
    }

    // Pulse animation
    if (showPulse) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => {
        pulseAnimation.stop();
      };
    }
  }, [showAnimation, showPulse, animationDelay, scaleAnim, pulseAnim]);

  // Glow animation
  useEffect(() => {
    if (showGlow) {
      const glowAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      glowAnimation.start();

      return () => {
        glowAnimation.stop();
      };
    }
  }, [showGlow, glowAnim]);

  // Format amount for display
  const formatAmount = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  // Custom marker view
  const renderCustomMarker = () => {
    const pulseScale = pulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.5],
    });

    const glowOpacity = glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.8],
    });

    return (
      <Animated.View 
        style={[
          styles.markerContainer,
          { transform: [{ scale: scaleAnim }] }
        ]}
      >
        {/* Pulse effect */}
        {showPulse && (
          <Animated.View
            style={[
              styles.pulseRing,
              {
                width: sizeConfig.pulse,
                height: sizeConfig.pulse,
                borderRadius: sizeConfig.pulse / 2,
                borderColor: typeConfig.glowColor,
                marginLeft: -(sizeConfig.pulse / 2),
                marginTop: -(sizeConfig.pulse / 2),
                transform: [{ scale: pulseScale }],
                opacity: pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.7, 0],
                }),
              },
            ]}
          />
        )}

        {/* Glow effect */}
        {showGlow && (
          <Animated.View
            style={[
              styles.glowEffect,
              {
                width: sizeConfig.container + 20,
                height: sizeConfig.container + 20,
                borderRadius: (sizeConfig.container + 20) / 2,
                backgroundColor: typeConfig.glowColor,
                marginLeft: -10,
                marginTop: -10,
                opacity: glowOpacity,
              },
            ]}
          />
        )}

        {/* Main marker with gradient */}
        <LinearGradient
          colors={finalGradientColors}
          style={[
            styles.marker,
            {
              width: sizeConfig.container,
              height: sizeConfig.container,
              borderRadius: sizeConfig.container / 2,
              borderColor: finalBorderColor,
              borderWidth: finalBorderWidth,
            },
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {children || (
            <Ionicons
              name={finalIcon}
              size={finalIconSize}
              color={finalIconColor}
            />
          )}
        </LinearGradient>

        {/* Amount label */}
        {amount && (
          <View style={styles.amountContainer}>
            <Typography
              variant="caption"
              color={theme.colors.white}
              weight="700"
              style={styles.amountText}
            >
              {formatAmount(amount)}
            </Typography>
          </View>
        )}

        {/* Text label */}
        {label && !amount && (
          <View style={styles.labelContainer}>
            <Typography
              variant="caption"
              color={theme.colors.white}
              weight="600"
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
      draggable={draggable}
      onPress={onPress}
      zIndex={zIndex}
      opacity={opacity}
      anchor={{ x: 0.5, y: 0.5 }}
      centerOffset={{ x: 0, y: 0 }}
    >
      {renderCustomMarker()}
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 2,
    alignSelf: 'center',
  },
  glowEffect: {
    position: 'absolute',
    alignSelf: 'center',
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
    shadowRadius: 8,
    zIndex: 10,
  },
  amountContainer: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: theme.colors.neutral[800],
    borderRadius: 12,
    minWidth: 40,
    alignItems: 'center',
  },
  amountText: {
    fontSize: 10,
    textAlign: 'center',
  },
  labelContainer: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: theme.colors.neutral[800],
    borderRadius: 10,
    alignItems: 'center',
  },
  labelText: {
    fontSize: 9,
    textAlign: 'center',
  },
});
