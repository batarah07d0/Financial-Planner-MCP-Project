import React, { useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { Typography } from './Typography';
import { Card } from './Card';
import { theme } from '../theme';
import { formatCurrency, formatDate } from '../utils';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export interface ChallengeProps {
  id: string;
  title: string;
  description: string;
  type: 'saving' | 'spending' | 'tracking';
  target: number;
  current: number;
  startDate: string;
  endDate: string;
  reward: {
    points: number;
    badge?: string;
  };
  participants?: number;
  isCompleted?: boolean;
  image?: string;
  icon?: string;
  iconType?: 'MaterialCommunityIcons' | 'FontAwesome5' | 'Ionicons';
  color?: string;
}

interface ChallengeCardProps {
  challenge: ChallengeProps;
  onPress?: (challenge: ChallengeProps) => void;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  onPress,
}) => {
  const {
    title,
    description,
    type,
    target,
    current,
    endDate,
    isCompleted,
    icon,
    color,
  } = challenge;

  // Animasi untuk efek press dan progress bar
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Hitung persentase penyelesaian
  const progress = Math.min(Math.round((current / target) * 100), 100);

  // Animasi progress bar saat komponen di-render
  React.useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress / 100,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, 
    }).start();
  }, [progress, progressAnim]);

  // Mendapatkan ikon dengan fallback yang robust
  const getIconComponent = () => {
    const iconSize = 22;
    const iconColor = theme.colors.white;

    // Icon mapping dengan fallback
    const iconMap: { [key: string]: { type: 'Ionicons' | 'MaterialCommunityIcons' | 'FontAwesome5'; name: string } } = {
      // Travel & Transportation
      'airplane': { type: 'Ionicons', name: 'airplane' },
      'car': { type: 'Ionicons', name: 'car' },
      'train': { type: 'Ionicons', name: 'train' },

      // Technology
      'phone-portrait': { type: 'Ionicons', name: 'phone-portrait' },
      'laptop': { type: 'Ionicons', name: 'laptop' },
      'desktop': { type: 'Ionicons', name: 'desktop' },
      'tablet-portrait': { type: 'Ionicons', name: 'tablet-portrait' },

      // Security & Finance
      'shield-checkmark': { type: 'Ionicons', name: 'shield-checkmark' },
      'shield': { type: 'Ionicons', name: 'shield' },
      'wallet': { type: 'FontAwesome5', name: 'wallet' },
      'money-bill': { type: 'FontAwesome5', name: 'money-bill' },

      // Savings & Goals
      'home': { type: 'Ionicons', name: 'home' },
      'school': { type: 'Ionicons', name: 'school' },
      'medical': { type: 'Ionicons', name: 'medical' },
      'fitness': { type: 'Ionicons', name: 'fitness' },
      'restaurant': { type: 'Ionicons', name: 'restaurant' },

      // Default fallbacks
      'star': { type: 'Ionicons', name: 'star' },
      'heart': { type: 'Ionicons', name: 'heart' },
      'trophy': { type: 'Ionicons', name: 'trophy' },
    };

    // Cari ikon yang sesuai atau gunakan fallback
    const iconName = icon || 'star';
    const iconConfig = iconMap[iconName] || { type: 'Ionicons', name: 'star' };

    try {
      switch (iconConfig.type) {
        case 'FontAwesome5':
          return <FontAwesome5 name={iconConfig.name as keyof typeof FontAwesome5.glyphMap} size={iconSize} color={iconColor} />;
        case 'MaterialCommunityIcons':
          return <MaterialCommunityIcons name={iconConfig.name as keyof typeof MaterialCommunityIcons.glyphMap} size={iconSize} color={iconColor} />;
        default:
          return <Ionicons name={iconConfig.name as keyof typeof Ionicons.glyphMap} size={iconSize} color={iconColor} />;
      }
    } catch (error) {
      // Fallback jika ikon tidak ditemukan
      return <Ionicons name="star" size={iconSize} color={iconColor} />;
    }
  };

  // Mendapatkan warna berdasarkan data dari database atau fallback ke tipe tantangan
  const getChallengeColor = () => {
    // Jika ada warna dari database, gunakan itu
    if (color) {
      return color;
    }

    // Fallback ke warna berdasarkan tipe tantangan
    switch (type) {
      case 'saving':
        return theme.colors.success[500];
      case 'spending':
        return theme.colors.danger[500];
      case 'tracking':
        return theme.colors.primary[500];
      default:
        return theme.colors.warning[500];
    }
  };

  // Helper function untuk mengubah hex color menjadi lebih terang
  const lightenColor = (hex: string, percent: number): string => {
    // Remove # if present
    const cleanHex = hex.replace('#', '');

    // Parse RGB values
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);

    // Lighten each component
    const newR = Math.min(255, Math.floor(r + (255 - r) * percent));
    const newG = Math.min(255, Math.floor(g + (255 - g) * percent));
    const newB = Math.min(255, Math.floor(b + (255 - b) * percent));

    // Convert back to hex
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  };

  // Mendapatkan gradient colors berdasarkan warna dari database atau tipe tantangan
  const getGradientColors = (): [string, string] => {
    // Jika ada warna dari database, buat gradient dari warna tersebut
    if (color) {
      // Buat gradient dengan warna yang lebih terang dan warna asli
      const lighterColor = lightenColor(color, 0.3);
      return [lighterColor, color];
    }

    // Fallback ke gradient berdasarkan tipe tantangan
    switch (type) {
      case 'saving':
        return [theme.colors.success[400], theme.colors.success[600]];
      case 'spending':
        return [theme.colors.danger[400], theme.colors.danger[600]];
      case 'tracking':
        return [theme.colors.primary[400], theme.colors.primary[600]];
      default:
        return [theme.colors.warning[400], theme.colors.warning[600]];
    }
  };

  // Mendapatkan teks tipe tantangan
  const getChallengeTypeText = () => {
    switch (type) {
      case 'saving':
        return 'Tantangan Menabung';
      case 'spending':
        return 'Tantangan Pengeluaran';
      case 'tracking':
        return 'Tantangan Pelacakan';
      default:
        return 'Tantangan';
    }
  };

  // Fungsi untuk menangani press in
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  // Fungsi untuk menangani press out
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  // Fungsi untuk menangani klik pada kartu
  const handlePress = () => {
    if (onPress) {
      onPress(challenge);
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Card elevation="md" style={styles.card}>
        <TouchableOpacity
          style={styles.content}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
        >
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <LinearGradient
                colors={getGradientColors()}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconContainer}
              >
                {getIconComponent()}
              </LinearGradient>
              <View style={styles.titleContent}>
                <Typography variant="body1" weight="600">
                  {title}
                </Typography>
                <Typography variant="caption" color={theme.colors.neutral[600]}>
                  {getChallengeTypeText()}
                </Typography>
              </View>
            </View>

            {isCompleted && (
              <View style={styles.completedBadge}>
                <LinearGradient
                  colors={[theme.colors.success[400], theme.colors.success[600]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.completedBadgeGradient}
                >
                  <Ionicons
                    name="checkmark"
                    size={14}
                    color={theme.colors.white}
                  />
                </LinearGradient>
              </View>
            )}
          </View>

          <Typography
            variant="body2"
            color={theme.colors.neutral[700]}
            style={styles.description}
          >
            {description}
          </Typography>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              >
                <LinearGradient
                  colors={getGradientColors()}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.progressGradient}
                />
              </Animated.View>
            </View>
            <View style={styles.progressTextContainer}>
              <Typography
                variant="caption"
                weight="600"
                color={getChallengeColor()}
              >
                {progress}%
              </Typography>
            </View>
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <Typography variant="caption" color={theme.colors.neutral[600]}>
                Target
              </Typography>
              <Typography variant="body2" weight="600">
                {formatCurrency(target)}
              </Typography>
            </View>

            <View style={styles.detailItem}>
              <Typography variant="caption" color={theme.colors.neutral[600]}>
                Saat Ini
              </Typography>
              <Typography
                variant="body2"
                weight="600"
                color={current >= target ? theme.colors.success[500] : theme.colors.neutral[800]}
              >
                {formatCurrency(current)}
              </Typography>
            </View>

            <View style={styles.detailItem}>
              <Typography variant="caption" color={theme.colors.neutral[600]}>
                Tenggat
              </Typography>
              <Typography variant="body2" weight="600">
                {formatDate(endDate, { format: 'short' })}
              </Typography>
            </View>
          </View>

          {/* Status Footer */}
          <View style={styles.footer}>
            <View style={styles.statusIndicator}>
              <View style={[styles.statusDot, {
                backgroundColor: isCompleted
                  ? theme.colors.success[500]
                  : current > 0
                  ? theme.colors.primary[500]
                  : theme.colors.neutral[400]
              }]} />
              <Typography
                variant="caption"
                weight="600"
                color={theme.colors.neutral[700]}
                style={styles.statusText}
              >
                {isCompleted
                  ? 'Selesai'
                  : current > 0
                  ? 'Sedang Berjalan'
                  : 'Belum Dimulai'}
              </Typography>
            </View>

            <View style={styles.timeInfo}>
              <Ionicons
                name="time-outline"
                size={12}
                color={theme.colors.neutral[500]}
              />
              <Typography
                variant="caption"
                color={theme.colors.neutral[600]}
                style={styles.timeText}
              >
                {formatDate(endDate, { format: 'short' })}
              </Typography>
            </View>
          </View>
        </TouchableOpacity>
      </Card>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  card: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.neutral[100],
  },
  content: {
    padding: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  titleContent: {
    flex: 1,
  },
  completedBadge: {
    marginLeft: theme.spacing.sm,
  },
  completedBadgeGradient: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: {
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  progressBar: {
    flex: 1,
    height: 12,
    backgroundColor: theme.colors.neutral[100],
    borderRadius: theme.borderRadius.round,
    marginRight: theme.spacing.sm,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.borderRadius.round,
  },
  progressGradient: {
    width: '100%',
    height: '100%',
  },
  progressTextContainer: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.neutral[50],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.xs,
  },
  statusText: {
    marginLeft: theme.spacing.xs,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    marginLeft: theme.spacing.xs,
  },
});
