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
import { Typography, EmptyState, SuperiorDialog } from '../../../core/components';
import { theme } from '../../../core/theme';
import { formatCurrency, formatDate } from '../../../core/utils';
import { useAppDimensions } from '../../../core/hooks/useAppDimensions';
import { useSuperiorDialog } from '../../../core/hooks';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../config/supabase';
import { useAuthStore } from '../../../core/services/store';

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

interface DashboardFilters {
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  amountRange: {
    min: number;
    max: number;
  };
  selectedCategories: string[];
  viewMode: 'overview' | 'locations' | 'categories';
  groupBy: 'area' | 'exact_location' | 'category';
}

// Chart data interfaces
interface LocationSpendingData {
  location: string;
  amount: number;
  count: number;
  color: string;
  coordinates?: { latitude: number; longitude: number };
}

interface CategoryLocationData {
  category: string;
  categoryId: string;
  locations: { location: string; amount: number; color: string }[];
  totalAmount: number;
  icon: string;
  color: string;
}





// Konstanta untuk animasi
const ANIMATION_DURATION = 300;

export const ExpenseMapScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // Core data state
  const [transactions, setTransactions] = useState<TransactionWithLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithLocation | null>(null);

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [showDetailCard, setShowDetailCard] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: { start: null, end: null },
    amountRange: { min: 0, max: 10000000 },
    selectedCategories: [],
    viewMode: 'overview',
    groupBy: 'area'
  });

  // Chart data state
  const [locationSpendingData, setLocationSpendingData] = useState<LocationSpendingData[]>([]);
  const [categoryLocationData, setCategoryLocationData] = useState<CategoryLocationData[]>([]);

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

  const { user } = useAuthStore();
  const { dialogState, showDialog, hideDialog } = useSuperiorDialog();





  // Fungsi untuk memproses data menjadi format chart
  const processChartData = useCallback((transactionsData: TransactionWithLocation[]) => {
    // 1. Process Location Spending Data
    const locationMap = new Map<string, { amount: number; count: number; color: string; coordinates?: { latitude: number; longitude: number } }>();

    transactionsData.forEach(transaction => {
      const locationKey = transaction.location.address || `${transaction.location.latitude.toFixed(4)}, ${transaction.location.longitude.toFixed(4)}`;
      const existing = locationMap.get(locationKey);

      if (existing) {
        existing.amount += transaction.amount;
        existing.count += 1;
      } else {
        locationMap.set(locationKey, {
          amount: transaction.amount,
          count: 1,
          color: transaction.color || theme.colors.primary[500],
          coordinates: transaction.location
        });
      }
    });

    const locationData: LocationSpendingData[] = Array.from(locationMap.entries()).map(([location, data]) => ({
      location,
      amount: data.amount,
      count: data.count,
      color: data.color,
      coordinates: data.coordinates
    })).sort((a, b) => b.amount - a.amount);

    // 2. Process Category Location Data
    const categoryMap = new Map<string, { locations: Map<string, number>; totalAmount: number; icon: string; color: string }>();

    transactionsData.forEach(transaction => {
      const categoryKey = transaction.category_id;
      const locationKey = transaction.location.address || `${transaction.location.latitude.toFixed(4)}, ${transaction.location.longitude.toFixed(4)}`;

      if (!categoryMap.has(categoryKey)) {
        categoryMap.set(categoryKey, {
          locations: new Map(),
          totalAmount: 0,
          icon: transaction.icon || 'pricetag-outline',
          color: transaction.color || theme.colors.primary[500]
        });
      }

      const categoryData = categoryMap.get(categoryKey)!;
      const existingLocationAmount = categoryData.locations.get(locationKey) || 0;
      categoryData.locations.set(locationKey, existingLocationAmount + transaction.amount);
      categoryData.totalAmount += transaction.amount;
    });

    const categoryData: CategoryLocationData[] = Array.from(categoryMap.entries()).map(([categoryId, data]) => {
      const transaction = transactionsData.find(t => t.category_id === categoryId);
      return {
        category: transaction?.category || 'Unknown',
        categoryId: categoryId, // Tambahkan categoryId
        locations: Array.from(data.locations.entries()).map(([location, amount]) => ({
          location,
          amount,
          color: data.color
        })),
        totalAmount: data.totalAmount,
        icon: data.icon,
        color: data.color
      };
    }).sort((a, b) => b.totalAmount - a.totalAmount);

    // Update state
    setLocationSpendingData(locationData);
    setCategoryLocationData(categoryData);
  }, []);

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

        // Process data untuk dashboard charts
        processChartData(formattedTransactions);
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
  }, [user, headerAnimation, fabAnimation, processChartData]);

  // Fungsi untuk toggle view mode dashboard
  const toggleViewMode = () => {
    setFilters(prev => {
      const modes: Array<'overview' | 'locations' | 'categories'> = ['overview', 'locations', 'categories'];
      const currentIndex = modes.indexOf(prev.viewMode);
      const nextIndex = (currentIndex + 1) % modes.length;

      return {
        ...prev,
        viewMode: modes[nextIndex]
      };
    });
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

  // Refresh data ketika halaman difokuskan (misalnya setelah menambah transaksi)
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        loadTransactionsWithLocation();
      }
    }, [user, loadTransactionsWithLocation])
  );

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

  // Render Top Spending Locations Chart
  const renderTopLocationsChart = () => {
    // Filter data berdasarkan kategori yang dipilih
    const filteredLocationData = filters.selectedCategories.length > 0
      ? locationSpendingData.filter(item => {
          // Cek apakah ada transaksi dari kategori yang dipilih di lokasi ini
          return filteredTransactions.some(t =>
            (t.location.address || `${t.location.latitude.toFixed(4)}, ${t.location.longitude.toFixed(4)}`) === item.location
          );
        })
      : locationSpendingData;

    if (filteredLocationData.length === 0) return null;

    const chartData = filteredLocationData.slice(0, 5).map(item => ({
      name: item.location.length > 20 ? `${item.location.substring(0, 20)}...` : item.location,
      amount: item.amount,
      color: item.color,
      count: item.count
    }));

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Typography variant="h5" weight="700" color={theme.colors.neutral[900]}>
            📍 Top Lokasi Pengeluaran
          </Typography>
          <Typography variant="body2" color={theme.colors.neutral[600]}>
            {filters.selectedCategories.length > 0
              ? `Difilter berdasarkan ${filters.selectedCategories.length} kategori`
              : "5 lokasi dengan pengeluaran terbesar"
            }
          </Typography>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.barChartContainer}>
            {chartData.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.barItem}
                onPress={() => {
                  // Handle bar press - show detail
                  Alert.alert(
                    item.name,
                    `Total: ${formatCurrency(item.amount)}\nJumlah transaksi: ${item.count}`
                  );
                }}
              >
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: (item.amount / chartData[0].amount) * 120,
                        backgroundColor: item.color
                      }
                    ]}
                  />
                  <Typography variant="caption" color={theme.colors.neutral[700]} style={styles.barAmount}>
                    {formatCurrency(item.amount)}
                  </Typography>
                </View>
                <Typography variant="caption" color={theme.colors.neutral[600]} style={styles.barLabel}>
                  {item.name}
                </Typography>
                <Typography variant="caption" color={theme.colors.neutral[500]} style={styles.barCount}>
                  {item.count} transaksi
                </Typography>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  // Render Category Distribution Chart
  const renderCategoryDistributionChart = () => {
    // Filter data berdasarkan kategori yang dipilih
    const filteredCategoryData = filters.selectedCategories.length > 0
      ? categoryLocationData.filter(item => filters.selectedCategories.includes(item.categoryId))
      : categoryLocationData;

    if (filteredCategoryData.length === 0) return null;

    const chartData = filteredCategoryData.slice(0, 6);

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Typography variant="h5" weight="700" color={theme.colors.neutral[900]}>
            🏷️ Kategori per Lokasi
          </Typography>
          <Typography variant="body2" color={theme.colors.neutral[600]}>
            {filters.selectedCategories.length > 0
              ? `Menampilkan ${filteredCategoryData.length} kategori yang dipilih`
              : "Distribusi pengeluaran berdasarkan kategori"
            }
          </Typography>
        </View>

        <View style={styles.categoryGrid}>
          {chartData.map((category, index) => (
            <TouchableOpacity
              key={index}
              style={styles.categoryCard}
              onPress={() => {
                Alert.alert(
                  category.category,
                  `Total: ${formatCurrency(category.totalAmount)}\nLokasi: ${category.locations.length}`
                );
              }}
            >
              <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                <Ionicons
                  name={category.icon as keyof typeof Ionicons.glyphMap}
                  size={20}
                  color={theme.colors.white}
                />
              </View>
              <Typography variant="body2" weight="600" color={theme.colors.neutral[800]}>
                {category.category}
              </Typography>
              <Typography variant="h6" weight="700" color={category.color}>
                {formatCurrency(category.totalAmount)}
              </Typography>
              <Typography variant="caption" color={theme.colors.neutral[500]}>
                {category.locations.length} lokasi
              </Typography>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };



  // Render Dashboard Content berdasarkan viewMode
  const renderDashboardContent = () => {
    switch (filters.viewMode) {
      case 'overview':
        return (
          <ScrollView style={styles.dashboardContainer} showsVerticalScrollIndicator={false}>
            {renderTopLocationsChart()}
            {renderCategoryDistributionChart()}
          </ScrollView>
        );
      case 'locations':
        return (
          <ScrollView style={styles.dashboardContainer} showsVerticalScrollIndicator={false}>
            {renderTopLocationsChart()}
          </ScrollView>
        );
      case 'categories':
        return (
          <ScrollView style={styles.dashboardContainer} showsVerticalScrollIndicator={false}>
            {renderCategoryDistributionChart()}
          </ScrollView>
        );

      default:
        return null;
    }
  };

  // Render superior floating action buttons untuk dashboard
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
      {/* View Mode Toggle - Tombol Utama */}
      <TouchableOpacity
        style={[styles.fab, styles.fabPrimary]}
        onPress={toggleViewMode}
        activeOpacity={0.8}
      >
        <BlurView intensity={80} style={styles.fabBlur}>
          <Ionicons
            name={
              filters.viewMode === 'overview' ? "grid" :
              filters.viewMode === 'locations' ? "location" :
              "pricetag"
            }
            size={isSmallDevice ? 20 : isLargeDevice ? 28 : 24}
            color={theme.colors.white}
          />
        </BlurView>
      </TouchableOpacity>

      {/* Filter Toggle */}
      <TouchableOpacity
        style={[styles.fab, styles.fabSecondary]}
        onPress={toggleFilters}
        activeOpacity={0.8}
      >
        <BlurView intensity={80} style={styles.fabBlur}>
          <Ionicons
            name={showFilters ? "close" : "options"}
            size={isSmallDevice ? 18 : isLargeDevice ? 24 : 20}
            color={theme.colors.primary[500]}
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
                Dashboard Lokasi
              </Typography>
              <Typography variant="caption" color={theme.colors.white}>
                Analisis pengeluaran berdasarkan lokasi
              </Typography>
            </View>

            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => {
                showDialog({
                  type: 'info',
                  title: 'Mode Tampilan',
                  message: `Saat ini: ${
                    filters.viewMode === 'overview' ? 'Ringkasan' :
                    filters.viewMode === 'locations' ? 'Lokasi' :
                    'Kategori'
                  }\n\nTekan tombol biru di kanan bawah untuk mengganti mode tampilan.`,
                  actions: [
                    {
                      text: 'Mengerti',
                      onPress: hideDialog,
                      style: 'primary'
                    }
                  ]
                });
              }}
            >
              <Ionicons
                name="information-circle-outline"
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
        <View style={styles.dashboardMainContainer}>
          {/* Dashboard Content */}
          {renderDashboardContent()}

          {/* Superior Floating Action Buttons */}
          {renderFloatingActionButtons()}
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

      {/* Superior Dialog */}
      <SuperiorDialog
        visible={dialogState.visible}
        type={dialogState.type}
        title={dialogState.title}
        message={dialogState.message}
        actions={dialogState.actions}
        onClose={hideDialog}
        icon={dialogState.icon}
        autoClose={dialogState.autoClose}
      />
    </SafeAreaView>
  );
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },

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


  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
  },
  loadingText: {
    marginTop: theme.spacing.md,
  },


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


  selectedTransactionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '50%', 
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

  legendBlur: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    overflow: 'hidden',
  },


  dashboardMainContainer: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  dashboardContainer: {
    flex: 1,
    padding: theme.spacing.layout.sm,
  },
  chartContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.layout.md,
    marginBottom: theme.spacing.layout.md,
    ...theme.elevation.sm,
  },
  chartHeader: {
    marginBottom: theme.spacing.layout.md,
  },


  barChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
  },
  barItem: {
    alignItems: 'center',
    marginHorizontal: theme.spacing.xs,
    minWidth: 80,
  },
  barContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 140,
    marginBottom: theme.spacing.sm,
  },
  bar: {
    width: 24,
    borderRadius: theme.borderRadius.sm,
    minHeight: 20,
  },
  barAmount: {
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  barLabel: {
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  barCount: {
    textAlign: 'center',
    marginTop: 2,
  },


  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    alignItems: 'center',
    ...theme.elevation.xs,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },

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
