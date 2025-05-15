import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../core/navigation/types';
import { Typography, TextInput, Button } from '../../../core/components';
import { theme } from '../../../core/theme';
import { Product, Store } from '../models/Product';
import { getProductById } from '../services/productService';
import { getNearbyStores } from '../services/productService';
import { addProductPrice } from '../services/productPriceService';
import { useLocation } from '../../../core/hooks/useLocation';
import { useAuthStore } from '../../../core/services/store';
import { formatCurrency } from '../../../core/utils';

type AddPriceScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddPrice'>;
type AddPriceScreenRouteProp = RouteProp<RootStackParamList, 'AddPrice'>;

export const AddPriceScreen = () => {
  const navigation = useNavigation<AddPriceScreenNavigationProp>();
  const route = useRoute<AddPriceScreenRouteProp>();
  const { productId } = route.params || {};
  
  const [product, setProduct] = useState<Product | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [price, setPrice] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSelectingStore, setIsSelectingStore] = useState(false);
  
  const { location, getCurrentLocation } = useLocation();
  const { user } = useAuthStore();
  
  // Fungsi untuk memuat produk dan toko terdekat
  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Jika ada productId, dapatkan produk
      if (productId) {
        const productData = await getProductById(productId);
        
        if (!productData) {
          throw new Error('Produk tidak ditemukan');
        }
        
        setProduct(productData);
      }
      
      // Dapatkan lokasi saat ini
      const currentLocation = await getCurrentLocation();
      
      if (!currentLocation) {
        throw new Error('Tidak dapat mendapatkan lokasi saat ini');
      }
      
      // Dapatkan toko terdekat
      const nearbyStores = await getNearbyStores(
        currentLocation.latitude,
        currentLocation.longitude,
        5000 // 5 km
      );
      
      setStores(nearbyStores);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fungsi untuk menangani simpan harga
  const handleSave = async () => {
    if (!product) {
      Alert.alert('Error', 'Produk tidak dipilih');
      return;
    }
    
    if (!selectedStore) {
      Alert.alert('Error', 'Toko tidak dipilih');
      return;
    }
    
    const priceValue = parseInt(price.replace(/[^0-9]/g, ''), 10);
    if (isNaN(priceValue) || priceValue <= 0) {
      Alert.alert('Error', 'Harga harus berupa angka positif');
      return;
    }
    
    if (!user) {
      Alert.alert('Error', 'Anda harus login untuk menambahkan harga');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      await addProductPrice(
        {
          productId: product.id,
          storeId: selectedStore.id,
          price: priceValue,
        },
        user.id
      );
      
      Alert.alert('Sukses', 'Harga berhasil ditambahkan', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error saving price:', error);
      Alert.alert('Error', 'Gagal menyimpan harga');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Fungsi untuk menangani perubahan harga
  const handlePriceChange = (text: string) => {
    // Format sebagai mata uang
    const numericValue = text.replace(/[^0-9]/g, '');
    if (numericValue) {
      setPrice(formatCurrency(parseInt(numericValue, 10), { showSymbol: false }));
    } else {
      setPrice('');
    }
  };
  
  // Fungsi untuk menangani pilih produk
  const handleSelectProduct = () => {
    navigation.navigate('SelectProduct', {
      onSelect: (selectedProduct: Product) => {
        setProduct(selectedProduct);
      },
    });
  };
  
  // Fungsi untuk menangani pilih toko
  const handleSelectStore = () => {
    setIsSelectingStore(true);
  };
  
  // Fungsi untuk menangani konfirmasi pilih toko
  const handleStoreSelected = (store: Store) => {
    setSelectedStore(store);
    setIsSelectingStore(false);
  };
  
  // Fungsi untuk menangani batal pilih toko
  const handleCancelSelectStore = () => {
    setIsSelectingStore(false);
  };
  
  // Memuat data saat komponen dimount
  useEffect(() => {
    loadData();
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
  
  // Render pemilihan toko
  if (isSelectingStore) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancelSelectStore}>
            <Typography variant="body1" color={theme.colors.primary[500]}>
              Batal
            </Typography>
          </TouchableOpacity>
          <Typography variant="h4">Pilih Toko</Typography>
          <View style={{ width: 50 }} />
        </View>
        
        <ScrollView contentContainerStyle={styles.storeListContainer}>
          {stores.length === 0 ? (
            <Typography
              variant="body1"
              color={theme.colors.neutral[600]}
              align="center"
              style={styles.emptyText}
            >
              Tidak ada toko terdekat. Tambahkan toko baru.
            </Typography>
          ) : (
            stores.map(store => (
              <TouchableOpacity
                key={store.id}
                style={styles.storeItem}
                onPress={() => handleStoreSelected(store)}
              >
                <Typography variant="h5">{store.name}</Typography>
                <Typography variant="body2" color={theme.colors.neutral[600]}>
                  {store.type === 'supermarket'
                    ? 'Supermarket'
                    : store.type === 'traditional_market'
                      ? 'Pasar Tradisional'
                      : store.type === 'convenience_store'
                        ? 'Minimarket'
                        : store.type === 'grocery'
                          ? 'Toko Kelontong'
                          : 'Lainnya'}
                </Typography>
                {store.address && (
                  <Typography variant="body2" color={theme.colors.neutral[600]}>
                    {store.address}
                  </Typography>
                )}
              </TouchableOpacity>
            ))
          )}
          
          <Button
            title="+ Tambah Toko Baru"
            variant="outline"
            onPress={() => {
              // Navigasi ke halaman tambah toko
              navigation.navigate('AddStore');
            }}
            style={styles.addStoreButton}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Typography variant="body1" color={theme.colors.primary[500]}>
              Batal
            </Typography>
          </TouchableOpacity>
          <Typography variant="h4">Tambah Harga</Typography>
          <TouchableOpacity onPress={handleSave} disabled={isSubmitting}>
            <Typography
              variant="body1"
              color={isSubmitting ? theme.colors.neutral[400] : theme.colors.primary[500]}
            >
              Simpan
            </Typography>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.section}>
            <Typography variant="body1" weight="600" style={styles.sectionTitle}>
              Produk
            </Typography>
            
            {product ? (
              <View style={styles.selectedItem}>
                <Typography variant="h5">{product.name}</Typography>
                <Typography variant="body2" color={theme.colors.neutral[600]}>
                  {product.category}
                </Typography>
                <TouchableOpacity
                  style={styles.changeButton}
                  onPress={handleSelectProduct}
                >
                  <Typography variant="body2" color={theme.colors.primary[500]}>
                    Ubah
                  </Typography>
                </TouchableOpacity>
              </View>
            ) : (
              <Button
                title="Pilih Produk"
                onPress={handleSelectProduct}
                style={styles.selectButton}
              />
            )}
          </View>
          
          <View style={styles.section}>
            <Typography variant="body1" weight="600" style={styles.sectionTitle}>
              Toko
            </Typography>
            
            {selectedStore ? (
              <View style={styles.selectedItem}>
                <Typography variant="h5">{selectedStore.name}</Typography>
                <Typography variant="body2" color={theme.colors.neutral[600]}>
                  {selectedStore.type === 'supermarket'
                    ? 'Supermarket'
                    : selectedStore.type === 'traditional_market'
                      ? 'Pasar Tradisional'
                      : selectedStore.type === 'convenience_store'
                        ? 'Minimarket'
                        : selectedStore.type === 'grocery'
                          ? 'Toko Kelontong'
                          : 'Lainnya'}
                </Typography>
                {selectedStore.address && (
                  <Typography variant="body2" color={theme.colors.neutral[600]}>
                    {selectedStore.address}
                  </Typography>
                )}
                <TouchableOpacity
                  style={styles.changeButton}
                  onPress={handleSelectStore}
                >
                  <Typography variant="body2" color={theme.colors.primary[500]}>
                    Ubah
                  </Typography>
                </TouchableOpacity>
              </View>
            ) : (
              <Button
                title="Pilih Toko"
                onPress={handleSelectStore}
                style={styles.selectButton}
              />
            )}
          </View>
          
          <View style={styles.section}>
            <Typography variant="body1" weight="600" style={styles.sectionTitle}>
              Harga
            </Typography>
            
            <TextInput
              label="Harga"
              value={price}
              onChangeText={handlePriceChange}
              placeholder="Masukkan harga"
              keyboardType="number-pad"
              style={styles.input}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.layout.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.layout.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: theme.spacing.layout.md,
  },
  sectionTitle: {
    marginBottom: theme.spacing.sm,
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  selectButton: {
    marginTop: theme.spacing.xs,
  },
  selectedItem: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.neutral[100],
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.xs,
  },
  changeButton: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
  },
  storeListContainer: {
    padding: theme.spacing.layout.md,
  },
  storeItem: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    ...theme.elevation.sm,
  },
  addStoreButton: {
    marginTop: theme.spacing.md,
  },
  emptyText: {
    marginVertical: theme.spacing.layout.md,
  },
});
