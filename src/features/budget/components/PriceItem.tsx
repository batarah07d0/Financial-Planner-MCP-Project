import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Typography } from '../../../core/components';
import { theme } from '../../../core/theme';
import { ProductPrice, Store } from '../models/Product';
import { formatCurrency, formatDate } from '../../../core/utils';
import { Ionicons } from '@expo/vector-icons';

interface PriceItemProps {
  price: ProductPrice & { store: Store };
  distance?: number; // dalam meter
  onUpvote?: (priceId: string) => void;
  onDownvote?: (priceId: string) => void;
  onStorePress?: (store: Store) => void;
}

export const PriceItem: React.FC<PriceItemProps> = ({
  price,
  distance,
  onUpvote,
  onDownvote,
  onStorePress,
}) => {
  // Fungsi untuk menangani upvote
  const handleUpvote = () => {
    if (onUpvote) {
      onUpvote(price.id);
    }
  };
  
  // Fungsi untuk menangani downvote
  const handleDownvote = () => {
    if (onDownvote) {
      onDownvote(price.id);
    }
  };
  
  // Fungsi untuk menangani klik pada toko
  const handleStorePress = () => {
    if (onStorePress) {
      onStorePress(price.store);
    }
  };
  
  // Hitung skor kepercayaan
  const trustScore = price.upvotes - price.downvotes;
  const trustColor = trustScore > 0
    ? theme.colors.success[500]
    : trustScore < 0
      ? theme.colors.danger[500]
      : theme.colors.neutral[500];
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleStorePress}>
          <Typography variant="h5" numberOfLines={1} style={styles.storeName}>
            {price.store.name}
          </Typography>
        </TouchableOpacity>
        
        <Typography variant="h4" color={theme.colors.primary[500]}>
          {formatCurrency(price.price)}
        </Typography>
      </View>
      
      <View style={styles.details}>
        <View>
          <Typography variant="body2" color={theme.colors.neutral[600]}>
            {price.store.type === 'supermarket'
              ? 'Supermarket'
              : price.store.type === 'traditional_market'
                ? 'Pasar Tradisional'
                : price.store.type === 'convenience_store'
                  ? 'Minimarket'
                  : price.store.type === 'grocery'
                    ? 'Toko Kelontong'
                    : 'Lainnya'}
          </Typography>
          
          {distance !== undefined && (
            <Typography variant="body2" color={theme.colors.neutral[600]}>
              {distance < 1000
                ? `${Math.round(distance)} m`
                : `${(distance / 1000).toFixed(1)} km`}
            </Typography>
          )}
          
          <Typography variant="caption" color={theme.colors.neutral[500]}>
            Update: {formatDate(price.priceDate, { format: 'short' })}
          </Typography>
        </View>
        
        <View style={styles.voteContainer}>
          <TouchableOpacity
            style={styles.voteButton}
            onPress={handleUpvote}
          >
            <Ionicons
              name="thumbs-up"
              size={18}
              color={theme.colors.success[500]}
            />
            <Typography
              variant="caption"
              color={theme.colors.success[500]}
              style={styles.voteCount}
            >
              {price.upvotes}
            </Typography>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.voteButton}
            onPress={handleDownvote}
          >
            <Ionicons
              name="thumbs-down"
              size={18}
              color={theme.colors.danger[500]}
            />
            <Typography
              variant="caption"
              color={theme.colors.danger[500]}
              style={styles.voteCount}
            >
              {price.downvotes}
            </Typography>
          </TouchableOpacity>
          
          <View style={[styles.trustBadge, { backgroundColor: trustColor }]}>
            <Typography variant="caption" color={theme.colors.white}>
              {trustScore > 0 ? '+' : ''}{trustScore}
            </Typography>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.elevation.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  storeName: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  voteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: theme.spacing.sm,
  },
  voteCount: {
    marginLeft: theme.spacing.xs / 2,
  },
  trustBadge: {
    marginLeft: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: theme.borderRadius.round,
  },
});
