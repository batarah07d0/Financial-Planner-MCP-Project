import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
// Import dari mock untuk Expo Go
import MapView, { Marker, Callout, PROVIDER_GOOGLE, Circle } from 'react-native-maps';
import { Typography, Card, Button, EmptyState } from '../../../core/components';
import { theme } from '../../../core/theme';
import { formatCurrency, formatDate, formatPercentage } from '../../../core/utils';
import { useLocation } from '../../../core/hooks';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../config/supabase';
import { useAuthStore } from '../../../core/services/store';

// Tipe data untuk transaksi dengan lokasi dari Supabase
interface TransactionWithLocation {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  category_id: string;
  description?: string;
  date: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  icon?: string;
  color?: string;
}

// Kategori default untuk fallback
const DEFAULT_CATEGORIES = {
  'Makanan & Minuman': {
    icon: 'fast-food-outline',
    color: '#FF6B6B',
    id: '5245eee1-d757-4b44-abd6-ecc6efd35207'
  },
  'Transportasi': {
    icon: 'car-outline',
    color: '#4ECDC4',
    id: 'd2c02aea-95e3-47d2-8ae3-17e7ea224edd'
  },
  'Belanja': {
    icon: 'cart-outline',
    color: '#FFD166',
    id: '5a948b41-68dc-46df-90b2-03e095de1641'
  },
  'Hiburan': {
    icon: 'film-outline',
    color: '#F72585',
    id: 'acde3aca-6151-484f-8c38-de7897950e9c'
  },
  'Tagihan': {
    icon: 'receipt-outline',
    color: '#3A86FF',
    id: 'fe362fb2-2075-41a5-a2f4-df6440e4f515'
  },
  'Kesehatan': {
    icon: 'medical-outline',
    color: '#06D6A0',
    id: '43fe341c-5299-475f-bfab-b54b0cc5b7d9'
  },
  'Pendidikan': {
    icon: 'school-outline',
    color: '#118AB2',
    id: 'd0bf30a5-2e40-420b-affc-8030207372a5'
  },
  'Lainnya': {
    icon: 'ellipsis-horizontal-outline',
    color: '#8A8A8A',
    id: 'a9d327c0-09bb-4b9c-a164-ea053f93751e'
  }
};

// Konstanta untuk animasi
const ANIMATION_DURATION = 300;
const { width, height } = Dimensions.get('window');

