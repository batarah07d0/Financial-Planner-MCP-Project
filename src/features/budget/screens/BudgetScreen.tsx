import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Typography, BudgetCard } from '../../../core/components';
import { theme } from '../../../core/theme';
import { formatCurrency } from '../../../core/utils';
import { useBudgetStore } from '../../../core/services/store/budgetStore';
import { useAuthStore } from '../../../core/services/store/authStore';
import { getCategories } from '../../../core/services/supabase/category.service';
import { getBudgetSpending } from '../../../core/services/supabase/budget.service';
import { Category } from '../../../core/services/supabase/types';
import { Ionicons } from '@expo/vector-icons';
import { useBudgetMonitor } from '../../../core/hooks/useBudgetMonitor';

// Interface untuk data budget yang ditampilkan di UI
interface BudgetDisplay {
  id: string;
  category: string;
  categoryId: string;
  amount: number;
  spent: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

// Interface untuk mapping kategori
interface CategoryMap {
  [key: string]: {
    name: string;
    icon?: string;
    color?: string;
  }
}

export const BudgetScreen = () => {
  const navigation = useNavigation();
  const [budgets, setBudgets] = useState<BudgetDisplay[]>([]);
  const [categoryMap, setCategoryMap] = useState<CategoryMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');

  // Menggunakan store untuk state management
  const { budgets: supabaseBudgets, fetchBudgets } = useBudgetStore();
  const { user } = useAuthStore();
  const { checkBudgetThresholds } = useBudgetMonitor();

  // Fungsi untuk memuat kategori
  const loadCategories = async () => {
    try {
      const categories = await getCategories({ type: 'expense' });
      const newCategoryMap: CategoryMap = {};

      categories.forEach(category => {
        newCategoryMap[category.id] = {
          name: category.name,
          icon: category.icon,
          color: category.color,
        };
      });

      setCategoryMap(newCategoryMap);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // Fungsi untuk menghitung pengeluaran untuk setiap anggaran
  const calculateSpending = async (budgetList: any[]) => {
    if (!user?.id) return [];

    try {
      const now = new Date();
      const displayBudgets: BudgetDisplay[] = [];

      for (const budget of budgetList) {
        let startDate = '';
        let endDate = '';
        // Default period jika tidak ada di database
        const period = budget.period || selectedPeriod || 'monthly';

        // Menentukan rentang tanggal berdasarkan periode
        if (period === 'daily') {
          const today = new Date();
          startDate = today.toISOString().split('T')[0];
          endDate = today.toISOString().split('T')[0];
        } else if (period === 'weekly') {
          const today = new Date();
          const day = today.getDay();
          const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
          const monday = new Date(today.setDate(diff));
          const sunday = new Date(today);
          sunday.setDate(monday.getDate() + 6);

          startDate = monday.toISOString().split('T')[0];
          endDate = sunday.toISOString().split('T')[0];
        } else if (period === 'monthly') {
          const year = now.getFullYear();
          const month = now.getMonth();
          const firstDay = new Date(year, month, 1);
          const lastDay = new Date(year, month + 1, 0);

          startDate = firstDay.toISOString().split('T')[0];
          endDate = lastDay.toISOString().split('T')[0];
        } else if (period === 'yearly') {
          const year = now.getFullYear();
          const firstDay = new Date(year, 0, 1);
          const lastDay = new Date(year, 11, 31);

          startDate = firstDay.toISOString().split('T')[0];
          endDate = lastDay.toISOString().split('T')[0];
        } else {
          // Default ke bulanan jika period tidak valid
          const year = now.getFullYear();
          const month = now.getMonth();
          const firstDay = new Date(year, month, 1);
          const lastDay = new Date(year, month + 1, 0);

          startDate = firstDay.toISOString().split('T')[0];
          endDate = lastDay.toISOString().split('T')[0];
        }

        // Mendapatkan total pengeluaran untuk kategori dan periode ini
        const spent = await getBudgetSpending(
          user.id,
          budget.category_id,
          startDate,
          endDate
        );

        displayBudgets.push({
          id: budget.id,
          categoryId: budget.category_id,
          category: categoryMap[budget.category_id]?.name || 'Kategori',
          amount: budget.amount,
          spent,
          period: period,
        });
      }

      return displayBudgets;
    } catch (error) {
      console.error('Error calculating spending:', error);
      return [];
    }
  };

  // Fungsi untuk memuat anggaran
  const loadBudgets = async () => {
    try {
      setIsLoading(true);

      if (!user?.id) return;

      // Memuat kategori terlebih dahulu
      await loadCategories();

      try {
        // Memuat anggaran dari Supabase
        // Coba tanpa filter period dulu untuk mengatasi jika kolom period belum ada
        await fetchBudgets(user.id);

        // Menghitung pengeluaran untuk setiap anggaran
        let displayBudgets = await calculateSpending(supabaseBudgets);

        // Filter secara manual berdasarkan period jika kolom period ada
        if (displayBudgets.length > 0 && 'period' in displayBudgets[0]) {
          displayBudgets = displayBudgets.filter(budget => budget.period === selectedPeriod);
        }

        setBudgets(displayBudgets);

        // Setelah memuat budget, cek threshold untuk notifikasi
        if (displayBudgets.length > 0) {
          checkBudgetThresholds();
        }
      } catch (error: any) {
        // Jika error terkait kolom period, tampilkan pesan yang lebih informatif
        if (error.message && error.message.includes('period does not exist')) {
          console.error('Kolom period belum ada di tabel budgets. Silakan jalankan SQL untuk menambahkan kolom period.');
          setBudgets([]);
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error loading budgets:', error);
      setBudgets([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi untuk refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadBudgets();
    setIsRefreshing(false);
  };

  // Fungsi untuk menangani klik pada anggaran
  const handleBudgetPress = (id: string) => {
    // Navigasi ke halaman detail anggaran
    console.log('Budget pressed:', id);
  };

  // Fungsi untuk menangani klik pada tombol tambah anggaran
  const handleAddBudget = () => {
    // Navigasi ke halaman tambah anggaran
    navigation.navigate('AddBudget' as never);
  };

  // Fungsi untuk menghitung total anggaran dan pengeluaran
  const calculateTotals = () => {
    const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
    const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
    return { totalBudget, totalSpent };
  };

  // Memuat anggaran saat komponen dimount atau periode berubah
  useEffect(() => {
    loadBudgets();
  }, [selectedPeriod, user]);

  // Render item untuk FlatList
  const renderItem = ({ item }: { item: BudgetDisplay }) => (
    <BudgetCard
      id={item.id}
      category={item.category}
      amount={item.amount}
      spent={item.spent}
      onPress={handleBudgetPress}
    />
  );

  // Render periode buttons
  const renderPeriodButtons = () => (
    <View style={styles.periodContainer}>
      <TouchableOpacity
        style={[
          styles.periodButton,
          selectedPeriod === 'daily' && styles.activePeriodButton,
        ]}
        onPress={() => setSelectedPeriod('daily')}
        activeOpacity={0.8}
      >
        <Typography
          variant="body2"
          weight={selectedPeriod === 'daily' ? '600' : '400'}
          color={selectedPeriod === 'daily' ? theme.colors.white : theme.colors.neutral[700]}
        >
          Harian
        </Typography>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.periodButton,
          selectedPeriod === 'weekly' && styles.activePeriodButton,
        ]}
        onPress={() => setSelectedPeriod('weekly')}
        activeOpacity={0.8}
      >
        <Typography
          variant="body2"
          weight={selectedPeriod === 'weekly' ? '600' : '400'}
          color={selectedPeriod === 'weekly' ? theme.colors.white : theme.colors.neutral[700]}
        >
          Mingguan
        </Typography>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.periodButton,
          selectedPeriod === 'monthly' && styles.activePeriodButton,
        ]}
        onPress={() => setSelectedPeriod('monthly')}
        activeOpacity={0.8}
      >
        <Typography
          variant="body2"
          weight={selectedPeriod === 'monthly' ? '600' : '400'}
          color={selectedPeriod === 'monthly' ? theme.colors.white : theme.colors.neutral[700]}
        >
          Bulanan
        </Typography>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.periodButton,
          selectedPeriod === 'yearly' && styles.activePeriodButton,
        ]}
        onPress={() => setSelectedPeriod('yearly')}
        activeOpacity={0.8}
      >
        <Typography
          variant="body2"
          weight={selectedPeriod === 'yearly' ? '600' : '400'}
          color={selectedPeriod === 'yearly' ? theme.colors.white : theme.colors.neutral[700]}
        >
          Tahunan
        </Typography>
      </TouchableOpacity>
    </View>
  );

  // Render summary
  const renderSummary = () => {
    const { totalBudget, totalSpent } = calculateTotals();
    const percentage = totalBudget > 0 ? totalSpent / totalBudget : 0;

    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Typography variant="body2" color={theme.colors.neutral[600]} weight="500">
            Total Anggaran
          </Typography>
          <Typography variant="h5" color={theme.colors.primary[500]} weight="700" style={{ marginTop: 4 }}>
            {formatCurrency(totalBudget)}
          </Typography>
        </View>

        <View style={styles.summaryItem}>
          <Typography variant="body2" color={theme.colors.neutral[600]} weight="500">
            Total Pengeluaran
          </Typography>
          <Typography
            variant="h5"
            color={percentage >= 1 ? theme.colors.danger[500] : theme.colors.success[500]}
            weight="700"
            style={{ marginTop: 4 }}
          >
            {formatCurrency(totalSpent)}
          </Typography>
        </View>
      </View>
    );
  };



  return (
    <SafeAreaView style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerContainer}>
        {/* Title Row */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Typography variant="h4" style={styles.headerTitle}>Anggaran</Typography>
          </View>
        </View>


      </View>

      {/* Period Selection */}
      {renderPeriodButtons()}

      {/* Budget Summary */}
      {renderSummary()}

      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        </View>
      ) : (
        <FlatList
          data={budgets}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary[500]]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Typography
                variant="body1"
                color={theme.colors.neutral[600]}
                align="center"
                style={styles.emptyText}
              >
                {user ?
                  (isLoading ? 'Memuat anggaran...' :
                    'Tidak ada anggaran untuk periode ini. Silakan tambahkan anggaran baru.') :
                  'Silakan login untuk melihat anggaran Anda.'
                }
              </Typography>
              {user && !isLoading && budgets.length === 0 && (
                <Typography
                  variant="caption"
                  color={theme.colors.neutral[500]}
                  align="center"
                  style={styles.noteText}
                >
                  Catatan: Jika Anda melihat error "column budgets.period does not exist",
                  silakan hubungi administrator untuk menjalankan SQL yang diperlukan.
                </Typography>
              )}
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      {user && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleAddBudget}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color={theme.colors.white} />
        </TouchableOpacity>
      )}
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
    paddingBottom: theme.spacing.md,
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
    height: 50, // Menetapkan tinggi tetap untuk header
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 6, // Menambahkan padding bawah untuk mengatasi masalah huruf 'g' terpotong
  },
  headerTitle: {
    fontSize: 26,
    color: theme.colors.primary[500],
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 32, // Menambahkan line-height untuk memastikan huruf 'g' tidak terpotong
  },
  featureButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.layout.sm,
    marginBottom: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  actionButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.round,
    marginRight: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primary[500],
    backgroundColor: theme.colors.white,
    ...theme.elevation.xs,
    height: 36, // Menetapkan tinggi tetap untuk semua tombol
    justifyContent: 'center', // Memastikan teks berada di tengah vertikal
    alignItems: 'center', // Memastikan teks berada di tengah horizontal
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
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
  periodContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
    marginBottom: theme.spacing.md,
  },
  periodButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.neutral[200],
    marginHorizontal: theme.spacing.xs,
    ...theme.elevation.xs,
  },
  activePeriodButton: {
    backgroundColor: theme.colors.primary[500],
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.layout.sm,
    paddingBottom: theme.spacing.md,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.xs,
    alignItems: 'center',
    ...theme.elevation.sm,
  },
  listContent: {
    padding: theme.spacing.layout.sm,
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
    flex: 1,
  },
  emptyText: {
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  noteText: {
    marginBottom: theme.spacing.md,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
});
