import React, { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from './Typography';
import { theme } from '../theme';
import { formatCurrency, formatPercentage } from '../utils';
import { useAppDimensions } from '../hooks/useAppDimensions';

interface BudgetCardProps {
  id: string;
  category: string;
  amount: number;
  spent: number;
  categoryIcon?: string;
  categoryColor?: string;
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  onPress?: (id: string) => void;
}

export const BudgetCard: React.FC<BudgetCardProps> = React.memo(({
  id,
  category,
  amount,
  spent,
  categoryIcon = 'wallet-outline',
  categoryColor,
  period = 'monthly',
  onPress,
}) => {
  // Responsive dimensions
  const {
    responsiveSpacing,
    responsiveFontSize,
    isSmallDevice
  } = useAppDimensions();

  // Animation values - menggunakan native driver untuk semua animasi transform
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        friction: 8,
        tension: 100,
        useNativeDriver: true, // Native driver untuk transform
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true, // Native driver untuk opacity
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true, // Native driver untuk transform
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true, // Native driver untuk opacity
      }),
    ]).start();
  };

  const handlePress = () => {
    if (onPress) {
      onPress(id);
    }
  };

  // Hitung persentase pengeluaran
  const percentage = amount > 0 ? spent / amount : 0;

  // Tentukan warna progress bar berdasarkan persentase
  const getProgressColor = (): [string, string] => {
    if (percentage >= 1) {
      return [theme.colors.danger[400], theme.colors.danger[600]];
    } else if (percentage >= 0.8) {
      return [theme.colors.warning[400], theme.colors.warning[600]];
    } else {
      return [theme.colors.success[400], theme.colors.success[600]];
    }
  };

  // Tentukan status badge
  const getStatusBadge = () => {
    if (percentage >= 1) {
      return { text: 'Melebihi', color: theme.colors.danger[500], bgColor: theme.colors.danger[100] };
    } else if (percentage >= 0.9) {
      return { text: 'Hampir Habis', color: theme.colors.warning[600], bgColor: theme.colors.warning[100] };
    } else if (percentage >= 0.7) {
      return { text: 'Perhatian', color: theme.colors.warning[500], bgColor: theme.colors.warning[50] };
    } else {
      return { text: 'Aman', color: theme.colors.success[600], bgColor: theme.colors.success[100] };
    }
  };

  // Format periode
  const getPeriodText = () => {
    switch (period) {
      case 'daily': return 'Harian';
      case 'weekly': return 'Mingguan';
      case 'monthly': return 'Bulanan';
      case 'yearly': return 'Tahunan';
      default: return 'Bulanan';
    }
  };

  const statusBadge = getStatusBadge();
  const progressColors = getProgressColor();

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <LinearGradient
          colors={[theme.colors.white, theme.colors.neutral[50]]}
          style={[
            styles.cardContainer,
            {
              marginBottom: responsiveSpacing(theme.spacing.md),
              padding: responsiveSpacing(isSmallDevice ? theme.spacing.md : theme.spacing.lg),
              borderRadius: theme.borderRadius.xl,
            },
          ]}
        >
          {/* Header dengan ikon dan status badge - Enhanced Layout */}
          <View style={[styles.header, {
            marginBottom: responsiveSpacing(theme.spacing.md),
            alignItems: 'flex-start', // Align ke atas untuk memberikan ruang lebih
          }]}>
            <View style={styles.headerLeft}>
              {/* Enhanced Icon Container dengan gradient dan shadow */}
              <View style={[styles.iconContainer, {
                width: responsiveSpacing(isSmallDevice ? 48 : 56),
                height: responsiveSpacing(isSmallDevice ? 48 : 56),
                borderRadius: responsiveSpacing(isSmallDevice ? 24 : 28),
                marginRight: responsiveSpacing(theme.spacing.md),
                flexShrink: 0, // Mencegah ikon menyusut
              }]}>
                <LinearGradient
                  colors={[
                    categoryColor || theme.colors.primary[400],
                    categoryColor ? `${categoryColor}CC` : theme.colors.primary[600]
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.iconGradient, {
                    width: responsiveSpacing(isSmallDevice ? 48 : 56),
                    height: responsiveSpacing(isSmallDevice ? 48 : 56),
                    borderRadius: responsiveSpacing(isSmallDevice ? 24 : 28),
                  }]}
                >
                  <Ionicons
                    name={categoryIcon as keyof typeof Ionicons.glyphMap}
                    size={responsiveSpacing(isSmallDevice ? 24 : 28)}
                    color={theme.colors.white}
                  />
                </LinearGradient>

                {/* Subtle glow effect */}
                <View style={[styles.iconGlow, {
                  width: responsiveSpacing(isSmallDevice ? 48 : 56),
                  height: responsiveSpacing(isSmallDevice ? 48 : 56),
                  borderRadius: responsiveSpacing(isSmallDevice ? 24 : 28),
                  backgroundColor: `${categoryColor || theme.colors.primary[500]}20`,
                }]} />
              </View>

              <View style={[styles.categoryInfo, {
                minHeight: responsiveSpacing(isSmallDevice ? 48 : 56), // Minimal height sama dengan ikon
                justifyContent: 'center', // Center vertikal
              }]}>
                <Typography
                  variant="body1"
                  weight="700"
                  style={{
                    fontSize: responsiveFontSize(isSmallDevice ? 16 : 18),
                    color: theme.colors.neutral[800],
                    letterSpacing: -0.3,
                    lineHeight: responsiveFontSize(isSmallDevice ? 20 : 22),
                    marginBottom: responsiveSpacing(2),
                  }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {category}
                </Typography>
                <Typography
                  variant="caption"
                  color={theme.colors.neutral[500]}
                  style={{
                    fontSize: responsiveFontSize(isSmallDevice ? 12 : 14),
                    fontWeight: '500',
                    lineHeight: responsiveFontSize(isSmallDevice ? 16 : 18),
                  }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {getPeriodText()}
                </Typography>
              </View>
            </View>

            <View style={[styles.statusBadge, {
              backgroundColor: statusBadge.bgColor,
              paddingHorizontal: responsiveSpacing(theme.spacing.sm),
              paddingVertical: responsiveSpacing(6),
              borderRadius: theme.borderRadius.round,
              marginTop: responsiveSpacing(2), // Sedikit margin dari atas
            }]}>
              <Typography
                variant="caption"
                weight="600"
                color={statusBadge.color}
                style={{
                  fontSize: responsiveFontSize(isSmallDevice ? 10 : 11),
                  lineHeight: responsiveFontSize(isSmallDevice ? 12 : 14),
                }}
                numberOfLines={1}
              >
                {statusBadge.text}
              </Typography>
            </View>
          </View>

          {/* Amount section */}
          <View style={[styles.amountSection, {
            marginBottom: responsiveSpacing(theme.spacing.md),
          }]}>
            <View style={styles.amountRow}>
              <Typography
                variant="caption"
                color={theme.colors.neutral[600]}
                style={{
                  fontSize: responsiveFontSize(isSmallDevice ? 11 : 13),
                }}
              >
                Terpakai
              </Typography>
              <Typography
                variant="caption"
                color={theme.colors.neutral[600]}
                style={{
                  fontSize: responsiveFontSize(isSmallDevice ? 11 : 13),
                }}
              >
                Total Anggaran
              </Typography>
            </View>
            <View style={styles.amountRow}>
              <Typography
                variant="h6"
                weight="700"
                color={percentage >= 1 ? theme.colors.danger[500] : theme.colors.neutral[800]}
                style={{
                  fontSize: responsiveFontSize(isSmallDevice ? 16 : 18),
                }}
              >
                {formatCurrency(spent)}
              </Typography>
              <Typography
                variant="h6"
                weight="600"
                color={theme.colors.primary[600]}
                style={{
                  fontSize: responsiveFontSize(isSmallDevice ? 16 : 18),
                }}
              >
                {formatCurrency(amount)}
              </Typography>
            </View>
          </View>

          {/* Progress bar dengan gradient */}
          <View style={[styles.progressContainer, {
            marginBottom: responsiveSpacing(theme.spacing.md),
          }]}>
            <View style={styles.progressHeader}>
              <Typography
                variant="caption"
                color={theme.colors.neutral[600]}
                style={{
                  fontSize: responsiveFontSize(isSmallDevice ? 10 : 12),
                }}
              >
                Progress
              </Typography>
              <Typography
                variant="caption"
                weight="600"
                color={percentage >= 1 ? theme.colors.danger[500] : theme.colors.primary[600]}
                style={{
                  fontSize: responsiveFontSize(isSmallDevice ? 10 : 12),
                }}
              >
                {formatPercentage(percentage)}
              </Typography>
            </View>
            <View style={[styles.progressBackground, {
              height: responsiveSpacing(isSmallDevice ? 8 : 10),
              marginTop: responsiveSpacing(6),
            }]}>
              <LinearGradient
                colors={progressColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(percentage * 100, 100)}%`,
                  },
                ]}
              />
            </View>
          </View>

          {/* Footer dengan sisa anggaran */}
          <View style={styles.footer}>
            <View style={styles.footerItem}>
              <Typography
                variant="caption"
                color={theme.colors.neutral[500]}
                style={{
                  fontSize: responsiveFontSize(isSmallDevice ? 10 : 12),
                }}
              >
                Sisa Anggaran
              </Typography>
              <Typography
                variant="body2"
                weight="600"
                color={percentage >= 0.9 ? theme.colors.danger[500] : theme.colors.success[600]}
                style={{
                  fontSize: responsiveFontSize(isSmallDevice ? 13 : 15),
                  marginTop: responsiveSpacing(2),
                }}
              >
                {formatCurrency(Math.max(amount - spent, 0))}
              </Typography>
            </View>

            <View style={styles.chevronContainer}>
              <Ionicons
                name="chevron-forward"
                size={responsiveSpacing(isSmallDevice ? 16 : 20)}
                color={theme.colors.neutral[400]}
              />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
});

BudgetCard.displayName = 'BudgetCard';

const styles = StyleSheet.create({
  cardContainer: {
    ...theme.elevation.md,
    shadowColor: theme.colors.neutral[900],
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', // Align ke atas untuk memberikan ruang lebih
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0, // Memungkinkan flex shrink
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: theme.colors.neutral[900],
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  iconGradient: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    zIndex: -1,
  },
  categoryInfo: {
    flex: 1,
    minWidth: 0, // Memungkinkan flex shrink
    paddingRight: theme.spacing.sm, // Memberikan ruang dari status badge
  },
  statusBadge: {
    alignSelf: 'flex-start',
    flexShrink: 0, // Mencegah badge menyusut
    maxWidth: 100, // Membatasi lebar maksimum badge
  },
  amountSection: {
    // Container for amount display
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  progressContainer: {
    // Container for progress bar
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBackground: {
    backgroundColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.round,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.borderRadius.round,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerItem: {
    flex: 1,
  },
  chevronContainer: {
    padding: theme.spacing.xs,
  },
});
