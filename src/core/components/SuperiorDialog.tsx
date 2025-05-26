import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Animated,
  Easing,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from './Typography';
import { theme } from '../theme';
import { useSensors } from '../hooks';

export type DialogType = 
  | 'success' 
  | 'error' 
  | 'warning' 
  | 'info' 
  | 'confirm' 
  | 'delete'
  | 'loading';

export interface DialogAction {
  text: string;
  onPress: () => void;
  style?: 'default' | 'cancel' | 'destructive' | 'primary';
  loading?: boolean;
}

export interface SuperiorDialogProps {
  visible: boolean;
  type: DialogType;
  title: string;
  message: string;
  actions?: DialogAction[];
  onClose?: () => void;
  icon?: string;
  autoClose?: number; // Auto close after X milliseconds
}

const getDialogConfig = (type: DialogType) => {
  switch (type) {
    case 'success':
      return {
        icon: 'checkmark-circle',
        colors: [theme.colors.success[500], theme.colors.success[600]],
        bgColors: [theme.colors.success[50], theme.colors.success[100]],
        haptic: 'success' as const,
      };
    case 'error':
      return {
        icon: 'close-circle',
        colors: [theme.colors.danger[500], theme.colors.danger[600]],
        bgColors: [theme.colors.danger[50], theme.colors.danger[100]],
        haptic: 'error' as const,
      };
    case 'warning':
      return {
        icon: 'warning',
        colors: [theme.colors.warning[500], theme.colors.warning[600]],
        bgColors: [theme.colors.warning[50], theme.colors.warning[100]],
        haptic: 'warning' as const,
      };
    case 'info':
      return {
        icon: 'information-circle',
        colors: [theme.colors.primary[500], theme.colors.primary[600]],
        bgColors: [theme.colors.primary[50], theme.colors.primary[100]],
        haptic: 'medium' as const,
      };
    case 'confirm':
      return {
        icon: 'help-circle',
        colors: [theme.colors.secondary[500], theme.colors.secondary[600]],
        bgColors: [theme.colors.secondary[50], theme.colors.secondary[100]],
        haptic: 'medium' as const,
      };
    case 'delete':
      return {
        icon: 'trash',
        colors: [theme.colors.danger[600], theme.colors.danger[700]],
        bgColors: [theme.colors.danger[50], theme.colors.danger[100]],
        haptic: 'error' as const,
      };
    case 'loading':
      return {
        icon: 'hourglass',
        colors: [theme.colors.neutral[500], theme.colors.neutral[600]],
        bgColors: [theme.colors.neutral[50], theme.colors.neutral[100]],
        haptic: 'light' as const,
      };
    default:
      return {
        icon: 'information-circle',
        colors: [theme.colors.primary[500], theme.colors.primary[600]],
        bgColors: [theme.colors.primary[50], theme.colors.primary[100]],
        haptic: 'medium' as const,
      };
  }
};

export const SuperiorDialog: React.FC<SuperiorDialogProps> = ({
  visible,
  type,
  title,
  message,
  actions = [],
  onClose,
  icon: customIcon,
  autoClose,
}) => {
  const [animatedValue] = useState(new Animated.Value(0));
  const { triggerHapticFeedback } = useSensors();
  const config = getDialogConfig(type);

  // Animasi untuk dialog
  useEffect(() => {
    if (visible) {
      // Reset animasi
      animatedValue.setValue(0);

      // Mulai animasi
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      // Trigger haptic feedback
      triggerHapticFeedback(config.haptic);

      // Auto close jika diatur
      if (autoClose && autoClose > 0) {
        const timer = setTimeout(() => {
          onClose?.();
        }, autoClose);

        return () => clearTimeout(timer);
      }
    }
  }, [visible, autoClose, onClose]);

  // Animasi scale dan opacity
  const scale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const handleActionPress = (action: DialogAction) => {
    if (!action.loading) {
      action.onPress();
    }
  };

  const renderActionButton = (action: DialogAction, index: number) => {
    const isDestructive = action.style === 'destructive';
    const isPrimary = action.style === 'primary';
    const isCancel = action.style === 'cancel';

    let buttonColors = [theme.colors.neutral[100], theme.colors.neutral[200]];
    let textColor = theme.colors.neutral[700];

    if (isDestructive) {
      buttonColors = [theme.colors.danger[500], theme.colors.danger[600]];
      textColor = theme.colors.white;
    } else if (isPrimary) {
      buttonColors = [theme.colors.primary[500], theme.colors.primary[600]];
      textColor = theme.colors.white;
    } else if (isCancel) {
      buttonColors = [theme.colors.neutral[200], theme.colors.neutral[300]];
      textColor = theme.colors.neutral[600];
    }

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.actionButton,
          action.loading && styles.disabledButton,
          index === 0 && actions.length > 1 && styles.firstButton,
        ]}
        onPress={() => handleActionPress(action)}
        disabled={action.loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={action.loading ? [theme.colors.neutral[300], theme.colors.neutral[400]] : buttonColors}
          style={styles.actionButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {action.loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={textColor} />
              <Typography variant="body1" weight="600" color={textColor} style={styles.loadingText}>
                {action.text}
              </Typography>
            </View>
          ) : (
            <Typography variant="body1" weight="600" color={textColor}>
              {action.text}
            </Typography>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.dialogContainer,
            {
              transform: [{ scale }],
              opacity,
            },
          ]}
        >
          <LinearGradient
            colors={config.bgColors}
            style={styles.dialogGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.dialogHeader}>
              <View style={styles.dialogIcon}>
                <LinearGradient
                  colors={config.colors}
                  style={styles.iconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {type === 'loading' ? (
                    <ActivityIndicator size={28} color="white" />
                  ) : (
                    <Ionicons 
                      name={customIcon as any || config.icon as any} 
                      size={28} 
                      color="white" 
                    />
                  )}
                </LinearGradient>
              </View>
              <Typography variant="h5" weight="700" color={theme.colors.neutral[800]} style={styles.title}>
                {title}
              </Typography>
            </View>

            <View style={styles.dialogContent}>
              <Typography 
                variant="body1" 
                color={theme.colors.neutral[600]} 
                align="center"
                style={styles.message}
              >
                {message}
              </Typography>
            </View>

            {actions.length > 0 && (
              <View style={styles.dialogActions}>
                {actions.map((action, index) => renderActionButton(action, index))}
              </View>
            )}
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: theme.spacing.layout.md,
  },
  dialogContainer: {
    width: Math.min(width - 48, 340),
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    ...theme.elevation.lg,
  },
  dialogGradient: {
    padding: 0,
  },
  dialogHeader: {
    alignItems: 'center',
    paddingTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  dialogIcon: {
    marginBottom: theme.spacing.md,
  },
  iconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.elevation.sm,
  },
  title: {
    textAlign: 'center',
  },
  dialogContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  message: {
    lineHeight: 22,
  },
  dialogActions: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.elevation.sm,
  },
  firstButton: {
    marginRight: theme.spacing.xs,
  },
  actionButtonGradient: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  loadingText: {
    marginLeft: theme.spacing.xs,
  },
});
