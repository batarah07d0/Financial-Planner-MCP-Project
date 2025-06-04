import React from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, GestureResponderEvent } from 'react-native';
import { Card } from './Card';
import { Typography } from './Typography';
import { theme } from '../theme';
import { formatCurrency, formatDate } from '../utils';
import { Ionicons } from '@expo/vector-icons';

interface TransactionCardProps {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description?: string;
  date: string;
  onPress?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  id,
  amount,
  type,
  category,
  description,
  date,
  onPress,
  onDelete,
}) => {
  // Animasi untuk efek press
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (onPress) {
      onPress(id);
    }
  };

  const handleDelete = (e: GestureResponderEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(id);
    }
  };

  // Mendapatkan ikon berdasarkan kategori
  const getCategoryIcon = () => {
    // Ini bisa diperluas dengan lebih banyak kategori
    switch (category.toLowerCase()) {
      case 'makanan':
      case 'makan':
      case 'kuliner':
        return 'fast-food-outline';
      case 'transportasi':
      case 'transport':
        return 'car-outline';
      case 'belanja':
      case 'shopping':
        return 'cart-outline';
      case 'hiburan':
      case 'entertainment':
        return 'film-outline';
      case 'utilitas':
      case 'tagihan':
      case 'bills':
        return 'receipt-outline';
      case 'gaji':
      case 'salary':
        return 'wallet-outline';
      case 'investasi':
      case 'investment':
        return 'trending-up-outline';
      case 'pendidikan':
      case 'education':
        return 'school-outline';
      case 'kesehatan':
      case 'health':
        return 'medical-outline';
      default:
        return type === 'income' ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline';
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.9}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Card style={styles.card} elevation="sm">
          <View style={styles.container}>
            <View style={styles.leftContent}>
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor:
                      type === 'income'
                        ? theme.colors.success[50]
                        : theme.colors.danger[50],
                  },
                ]}
              >
                <Ionicons
                  name={getCategoryIcon() as keyof typeof Ionicons.glyphMap}
                  size={20}
                  color={
                    type === 'income'
                      ? theme.colors.success[500]
                      : theme.colors.danger[500]
                  }
                />
              </View>
              <View style={styles.details}>
                <Typography variant="body1" weight="600">
                  {category}
                </Typography>
                {description && (
                  <Typography
                    variant="body2"
                    color={theme.colors.neutral[600]}
                    style={styles.description}
                    numberOfLines={1}
                  >
                    {description}
                  </Typography>
                )}
                <Typography
                  variant="caption"
                  color={theme.colors.neutral[500]}
                  style={styles.date}
                >
                  {formatDate(date, { format: 'medium' })}
                </Typography>
              </View>
            </View>

            <View style={styles.rightContent}>
              <Typography
                variant="body1"
                weight="700"
                color={
                  type === 'income'
                    ? theme.colors.success[500]
                    : theme.colors.danger[500]
                }
              >
                {type === 'income' ? '+' : '-'} {formatCurrency(amount)}
              </Typography>
              {onDelete && (
                <TouchableOpacity
                  onPress={handleDelete}
                  style={styles.deleteButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="trash-outline" size={16} color={theme.colors.danger[500]} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Card>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: 16,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  details: {
    flex: 1,
  },
  description: {
    marginTop: theme.spacing.xxs,
  },
  date: {
    marginTop: theme.spacing.xs,
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  deleteButton: {
    marginTop: theme.spacing.xs,
    padding: theme.spacing.xs,
  },
});
