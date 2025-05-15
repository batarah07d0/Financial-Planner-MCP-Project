import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Typography } from './Typography';
import { Card } from './Card';
import { theme } from '../theme';
import { formatCurrency, formatDate } from '../utils';
import { Ionicons } from '@expo/vector-icons';

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
    startDate,
    endDate,
    reward,
    participants,
    isCompleted,
    image,
  } = challenge;

  // Hitung persentase penyelesaian
  const progress = Math.min(Math.round((current / target) * 100), 100);

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

  // Fungsi untuk menangani klik pada kartu
  const handlePress = () => {
    if (onPress) {
      onPress(challenge);
    }
  };

  return (
    <Card style={styles.container}>
      <TouchableOpacity
        style={styles.content}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: getChallengeColor() },
              ]}
            >
              <Ionicons
                name={getChallengeIcon() as any}
                size={20}
                color={theme.colors.white}
              />
            </View>
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
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={theme.colors.success[500]}
              />
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
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress}%`,
                  backgroundColor: getChallengeColor(),
                },
              ]}
            />
          </View>
          <Typography variant="caption" align="right">
            {progress}%
          </Typography>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <Typography variant="caption" color={theme.colors.neutral[600]}>
              Target
            </Typography>
            <Typography variant="body2">
              {formatCurrency(target)}
            </Typography>
          </View>

          <View style={styles.detailItem}>
            <Typography variant="caption" color={theme.colors.neutral[600]}>
              Saat Ini
            </Typography>
            <Typography variant="body2">
              {formatCurrency(current)}
            </Typography>
          </View>

          <View style={styles.detailItem}>
            <Typography variant="caption" color={theme.colors.neutral[600]}>
              Tenggat
            </Typography>
            <Typography variant="body2">
              {formatDate(endDate, { format: 'short' })}
            </Typography>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.reward}>
            <Ionicons
              name="star"
              size={16}
              color={theme.colors.warning[500]}
            />
            <Typography
              variant="caption"
              color={theme.colors.neutral[700]}
              style={styles.rewardText}
            >
              {reward.points} poin
            </Typography>
          </View>

          {participants && (
            <View style={styles.participants}>
              <Ionicons
                name="people-outline"
                size={16}
                color={theme.colors.neutral[700]}
              />
              <Typography
                variant="caption"
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
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  content: {
    padding: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  titleContent: {
    flex: 1,
  },
  completedBadge: {
    marginLeft: theme.spacing.sm,
  },
  description: {
    marginBottom: theme.spacing.md,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.round,
    marginRight: theme.spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  detailItem: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
  },
  reward: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardText: {
    marginLeft: theme.spacing.xs,
  },
  participants: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantsText: {
    marginLeft: theme.spacing.xs,
  },
});
