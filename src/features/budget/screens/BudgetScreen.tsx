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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography, BudgetCard } from '../../../core/components';
import { theme } from '../../../core/theme';
import { formatCurrency } from '../../../core/utils';
import { useBudgetStore } from '../../../core/services/store/budgetStore';
import { useAuthStore } from '../../../core/services/store/authStore';
import { getCategories } from '../../../core/services/supabase/category.service';
import { getBudgetSpending } from '../../../core/services/supabase/budget.service';

import { Ionicons } from '@expo/vector-icons';
import { useBudgetMonitor } from '../../../core/hooks/useBudgetMonitor';
import { useAppDimensions } from '../../../core/hooks/useAppDimensions';

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
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');

  // Responsive dimensions
  const {
    responsiveSpacing,
    responsiveFontSize,
    isSmallDevice
  } = useAppDimensions();

  // Menggunakan store untuk state management
  const { budgets: supabaseBudgets, fetchBudgets, isLoading: storeLoading } = useBudgetStore();
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
        await fetchBudgets(user.id);

        // Tunggu sebentar untuk memastikan store ter-update
        await new Promise(resolve => setTimeout(resolve, 200));

        // Setelah memuat budget, cek threshold untuk notifikasi
        checkBudgetThresholds();
      } catch (error: any) {
        // Jika error terkait kolom period, log ke console untuk developer
        if (error.message && error.message.includes('period does not exist')) {
          console.warn('Database schema update needed: period column missing in budgets table');
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
    (navigation as any).navigate('BudgetDetail', { id });
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

  // Refresh data saat screen focus (user kembali dari AddBudgetScreen)
  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        loadBudgets();
      }
    }, [user?.id, selectedPeriod])
  );

  // Listen untuk perubahan data budget dari store
  useEffect(() => {
    const processStoreBudgets = async () => {
      if (supabaseBudgets.length > 0 && categoryMap && Object.keys(categoryMap).length > 0) {
        console.log('Processing budgets from store...');

        // Menghitung pengeluaran untuk setiap anggaran
        let displayBudgets = await calculateSpending(supabaseBudgets);

        // Filter berdasarkan period yang dipilih
        const filteredBudgets = displayBudgets.filter(budget => {
          const budgetPeriod = budget.period || selectedPeriod;
          return budgetPeriod === selectedPeriod;
        });

        // Tampilkan hanya budget yang sesuai dengan periode yang dipilih
        if (filteredBudgets.length > 0) {
          console.log(`Found ${filteredBudgets.length} budget(s) for ${selectedPeriod} period`);
          setBudgets(filteredBudgets);
        } else {
          console.log(`No budgets found for ${selectedPeriod} period`);
          setBudgets([]);
        }
      }
    };

    processStoreBudgets();
  }, [supabaseBudgets, categoryMap, selectedPeriod]);

  // Render item untuk FlatList
  const renderItem = ({ item }: { item: BudgetDisplay }) => {
    const categoryData = categoryMap[item.categoryId];
    return (
      <BudgetCard
        id={item.id}
        category={item.category}
        amount={item.amount}
        spent={item.spent}
        categoryIcon={categoryData?.icon}
        categoryColor={categoryData?.color}
        period={item.period}
        onPress={handleBudgetPress}
      />
    );
  };

  // Fungsi untuk menghitung jumlah budget per periode
  const getBudgetCountByPeriod = (period: string) => {
    return supabaseBudgets.filter(budget => budget.period === period).length;
  };

  // Render periode buttons dengan responsivitas dan perfect center alignment
  const renderPeriodButtons = () => {
    // Responsive button styling dengan perfect center alignment
    const getResponsivePeriodButtonStyle = (isActive: boolean) => ({
      paddingVertical: responsiveSpacing(theme.spacing.xs + 2), // Sedikit lebih besar untuk center vertikal
      paddingHorizontal: responsiveSpacing(isSmallDevice ? theme.spacing.md : theme.spacing.lg),
      borderRadius: theme.borderRadius.round,
      backgroundColor: isActive ? theme.colors.primary[500] : theme.colors.neutral[200],
      marginHorizontal: responsiveSpacing(theme.spacing.xs), // Margin horizontal yang sama
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      minHeight: responsiveSpacing(isSmallDevice ? 36 : 40), // Tinggi yang lebih konsisten
      minWidth: responsiveSpacing(isSmallDevice ? 70 : 80), // Lebar minimum untuk konsistensi
      ...theme.elevation.xs,
    });

    // Render badge untuk menunjukkan jumlah budget
    const renderBadge = (count: number, isActive: boolean) => {
      if (count === 0) return null;

      return (
        <View style={{
          position: 'absolute',
          top: -6,
          right: -6,
          backgroundColor: isActive ? theme.colors.white : theme.colors.primary[500],
          borderRadius: 10,
          minWidth: 20,
          height: 20,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 6,
        }}>
          <Typography
            variant="caption"
            weight="600"
            color={isActive ? theme.colors.primary[500] : theme.colors.white}
            style={{
              fontSize: 10,
              lineHeight: 12,
            }}
          >
            {count}
          </Typography>
        </View>
      );
    };

    return (
      <View style={[styles.periodContainer, {
        flexDirection: 'row',
        justifyContent: 'center', // Center horizontal container
        alignItems: 'center', // Center vertical container
        flexWrap: 'wrap',
        paddingVertical: responsiveSpacing(theme.spacing.md),
        marginBottom: responsiveSpacing(theme.spacing.md),
        paddingHorizontal: responsiveSpacing(theme.spacing.sm), // Padding untuk breathing room
      }]}>
        <TouchableOpacity
          style={getResponsivePeriodButtonStyle(selectedPeriod === 'daily')}
          onPress={() => setSelectedPeriod('daily')}
          activeOpacity={0.8}
        >
          <Typography
            variant="body2"
            weight={selectedPeriod === 'daily' ? '600' : '400'}
            color={selectedPeriod === 'daily' ? theme.colors.white : theme.colors.neutral[700]}
            style={{
              fontSize: responsiveFontSize(isSmallDevice ? 12 : 14),
              textAlign: 'center',
              lineHeight: responsiveFontSize(isSmallDevice ? 16 : 18), // Line height untuk center vertikal
            }}
          >
            Harian
          </Typography>
          {renderBadge(getBudgetCountByPeriod('daily'), selectedPeriod === 'daily')}
        </TouchableOpacity>

        <TouchableOpacity
          style={getResponsivePeriodButtonStyle(selectedPeriod === 'weekly')}
          onPress={() => setSelectedPeriod('weekly')}
          activeOpacity={0.8}
        >
          <Typography
            variant="body2"
            weight={selectedPeriod === 'weekly' ? '600' : '400'}
            color={selectedPeriod === 'weekly' ? theme.colors.white : theme.colors.neutral[700]}
            style={{
              fontSize: responsiveFontSize(isSmallDevice ? 12 : 14),
              textAlign: 'center',
              lineHeight: responsiveFontSize(isSmallDevice ? 16 : 18),
            }}
          >
            Mingguan
          </Typography>
          {renderBadge(getBudgetCountByPeriod('weekly'), selectedPeriod === 'weekly')}
        </TouchableOpacity>

        <TouchableOpacity
          style={getResponsivePeriodButtonStyle(selectedPeriod === 'monthly')}
          onPress={() => setSelectedPeriod('monthly')}
          activeOpacity={0.8}
        >
          <Typography
            variant="body2"
            weight={selectedPeriod === 'monthly' ? '600' : '400'}
            color={selectedPeriod === 'monthly' ? theme.colors.white : theme.colors.neutral[700]}
            style={{
              fontSize: responsiveFontSize(isSmallDevice ? 12 : 14),
              textAlign: 'center',
              lineHeight: responsiveFontSize(isSmallDevice ? 16 : 18),
            }}
          >
            Bulanan
          </Typography>
          {renderBadge(getBudgetCountByPeriod('monthly'), selectedPeriod === 'monthly')}
        </TouchableOpacity>

        <TouchableOpacity
          style={getResponsivePeriodButtonStyle(selectedPeriod === 'yearly')}
          onPress={() => setSelectedPeriod('yearly')}
          activeOpacity={0.8}
        >
          <Typography
            variant="body2"
            weight={selectedPeriod === 'yearly' ? '600' : '400'}
            color={selectedPeriod === 'yearly' ? theme.colors.white : theme.colors.neutral[700]}
            style={{
              fontSize: responsiveFontSize(isSmallDevice ? 12 : 14),
              textAlign: 'center',
              lineHeight: responsiveFontSize(isSmallDevice ? 16 : 18),
            }}
          >
            Tahunan
          </Typography>
          {renderBadge(getBudgetCountByPeriod('yearly'), selectedPeriod === 'yearly')}
        </TouchableOpacity>
      </View>
    );
  };

  // Render summary dengan responsivitas
  const renderSummary = () => {
    const { totalBudget, totalSpent } = calculateTotals();
    const percentage = totalBudget > 0 ? totalSpent / totalBudget : 0;

    // Responsive summary item styling
    const getResponsiveSummaryItemStyle = () => ({
      flex: 1,
      backgroundColor: theme.colors.white,
      padding: responsiveSpacing(isSmallDevice ? theme.spacing.sm : theme.spacing.md),
      borderRadius: theme.borderRadius.md,
      marginHorizontal: responsiveSpacing(theme.spacing.xs),
      alignItems: 'center' as const,
      minHeight: responsiveSpacing(isSmallDevice ? 70 : 80),
      justifyContent: 'center' as const,
      ...theme.elevation.sm,
    });

    return (
      <View style={[styles.summaryContainer, {
        paddingHorizontal: responsiveSpacing(theme.spacing.layout.sm),
        paddingBottom: responsiveSpacing(theme.spacing.md),
      }]}>
        <View style={getResponsiveSummaryItemStyle()}>
          <Typography
            variant="body2"
            color={theme.colors.neutral[600]}
            weight="500"
            style={{
              fontSize: responsiveFontSize(isSmallDevice ? 12 : 14),
              textAlign: 'center'
            }}
          >
            Total Anggaran
          </Typography>
          <Typography
            variant="h5"
            color={theme.colors.primary[500]}
            weight="700"
            style={{
              marginTop: responsiveSpacing(4),
              fontSize: responsiveFontSize(isSmallDevice ? 16 : 18),
              textAlign: 'center'
            }}
          >
            {formatCurrency(totalBudget)}
          </Typography>
        </View>

        <View style={getResponsiveSummaryItemStyle()}>
          <Typography
            variant="body2"
            color={theme.colors.neutral[600]}
            weight="500"
            style={{
              fontSize: responsiveFontSize(isSmallDevice ? 12 : 14),
              textAlign: 'center'
            }}
          >
            Total Pengeluaran
          </Typography>
          <Typography
            variant="h5"
            color={percentage >= 1 ? theme.colors.danger[500] : theme.colors.success[500]}
            weight="700"
            style={{
              marginTop: responsiveSpacing(4),
              fontSize: responsiveFontSize(isSmallDevice ? 16 : 18),
              textAlign: 'center'
            }}
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
      <View style={[styles.headerContainer, {
        paddingTop: responsiveSpacing(theme.spacing.md),
        paddingBottom: responsiveSpacing(theme.spacing.md),
      }]}>
        {/* Title Row */}
        <View style={[styles.header, {
          paddingHorizontal: responsiveSpacing(theme.spacing.layout.sm),
          marginBottom: responsiveSpacing(theme.spacing.md),
          height: responsiveSpacing(isSmallDevice ? 45 : 50),
        }]}>
          <View style={[styles.titleContainer, {
            paddingBottom: responsiveSpacing(6),
          }]}>
            <Typography
              variant="h4"
              style={{
                fontSize: responsiveFontSize(isSmallDevice ? 22 : 26),
                color: theme.colors.primary[500],
                fontWeight: '700',
                letterSpacing: -0.5,
                lineHeight: responsiveSpacing(isSmallDevice ? 28 : 32),
              }}
            >
              Anggaran
            </Typography>
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
          contentContainerStyle={[styles.listContent, {
            padding: responsiveSpacing(theme.spacing.layout.sm),
          }]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary[500]]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <LinearGradient
                colors={[theme.colors.primary[50], theme.colors.primary[100]]}
                style={styles.emptyGradient}
              >
                <View style={styles.emptyIconContainer}>
                  <LinearGradient
                    colors={[theme.colors.primary[400], theme.colors.primary[600]]}
                    style={styles.emptyIconGradient}
                  >
                    <Ionicons
                      name="wallet-outline"
                      size={responsiveSpacing(48)}
                      color={theme.colors.white}
                    />
                  </LinearGradient>
                </View>

                <Typography
                  variant="h4"
                  color={theme.colors.neutral[800]}
                  align="center"
                  weight="700"
                  style={styles.emptyTitle}
                >
                  {user ?
                    (isLoading ? 'Memuat Anggaran...' :
                      'Mulai Kelola Anggaran') :
                    'Silakan Login Terlebih Dahulu'
                  }
                </Typography>

                <Typography
                  variant="body1"
                  color={theme.colors.neutral[600]}
                  align="center"
                  style={styles.emptyText}
                >
                  {user ?
                    (isLoading ? 'Sedang mengambil data anggaran Anda...' :
                      `Buat anggaran ${selectedPeriod === 'daily' ? 'harian' :
                       selectedPeriod === 'weekly' ? 'mingguan' :
                       selectedPeriod === 'monthly' ? 'bulanan' : 'tahunan'} untuk mengontrol pengeluaran dan mencapai tujuan finansial Anda.`) :
                    'Masuk ke akun Anda untuk melihat dan mengelola anggaran keuangan.'
                  }
                </Typography>

                {user && !isLoading && budgets.length === 0 && (
                  <View style={styles.emptyFeatures}>
                    <View style={styles.featureItem}>
                      <View style={styles.featureIcon}>
                        <Ionicons name="checkmark-circle" size={18} color={theme.colors.success[500]} />
                      </View>
                      <Typography variant="body2" color={theme.colors.neutral[700]} style={styles.featureText}>
                        Kontrol pengeluaran harian
                      </Typography>
                    </View>
                    <View style={styles.featureItem}>
                      <View style={styles.featureIcon}>
                        <Ionicons name="trending-up" size={18} color={theme.colors.info[500]} />
                      </View>
                      <Typography variant="body2" color={theme.colors.neutral[700]} style={styles.featureText}>
                        Pantau progress real-time
                      </Typography>
                    </View>
                    <View style={styles.featureItem}>
                      <View style={styles.featureIcon}>
                        <Ionicons name="notifications" size={18} color={theme.colors.warning[500]} />
                      </View>
                      <Typography variant="body2" color={theme.colors.neutral[700]} style={styles.featureText}>
                        Notifikasi batas anggaran
                      </Typography>
                    </View>
                  </View>
                )}

                {user && !isLoading && budgets.length === 0 && (
                  <TouchableOpacity style={styles.emptyActionButton} onPress={handleAddBudget}>
                    <LinearGradient
                      colors={[theme.colors.primary[500], theme.colors.primary[700]]}
                      style={styles.emptyActionGradient}
                    >
                      <Ionicons name="add-circle" size={24} color={theme.colors.white} />
                      <Typography variant="h6" weight="600" color={theme.colors.white}>
                        Buat Anggaran Pertama
                      </Typography>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </LinearGradient>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      {user && (
        <TouchableOpacity
          style={{
            ...styles.fab,
            bottom: responsiveSpacing(isSmallDevice ? 20 : 24),
            right: responsiveSpacing(isSmallDevice ? 20 : 24),
            width: responsiveSpacing(isSmallDevice ? 52 : 60),
            height: responsiveSpacing(isSmallDevice ? 52 : 60),
            borderRadius: responsiveSpacing(isSmallDevice ? 26 : 30),
          }}
          onPress={handleAddBudget}
          activeOpacity={0.8}
        >
          <Ionicons
            name="add"
            size={responsiveSpacing(isSmallDevice ? 20 : 24)}
            color={theme.colors.white}
          />
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
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
    ...theme.elevation.xs,
    // Responsive values will be applied inline
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // Responsive values will be applied inline
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // Responsive values will be applied inline
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
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
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
    zIndex: 999,
    // Responsive values will be applied inline
  },
  periodContainer: {
    backgroundColor: theme.colors.white,
    // All styling moved inline for perfect center alignment
  },
  periodButton: {
    // Responsive values moved to renderPeriodButtons
  },
  activePeriodButton: {
    // Responsive values moved to renderPeriodButtons
  },
  summaryContainer: {
    flexDirection: 'row',
    // Responsive values will be applied inline
  },
  summaryItem: {
    // Responsive values moved to renderSummary
  },
  listContent: {
    // Responsive values will be applied inline
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
  emptyGradient: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    shadowColor: theme.colors.neutral[900],
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  emptyIconContainer: {
    marginBottom: theme.spacing.lg,
    borderRadius: 40,
    overflow: 'hidden',
    shadowColor: theme.colors.primary[600],
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emptyIconGradient: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  emptyText: {
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: theme.spacing.md,
  },
  emptyFeatures: {
    width: '100%',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
    shadowColor: theme.colors.neutral[900],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureText: {
    flex: 1,
  },
  emptyActionButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: theme.colors.primary[600],
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emptyActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    gap: 12,
  },
});
