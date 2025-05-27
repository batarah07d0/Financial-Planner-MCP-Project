import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Typography, TransactionCard, SuperiorDialog } from '../../../core/components';
import { theme } from '../../../core/theme';
import { Transaction } from '../../../core/services/supabase/types';
import { RootStackParamList } from '../../../core/navigation/types';
import { useTransactionStore, useAuthStore } from '../../../core/services/store';
import { supabase } from '../../../config/supabase';
import { useSuperiorDialog } from '../../../core/hooks';
import { useAppDimensions } from '../../../core/hooks/useAppDimensions';

// Definisikan tipe untuk navigasi dengan keyof untuk memastikan nama screen valid
type TransactionsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Fungsi helper untuk navigasi yang type-safe
const navigateTo = <T extends keyof RootStackParamList>(
  navigation: TransactionsScreenNavigationProp,
  screen: T,
  params?: RootStackParamList[T]
) => {
  navigation.navigate(screen as any, params as any);
};

// Kategori akan diambil dari Supabase

export const TransactionsScreen = () => {
  const navigation = useNavigation<TransactionsScreenNavigationProp>();
  const { user } = useAuthStore();

  // Hook responsif untuk mendapatkan dimensi dan breakpoint
  const {
    width,
    height,
    breakpoint,
    isLandscape,
    responsiveFontSize,
    responsiveSpacing,
    isSmallDevice,
    isMediumDevice,
    isLargeDevice
  } = useAppDimensions();

  const {
    transactions,
    isLoading,
    error,
    fetchTransactions,
    deleteTransaction
  } = useTransactionStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  const { dialogState, showError, showDelete, showSuccess, hideDialog } = useSuperiorDialog();

  // Responsive icon button size
  const getIconButtonSize = () => {
    if (isSmallDevice) return 40;
    if (isLargeDevice) return 52;
    return 44; // medium device
  };

  // Responsive FAB size
  const getFABSize = () => {
    if (isSmallDevice) return 56;
    if (isLargeDevice) return 68;
    return 60; // medium device
  };

  // Responsive icon sizes
  const getIconSize = () => {
    if (isSmallDevice) return 20;
    if (isLargeDevice) return 26;
    return 22; // medium device
  };

  // Responsive FAB position
  const getFABPosition = () => {
    if (isSmallDevice) return 20;
    if (isLargeDevice) return 28;
    return 24; // medium device
  };

  // Fungsi untuk memuat transaksi dari Supabase
  const loadTransactions = async () => {
    if (!user) {
      showError('Error', 'Anda harus login terlebih dahulu');
      return;
    }

    try {
      await fetchTransactions(user.id, {
        limit: 50, // Ambil lebih banyak transaksi
      });

      // Ambil kategori untuk mapping
      await loadCategories();
    } catch (error) {
      console.error('Error loading transactions:', error);
      showError('Error', 'Gagal memuat transaksi');
    }
  };

  // Fungsi untuk memuat kategori
  const loadCategories = async () => {
    try {
      // Gunakan API Supabase untuk mendapatkan kategori
      const { data, error } = await supabase
        .from('categories')
        .select('id, name');

      if (error) throw error;

      if (data) {
        const newCategoryMap: Record<string, string> = {};
        data.forEach(category => {
          newCategoryMap[category.id] = category.name;
        });
        setCategoryMap(newCategoryMap);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // Fungsi untuk refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadTransactions();
    setIsRefreshing(false);
  };

  // Fungsi untuk menangani klik pada transaksi
  const handleTransactionPress = (id: string) => {
    // Navigasi ke halaman detail transaksi
    navigateTo(navigation, 'TransactionDetail', { id });
  };

  // Fungsi untuk menghapus transaksi
  const handleDeleteTransaction = (id: string) => {
    showDelete(
      'Hapus Transaksi',
      'Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat dibatalkan.',
      async () => {
        try {
          await deleteTransaction(id);
          showSuccess('Sukses', 'Transaksi berhasil dihapus');
        } catch (error) {
          console.error('Error deleting transaction:', error);
          showError('Error', 'Gagal menghapus transaksi');
        }
      }
    );
  };

  // Fungsi untuk menangani klik pada tombol tambah transaksi
  const handleAddTransaction = () => {
    // Berikan haptic feedback untuk pengalaman pengguna yang lebih baik
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Navigasi ke halaman tambah transaksi
    navigateTo(navigation, 'AddTransaction');
  };

  // Fungsi untuk menangani klik pada tombol pemindai struk
  const handleScanReceipt = () => {
    // Navigasi ke halaman pemindai struk
    navigateTo(navigation, 'ReceiptScanner');
  };

  // Fungsi untuk menangani klik pada tombol pemindai barcode
  const handleScanBarcode = () => {
    // Navigasi ke halaman pemindai barcode
    navigateTo(navigation, 'BarcodeScanner', {
      onScanComplete: (data: {
        productName: string;
        amount: number;
        category: string;
        barcode: string;
      }) => {
        // Navigasi ke halaman tambah transaksi dengan data dari pemindaian
        navigateTo(navigation, 'AddTransaction', {
          scannedData: {
            description: data.productName,
            amount: data.amount,
            // Catatan: category tidak ada dalam tipe scannedData, jadi kita tidak menyertakannya
          },
        });
      },
    });

    // Tampilkan pesan untuk debugging
    console.log('Navigating to BarcodeScanner screen');
  };

  // Fungsi untuk menangani klik pada tombol riwayat pemindaian barcode
  const handleBarcodeScanHistory = () => {
    // Navigasi ke halaman riwayat pemindaian barcode
    navigateTo(navigation, 'BarcodeScanHistory');
  };

  // Fungsi untuk menangani klik pada tombol peta pengeluaran
  const handleOpenExpenseMap = () => {
    // Navigasi ke halaman peta pengeluaran
    navigateTo(navigation, 'ExpenseMap');
  };

  // Fungsi untuk memfilter transaksi
  const getFilteredTransactions = () => {
    if (filter === 'all') {
      return transactions;
    }
    return transactions.filter((transaction: Transaction) => transaction.type === filter);
  };

  // Memuat transaksi saat komponen dimount atau user berubah
  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user]);

  // Refresh data ketika halaman difokuskan (misalnya setelah menambah transaksi)
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        loadTransactions();
      }
    }, [user])
  );

  // Tampilkan error jika ada
  useEffect(() => {
    if (error) {
      showError('Error', error);
    }
  }, [error]);

  // Render item untuk FlatList
  const renderItem = ({ item }: { item: Transaction }) => {
    // Gunakan nama kategori dari state categoryMap
    const categoryName = categoryMap[item.category_id] || 'Lainnya';

    return (
      <TransactionCard
        id={item.id}
        amount={item.amount}
        type={item.type}
        category={categoryName}
        description={item.description}
        date={item.date}
        onPress={handleTransactionPress}
        onDelete={() => handleDeleteTransaction(item.id)}
      />
    );
  };

  // Render filter buttons
  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[
          styles.filterButton,
          filter === 'all' && styles.activeFilterButton,
        ]}
        onPress={() => setFilter('all')}
        activeOpacity={0.8}
      >
        <Ionicons
          name="apps"
          size={18}
          color={filter === 'all' ? theme.colors.white : theme.colors.neutral[700]}
          style={styles.filterIcon}
        />
        <Typography
          variant="body2"
          weight={filter === 'all' ? '600' : '400'}
          color={filter === 'all' ? theme.colors.white : theme.colors.neutral[700]}
        >
          Semua
        </Typography>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.filterButton,
          filter === 'income' && styles.activeFilterButtonIncome,
        ]}
        onPress={() => setFilter('income')}
        activeOpacity={0.8}
      >
        <Ionicons
          name="arrow-down"
          size={18}
          color={filter === 'income' ? theme.colors.white : theme.colors.success[500]}
          style={styles.filterIcon}
        />
        <Typography
          variant="body2"
          weight={filter === 'income' ? '600' : '400'}
          color={filter === 'income' ? theme.colors.white : theme.colors.neutral[700]}
        >
          Pemasukan
        </Typography>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.filterButton,
          filter === 'expense' && styles.activeFilterButtonExpense,
        ]}
        onPress={() => setFilter('expense')}
        activeOpacity={0.8}
      >
        <Ionicons
          name="arrow-up"
          size={18}
          color={filter === 'expense' ? theme.colors.white : theme.colors.danger[500]}
          style={styles.filterIcon}
        />
        <Typography
          variant="body2"
          weight={filter === 'expense' ? '600' : '400'}
          color={filter === 'expense' ? theme.colors.white : theme.colors.neutral[700]}
        >
          Pengeluaran
        </Typography>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />
      <View style={styles.headerContainer}>
        {/* Header Title and Add Button */}
        <View style={styles.header}>
          <Typography variant="h4" weight="700" color={theme.colors.primary[500]} style={styles.headerTitle}>
            Transaksi
          </Typography>
        </View>

        {/* Action Icons Row */}
        <View style={[
          styles.headerActions,
          {
            paddingHorizontal: responsiveSpacing(theme.spacing.layout.sm),
          }
        ]}>
          <TouchableOpacity
            style={[
              styles.iconButton,
              {
                width: getIconButtonSize(),
                height: getIconButtonSize(),
                borderRadius: getIconButtonSize() / 2,
              }
            ]}
            onPress={handleOpenExpenseMap}
          >
            <Ionicons name="map-outline" size={getIconSize()} color={theme.colors.primary[500]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.iconButton,
              {
                width: getIconButtonSize(),
                height: getIconButtonSize(),
                borderRadius: getIconButtonSize() / 2,
              }
            ]}
            onPress={handleScanReceipt}
          >
            <Ionicons name="scan-outline" size={getIconSize()} color={theme.colors.primary[500]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.iconButton,
              {
                width: getIconButtonSize(),
                height: getIconButtonSize(),
                borderRadius: getIconButtonSize() / 2,
              }
            ]}
            onPress={handleScanBarcode}
          >
            <Ionicons name="barcode-outline" size={getIconSize()} color={theme.colors.primary[500]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.iconButton,
              {
                width: getIconButtonSize(),
                height: getIconButtonSize(),
                borderRadius: getIconButtonSize() / 2,
              }
            ]}
            onPress={handleBarcodeScanHistory}
          >
            <Ionicons name="list-outline" size={getIconSize()} color={theme.colors.primary[500]} />
          </TouchableOpacity>
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterWrapper}>
          {renderFilterButtons()}
        </View>
      </View>

      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        </View>
      ) : (
        <FlatList
          data={getFilteredTransactions()}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary[500]]}
              progressBackgroundColor={theme.colors.white}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="receipt-outline"
                size={64}
                color={theme.colors.neutral[300]}
                style={styles.emptyIcon}
              />
              <Typography
                variant="body1"
                weight="600"
                color={theme.colors.neutral[600]}
                align="center"
              >
                Tidak ada transaksi
              </Typography>
              <Typography
                variant="body2"
                color={theme.colors.neutral[500]}
                align="center"
                style={styles.emptySubtitle}
              >
                Tambahkan transaksi pertama Anda dengan menekan tombol + di bawah
              </Typography>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            width: getFABSize(),
            height: getFABSize(),
            borderRadius: getFABSize() / 2,
            bottom: getFABPosition(),
            right: getFABPosition(),
          }
        ]}
        onPress={handleAddTransaction}
        activeOpacity={0.8}
      >
        <Ionicons
          name="add"
          size={isSmallDevice ? 20 : isLargeDevice ? 28 : 24}
          color={theme.colors.white}
        />
      </TouchableOpacity>

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
  headerContainer: {
    backgroundColor: theme.colors.white,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
    ...theme.elevation.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.layout.sm,
    marginBottom: theme.spacing.md,
  },
  headerTitle: {
    fontSize: 28,
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    marginBottom: theme.spacing.md,
  },
  iconButton: {
    backgroundColor: theme.colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: theme.spacing.xs,
  },
  filterWrapper: {
    paddingHorizontal: theme.spacing.layout.sm,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: theme.spacing.md,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.neutral[200],
    marginHorizontal: theme.spacing.xs,
    ...theme.elevation.xs,
  },
  filterIcon: {
    marginRight: theme.spacing.xs,
  },
  activeFilterButton: {
    backgroundColor: theme.colors.primary[500],
  },
  activeFilterButtonIncome: {
    backgroundColor: theme.colors.success[500],
  },
  activeFilterButtonExpense: {
    backgroundColor: theme.colors.danger[500],
  },
  listContent: {
    padding: theme.spacing.layout.sm,
    paddingTop: theme.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: theme.spacing.layout.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.layout.xl,
  },
  emptyIcon: {
    marginBottom: theme.spacing.md,
  },
  emptySubtitle: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
    maxWidth: '80%',
  },
  fab: {
    position: 'absolute',
    backgroundColor: theme.colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.elevation.md,
    shadowColor: theme.colors.primary[700],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 999, // Memastikan FAB selalu di atas elemen lain
  },
});
