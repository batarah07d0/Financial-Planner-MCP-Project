import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from './Card';
import { Typography } from './Typography';
import { theme } from '../theme';
import { formatCurrency, formatPercentage } from '../utils';
import { useAppDimensions } from '../hooks/useAppDimensions';

interface BudgetCardProps {
  id: string;
  category: string;
  amount: number;
  spent: number;
  onPress?: (id: string) => void;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({
  id,
  category,
  amount,
  spent,
  onPress,
}) => {
  // Responsive dimensions
  const {
    responsiveSpacing,
    responsiveFontSize,
    isSmallDevice
  } = useAppDimensions();

  const handlePress = () => {
    if (onPress) {
      onPress(id);
    }
  };

  // Hitung persentase pengeluaran
  const percentage = amount > 0 ? spent / amount : 0;

  // Tentukan warna progress bar berdasarkan persentase
  const getProgressColor = () => {
    if (percentage >= 1) {
      return theme.colors.danger[500];
    } else if (percentage >= 0.8) {
      return theme.colors.warning[500];
    } else {
      return theme.colors.success[500];
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Card style={{
        ...styles.card,
        marginBottom: responsiveSpacing(theme.spacing.sm),
        padding: responsiveSpacing(isSmallDevice ? theme.spacing.sm : theme.spacing.md),
      }}>
        <View style={[styles.header, {
          marginBottom: responsiveSpacing(theme.spacing.sm),
        }]}>
          <Typography
            variant="body1"
            weight="600"
            style={{
              fontSize: responsiveFontSize(isSmallDevice ? 14 : 16),
              flexShrink: 1
            }}
          >
            {category}
          </Typography>
          <Typography
            variant="body2"
            color={percentage >= 1 ? theme.colors.danger[500] : theme.colors.neutral[600]}
            style={{
              fontSize: responsiveFontSize(isSmallDevice ? 12 : 14),
              textAlign: 'right',
              flexShrink: 0
            }}
          >
            {formatCurrency(spent)} / {formatCurrency(amount)}
          </Typography>
        </View>

        <View style={[styles.progressContainer, {
          marginBottom: responsiveSpacing(theme.spacing.sm),
        }]}>
          <View style={[styles.progressBackground, {
            height: responsiveSpacing(isSmallDevice ? 6 : 8),
          }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(percentage * 100, 100)}%`,
                  backgroundColor: getProgressColor(),
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Typography
            variant="caption"
            color={
              percentage >= 1
                ? theme.colors.danger[500]
                : theme.colors.neutral[600]
            }
            style={{
              fontSize: responsiveFontSize(isSmallDevice ? 10 : 12),
              flexShrink: 1
            }}
          >
            {percentage >= 1
              ? 'Melebihi anggaran'
              : `${formatPercentage(percentage)} terpakai`}
          </Typography>
          <Typography
            variant="caption"
            color={theme.colors.neutral[600]}
            style={{
              fontSize: responsiveFontSize(isSmallDevice ? 10 : 12),
              textAlign: 'right',
              flexShrink: 0
            }}
          >
            Sisa: {formatCurrency(Math.max(amount - spent, 0))}
          </Typography>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    // Responsive values will be applied inline
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // Responsive values will be applied inline
  },
  progressContainer: {
    // Responsive values will be applied inline
  },
  progressBackground: {
    backgroundColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.round,
    overflow: 'hidden',
    // Responsive values will be applied inline
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
});
