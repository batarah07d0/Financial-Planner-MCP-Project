import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { theme } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gradient';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
  disabled,
  ...rest
}) => {
  // Menentukan style berdasarkan variant
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: theme.colors.primary[500],
          borderColor: theme.colors.primary[500],
        };
      case 'secondary':
        return {
          backgroundColor: theme.colors.secondary[500],
          borderColor: theme.colors.secondary[500],
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: theme.colors.primary[500],
          borderWidth: 2,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        };
      case 'danger':
        return {
          backgroundColor: theme.colors.danger[500],
          borderColor: theme.colors.danger[500],
        };
      case 'gradient':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          overflow: 'hidden',
        };
      default:
        return {
          backgroundColor: theme.colors.primary[500],
          borderColor: theme.colors.primary[500],
        };
    }
  };

  // Menentukan text style berdasarkan variant
  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case 'outline':
      case 'ghost':
        return {
          color: theme.colors.primary[500],
        };
      default:
        return {
          color: theme.colors.white,
        };
    }
  };

  // Menentukan padding berdasarkan size
  const getPaddingStyle = (): ViewStyle => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: theme.spacing.xs,
          paddingHorizontal: theme.spacing.md,
        };
      case 'large':
        return {
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.xl,
        };
      default:
        return {
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.lg,
        };
    }
  };

  // Menentukan text style berdasarkan size
  const getTextSizeStyle = (): TextStyle => {
    switch (size) {
      case 'small':
        return theme.typography.button.small;
      case 'large':
        return theme.typography.button.large;
      default:
        return theme.typography.button.medium;
    }
  };

  // Render button content
  const renderButtonContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost'
            ? theme.colors.primary[500]
            : theme.colors.white
          }
        />
      );
    }

    return (
      <>
        {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
        <Text
          style={[
            styles.text,
            getTextStyle(),
            getTextSizeStyle(),
            disabled && styles.disabledText,
            textStyle,
          ]}
        >
          {title}
        </Text>
        {rightIcon && <View style={styles.iconContainer}>{rightIcon}</View>}
      </>
    );
  };

  // Render gradient button
  if (variant === 'gradient') {
    return (
      <TouchableOpacity
        style={[
          styles.button,
          getVariantStyle(),
          getPaddingStyle(),
          fullWidth && styles.fullWidth,
          disabled && styles.disabled,
          style,
        ]}
        disabled={disabled || loading}
        activeOpacity={0.8}
        {...rest}
      >
        <LinearGradient
          colors={[theme.colors.primary[400], theme.colors.primary[700]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientBackground}
        >
          {renderButtonContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Render regular button
  return (
    <TouchableOpacity
      style={[
        styles.button,
        getVariantStyle(),
        getPaddingStyle(),
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...rest}
    >
      {renderButtonContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    ...theme.elevation.sm,
  },
  text: {
    textAlign: 'center',
    marginHorizontal: theme.spacing.xs,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.6,
  },
  disabledText: {
    opacity: 0.8,
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  iconContainer: {
    marginHorizontal: theme.spacing.xs,
  },
});
