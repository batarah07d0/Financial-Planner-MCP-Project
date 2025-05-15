import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../core/navigation/types';
import { Typography, EmptyState } from '../../../core/components';
import { theme } from '../../../core/theme';
import { Ionicons } from '@expo/vector-icons';
import { BarcodeHistoryItem } from '../models/Barcode';
import { getBarcodeHistory, searchBarcode } from '../services/barcodeService';
import { formatCurrency, formatDate } from '../../../core/utils';

type BarcodeScanHistoryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'BarcodeScanHistory'>;

export const BarcodeScanHistoryScreen = () => {
  const navigation = useNavigation<BarcodeScanHistoryScreenNavigationProp>();
  const [history, setHistory] = useState<BarcodeHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fungsi untuk memuat riwayat pemindaian
  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const data = await getBarcodeHistory();
      setHistory(data);
    } catch (error) {
      console.error('Error loading barcode history:', error);
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
        // Navigasi ke layar detail produk
        navigation.navigate('ProductDetail', { productId: item.barcode });
      } else {
        // Jika produk tidak ditemukan, tampilkan pesan
        navigation.navigate('AddProduct', { barcode: item.barcode });
      }
    } catch (error) {
      console.error('Error searching barcode:', error);
    }
  };

  // Fungsi untuk menangani pemindaian barcode baru
  const handleScanBarcode = () => {
    navigation.navigate('BarcodeScanner', {
      onScanComplete: (data) => {
        // Refresh riwayat setelah pemindaian berhasil
        loadHistory();
      },
    });
  };

  // Memuat riwayat saat komponen dimount
  useEffect(() => {
    loadHistory();
  }, []);

  // Render item riwayat
  const renderHistoryItem = ({ item }: { item: BarcodeHistoryItem }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => handleItemPress(item)}
    >
      <View style={styles.historyItemContent}>
        <Typography variant="h5" numberOfLines={1} style={styles.productName}>
          {item.productName}
        </Typography>
        
        <Typography variant="body2" color={theme.colors.neutral[600]}>
          Barcode: {item.barcode}
        </Typography>
        
        <View style={styles.historyItemDetails}>
          <Typography variant="body1" color={theme.colors.primary[500]}>
            {formatCurrency(item.price)}
          </Typography>
          
          <Typography variant="caption" color={theme.colors.neutral[500]}>
            {formatDate(item.scannedAt, { format: 'medium', includeTime: true })}
          </Typography>
        </View>
      </View>
      
      {item.addedToTransaction && (
        <View style={styles.transactionBadge}>
          <Ionicons name="checkmark-circle" size={16} color={theme.colors.white} />
          <Typography variant="caption" color={theme.colors.white} style={styles.transactionBadgeText}>
            Ditambahkan
          </Typography>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Typography variant="body1" color={theme.colors.primary[500]}>
            Kembali
          </Typography>
        </TouchableOpacity>
        <Typography variant="h4">Riwayat Pemindaian</Typography>
        <View style={{ width: 60 }} />
      </View>

      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderHistoryItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <EmptyState
              title="Belum Ada Riwayat"
              description="Anda belum memindai barcode apapun. Pindai barcode untuk melihat riwayat di sini."
              actionLabel="Pindai Barcode"
              onAction={handleScanBarcode}
            />
          }
        />
      )}

      <TouchableOpacity
        style={styles.scanButton}
        onPress={handleScanBarcode}
      >
        <Ionicons name="barcode-outline" size={24} color={theme.colors.white} />
        <Typography variant="body1" color={theme.colors.white} style={styles.scanButtonText}>
          Pindai Barcode
        </Typography>
      </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: theme.spacing.layout.sm,
    paddingBottom: theme.spacing.layout.xl * 2, // Extra padding for the scan button
  },
  historyItem: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.elevation.sm,
    position: 'relative',
  },
  historyItemContent: {
    flex: 1,
  },
  productName: {
    marginBottom: theme.spacing.xs,
  },
  historyItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  transactionBadge: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
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
  scanButton: {
    position: 'absolute',
    bottom: theme.spacing.layout.md,
    left: theme.spacing.layout.md,
    right: theme.spacing.layout.md,
    backgroundColor: theme.colors.primary[500],
    borderRadius: theme.borderRadius.round,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    ...theme.elevation.md,
  },
  scanButtonText: {
    marginLeft: theme.spacing.sm,
  },
});
