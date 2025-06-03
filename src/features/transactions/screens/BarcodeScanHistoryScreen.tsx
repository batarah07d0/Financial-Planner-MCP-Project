import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  Animated,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../core/navigation/types';
import { Typography, EmptyState, Button } from '../../../core/components';
import { theme } from '../../../core/theme';
import { formatCurrency } from '../../../core/utils';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BarcodeHistoryItem } from '../models/Barcode';
import { getBarcodeHistory, searchBarcode } from '../services/barcodeService';
import { formatDate } from '../../../core/utils';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppDimensions } from '../../../core/hooks/useAppDimensions';

type BarcodeScanHistoryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'BarcodeScanHistory'>;

export const BarcodeScanHistoryScreen = () => {
  const navigation = useNavigation<BarcodeScanHistoryScreenNavigationProp>();

  // Hook responsif untuk mendapatkan dimensi dan breakpoint
  const {
    isLandscape,
    isSmallDevice,
    isLargeDevice
  } = useAppDimensions();

  const [history, setHistory] = useState<BarcodeHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'added' | 'notAdded'>('all');

  // Responsive header heights
  const getResponsiveHeaderHeights = () => {
    if (isLandscape) return { expanded: 80, collapsed: 60 };
    if (isSmallDevice) return { expanded: 100, collapsed: 70 };
    if (isLargeDevice) return { expanded: 140, collapsed: 90 };
    return { expanded: 120, collapsed: 80 }; // medium device
  };

  // Responsive icon circle size
  const getIconCircleSize = () => {
    if (isSmallDevice) return 44;
    if (isLargeDevice) return 56;
    return 50; // medium device
  };

  // Responsive empty state icon size
  const getEmptyStateIconSize = () => {
    if (isSmallDevice) return 100;
    if (isLargeDevice) return 140;
    return 120; // medium device
  };

  // Responsive icon sizes
  const getIconSize = () => {
    if (isSmallDevice) return 20;
    if (isLargeDevice) return 28;
    return 24; // medium device
  };

  // Animated values
  const scrollY = new Animated.Value(0);
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50, 100],
    outputRange: [1, 0.9, 0.8],
    extrapolate: 'clamp',
  });

  const headerHeights = getResponsiveHeaderHeights();
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [headerHeights.expanded, headerHeights.collapsed],
    extrapolate: 'clamp',
  });

  // Fungsi untuk memuat riwayat pemindaian
  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const data = await getBarcodeHistory();
      setHistory(data);
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Error loading barcode history:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi untuk refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadHistory();
    setIsRefreshing(false);
  };

  // Fungsi untuk menangani klik pada item riwayat
  const handleItemPress = async (item: BarcodeHistoryItem) => {
    try {
      // Cari data produk berdasarkan barcode
      const productData = await searchBarcode(item.barcode);

      if (productData) {
        // Tampilkan informasi produk dalam alert
        Alert.alert(
          'Informasi Produk',
          `Nama: ${productData.productName}\nKategori: ${productData.category}\nHarga: ${productData.defaultPrice ? formatCurrency(productData.defaultPrice) : 'Tidak tersedia'}`,
          [
            { text: 'OK' },
            { text: 'Tambah Produk', onPress: () => navigation.navigate('AddProduct', { barcode: item.barcode }) }
          ]
        );
      } else {
        // Jika produk tidak ditemukan, tampilkan pesan
        navigation.navigate('AddProduct', { barcode: item.barcode });
      }
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Error searching barcode:', error);
      }
    }
  };

  // Fungsi untuk menangani pemindaian barcode baru
  const handleScanBarcode = () => {
    navigation.navigate('BarcodeScanner', {
      onScanComplete: () => {
        // Refresh riwayat setelah pemindaian berhasil
        loadHistory();
      },
    });
  };

  // Fungsi untuk filter data berdasarkan status dan pencarian
  const getFilteredHistory = () => {
    let filtered = [...history];

    // Filter berdasarkan status
    if (selectedFilter === 'added') {
      filtered = filtered.filter(item => item.addedToTransaction);
    } else if (selectedFilter === 'notAdded') {
      filtered = filtered.filter(item => !item.addedToTransaction);
    }

    // Filter berdasarkan pencarian
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        item =>
          item.productName.toLowerCase().includes(query) ||
          item.barcode.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  // Fungsi untuk mengubah filter
  const handleFilterChange = (filter: 'all' | 'added' | 'notAdded') => {
    setSelectedFilter(filter);
  };

  // Memuat riwayat saat komponen dimount
  useEffect(() => {
    loadHistory();

    // Set status bar style
    StatusBar.setBarStyle('light-content');

    return () => {
      // Reset status bar style saat unmount
      StatusBar.setBarStyle('dark-content');
    };
  }, []);

  // Render item riwayat
  const renderHistoryItem = ({ item, index }: { item: BarcodeHistoryItem, index: number }) => {
    // Animasi untuk item
    const animatedScale = new Animated.Value(1);

    const onPressIn = () => {
      Animated.spring(animatedScale, {
        toValue: 0.97,
        useNativeDriver: true,
      }).start();
    };

    const onPressOut = () => {
      Animated.spring(animatedScale, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }).start();
    };

    // Animasi dan warna gradient diatur langsung pada komponen

    return (
      <Animated.View
        style={[
          styles.historyItemContainer,
          {
            transform: [{ scale: animatedScale }],
            marginTop: index === 0 ? 8 : 0
          }
        ]}
      >
        <TouchableOpacity
          style={styles.historyItem}
          onPress={() => handleItemPress(item)}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={item.addedToTransaction ? ['#E0F2F1', '#B2DFDB'] : ['#FFFFFF', '#FAFAFA']}
            style={styles.historyItemGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.historyItemIconContainer}>
              <View style={[
                styles.iconCircle,
                {
                  width: getIconCircleSize(),
                  height: getIconCircleSize(),
                  borderRadius: getIconCircleSize() / 2,
                }
              ]}>
                <MaterialCommunityIcons
                  name="barcode-scan"
                  size={getIconSize()}
                  color={theme.colors.primary[500]}
                />
              </View>
            </View>

            <View style={styles.historyItemContent}>
              <View style={styles.historyItemHeader}>
                <Typography variant="h5" numberOfLines={1} style={styles.productName}>
                  {item.productName}
                </Typography>

                <Typography variant="body1" weight="600" color={theme.colors.primary[500]} style={styles.priceText}>
                  {formatCurrency(item.price)}
                </Typography>
              </View>

              <View style={styles.barcodeContainer}>
                <Ionicons name="barcode-outline" size={16} color={theme.colors.neutral[600]} />
                <Typography variant="body2" color={theme.colors.neutral[600]} style={styles.barcodeText}>
                  {item.barcode}
                </Typography>
              </View>

              <View style={styles.historyItemFooter}>
                <View style={styles.dateContainer}>
                  <Ionicons name="time-outline" size={14} color={theme.colors.neutral[500]} />
                  <Typography variant="caption" color={theme.colors.neutral[500]} style={styles.dateText}>
                    {formatDate(item.scannedAt, { format: 'medium', includeTime: true })}
                  </Typography>
                </View>

                {item.addedToTransaction && (
                  <View style={styles.transactionBadge}>
                    <Ionicons name="checkmark-circle" size={14} color={theme.colors.white} />
                    <Typography variant="caption" color={theme.colors.white} style={styles.transactionBadgeText}>
                      Ditambahkan
                    </Typography>
                  </View>
                )}
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Render komponen filter
  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[
          styles.filterButton,
          selectedFilter === 'all' && styles.filterButtonActive
        ]}
        onPress={() => handleFilterChange('all')}
      >
        <Typography
          variant="body2"
          color={selectedFilter === 'all' ? theme.colors.white : theme.colors.neutral[600]}
          weight={selectedFilter === 'all' ? '600' : '400'}
        >
          Semua
        </Typography>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.filterButton,
          selectedFilter === 'added' && styles.filterButtonActive
        ]}
        onPress={() => handleFilterChange('added')}
      >
        <Typography
          variant="body2"
          color={selectedFilter === 'added' ? theme.colors.white : theme.colors.neutral[600]}
          weight={selectedFilter === 'added' ? '600' : '400'}
        >
          Ditambahkan
        </Typography>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.filterButton,
          selectedFilter === 'notAdded' && styles.filterButtonActive
        ]}
        onPress={() => handleFilterChange('notAdded')}
      >
        <Typography
          variant="body2"
          color={selectedFilter === 'notAdded' ? theme.colors.white : theme.colors.neutral[600]}
          weight={selectedFilter === 'notAdded' ? '600' : '400'}
        >
          Belum Ditambahkan
        </Typography>
      </TouchableOpacity>
    </View>
  );

  // Render komponen pencarian
  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={20} color={theme.colors.neutral[500]} style={styles.searchIcon} />
      <Animated.View style={styles.searchInputContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Cari produk atau barcode..."
          placeholderTextColor={theme.colors.neutral[400]}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </Animated.View>
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
          <Ionicons name="close-circle" size={18} color={theme.colors.neutral[500]} />
        </TouchableOpacity>
      )}
    </View>
  );

  // Render komponen EmptyState kustom
  const renderEmptyState = () => {
    const filteredData = getFilteredHistory();
    const isFiltered = searchQuery.trim().length > 0 || selectedFilter !== 'all';

    if (isFiltered && filteredData.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <View style={[
            styles.emptyStateIconContainer,
            {
              width: getEmptyStateIconSize(),
              height: getEmptyStateIconSize(),
              borderRadius: getEmptyStateIconSize() / 2,
            }
          ]}>
            <Ionicons
              name="search"
              size={isSmallDevice ? 60 : isLargeDevice ? 90 : 80}
              color={theme.colors.primary[300]}
            />
          </View>
          <Typography variant="h5" align="center" style={styles.emptyStateTitle}>
            Tidak Ada Hasil
          </Typography>
          <Typography variant="body1" color={theme.colors.neutral[600]} align="center" style={styles.emptyStateDescription}>
            Tidak ada riwayat pemindaian yang cocok dengan filter yang dipilih.
          </Typography>
          <Button
            title="Reset Filter"
            variant="outline"
            size="small"
            onPress={() => {
              setSearchQuery('');
              setSelectedFilter('all');
            }}
            style={styles.emptyStateButton}
          />
        </View>
      );
    }

    return (
      <EmptyState
        title="Belum Ada Riwayat"
        description="Anda belum memindai barcode apapun. Pindai barcode untuk melihat riwayat di sini."
        actionLabel="Pindai Barcode"
        onAction={handleScanBarcode}
        icon="barcode-outline"
        iconColor={theme.colors.primary[300]}
        iconSize={80}
        style={styles.emptyState}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary[600]} />

      {/* Header dengan gradient */}
      <Animated.View style={[styles.headerContainer, { height: headerHeight, opacity: headerOpacity }]}>
        <LinearGradient
          colors={['#1E88E5', '#2196F3']} // primary[600] dan primary[500]
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons
                name="arrow-back"
                size={getIconSize()}
                color={theme.colors.white}
              />
            </TouchableOpacity>

            <View style={styles.titleContainer}>
              <Typography variant="h4" color={theme.colors.white} weight="600">
                Riwayat Pemindaian
              </Typography>
              <Typography variant="body2" color={theme.colors.white} style={styles.subtitle}>
                {history.length} item tersimpan
              </Typography>
            </View>

            <TouchableOpacity style={styles.headerIconButton}>
              <Ionicons name="options-outline" size={24} color={theme.colors.white} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Search bar */}
      {renderSearchBar()}

      {/* Filter buttons */}
      {renderFilterButtons()}

      {/* Content */}
      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          <Typography variant="body1" color={theme.colors.neutral[600]} style={styles.loadingText}>
            Memuat riwayat pemindaian...
          </Typography>
        </View>
      ) : (
        <Animated.FlatList
          data={getFilteredHistory()}
          renderItem={renderHistoryItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary[500]]}
              tintColor={theme.colors.primary[500]}
            />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.scanButton}
        onPress={handleScanBarcode}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#2196F3', '#1976D2']} // primary[500] dan primary[700]
          style={styles.scanButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons
            name="barcode-outline"
            size={getIconSize()}
            color={theme.colors.white}
          />
          <Typography variant="body1" color={theme.colors.white} weight="600" style={styles.scanButtonText}>
            Pindai Barcode
          </Typography>
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  // Header styles
  headerContainer: {
    width: '100%',
    overflow: 'hidden',
  },
  headerGradient: {
    flex: 1,
    paddingTop: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.layout.md,
    paddingBottom: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    marginTop: 2,
    opacity: 0.8,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  // Search bar styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.layout.md,
    marginTop: -20,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    ...theme.elevation.sm,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInputContainer: {
    flex: 1,
  },
  searchInput: {
    fontSize: 16,
    color: theme.colors.neutral[800],
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },

  // Filter styles
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.layout.sm,
    marginBottom: theme.spacing.md,
  },
  filterButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.round,
    marginRight: theme.spacing.sm,
    backgroundColor: theme.colors.neutral[100],
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary[500],
  },

  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50,
  },
  loadingText: {
    marginTop: theme.spacing.md,
  },

  // List styles
  listContent: {
    padding: theme.spacing.layout.sm,
    paddingBottom: theme.spacing.layout.xl * 3, // Extra padding for the scan button
  },

  // History item styles
  historyItemContainer: {
    marginHorizontal: theme.spacing.layout.xs,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    ...theme.elevation.sm,
  },
  historyItem: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  historyItemGradient: {
    flexDirection: 'row',
    padding: theme.spacing.md,
  },
  historyItemIconContainer: {
    marginRight: theme.spacing.md,
  },
  iconCircle: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyItemContent: {
    flex: 1,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xs,
  },
  productName: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  priceText: {
    marginLeft: theme.spacing.xs,
  },
  barcodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  barcodeText: {
    marginLeft: theme.spacing.xs,
  },
  historyItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    marginLeft: theme.spacing.xs,
  },
  transactionBadge: {
    backgroundColor: theme.colors.success[500],
    borderRadius: theme.borderRadius.round,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
  },
  transactionBadgeText: {
    marginLeft: theme.spacing.xs / 2,
  },

  // Empty state styles
  emptyState: {
    marginTop: 40,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.layout.lg,
    marginTop: 40,
  },
  emptyStateIconContainer: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  emptyStateTitle: {
    marginBottom: theme.spacing.sm,
  },
  emptyStateDescription: {
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyStateButton: {
    minWidth: 120,
  },

  // Scan button styles
  scanButton: {
    position: 'absolute',
    bottom: theme.spacing.layout.md,
    left: theme.spacing.layout.md,
    right: theme.spacing.layout.md,
    borderRadius: theme.borderRadius.round,
    overflow: 'hidden',
    ...theme.elevation.md,
  },
  scanButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  scanButtonText: {
    marginLeft: theme.spacing.sm,
  },
});
