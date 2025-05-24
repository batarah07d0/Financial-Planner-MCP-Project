import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Animated,
} from 'react-native';
import { Typography } from '../../../core/components';
import { theme } from '../../../core/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface SettingItemProps {
  title: string;
  description: string;
  icon: string;
  iconColor?: string;
  value?: string;
  onPress?: () => void;
  isSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  isDanger?: boolean;
}

export const SettingItem: React.FC<SettingItemProps> = ({
  title,
  description,
  icon,
  iconColor,
  value,
  onPress,
  isSwitch = false,
  switchValue = false,
  onSwitchChange,
  isDanger = false,
}) => {
  const [pressAnim] = useState(new Animated.Value(1));

  // Warna ikon default
  const defaultIconColor = isDanger
    ? theme.colors.danger[500]
    : iconColor || theme.colors.primary[500];

  // Warna gradient untuk container ikon
  const gradientColors = isDanger
    ? [theme.colors.danger[50], theme.colors.danger[100]] as const
    : [
        iconColor ? `${iconColor}20` : theme.colors.primary[50],
        iconColor ? `${iconColor}40` : theme.colors.primary[100],
      ] as const;

  // Gunakan state biasa untuk background color
  const [isPressed, setIsPressed] = useState(false);

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.timing(pressAnim, {
      toValue: 0.98,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.timing(pressAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  // Tentukan background color berdasarkan state isPressed
  const backgroundColor = isPressed
    ? isDanger ? theme.colors.danger[50] : theme.colors.primary[50]
    : theme.colors.white;

  const renderContent = () => (
    <View style={styles.content}>
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={gradientColors}
          style={styles.iconGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name={icon as any} size={22} color={defaultIconColor} />
        </LinearGradient>
      </View>

      <View style={styles.textContainer}>
        <Typography
          variant="body1"
          weight="600"
          color={isDanger ? theme.colors.danger[500] : theme.colors.neutral[800]}
        >
          {title}
        </Typography>
        <Typography variant="body2" color={theme.colors.neutral[600]}>
          {description}
        </Typography>
      </View>

      {isSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{
            false: theme.colors.neutral[300],
            true: isDanger ? theme.colors.danger[300] : theme.colors.primary[300],
          }}
          thumbColor={
            switchValue
              ? isDanger
                ? theme.colors.danger[500]
                : theme.colors.primary[500]
              : theme.colors.white
          }
          ios_backgroundColor={theme.colors.neutral[300]}
        />
      ) : (
        <View style={styles.valueContainer}>
          {value && (
            <Typography
              variant="body2"
              color={theme.colors.neutral[600]}
              style={styles.valueText}
            >
              {value}
            </Typography>
          )}
          {onPress && (
            <Ionicons
              name="chevron-forward"
              size={20}
              color={isDanger ? theme.colors.danger[500] : theme.colors.primary[500]}
            />
          )}
        </View>
      )}
    </View>
  );

  if (!onPress && !isSwitch) {
    return (
      <View style={styles.container}>
        {renderContent()}
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isSwitch}
    >
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ scale: pressAnim }],
          },
          { backgroundColor }, // Gunakan backgroundColor sebagai style terpisah
        ]}
      >
        {renderContent()}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.xs,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  iconContainer: {
    marginRight: theme.spacing.md,
  },
  iconGradient: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueText: {
    marginRight: theme.spacing.sm,
  },
});
