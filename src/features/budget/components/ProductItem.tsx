import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Typography } from '../../../core/components';
import { theme } from '../../../core/theme';
import { ProductWithPrices } from '../models/Product';
import { formatCurrency } from '../../../core/utils';

interface ProductItemProps {
  product: ProductWithPrices;
  onPress?: (product: ProductWithPrices) => void;
}

export const ProductItem: React.FC<ProductItemProps> = ({ product, onPress }) => {
  // Hitung harga terendah dan tertinggi
  const prices = product.prices.map(price => price.price);
  const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const highestPrice = prices.length > 0 ? Math.max(...prices) : 0;
  
  // Hitung jumlah toko
  const storeCount = new Set(product.prices.map(price => price.storeId)).size;
  
  // Fungsi untuk menangani klik pada produk
  const handlePress = () => {
    if (onPress) {
      onPress(product);
    }
  };
  
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {product.imageUrl ? (
        <Image
          source={{ uri: product.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Typography variant="body2" color={theme.colors.neutral[500]}>
            No Image
          </Typography>
        </View>
      )}
      
      <View style={styles.content}>
        <Typography variant="h5" numberOfLines={1} style={styles.name}>
          {product.name}
        </Typography>
        
        <Typography
          variant="body2"
          color={theme.colors.neutral[600]}
          style={styles.category}
        >
          {product.category}
        </Typography>
        
        <View style={styles.priceContainer}>
          {lowestPrice === highestPrice ? (
            <Typography variant="h5" color={theme.colors.primary[500]}>
              {formatCurrency(lowestPrice)}
            </Typography>
          ) : (
            <Typography variant="h5" color={theme.colors.primary[500]}>
              {formatCurrency(lowestPrice)} - {formatCurrency(highestPrice)}
            </Typography>
          )}
          
          <Typography variant="caption" color={theme.colors.neutral[500]}>
            di {storeCount} toko
          </Typography>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.elevation.sm,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.sm,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.neutral[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  name: {
    marginBottom: theme.spacing.xs,
  },
  category: {
    marginBottom: theme.spacing.sm,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
});
