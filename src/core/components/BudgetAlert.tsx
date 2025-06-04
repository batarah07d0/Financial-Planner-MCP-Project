import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import { Typography } from './Typography';
import { Button } from './Button';
import { theme } from '../theme';
import { useSensors } from '../hooks/useSensors';
import { useNotificationManager } from '../hooks/useNotificationManager';
import { formatCurrency } from '../utils';

interface BudgetAlertProps {
  visible: boolean;
  onClose: () => void;
  budgetName: string;
  budgetLimit: number;
  currentSpending: number;
  remainingBudget: number;
  percentageUsed: number;
}

export const BudgetAlert: React.FC<BudgetAlertProps> = ({
  visible,
  onClose,
  budgetName,
  budgetLimit,
  currentSpending,
  remainingBudget,
  percentageUsed,
}) => {
  const [animatedValue] = useState(new Animated.Value(0));
  const { triggerHapticFeedback } = useSensors();
  const { sendBudgetAlert } = useNotificationManager();

  // Animasi untuk alert
  useEffect(() => {
    if (visible) {
      // Reset animasi
      animatedValue.setValue(0);

      // Mulai animasi
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      // Trigger haptic feedback berdasarkan persentase penggunaan
      if (percentageUsed >= 90) {
        triggerHapticFeedback('error');
      } else if (percentageUsed >= 75) {
        triggerHapticFeedback('warning');
      } else {
        triggerHapticFeedback('medium');
      }

      // Kirim notifikasi budget alert
      sendBudgetAlert(budgetName, percentageUsed, remainingBudget);
    }
  }, [visible, budgetName, percentageUsed, remainingBudget, animatedValue, sendBudgetAlert, triggerHapticFeedback]);

  // Animasi untuk scale dan opacity
  const scale = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 1.1, 1],
  });

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // Mendapatkan warna berdasarkan persentase penggunaan
  const getStatusColor = () => {
    if (percentageUsed >= 90) {
      return theme.colors.danger[500];
    } else if (percentageUsed >= 75) {
      return theme.colors.warning[500];
    } else {
      return theme.colors.success[500];
    }
  };

  // Mendapatkan pesan berdasarkan persentase penggunaan
  const getStatusMessage = () => {
    if (percentageUsed >= 90) {
      return 'Anggaran hampir habis!';
    } else if (percentageUsed >= 75) {
      return 'Anggaran sudah terpakai 75%';
    } else {
      return 'Anggaran masih dalam batas aman';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <Animated.View
          style={[
            styles.alertContainer,
            {
              transform: [{ scale }],
              opacity,
            },
          ]}
        >
          <View style={styles.header}>
            <Typography variant="h5" align="center">
              Peringatan Anggaran
            </Typography>
          </View>

          <View style={styles.content}>
            <Typography variant="body1" weight="600" style={styles.budgetName}>
              {budgetName}
            </Typography>

            <Typography
              variant="body1"
              color={getStatusColor()}
              weight="600"
              style={styles.statusMessage}
            >
              {getStatusMessage()}
            </Typography>

            <View style={styles.budgetInfo}>
              <View style={styles.infoItem}>
                <Typography variant="body2" color={theme.colors.neutral[600]}>
                  Batas Anggaran
                </Typography>
                <Typography variant="body1">
                  {formatCurrency(budgetLimit)}
                </Typography>
              </View>

              <View style={styles.infoItem}>
                <Typography variant="body2" color={theme.colors.neutral[600]}>
                  Pengeluaran
                </Typography>
                <Typography variant="body1" color={theme.colors.danger[500]}>
                  {formatCurrency(currentSpending)}
                </Typography>
              </View>

              <View style={styles.infoItem}>
                <Typography variant="body2" color={theme.colors.neutral[600]}>
                  Sisa Anggaran
                </Typography>
                <Typography
                  variant="body1"
                  color={remainingBudget < 0 ? theme.colors.danger[500] : theme.colors.success[500]}
                >
                  {formatCurrency(remainingBudget)}
                </Typography>
              </View>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressBackground}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(percentageUsed, 100)}%`,
                      backgroundColor: getStatusColor(),
                    },
                  ]}
                />
              </View>
              <Typography variant="caption" align="center" style={styles.progressText}>
                {percentageUsed.toFixed(0)}% terpakai
              </Typography>
            </View>
          </View>

          <View style={styles.footer}>
            <Button
              title="Tutup"
              onPress={onClose}
              fullWidth
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: theme.spacing.layout.md,
  },
  alertContainer: {
    width: '100%',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.elevation.md,
  },
  header: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primary[500],
  },
  content: {
    padding: theme.spacing.md,
  },
  budgetName: {
    marginBottom: theme.spacing.sm,
  },
  statusMessage: {
    marginBottom: theme.spacing.md,
  },
  budgetInfo: {
    marginBottom: theme.spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  progressContainer: {
    marginBottom: theme.spacing.md,
  },
  progressBackground: {
    height: 10,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.round,
    overflow: 'hidden',
    marginBottom: theme.spacing.xs,
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    marginTop: theme.spacing.xs,
  },
  footer: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
  },
});
