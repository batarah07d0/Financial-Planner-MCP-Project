import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../core/navigation/types';
import { Typography, EmptyState } from '../../../core/components';
import { theme } from '../../../core/theme';
import { ProductItem } from '../components/ProductItem';
import { ProductWithPrices, BASIC_PRODUCT_CATEGORIES } from '../models/Product';
import { getProductsWithPricesFromNearbyStores } from '../services/productPriceService';
import { useLocation } from '../../../core/hooks/useLocation';
import { Ionicons } from '@expo/vector-icons';

type PriceComparisonScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PriceComparison'>;

export const PriceComparisonScreen = () => {
  const navigation = useNavigation<PriceComparisonScreenNavigationProp>();
  const [products, setProducts] = useState<ProductWithPrices[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithPrices[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { location, getCurrentLocation } = useLocation();

  // Fungsi untuk memuat produk dengan harga
  const loadProducts = async () => {
    try {
      setIsLoading(true);

      // Dapatkan lokasi saat ini
      const currentLocation = await getCurrentLocation();

      if (!currentLocation) {
        throw new Error('Tidak dapat mendapatkan lokasi saat ini');
      }

      // Dapatkan produk dengan harga dari toko terdekat
      const productsWithPrices = await getProductsWithPricesFromNearbyStores(
        currentLocation.latitude,
        currentLocation.longitude,
        5000, // 5 km
        30 // 30 hari
      );

      setProducts(productsWithPrices);
      setFilteredProducts(productsWithPrices);
    } catch (error) {
      console.error('Error loading products with prices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi untuk refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadProducts();
    setIsRefreshing(false);
  };

  // Fungsi untuk menangani klik pada produk
  const handleProductPress = (product: ProductWithPrices) => {
    navigation.navigate('ProductDetail', { productId: product.id });
  };

  // Fungsi untuk menangani perubahan pencarian
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    filterProducts(text, selectedCategory);
  };

  // Fungsi untuk menangani klik pada kategori
  const handleCategoryPress = (category: string | null) => {
    setSelectedCategory(category);
    filterProducts(searchQuery, category);
  };

  // Fungsi untuk memfilter produk
  const filterProducts = (query: string, category: string | null) => {
    let filtered = products;

    // Filter berdasarkan pencarian
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(lowerQuery) ||
        product.category.toLowerCase().includes(lowerQuery)
      );
    }

    // Filter berdasarkan kategori
    if (category) {
      filtered = filtered.filter(product => product.category === category);
    }

    setFilteredProducts(filtered);
  };

  // Fungsi untuk menangani tambah produk baru
  const handleAddProduct = () => {
    navigation.navigate('AddProduct', {});
  };

  // Fungsi untuk menangani tambah harga baru
  const handleAddPrice = () => {
    navigation.navigate('AddPrice', {});
  };

  // Memuat produk saat komponen dimount
  useEffect(() => {
    loadProducts();
  }, []);

  // Render item kategori
  const renderCategoryItem = ({ item }: { item: string | null }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        selectedCategory === item && styles.selectedCategoryButton,
      ]}
      onPress={() => handleCategoryPress(item)}
    >
      <Typography
        variant="body2"
        color={selectedCategory === item ? theme.colors.white : theme.colors.neutral[700]}
      >
        {item === null ? 'Semua' : item}
      </Typography>
    </TouchableOpacity>
  );

  // Render item produk
  const renderProductItem = ({ item }: { item: ProductWithPrices }) => (
    <ProductItem
      product={item}
      onPress={handleProductPress}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Typography variant="body1" color={theme.colors.primary[500]}>
            Kembali
          </Typography>
        </TouchableOpacity>
        <Typography variant="h4">Perbandingan Harga</Typography>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleAddPrice}
          >
            <Typography variant="body2" color={theme.colors.primary[500]}>
              + Harga
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleAddProduct}
          >
            <Typography variant="body2" color={theme.colors.primary[500]}>
              + Produk
            </Typography>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search"
            size={20}
            color={theme.colors.neutral[500]}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari produk..."
            value={searchQuery}
            onChangeText={handleSearchChange}
          />
          {searchQuery ? (
            <TouchableOpacity
              onPress={() => handleSearchChange('')}
              style={styles.clearButton}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={theme.colors.neutral[500]}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <FlatList
        horizontal
        data={[null, ...BASIC_PRODUCT_CATEGORIES]}
        renderItem={renderCategoryItem}
        keyExtractor={item => (item === null ? 'all' : item)}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      />

      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <EmptyState
              title="Tidak Ada Produk"
              description="Tidak ada produk yang ditemukan. Coba ubah filter atau tambahkan produk baru."
              actionLabel="Tambah Produk"
              onAction={handleAddProduct}
            />
          }
        />
      )}
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
  headerButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginLeft: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary[500],
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.layout.sm,
    paddingBottom: theme.spacing.md,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    ...theme.elevation.sm,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: theme.colors.neutral[900],
  },
  clearButton: {
    padding: theme.spacing.xs,
  },
  categoriesContainer: {
    paddingHorizontal: theme.spacing.layout.sm,
    paddingBottom: theme.spacing.md,
  },
  categoryButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.neutral[200],
    marginRight: theme.spacing.sm,
  },
  selectedCategoryButton: {
    backgroundColor: theme.colors.primary[500],
  },
  listContent: {
    padding: theme.spacing.layout.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
