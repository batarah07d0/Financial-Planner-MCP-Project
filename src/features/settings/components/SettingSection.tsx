import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
} from 'react-native';
import { Typography } from '../../../core/components';
import { theme } from '../../../core/theme';

interface SettingSectionProps {
  title: string;
  children: React.ReactNode;
  delay?: number;
}

export const SettingSection: React.FC<SettingSectionProps> = ({
  title,
  children,
  delay = 0,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: translateYAnim }],
        },
      ]}
    >
      <View style={styles.titleContainer}>
        <View style={styles.titleLine} />
        <Typography variant="h6" style={styles.title}>
          {title}
        </Typography>
        <View style={styles.titleLine} />
      </View>
      <View style={styles.content}>
        {children}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  titleLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.neutral[200],
  },
  title: {
    marginHorizontal: theme.spacing.md,
    color: theme.colors.primary[500],
    fontWeight: '600',
  },
  content: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    ...theme.elevation.sm,
    overflow: 'hidden',
  },
});