export const ExpenseMapScreen = () => {
  const navigation = useNavigation();
  const mapRef = useRef<MapView>(null);
  const [transactions, setTransactions] = useState<TransactionWithLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithLocation | null>(null);
  const [mapType, setMapType] = useState<'standard' | 'heatmap'>('standard');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Animasi
  const headerAnimation = useRef(new Animated.Value(0)).current;
  const cardAnimation = useRef(new Animated.Value(0)).current;
  const filterAnimation = useRef(new Animated.Value(0)).current;

  const { getCurrentLocation } = useLocation();
  const { user } = useAuthStore();

  // Fungsi untuk memuat kategori dari Supabase (tidak digunakan lagi)
  // Kategori sekarang diambil langsung dari relasi transaksi

  // Fungsi untuk memuat transaksi dengan lokasi dari Supabase
  const loadTransactionsWithLocation = async () => {
    try {
      setIsLoading(true);

      if (!user) {
        console.warn('User not authenticated');
        return;
      }

      // Mengambil transaksi dengan lokasi dari Supabase
      const { data: transactionsData, error } = await supabase
        .from('transactions')
        .select('*, categories:category_id(*)')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .not('location_lat', 'is', null)
        .not('location_lng', 'is', null)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error loading transactions with location:', error);
        Alert.alert('Error', 'Gagal memuat data transaksi');
        return;
      }

      if (transactionsData && transactionsData.length > 0) {
        // Transformasi data untuk format yang dibutuhkan komponen
        const formattedTransactions: TransactionWithLocation[] = transactionsData.map(t => {
          const category = t.categories ? t.categories : null;

          return {
            id: t.id,
            amount: t.amount,
            type: t.type as 'income' | 'expense',
            category_id: t.category_id,
            category: category ? category.name : 'Lainnya',
            description: t.description || '',
            date: t.date,
            location: {
              latitude: t.location_lat,
              longitude: t.location_lng,
              address: t.location_name || undefined
            },
            icon: category ? category.icon : 'pricetag-outline',
            color: category ? category.color : theme.colors.neutral[500]
          };
        });

        setTransactions(formattedTransactions);
      } else {
        // Jika tidak ada data, set array kosong
        setTransactions([]);
      }

      // Animasi header setelah data dimuat
      Animated.timing(headerAnimation, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Error loading transactions with location:', error);
      Alert.alert('Error', 'Gagal memuat data transaksi');
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi untuk menangani klik pada marker
  const handleMarkerPress = (transaction: TransactionWithLocation) => {
    // Reset animasi card
    cardAnimation.setValue(0);

    // Set transaksi yang dipilih
    setSelectedTransaction(transaction);

    // Animasi card
    Animated.spring(cardAnimation, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  // Fungsi untuk mendapatkan lokasi saat ini dan memindahkan peta
  const handleGetCurrentLocation = async () => {
    const currentLocation = await getCurrentLocation();

    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    }
  };

  // Fungsi untuk mengubah tipe peta
  const toggleMapType = () => {
    setMapType(prev => (prev === 'standard' ? 'heatmap' : 'standard'));
  };

  // Fungsi untuk toggle filter kategori
  const toggleFilters = () => {
    // Toggle state
    setShowFilters(prev => !prev);

    // Animasi filter
    Animated.timing(filterAnimation, {
      toValue: showFilters ? 0 : 1,
      duration: ANIMATION_DURATION,
      useNativeDriver: true,
    }).start();
  };

  // Fungsi untuk memilih kategori
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(prev => prev === categoryId ? null : categoryId);
  };

  // Mendapatkan transaksi yang difilter berdasarkan kategori
  const filteredTransactions = useMemo(() => {
    if (!selectedCategory) return transactions;
    return transactions.filter(t => t.category_id === selectedCategory);
  }, [transactions, selectedCategory]);

  // Fungsi untuk mendapatkan ikon dan warna kategori tidak diperlukan lagi
  // karena data tersebut sudah ada di objek transaksi

  // Mendapatkan kategori unik dari transaksi
  const uniqueCategories = useMemo(() => {
    // Menggunakan Set untuk mendapatkan kategori unik berdasarkan category_id
    const uniqueCategoryIds = new Set<string>();
    const uniqueCats: { id: string, name: string, icon: string, color: string }[] = [];

    transactions.forEach(t => {
      if (!uniqueCategoryIds.has(t.category_id)) {
        uniqueCategoryIds.add(t.category_id);
        uniqueCats.push({
          id: t.category_id,
          name: t.category,
          icon: t.icon || 'pricetag-outline',
          color: t.color || theme.colors.neutral[500]
        });
      }
    });

    return uniqueCats;
  }, [transactions]);

  // Memuat transaksi saat komponen dimount
  useEffect(() => {
    loadTransactionsWithLocation();
    handleGetCurrentLocation();
  }, []);

  // Render marker untuk setiap transaksi
  const renderMarkers = () => {
    return filteredTransactions.map(transaction => (
      <Marker
        key={transaction.id}
        coordinate={{
          latitude: transaction.location.latitude,
          longitude: transaction.location.longitude,
        }}
        onPress={() => handleMarkerPress(transaction)}
      >
        <View style={styles.customMarker}>
          <View
            style={[
              styles.markerIconContainer,
              { backgroundColor: transaction.color || theme.colors.neutral[500] }
            ]}
          >
            <Ionicons
              name={(transaction.icon || 'pricetag-outline') as any}
              size={16}
              color={theme.colors.white}
            />
          </View>
          <View style={styles.markerAmountContainer}>
            <Typography
              variant="caption"
              color={theme.colors.white}
              weight="600"
              style={styles.markerAmount}
            >
              {formatCurrency(transaction.amount, { showSymbol: false })}
            </Typography>
          </View>
        </View>

        <Callout tooltip>
          <View style={styles.callout}>
            <View style={styles.calloutHeader}>
              <View style={[
                styles.calloutIcon,
                { backgroundColor: transaction.color || theme.colors.neutral[500] }
              ]}>
                <Ionicons
                  name={(transaction.icon || 'pricetag-outline') as any}
                  size={20}
                  color={theme.colors.white}
                />
              </View>
              <View style={styles.calloutHeaderText}>
                <Typography variant="body1" weight="600">
                  {transaction.category}
                </Typography>
                {transaction.description && (
                  <Typography variant="caption" color={theme.colors.neutral[600]}>
                    {transaction.description}
                  </Typography>
                )}
              </View>
            </View>

            <View style={styles.calloutBody}>
              <Typography variant="h5" color={theme.colors.danger[500]} style={styles.calloutAmount}>
                - {formatCurrency(transaction.amount)}
              </Typography>
              <Typography variant="caption" color={theme.colors.neutral[500]}>
                {formatDate(transaction.date, { format: 'medium' })}
              </Typography>
              {transaction.location.address && (
                <View style={styles.calloutAddress}>
                  <Ionicons name="location-outline" size={14} color={theme.colors.neutral[500]} />
                  <Typography variant="caption" color={theme.colors.neutral[500]} style={styles.addressText}>
                    {transaction.location.address}
                  </Typography>
                </View>
              )}
            </View>

            <View style={styles.calloutArrow} />
          </View>
        </Callout>
      </Marker>
    ));
  };

  // Render circles untuk heatmap
  const renderHeatmap = () => {
    return filteredTransactions.map(transaction => (
      <React.Fragment key={transaction.id}>
        {/* Circle untuk heatmap */}
        <Circle
          center={{
            latitude: transaction.location.latitude,
            longitude: transaction.location.longitude,
          }}
          radius={transaction.amount / 1000 * 50} // Radius berdasarkan jumlah pengeluaran
          fillColor={`${transaction.color || theme.colors.neutral[500]}80`} // 50% opacity
          strokeColor={transaction.color || theme.colors.neutral[500]}
          strokeWidth={1}
        />
        {/* Marker transparan untuk menangani onPress */}
        <Marker
          coordinate={{
            latitude: transaction.location.latitude,
            longitude: transaction.location.longitude,
          }}
          opacity={0}
          onPress={() => handleMarkerPress(transaction)}
        />
      </React.Fragment>
    ));
  };

  // Render kategori filter
  const renderCategoryFilters = () => {
    return (
      <Animated.View
        style={[
          styles.filterContainer,
          {
            transform: [
              {
                translateY: filterAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-100, 0]
                })
              }
            ],
            opacity: filterAnimation
          }
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {uniqueCategories.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryFilter,
                selectedCategory === category.id && styles.selectedCategoryFilter,
                { borderColor: category.color }
              ]}
              onPress={() => handleCategorySelect(category.id)}
            >
              <View
                style={[
                  styles.categoryIconContainer,
                  { backgroundColor: category.color }
                ]}
              >
                <Ionicons
                  name={(category.icon || 'pricetag-outline') as any}
                  size={16}
                  color={theme.colors.white}
                />
              </View>
              <Typography
                variant="caption"
                color={selectedCategory === category.id ? category.color : theme.colors.neutral[700]}
                weight={selectedCategory === category.id ? "600" : "400"}
              >
                {category.name}
              </Typography>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>
    );
  };

  // Render legenda untuk heatmap
  const renderHeatmapLegend = () => {
    if (mapType !== 'heatmap') return null;

    return (
      <View style={styles.heatmapLegend}>
        <Typography variant="caption" color={theme.colors.neutral[700]} weight="600">
          Legenda Heatmap
        </Typography>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: theme.colors.danger[300] }]} />
            <Typography variant="caption" color={theme.colors.neutral[600]}>
              &lt; Rp 100rb
            </Typography>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: theme.colors.danger[500] }]} />
            <Typography variant="caption" color={theme.colors.neutral[600]}>
              Rp 100rb - 200rb
            </Typography>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: theme.colors.danger[700] }]} />
            <Typography variant="caption" color={theme.colors.neutral[600]}>
              &gt; Rp 200rb
            </Typography>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header dengan animasi */}
      <Animated.View
        style={[
          styles.header,
          {
            transform: [
              {
                translateY: headerAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, 0]
                })
              }
            ],
            opacity: headerAnimation
          }
        ]}
      >
        <LinearGradient
          colors={[theme.colors.primary[500], theme.colors.primary[700]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Typography variant="h4" color={theme.colors.white} weight="600">
                Peta Pengeluaran
              </Typography>
              <Typography variant="caption" color={theme.colors.white}>
                Visualisasi lokasi pengeluaran Anda
              </Typography>
            </View>

            <TouchableOpacity
              style={styles.headerButton}
              onPress={toggleFilters}
            >
              <Ionicons
                name={showFilters ? "options" : "options-outline"}
                size={24}
                color={theme.colors.white}
              />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Filter kategori */}
      {!isLoading && renderCategoryFilters()}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          <Typography
            variant="body1"
            color={theme.colors.neutral[600]}
            style={styles.loadingText}
          >
            Memuat data pengeluaran...
          </Typography>
        </View>
      ) : (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: -6.2088,
              longitude: 106.8456,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            showsUserLocation
            showsMyLocationButton={false}
            showsCompass={true}
            rotateEnabled={true}
            zoomEnabled={true}
            scrollEnabled={true}
            pitchEnabled={true}
          >
            {mapType === 'standard' ? renderMarkers() : renderHeatmap()}
          </MapView>

          {/* Map controls */}
          <View style={styles.mapControls}>
            <TouchableOpacity
              style={styles.mapControlButton}
              onPress={handleGetCurrentLocation}
            >
              <Ionicons name="locate" size={22} color={theme.colors.primary[500]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mapControlButton}
              onPress={toggleMapType}
            >
              <Ionicons
                name={mapType === 'standard' ? "thermometer-outline" : "map-outline"}
                size={22}
                color={theme.colors.primary[500]}
              />
            </TouchableOpacity>
          </View>

          {/* Heatmap legend */}
          {renderHeatmapLegend()}
        </View>
      )}

      {/* Detail transaksi dengan animasi */}
      {selectedTransaction && (
        <Animated.View
          style={[
            styles.selectedTransactionContainer,
            {
              transform: [
                {
                  translateY: cardAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [200, 0]
                  })
                }
              ],
              opacity: cardAnimation
            }
          ]}
        >
          <LinearGradient
            colors={[
              (selectedTransaction.color || theme.colors.neutral[500]) + '20',
              (selectedTransaction.color || theme.colors.neutral[500]) + '10'
            ]}
            style={styles.transactionCardGradient}
          >
            <View style={styles.transactionCardHeader}>
              <View style={styles.transactionCardTitle}>
                <View
                  style={[
                    styles.transactionCategoryIcon,
                    { backgroundColor: selectedTransaction.color || theme.colors.neutral[500] }
                  ]}
                >
                  <Ionicons
                    name={(selectedTransaction.icon || 'pricetag-outline') as any}
                    size={24}
                    color={theme.colors.white}
                  />
                </View>
                <View style={styles.transactionTitleText}>
                  <Typography variant="h5" weight="600">
                    {selectedTransaction.category}
                  </Typography>
                  {selectedTransaction.description && (
                    <Typography variant="body2" color={theme.colors.neutral[600]}>
                      {selectedTransaction.description}
                    </Typography>
                  )}
                </View>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedTransaction(null)}
              >
                <Ionicons name="close" size={24} color={theme.colors.neutral[500]} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.transactionCardBody} showsVerticalScrollIndicator={false}>
              <Typography variant="h3" color={theme.colors.danger[500]} style={styles.amount}>
                - {formatCurrency(selectedTransaction.amount)}
              </Typography>

              <View style={styles.transactionDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="calendar-outline" size={18} color={theme.colors.neutral[500]} />
                  <Typography variant="body2" color={theme.colors.neutral[700]} style={styles.detailText}>
                    {formatDate(selectedTransaction.date, { format: 'long' })}
                  </Typography>
                </View>

                {selectedTransaction.location.address && (
                  <View style={styles.detailItem}>
                    <Ionicons name="location-outline" size={18} color={theme.colors.neutral[500]} />
                    <Typography variant="body2" color={theme.colors.neutral[700]} style={styles.detailText}>
                      {selectedTransaction.location.address}
                    </Typography>
                  </View>
                )}
              </View>

              {/* Tambahkan padding bawah untuk memastikan konten bisa di-scroll */}
              <View style={{ paddingBottom: 20 }} />
            </ScrollView>
          </LinearGradient>
        </Animated.View>
      )}

      {/* Tampilkan pesan jika tidak ada transaksi */}
      {!isLoading && filteredTransactions.length === 0 && (
        <View style={styles.emptyStateContainer}>
          <EmptyState
            title="Tidak ada data"
            description={selectedCategory
              ? `Tidak ada transaksi untuk kategori ${selectedCategory}`
              : "Tidak ada transaksi dengan data lokasi"
            }
            icon="location-outline"
            iconColor={theme.colors.primary[300]}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

// Dimensi layar dapat digunakan jika diperlukan
// const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  // Header styles
  header: {
    width: '100%',
    zIndex: 10,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerGradient: {
    width: '100%',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.layout.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },

  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
  },
  loadingText: {
    marginTop: theme.spacing.md,
  },

  // Map styles
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapControls: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'column',
    gap: 8,
  },
  mapControlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.elevation.md,
  },

  // Custom marker styles
  customMarker: {
    alignItems: 'center',
  },
  markerIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.white,
    ...theme.elevation.sm,
  },
  markerAmountContainer: {
    backgroundColor: theme.colors.danger[500],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.round,
    marginTop: 2,
    ...theme.elevation.xs,
  },
  markerAmount: {
    fontSize: 10,
  },

  // Callout styles
  callout: {
    width: 250,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: 0,
    ...theme.elevation.md,
  },
  calloutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[100],
  },
  calloutIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  calloutHeaderText: {
    flex: 1,
  },
  calloutBody: {
    padding: theme.spacing.md,
  },
  calloutAmount: {
    marginBottom: theme.spacing.sm,
  },
  calloutAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  addressText: {
    marginLeft: 4,
    flex: 1,
  },
  calloutArrow: {
    width: 20,
    height: 10,
    backgroundColor: theme.colors.white,
    position: 'absolute',
    bottom: -10,
    left: '50%',
    marginLeft: -10,
    transform: [{ rotate: '45deg' }],
  },

  // Filter styles
  filterContainer: {
    backgroundColor: theme.colors.white,
    paddingVertical: theme.spacing.sm,
    ...theme.elevation.sm,
    zIndex: 5,
  },
  filterScrollContent: {
    paddingHorizontal: theme.spacing.layout.sm,
    gap: theme.spacing.sm,
  },
  categoryFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.round,
    borderWidth: 1,
    borderColor: theme.colors.neutral[300],
    marginRight: theme.spacing.sm,
  },
  selectedCategoryFilter: {
    backgroundColor: theme.colors.neutral[50],
    borderWidth: 1.5,
  },
  categoryIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.xs,
  },

  // Heatmap legend styles
  heatmapLegend: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    ...theme.elevation.md,
  },
  legendItems: {
    marginTop: theme.spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },

  // Transaction detail styles
  selectedTransactionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '50%', // Maksimal 50% dari tinggi layar
    ...theme.elevation.lg,
  },
  transactionCardGradient: {
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: theme.colors.white,
  },
  transactionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: theme.spacing.layout.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[100],
  },
  transactionCardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionCategoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  transactionTitleText: {
    flex: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral[100],
  },
  transactionCardBody: {
    padding: theme.spacing.layout.sm,
  },
  amount: {
    marginBottom: theme.spacing.md,
  },
  transactionDetails: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.elevation.xs,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  detailText: {
    marginLeft: theme.spacing.sm,
    flex: 1,
  },

  // Empty state styles
  emptyStateContainer: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: theme.spacing.layout.md,
    margin: theme.spacing.layout.lg,
    borderRadius: theme.borderRadius.lg,
    ...theme.elevation.md,
  },
});
