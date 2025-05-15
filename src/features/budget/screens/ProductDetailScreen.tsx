import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../core/navigation/types';
import { Typography, EmptyState } from '../../../core/components';
import { theme } from '../../../core/theme';
import { PriceItem } from '../components/PriceItem';
import { ProductWithPrices, Store } from '../models/Product';
import { getProductById } from '../services/productService';
import { getProductPricesByProductId, voteProductPrice } from '../services/productPriceService';
import { useLocation } from '../../../core/hooks/useLocation';
import { getDistance } from 'geolib';
import { Ionicons } from '@expo/vector-icons';

type ProductDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProductDetail'>;
type ProductDetailScreenRouteProp = RouteProp<RootStackParamList, 'ProductDetail'>;

export const ProductDetailScreen = () => {
  const navigation = useNavigation<ProductDetailScreenNavigationProp>();
  const route = useRoute<ProductDetailScreenRouteProp>();
  const { productId } = route.params;
  
  const [product, setProduct] = useState<ProductWithPrices | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'price' | 'distance' | 'trust'>('price');
  
  const { location, getCurrentLocation } = useLocation();
  
  // Fungsi untuk memuat produk dan harga
  const loadProductWithPrices = async () => {
    try {
      setIsLoading(true);
      
      // Dapatkan produk
      const productData = await getProductById(productId);
      
      if (!productData) {
        throw new Error('Produk tidak ditemukan');
      }
      
      // Dapatkan harga produk
      const prices = await getProductPricesByProductId(productId);
      
      // Dapatkan lokasi saat ini
      const currentLocation = await getCurrentLocation();
      
      // Gabungkan produk dengan harga
      const productWithPrices: ProductWithPrices = {
        ...productData,
        prices: prices.map(price => {
          // Dummy store untuk sementara
          // Nanti akan diganti dengan data toko yang sebenarnya
          const store: Store = {
            id: price.storeId,
            name: `Toko ${price.storeId.substring(0, 5)}`,
            type: 'supermarket',
            location: {
              latitude: currentLocation?.latitude || -6.2088,
              longitude: currentLocation?.longitude || 106.8456,
            },
            createdAt: price.createdAt,
            updatedAt: price.updatedAt,
          };
          
          return {
            ...price,
            store,
          };
        }),
      };
      
      setProduct(productWithPrices);
    } catch (error) {
      console.error('Error loading product with prices:', error);
      Alert.alert('Error', 'Gagal memuat data produk');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fungsi untuk menangani upvote
  const handleUpvote = async (priceId: string) => {
    try {
      const result = await voteProductPrice(priceId, 'up');
      
      if (result && product) {
        // Perbarui state produk dengan harga yang baru
        setProduct({
          ...product,
          prices: product.prices.map(price =>
            price.id === priceId
              ? { ...price, upvotes: result.upvotes }
              : price
          ),
        });
      }
    } catch (error) {
      console.error('Error upvoting price:', error);
      Alert.alert('Error', 'Gagal memberikan upvote');
    }
  };
  
  // Fungsi untuk menangani downvote
  const handleDownvote = async (priceId: string) => {
    try {
      const result = await voteProductPrice(priceId, 'down');
      
      if (result && product) {
        // Perbarui state produk dengan harga yang baru
        setProduct({
          ...product,
          prices: product.prices.map(price =>
            price.id === priceId
              ? { ...price, downvotes: result.downvotes }
              : price
          ),
        });
      }
    } catch (error) {
      console.error('Error downvoting price:', error);
      Alert.alert('Error', 'Gagal memberikan downvote');
    }
  };
  
  // Fungsi untuk menangani klik pada toko
  const handleStorePress = (store: Store) => {
    // Navigasi ke halaman detail toko
    // navigation.navigate('StoreDetail', { storeId: store.id });
    Alert.alert('Info', `Toko: ${store.name}`);
  };
  
  // Fungsi untuk menangani tambah harga baru
  const handleAddPrice = () => {
    if (product) {
      navigation.navigate('AddPrice', { productId: product.id });
    }
  };
  
  // Fungsi untuk mengurutkan harga
  const getSortedPrices = () => {
    if (!product) return [];
    
    const prices = [...product.prices];
    
    switch (sortBy) {
      case 'price':
        return prices.sort((a, b) => a.price - b.price);
      case 'distance':
        if (!location) return prices;
        return prices.sort((a, b) => {
          const distanceA = getDistance(
            { latitude: location.latitude, longitude: location.longitude },
            { latitude: a.store.location.latitude, longitude: a.store.location.longitude }
          );
          const distanceB = getDistance(
            { latitude: location.latitude, longitude: location.longitude },
            { latitude: b.store.location.latitude, longitude: b.store.location.longitude }
          );
          return distanceA - distanceB;
        });
      case 'trust':
        return prices.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
      default:
        return prices;
    }
  };
  
  // Memuat produk saat komponen dimount
  useEffect(() => {
    loadProductWithPrices();
  }, [productId]);
  
  // Render loading
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }
  
  // Render jika produk tidak ditemukan
  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          title="Produk Tidak Ditemukan"
          description="Produk yang Anda cari tidak ditemukan."
          actionLabel="Kembali"
          onAction={() => navigation.goBack()}
        />
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Typography variant="body1" color={theme.colors.primary[500]}>
            Kembali
          </Typography>
        </TouchableOpacity>
        <Typography variant="h4">Detail Produk</Typography>
        <TouchableOpacity onPress={handleAddPrice}>
          <Typography variant="body1" color={theme.colors.primary[500]}>
            + Harga
          </Typography>
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.productHeader}>
          {product.imageUrl ? (
            <Image
              source={{ uri: product.imageUrl }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Ionicons
                name="image-outline"
                size={40}
                color={theme.colors.neutral[500]}
              />
            </View>
          )}
          
          <View style={styles.productInfo}>
            <Typography variant="h4" style={styles.productName}>
              {product.name}
            </Typography>
            
            <Typography
              variant="body1"
              color={theme.colors.neutral[600]}
              style={styles.productCategory}
            >
              {product.category}
            </Typography>
            
            {product.description && (
              <Typography
                variant="body2"
                color={theme.colors.neutral[600]}
                style={styles.productDescription}
              >
                {product.description}
              </Typography>
            )}
          </View>
        </View>
        
        <View style={styles.pricesHeader}>
          <Typography variant="h5">Harga di Toko Terdekat</Typography>
          
          <View style={styles.sortButtons}>
            <TouchableOpacity
              style={[
                styles.sortButton,
                sortBy === 'price' && styles.activeSortButton,
              ]}
              onPress={() => setSortBy('price')}
            >
              <Typography
                variant="caption"
                color={sortBy === 'price' ? theme.colors.white : theme.colors.neutral[700]}
              >
                Harga
              </Typography>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.sortButton,
                sortBy === 'distance' && styles.activeSortButton,
              ]}
              onPress={() => setSortBy('distance')}
            >
              <Typography
                variant="caption"
                color={sortBy === 'distance' ? theme.colors.white : theme.colors.neutral[700]}
              >
                Jarak
              </Typography>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.sortButton,
                sortBy === 'trust' && styles.activeSortButton,
              ]}
              onPress={() => setSortBy('trust')}
            >
              <Typography
                variant="caption"
                color={sortBy === 'trust' ? theme.colors.white : theme.colors.neutral[700]}
              >
                Kepercayaan
              </Typography>
            </TouchableOpacity>
          </View>
        </View>
        
        {getSortedPrices().length === 0 ? (
          <EmptyState
            title="Belum Ada Harga"
            description="Belum ada data harga untuk produk ini. Tambahkan harga baru untuk membantu pengguna lain."
            actionLabel="Tambah Harga"
            onAction={handleAddPrice}
          />
        ) : (
          getSortedPrices().map(price => (
            <PriceItem
              key={price.id}
              price={price}
              distance={
                location
                  ? getDistance(
                      { latitude: location.latitude, longitude: location.longitude },
                      { latitude: price.store.location.latitude, longitude: price.store.location.longitude }
                    )
                  : undefined
              }
              onUpvote={handleUpvote}
              onDownvote={handleDownvote}
              onStorePress={handleStorePress}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.layout.sm,
    paddingBottom: theme.spacing.md,
  },
  content: {
    padding: theme.spacing.layout.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productHeader: {
    flexDirection: 'row',
    marginBottom: theme.spacing.layout.md,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius.md,
  },
  productImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.neutral[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  productName: {
    marginBottom: theme.spacing.xs,
  },
  productCategory: {
    marginBottom: theme.spacing.sm,
  },
  productDescription: {
    marginBottom: theme.spacing.sm,
  },
  pricesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sortButtons: {
    flexDirection: 'row',
  },
  sortButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.neutral[200],
    marginLeft: theme.spacing.xs,
  },
  activeSortButton: {
    backgroundColor: theme.colors.primary[500],
  },
});
