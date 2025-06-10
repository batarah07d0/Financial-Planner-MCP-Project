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
import { useNavigation, useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Typography, TransactionCard, SuperiorDialog } from '../../../core/components';
import { theme } from '../../../core/theme';
import { Transaction } from '../../../core/services/supabase/types';
import { useSensitiveActionAuth } from '../../../core/hooks/useSensitiveActionAuth';
import { RootStackParamList, TabParamList } from '../../../core/navigation/types';
import { useTransactionStore, useAuthStore } from '../../../core/services/store';
import { supabase } from '../../../config/supabase';
import { useSuperiorDialog } from '../../../core/hooks';
import { useAppDimensions } from '../../../core/hooks/useAppDimensions';

// Definisikan tipe untuk navigasi dengan keyof untuk memastikan nama screen valid
type TransactionsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type TransactionsScreenRouteProp = RouteProp<TabParamList, 'Transactions'>;

// Fungsi helper untuk navigasi yang type-safe
const navigateTo = <T extends keyof RootStackParamList>(
  navigation: TransactionsScreenNavigationProp,
  screen: T,
  params?: RootStackParamList[T]
) => {
  // Type assertion diperlukan karena navigation prop tidak mengenali semua screen
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (navigation as any).navigate(screen, params);
};

// Kategori akan diambil dari Supabase

export const TransactionsScreen = () => {
  const navigation = useNavigation<TransactionsScreenNavigationProp>();
  const route = useRoute<TransactionsScreenRouteProp>();
  const { user } = useAuthStore();

  // Ambil parameter dari route
  const { categoryId: routeCategoryId, type: routeType } = route.params || {};

  // Hook responsif untuk mendapatkan dimensi dan breakpoint
  const {
    responsiveSpacing,
    isSmallDevice,
    isLargeDevice
  } = useAppDimensions();

  const {
    fetchTransactions,
    deleteTransaction
  } = useTransactionStore();

  // Simplified state management - gunakan satu sumber data yang konsisten
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>(routeType || 'all');
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  const [filteredCategoryId] = useState<string | undefined>(routeCategoryId);
  const [error, setError] = useState<string | null>(null);

  const { dialogState, showError, showSuccess, showConfirm, hideDialog } = useSuperiorDialog();
  const { authenticateDelete } = useSensitiveActionAuth({
    showConfirm,
    showError,
  });

  // Responsive icon button size
  const getIconButtonSize = () => {
    if (isSmallDevice) return 40;
    if (isLargeDevice) return 52;
    return 44; // medium device
  };

  // Responsive icon sizes
  const getIconSize = () => {
    if (isSmallDevice) return 20;
    if (isLargeDevice) return 26;
    return 22; // medium device
  };

  // Fungsi untuk memuat transaksi dari Supabase dengan error handling yang lebih baik
  const loadTransactions = React.useCallback(async () => {
    if (!user) {
      setError('Anda harus login terlebih dahulu');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Query langsung ke Supabase untuk mendapatkan data terbaru
      const { data: allTransactions, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(100);

      if (fetchError) {
        throw fetchError;
      }

      if (allTransactions) {
        // Set data ke state lokal
        setTransactions(allTransactions as Transaction[]);

        // Update store untuk konsistensi dengan komponen lain
        try {
          await fetchTransactions(user.id, { limit: 100 });
        } catch (storeError) {
          // Store update gagal tidak masalah, data lokal sudah ada
        }
      }

      // Ambil kategori untuk mapping
      await loadCategories();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Gagal memuat transaksi');
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchTransactions]);

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
      // Error loading categories, but continue with empty category map
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
  const handleDeleteTransaction = async (id: string) => {
    // Cari transaksi untuk mendapatkan informasi kategori
    const transaction = transactions.find(t => t.id === id);
    const categoryName = transaction ? categoryMap[transaction.category_id] || 'Lainnya' : 'transaksi ini';
    const transactionName = transaction
      ? `${transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} ${categoryName}`
      : 'transaksi ini';

    await authenticateDelete(
      'transaksi',
      transactionName,
      async () => {
        try {
          await deleteTransaction(id);
          // Refresh data setelah delete berhasil
          await loadTransactions();
          showSuccess('Sukses', 'Transaksi berhasil dihapus');
        } catch (error) {
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



  // Fungsi untuk menangani klik pada tombol peta pengeluaran
  const handleOpenExpenseMap = () => {
    // Navigasi ke halaman peta pengeluaran
    navigateTo(navigation, 'ExpenseMap');
  };

  // Fungsi untuk memfilter transaksi
  const getFilteredTransactions = () => {
    let filtered = transactions;

    // Filter berdasarkan tipe
    if (filter !== 'all') {
      filtered = filtered.filter((transaction: Transaction) => transaction.type === filter);
    }

    // Filter berdasarkan kategori jika ada
    if (filteredCategoryId) {
      filtered = filtered.filter((transaction: Transaction) => transaction.category_id === filteredCategoryId);
    }

    return filtered;
  };

  // Memuat transaksi saat komponen dimount atau user berubah
  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user, loadTransactions]);

  // Refresh data ketika halaman difokuskan (misalnya setelah menambah transaksi)
  // Gunakan ref untuk mencegah refresh berlebihan
  const lastFocusTime = React.useRef<number>(0);

  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        const now = Date.now();
        // Hanya refresh jika sudah lebih dari 2 detik sejak focus terakhir
        if (now - lastFocusTime.current > 2000) {
          lastFocusTime.current = now;
          loadTransactions();
        }
      }
    }, [user, loadTransactions])
  );

  // Tampilkan error jika ada
  useEffect(() => {
    if (error) {
      showError('Error', error);
    }
  }, [error, showError]);

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
        onDelete={async () => await handleDeleteTransaction(item.id)}
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
          <Typography variant="h5" weight="700" color={theme.colors.primary[500]} style={styles.headerTitle}>
            Transaksi
          </Typography>
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterWrapper}>
          {renderFilterButtons()}
        </View>

        {/* Action Icons Row - Moved below filter buttons */}
        <View style={[
          styles.actionIconsContainer,
          {
            paddingHorizontal: responsiveSpacing(theme.spacing.layout.sm),
            marginTop: responsiveSpacing(theme.spacing.md),
          }
        ]}>
          <TouchableOpacity
            style={[
              styles.actionButton,
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
              styles.actionButton,
              styles.addButton,
              {
                width: getIconButtonSize(),
                height: getIconButtonSize(),
                borderRadius: getIconButtonSize() / 2,
              }
            ]}
            onPress={handleAddTransaction}
          >
            <Ionicons name="add" size={getIconSize()} color={theme.colors.white} />
          </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.layout.sm,
    marginBottom: theme.spacing.md,
  },
  headerTitle: {
    fontSize: 20,
    textAlign: 'center',
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
  actionIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral[100],
    ...theme.elevation.sm,
  },
  addButton: {
    backgroundColor: theme.colors.primary[500],
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

});
