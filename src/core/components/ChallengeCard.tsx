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
import { Ionicons } from '@expo/vector-icons';
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
    reward,
    participants,
    isCompleted,
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
      useNativeDriver: false, // Karena kita menganimasikan width
    }).start();
  }, [progress, progressAnim]);

  // Mendapatkan ikon berdasarkan tipe tantangan
  const getChallengeIcon = () => {
    switch (type) {
      case 'saving':
        return 'piggy-bank-outline';
      case 'spending':
        return 'wallet-outline';
      case 'tracking':
        return 'analytics-outline';
      default:
        return 'trophy-outline';
    }
  };

  // Mendapatkan warna berdasarkan tipe tantangan
  const getChallengeColor = () => {
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

  // Mendapatkan gradient colors berdasarkan tipe tantangan
  const getGradientColors = (): [string, string] => {
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
                <Ionicons
                  name={getChallengeIcon() as keyof typeof Ionicons.glyphMap}
                  size={20}
                  color={theme.colors.white}
                />
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

          <View style={styles.footer}>
            <View style={styles.reward}>
              <LinearGradient
                colors={[theme.colors.warning[400], theme.colors.warning[600]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.rewardBadge}
              >
                <Ionicons
                  name="star"
                  size={12}
                  color={theme.colors.white}
                />
              </LinearGradient>
              <Typography
                variant="caption"
                weight="600"
                color={theme.colors.neutral[700]}
                style={styles.rewardText}
              >
                {reward.points} poin
              </Typography>
            </View>

            {participants && (
              <View style={styles.participants}>
                <View style={styles.participantsBadge}>
                  <Ionicons
                    name="people"
                    size={12}
                    color={theme.colors.neutral[600]}
                  />
                </View>
                <Typography
                  variant="caption"
                  weight="600"
                  color={theme.colors.neutral[700]}
                  style={styles.participantsText}
                >
                  {participants} peserta
                </Typography>
              </View>
            )}
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
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
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
    height: 10,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.round,
    marginRight: theme.spacing.sm,
    overflow: 'hidden',
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
  reward: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardText: {
    marginLeft: theme.spacing.sm,
  },
  participants: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantsBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral[200],
  },
  participantsText: {
    marginLeft: theme.spacing.sm,
  },
});
