import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
  Platform,
  Easing,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
// Import Beautiful Map Components
import MapView, { Circle } from 'react-native-maps';
import { EnhancedMapView } from '../../../core/components/EnhancedMapView';
import { EnhancedMarker } from '../../../core/components/EnhancedMarker';
import { Typography, EmptyState } from '../../../core/components';
import { theme } from '../../../core/theme';
import { formatCurrency, formatDate } from '../../../core/utils';
import { useAppDimensions } from '../../../core/hooks/useAppDimensions';
import { useLocation } from '../../../core/hooks';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../config/supabase';
import { useAuthStore } from '../../../core/services/store';

// Enhanced interfaces for superior map visualization
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

interface MapFilters {
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  amountRange: {
    min: number;
    max: number;
  };
  selectedCategories: string[];
  mapStyle: 'standard' | 'satellite' | 'hybrid' | 'dark';
  viewMode: 'markers' | 'heatmap' | 'clusters';
}



// Konstanta untuk animasi
const ANIMATION_DURATION = 300;

export const ExpenseMapScreen = () => {
  const navigation = useNavigation();
  const mapRef = useRef<MapView>(null);
  const insets = useSafeAreaInsets();

  // Core data state
  const [transactions, setTransactions] = useState<TransactionWithLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithLocation | null>(null);

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [showDetailCard, setShowDetailCard] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<MapFilters>({
    dateRange: { start: null, end: null },
    amountRange: { min: 0, max: 10000000 },
    selectedCategories: [],
    mapStyle: 'standard',
    viewMode: 'markers'
  });

  // Animation refs
  const headerAnimation = useRef(new Animated.Value(0)).current;
  const filterAnimation = useRef(new Animated.Value(0)).current;
  const detailCardAnimation = useRef(new Animated.Value(0)).current;
  const fabAnimation = useRef(new Animated.Value(1)).current;

  // Hook responsif untuk mendapatkan dimensi dan breakpoint
  const {
    isSmallDevice,
    isLargeDevice
  } = useAppDimensions();



  const { getCurrentLocation } = useLocation();
  const { user } = useAuthStore();





  // Fungsi untuk memuat kategori dari Supabase (tidak digunakan lagi)
  // Kategori sekarang diambil langsung dari relasi transaksi

  // Fungsi untuk memuat transaksi dengan lokasi dari Supabase
  const loadTransactionsWithLocation = useCallback(async () => {
    try {
      setIsLoading(true);

      if (!user) {
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
              latitude: parseFloat(t.location_lat), // Pastikan parsing ke number
              longitude: parseFloat(t.location_lng), // Pastikan parsing ke number
              address: t.location_name || undefined
            },
            icon: category ? category.icon : 'pricetag-outline',
            color: category ? category.color : theme.colors.neutral[500]
          };
        });

        setTransactions(formattedTransactions);

        // Auto zoom ke lokasi transaksi pertama jika ada data
        if (formattedTransactions.length > 0 && mapRef.current) {
          const firstTransaction = formattedTransactions[0];
          mapRef.current.animateToRegion({
            latitude: firstTransaction.location.latitude,
            longitude: firstTransaction.location.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }, 1000);
        }
      } else {
        // Jika tidak ada data, set array kosong
        setTransactions([]);
      }

      // Animasi superior entrance
      Animated.parallel([
        Animated.timing(headerAnimation, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fabAnimation, {
          toValue: 1,
          duration: 800,
          delay: 300,
          easing: Easing.elastic(1.2),
          useNativeDriver: true,
        })
      ]).start();
    } catch (error) {
      Alert.alert('Error', 'Gagal memuat data transaksi');
    } finally {
      setIsLoading(false);
    }
  }, [user, headerAnimation, fabAnimation]);

  // Fungsi untuk menangani klik pada marker
  const handleMarkerPress = (transaction: TransactionWithLocation) => {
    // Reset animasi card
    detailCardAnimation.setValue(0);

    // Set transaksi yang dipilih
    setSelectedTransaction(transaction);
    setShowDetailCard(true);

    // Animasi superior detail card
    Animated.timing(detailCardAnimation, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  // Fungsi untuk mendapatkan lokasi saat ini dan memindahkan peta
  const handleGetCurrentLocation = useCallback(async () => {
    try {
      const currentLocation = await getCurrentLocation();

      if (currentLocation && mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }
    } catch (error) {
      // Menghilangkan console.log untuk mengatasi ESLint error
      Alert.alert('Error', 'Gagal mendapatkan lokasi saat ini');
    }
  }, [getCurrentLocation]);

  // Fungsi untuk mengubah tipe peta
  const toggleMapType = () => {
    setFilters(prev => ({
      ...prev,
      mapStyle: prev.mapStyle === 'standard' ? 'satellite' : 'standard'
    }));
  };

  // Fungsi untuk toggle view mode
  const toggleViewMode = () => {
    setFilters(prev => ({
      ...prev,
      viewMode: prev.viewMode === 'markers' ? 'heatmap' : 'markers'
    }));
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
    setFilters(prev => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(categoryId)
        ? prev.selectedCategories.filter(id => id !== categoryId)
        : [...prev.selectedCategories, categoryId]
    }));
  };

  // Mendapatkan transaksi yang difilter berdasarkan kategori dan filter lainnya
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Filter by categories
    if (filters.selectedCategories.length > 0) {
      filtered = filtered.filter(t => filters.selectedCategories.includes(t.category_id));
    }

    // Filter by amount range
    filtered = filtered.filter(t =>
      t.amount >= filters.amountRange.min && t.amount <= filters.amountRange.max
    );

    // Filter by date range
    if (filters.dateRange.start && filters.dateRange.end) {
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= filters.dateRange.start! && transactionDate <= filters.dateRange.end!;
      });
    }

    return filtered;
  }, [transactions, filters]);

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

  // Memuat transaksi saat komponen dimount dan ketika user berubah
  useEffect(() => {
    if (user) {
      loadTransactionsWithLocation();
    }
  }, [user, loadTransactionsWithLocation]);

  // Get current location sekali saat mount
  useEffect(() => {
    handleGetCurrentLocation();
  }, [handleGetCurrentLocation]);

  // Refresh data ketika halaman difokuskan (misalnya setelah menambah transaksi)
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        loadTransactionsWithLocation();
      }
    }, [user, loadTransactionsWithLocation])
  );

  // Render marker untuk setiap transaksi
  const renderMarkers = () => {
    return filteredTransactions.map((transaction, index) => (
      <EnhancedMarker
        key={transaction.id}
        coordinate={{
          latitude: transaction.location.latitude,
          longitude: transaction.location.longitude,
        }}
        type="expense"
        size="medium"
        gradientColors={[
          transaction.color || theme.colors.danger[400],
          transaction.color ? `${transaction.color}CC` : theme.colors.danger[600]
        ]}
        icon={(transaction.icon || 'pricetag-outline') as keyof typeof Ionicons.glyphMap}
        amount={transaction.amount}
        showAnimation={true}
        showGlow={index < 3} // Show glow for top 3 transactions
        animationDelay={index * 100}
        onPress={() => handleMarkerPress(transaction)}
      />
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
        <EnhancedMarker
          coordinate={{
            latitude: transaction.location.latitude,
            longitude: transaction.location.longitude,
          }}
          type="custom"
          size="small"
          gradientColors={['transparent', 'transparent']}
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
                filters.selectedCategories.includes(category.id) && styles.selectedCategoryFilter,
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
                  name={(category.icon || 'pricetag-outline') as keyof typeof Ionicons.glyphMap}
                  size={16}
                  color={theme.colors.white}
                />
              </View>
              <Typography
                variant="caption"
                color={filters.selectedCategories.includes(category.id) ? category.color : theme.colors.neutral[700]}
                weight={filters.selectedCategories.includes(category.id) ? "600" : "400"}
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
    if (filters.viewMode !== 'heatmap') return null;

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

  // Render superior floating action buttons
  const renderFloatingActionButtons = () => (
    <Animated.View
      style={[
        styles.fabContainer,
        {
          transform: [{ scale: fabAnimation }],
          bottom: insets.bottom + 20
        }
      ]}
    >
      {/* Current Location */}
      <TouchableOpacity
        style={[styles.fab, styles.fabSecondary]}
        onPress={handleGetCurrentLocation}
        activeOpacity={0.8}
      >
        <BlurView intensity={80} style={styles.fabBlur}>
          <Ionicons
            name="locate"
            size={isSmallDevice ? 18 : isLargeDevice ? 24 : 20}
            color={theme.colors.primary[500]}
          />
        </BlurView>
      </TouchableOpacity>

      {/* Map Style Toggle */}
      <TouchableOpacity
        style={[styles.fab, styles.fabSecondary]}
        onPress={toggleMapType}
        activeOpacity={0.8}
      >
        <BlurView intensity={80} style={styles.fabBlur}>
          <Ionicons
            name="map-outline"
            size={isSmallDevice ? 18 : isLargeDevice ? 24 : 20}
            color={theme.colors.primary[500]}
          />
        </BlurView>
      </TouchableOpacity>

      {/* View Mode Toggle */}
      <TouchableOpacity
        style={[styles.fab, styles.fabSecondary]}
        onPress={toggleViewMode}
        activeOpacity={0.8}
      >
        <BlurView intensity={80} style={styles.fabBlur}>
          <Ionicons
            name={filters.viewMode === 'markers' ? "thermometer-outline" : "map-outline"}
            size={isSmallDevice ? 18 : isLargeDevice ? 24 : 20}
            color={theme.colors.primary[500]}
          />
        </BlurView>
      </TouchableOpacity>

      {/* Filter Toggle */}
      <TouchableOpacity
        style={[styles.fab, styles.fabPrimary]}
        onPress={toggleFilters}
        activeOpacity={0.8}
      >
        <BlurView intensity={80} style={styles.fabBlur}>
          <Ionicons
            name="options-outline"
            size={isSmallDevice ? 20 : isLargeDevice ? 28 : 24}
            color={theme.colors.white}
          />
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );

  // Render superior expense detail card
  const renderExpenseDetailCard = () => {
    if (!selectedTransaction || !showDetailCard) return null;

    return (
      <Animated.View
        style={[
          styles.detailCard,
          {
            transform: [
              {
                translateY: detailCardAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [300, 0],
                }),
              },
            ],
            bottom: insets.bottom + 20
          }
        ]}
      >
        <BlurView intensity={95} style={styles.detailCardBlur}>
          <View style={styles.detailCardHeader}>
            <View style={styles.detailCardHandle} />
            <TouchableOpacity
              style={styles.detailCardClose}
              onPress={() => {
                Animated.timing(detailCardAnimation, {
                  toValue: 0,
                  duration: 300,
                  useNativeDriver: true,
                }).start(() => {
                  setSelectedTransaction(null);
                  setShowDetailCard(false);
                });
              }}
            >
              <Ionicons name="close" size={20} color={theme.colors.neutral[600]} />
            </TouchableOpacity>
          </View>

          <View style={styles.detailCardContent}>
            <View style={styles.expenseHeader}>
              <View style={[styles.expenseIcon, { backgroundColor: selectedTransaction.color }]}>
                <Ionicons
                  name={(selectedTransaction.icon || 'pricetag-outline') as keyof typeof Ionicons.glyphMap}
                  size={24}
                  color={theme.colors.white}
                />
              </View>
              <View style={styles.expenseInfo}>
                <Typography variant="h5" weight="700" color={theme.colors.neutral[900]}>
                  {formatCurrency(selectedTransaction.amount)}
                </Typography>
                <Typography variant="body2" color={theme.colors.neutral[600]}>
                  {selectedTransaction.category}
                </Typography>
              </View>
            </View>

            {selectedTransaction.description && (
              <View style={styles.expenseDescription}>
                <Typography variant="body1" color={theme.colors.neutral[800]}>
                  {selectedTransaction.description}
                </Typography>
              </View>
            )}

            <View style={styles.expenseDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={16} color={theme.colors.neutral[500]} />
                <Typography variant="body2" color={theme.colors.neutral[600]} style={styles.detailText}>
                  {formatDate(selectedTransaction.date)}
                </Typography>
              </View>

              {selectedTransaction.location.address && (
                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={16} color={theme.colors.neutral[500]} />
                  <Typography variant="body2" color={theme.colors.neutral[600]} style={styles.detailText}>
                    {selectedTransaction.location.address}
                  </Typography>
                </View>
              )}
            </View>
          </View>
        </BlurView>
      </Animated.View>
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
          <EnhancedMapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: -6.2088,
              longitude: 106.8456,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            showsUserLocation={true}
            showsCompass={true}
            showsScale={true}
            showsBuildings={true}
            rotateEnabled={true}
            zoomEnabled={true}
            scrollEnabled={true}
            pitchEnabled={true}
            mapType="standard"
            customMapStyle="auto"
            enhancedVisuals={true}
          >
            {filters.viewMode === 'markers' ? renderMarkers() : renderHeatmap()}
          </EnhancedMapView>

          {/* Superior Floating Action Buttons */}
          {renderFloatingActionButtons()}

          {/* Heatmap legend */}
          {renderHeatmapLegend()}
        </View>
      )}

      {/* Superior Expense Detail Card */}
      {renderExpenseDetailCard()}

      {/* Tampilkan pesan jika tidak ada transaksi */}
      {!isLoading && filteredTransactions.length === 0 && (
        <View style={styles.emptyStateContainer}>
          <EmptyState
            title="Tidak ada data"
            description={filters.selectedCategories.length > 0
              ? `Tidak ada transaksi untuk kategori yang dipilih`
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
    flexDirection: 'column',
    gap: 8,
  },
  mapControlButton: {
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

  // Superior Floating Action Button styles
  fabContainer: {
    position: 'absolute',
    right: 20,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.elevation.lg,
  },
  fabPrimary: {
    backgroundColor: theme.colors.primary[500],
  },
  fabSecondary: {
    backgroundColor: theme.colors.white,
  },
  fabBlur: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },

  // Superior Detail Card styles
  detailCard: {
    position: 'absolute',
    left: 20,
    right: 20,
    maxHeight: '60%',
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    ...theme.elevation.xl,
  },
  detailCardBlur: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  detailCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[100],
  },
  detailCardHandle: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.neutral[300],
    borderRadius: 2,
    alignSelf: 'center',
  },
  detailCardClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral[100],
  },
  detailCardContent: {
    padding: 20,
  },
  expenseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  expenseIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: theme.colors.neutral[50],
    borderRadius: theme.borderRadius.md,
  },
  expenseDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Enhanced Heatmap Legend styles
  legendBlur: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    overflow: 'hidden',
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
