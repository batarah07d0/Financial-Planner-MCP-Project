import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { Typography } from '../../../core/components';
import { theme } from '../../../core/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface StatItem {
  icon: string;
  title: string;
  value: string | number;
  color: string;
}

interface StatisticsCardProps {
  stats: StatItem[];
  isLoading?: boolean;
}

export const StatisticsCard: React.FC<StatisticsCardProps> = ({ stats, isLoading = false }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  // Render loading skeleton
  const renderLoadingSkeleton = () => {
    return (
      <View style={styles.statsContainer}>
        {[1, 2, 3, 4].map((_, index) => (
          <View key={index} style={styles.statItem}>
            <View style={styles.iconContainer}>
              <View style={[styles.iconGradient, styles.skeletonIcon]} />
            </View>

            <View style={styles.statContent}>
              <View style={styles.skeletonText} />
              <View style={styles.skeletonValue} />
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={[theme.colors.white, theme.colors.neutral[50]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <Ionicons
              name="stats-chart"
              size={20}
              color={theme.colors.primary[500]}
              style={styles.headerIcon}
            />
            <Typography variant="h6" weight="600" color={theme.colors.neutral[800]}>
              Statistik Aktivitas
            </Typography>
          </View>
          <Typography variant="body2" color={theme.colors.neutral[600]}>
            Ringkasan aktivitas keuangan Anda
          </Typography>
        </View>

        {isLoading ? renderLoadingSkeleton() : (
          <View style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <StatItemComponent key={index} item={stat} index={index} />
            ))}
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
};

interface StatItemComponentProps {
  item: StatItem;
  index: number;
}

const StatItemComponent: React.FC<StatItemComponentProps> = ({ item, index }) => {
  const valueAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(valueAnim, {
        toValue: 1,
        duration: 1000,
        delay: 500 + index * 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        delay: 300 + index * 100,
        useNativeDriver: true,
      })
    ]).start();
  }, [index, scaleAnim, valueAnim]);

  return (
    <Animated.View
      style={[
        styles.statItem,
        {
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={[`${item.color}20`, `${item.color}40`]}
          style={styles.iconGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={22} color={item.color} />
        </LinearGradient>
      </View>

      <View style={styles.statContent}>
        <Typography variant="body2" color={theme.colors.neutral[600]}>
          {item.title}
        </Typography>
        <Animated.View
          style={{
            opacity: valueAnim,
            transform: [
              {
                translateY: valueAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0],
                }),
              },
            ],
          }}
        >
          <Typography variant="body1" weight="700" color={theme.colors.neutral[800]}>
            {item.value}
          </Typography>
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.elevation.md,
  },
  gradient: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.layout.sm,
  },
  header: {
    marginBottom: theme.spacing.md,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  headerIcon: {
    marginRight: theme.spacing.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    ...theme.elevation.sm,
  },
  iconContainer: {
    marginRight: theme.spacing.sm,
  },
  iconGradient: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statContent: {
    flex: 1,
  },

  skeletonIcon: {
    backgroundColor: theme.colors.neutral[200],
    opacity: 0.7,
  },
  skeletonText: {
    height: 10,
    width: '70%',
    backgroundColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.xs,
  },
  skeletonValue: {
    height: 16,
    width: '50%',
    backgroundColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.sm,
  },
});
