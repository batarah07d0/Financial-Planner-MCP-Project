import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography, Card } from '../../../core/components';
import { theme } from '../../../core/theme';
import { formatCurrency } from '../../../core/utils';
import { useAppDimensions } from '../../../core/hooks/useAppDimensions';

// Helper function untuk format persentase
const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../config/supabase';
import { useAuthStore } from '../../../core/services/store/authStore';
import { Transaction } from '../../../core/services/supabase/types';

// Tipe data untuk kategori pengeluaran
interface ExpenseCategory {
  id: string;
  name: string;
  amount: number;
  color: string;
  percentage: number;
  icon: string;
}



// Warna untuk kategori pengeluaran
const categoryColors = [
  theme.colors.primary[500],
  theme.colors.secondary[500],
  theme.colors.accent[500],
  theme.colors.danger[500],
  theme.colors.success[500],
  theme.colors.info[500],
  theme.colors.warning[500],
  theme.colors.neutral[500],
];

export const AnalyticsScreen = () => {
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]); // Untuk summary berdasarkan periode
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const { user } = useAuthStore();
  const [categoryMap, setCategoryMap] = useState<Record<string, { name: string, color: string, icon: string }>>({});
  const [rawCategoriesData, setRawCategoriesData] = useState<Array<{id: string, amount: number, percentage: number, index: number}>>([]);
  const [animatedValues] = useState({
    summary: new Animated.Value(0),
    categories: new Animated.Value(0),
    header: new Animated.Value(0),
    periodButtons: new Animated.Value(0),
  });

  // Refs untuk mencegah infinite loading dan throttling
  const lastFocusTime = useRef<number>(0);
  const categoriesLoaded = useRef<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Hook responsif untuk mendapatkan dimensi dan breakpoint
  const {
    width,
    responsiveFontSize,
    responsiveSpacing,
    isSmallDevice,
    isMediumDevice,
  } = useAppDimensions();

  // Fungsi untuk menghitung ukuran chart yang responsif
  const getResponsiveChartSizes = () => {
    const baseChartSize = Math.min(width * 0.6, 260); // Perbaikan: Ukuran yang lebih besar untuk visibility
    const centerSize = baseChartSize * 0.42; // 42% dari ukuran chart
    const fontSize = responsiveFontSize(isSmallDevice ? 12 : isMediumDevice ? 14 : 16);
    const lineHeight = fontSize * 1.3;

    return {
      chartSize: baseChartSize,
      centerSize: centerSize,
      centerRadius: centerSize / 2,
      fontSize: fontSize,
      lineHeight: lineHeight,
      padding: responsiveSpacing(isSmallDevice ? 8 : 12),
    };
  };

  // Fungsi untuk memuat kategori dengan useCallback untuk stabilitas
  const loadCategories = useCallback(async () => {
    // Hanya load sekali untuk mencegah infinite loop
    if (categoriesLoaded.current) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, color, icon')
        .eq('type', 'expense');

      if (error) throw error;

      if (data) {
        const newCategoryMap: Record<string, { name: string, color: string, icon: string }> = {};
        data.forEach((category, index) => {
          newCategoryMap[category.id] = {
            name: category.name,
            color: category.color || categoryColors[index % categoryColors.length],
            icon: category.icon || 'pricetag-outline'
          };
        });
        setCategoryMap(newCategoryMap);
        categoriesLoaded.current = true;
      }
    } catch (error) {
      setError('Gagal memuat kategori');
    }
  }, []);

  // Fungsi untuk menjalankan animasi terpisah
  const runAnimations = useCallback(() => {
    Animated.stagger(150, [
      Animated.timing(animatedValues.header, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValues.periodButtons, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValues.summary, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValues.categories, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [animatedValues]);

  // Fungsi untuk memuat data analisis (tanpa animasi dan categoryMap dependency)
  const loadAnalyticsData = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // Memuat kategori terlebih dahulu
      await loadCategories();

      // Mendapatkan SEMUA transaksi untuk konsistensi dengan Dashboard
      const { data: allTransactions, error: allError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (allError) throw allError;

      // Perbaikan: Hitung tanggal mulai berdasarkan periode yang dipilih dengan logika yang lebih akurat
      const today = new Date();
      const startDate = new Date();

      switch (selectedPeriod) {
        case 'weekly':
          // Ambil data 8 minggu terakhir untuk tren yang lebih baik
          startDate.setDate(today.getDate() - (8 * 7));
          break;
        case 'monthly':
          // Ambil data 6 bulan terakhir
          startDate.setMonth(today.getMonth() - 6);
          break;
        case 'yearly':
          // Perbaikan: Ambil data mulai dari awal tahun 2025 karena aplikasi baru dibuat 2025
          startDate.setFullYear(2025, 0, 1); // 1 Januari 2025
          break;
        default:
          startDate.setMonth(today.getMonth() - 6); // Default 6 bulan
      }

      // Filter transaksi berdasarkan periode untuk tren dan kategori
      const periodFilteredTransactions = allTransactions?.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= startDate && transactionDate <= today;
      }) || [];

      // Simpan filtered transactions untuk summary
      setFilteredTransactions(periodFilteredTransactions);

      const transactions = periodFilteredTransactions;

      if (transactions) {
        // Mengelompokkan transaksi berdasarkan kategori untuk kategori pengeluaran
        const expensesByCategory: Record<string, number> = {};
        let totalExpense = 0;

        transactions.forEach(transaction => {
          if (transaction.type === 'expense') {
            const categoryId = transaction.category_id;
            if (!expensesByCategory[categoryId]) {
              expensesByCategory[categoryId] = 0;
            }
            expensesByCategory[categoryId] += transaction.amount;
            totalExpense += transaction.amount;
          }
        });

        // Simpan data mentah untuk diproses nanti
        setRawCategoriesData(Object.keys(expensesByCategory).map((categoryId, index) => ({
          id: categoryId,
          amount: expensesByCategory[categoryId],
          percentage: totalExpense > 0 ? expensesByCategory[categoryId] / totalExpense : 0,
          index,
        })).sort((a, b) => b.amount - a.amount));



        // Jalankan animasi setelah data dimuat
        runAnimations();
      }
    } catch (error) {
      setError('Gagal memuat data analisis');
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedPeriod, loadCategories, runAnimations]);

  // Effect terpisah untuk load kategori sekali saat mount
  useEffect(() => {
    if (user && !categoriesLoaded.current) {
      loadCategories();
    }
  }, [user, loadCategories]);

  // Effect untuk memproses raw categories data dengan categoryMap
  useEffect(() => {
    if (rawCategoriesData.length > 0 && Object.keys(categoryMap).length > 0) {
      const processedCategories: ExpenseCategory[] = rawCategoriesData.map((item) => {
        const categoryInfo = categoryMap[item.id] || {
          name: 'Lainnya',
          color: categoryColors[item.index % categoryColors.length],
          icon: 'pricetag-outline'
        };

        return {
          id: item.id,
          name: categoryInfo.name,
          amount: item.amount,
          color: categoryInfo.color,
          percentage: item.percentage,
          icon: categoryInfo.icon,
        };
      });

      setExpenseCategories(processedCategories);
    }
  }, [rawCategoriesData, categoryMap]);

  // Effect untuk load data analisis saat user atau periode berubah
  useEffect(() => {
    if (user) {
      loadAnalyticsData();
    }
  }, [user, selectedPeriod, loadAnalyticsData]);

  // Refresh data ketika halaman difokuskan dengan throttling
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        const now = Date.now();
        // Hanya refresh jika sudah lebih dari 3 detik sejak focus terakhir
        if (now - lastFocusTime.current > 3000) {
          lastFocusTime.current = now;
          loadAnalyticsData();
        }
      }
    }, [user, loadAnalyticsData])
  );

  // Render periode buttons
  const renderPeriodButtons = () => (
    <Animated.View
      style={[
        styles.periodContainer,
        {
          opacity: animatedValues.periodButtons,
          transform: [{
            translateY: animatedValues.periodButtons.interpolate({
              inputRange: [0, 1],
              outputRange: [10, 0]
            })
          }]
        }
      ]}
    >
      <TouchableOpacity
        style={[
          styles.periodButton,
          selectedPeriod === 'weekly' && styles.activePeriodButton,
        ]}
        onPress={() => setSelectedPeriod('weekly')}
        activeOpacity={0.7}
      >
        {selectedPeriod === 'weekly' ? (
          <LinearGradient
            colors={[theme.colors.primary[400], theme.colors.primary[600]]}
            style={styles.gradientButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Typography
              variant="body2"
              weight="600"
              color={theme.colors.white}
            >
              Mingguan
            </Typography>
          </LinearGradient>
        ) : (
          <Typography
            variant="body2"
            weight="500"
            color={theme.colors.neutral[700]}
          >
            Mingguan
          </Typography>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.periodButton,
          selectedPeriod === 'monthly' && styles.activePeriodButton,
        ]}
        onPress={() => setSelectedPeriod('monthly')}
        activeOpacity={0.7}
      >
        {selectedPeriod === 'monthly' ? (
          <LinearGradient
            colors={[theme.colors.primary[400], theme.colors.primary[600]]}
            style={styles.gradientButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Typography
              variant="body2"
              weight="600"
              color={theme.colors.white}
            >
              Bulanan
            </Typography>
          </LinearGradient>
        ) : (
          <Typography
            variant="body2"
            weight="500"
            color={theme.colors.neutral[700]}
          >
            Bulanan
          </Typography>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.periodButton,
          selectedPeriod === 'yearly' && styles.activePeriodButton,
        ]}
        onPress={() => setSelectedPeriod('yearly')}
        activeOpacity={0.7}
      >
        {selectedPeriod === 'yearly' ? (
          <LinearGradient
            colors={[theme.colors.primary[400], theme.colors.primary[600]]}
            style={styles.gradientButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Typography
              variant="body2"
              weight="600"
              color={theme.colors.white}
            >
              Tahunan
            </Typography>
          </LinearGradient>
        ) : (
          <Typography
            variant="body2"
            weight="500"
            color={theme.colors.neutral[700]}
          >
            Tahunan
          </Typography>
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  // Render pie chart untuk kategori pengeluaran
  const renderExpenseCategoriesChart = () => {
    const chartSizes = getResponsiveChartSizes();

    return (
      <Animated.View style={{
        opacity: animatedValues.categories,
        transform: [{
          translateY: animatedValues.categories.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0]
          })
        }]
      }}>
        <Card style={styles.chartCard} elevation="lg">
          <View style={styles.cardHeader}>
            <Ionicons name="pie-chart" size={24} color={theme.colors.primary[500]} />
            <Typography variant="h5" color={theme.colors.primary[700]} weight="600" style={styles.chartTitle}>
              Pengeluaran per Kategori
            </Typography>
          </View>

          {expenseCategories.length > 0 ? (
            <View style={styles.pieChartContainer}>
              <View style={[styles.pieChart, {
                width: chartSizes.chartSize,
                height: chartSizes.chartSize
              }]}>
                {expenseCategories.map((category, index) => {
                  // Perbaikan: Hitung ukuran dengan algoritma yang lebih baik untuk menampilkan semua kategori
                  const minSize = chartSizes.chartSize * 0.25; // Minimum 25% dari chart
                  const maxSize = chartSizes.chartSize * 0.85; // Maximum 85% dari chart

                  // Gunakan logarithmic scaling untuk distribusi yang lebih baik
                  const logPercentage = Math.log(category.percentage * 100 + 1) / Math.log(101);
                  const sizeRange = maxSize - minSize;
                  const segmentSize = minSize + (sizeRange * logPercentage);

                  const offset = (chartSizes.chartSize - segmentSize) / 2;

                  return (
                    <View
                      key={category.id}
                      style={[
                        styles.pieChartSegment,
                        {
                          width: segmentSize,
                          height: segmentSize,
                          borderRadius: segmentSize / 2,
                          backgroundColor: category.color,
                          opacity: 0.95 - (index * 0.03), // Perbaikan: Opacity yang lebih subtle
                          top: offset,
                          left: offset,
                          zIndex: expenseCategories.length - index,
                        }
                      ]}
                    />
                  );
                })}
                <LinearGradient
                  colors={[theme.colors.white, theme.colors.neutral[50]]}
                  style={[styles.pieChartCenter, {
                    width: chartSizes.centerSize,
                    height: chartSizes.centerSize,
                    borderRadius: chartSizes.centerRadius,
                    padding: chartSizes.padding,
                  }]}
                >
                  <Typography
                    variant="body2"
                    color={theme.colors.neutral[700]}
                    weight="500"
                    style={{ fontSize: chartSizes.fontSize * 0.75 }}
                  >
                    Total
                  </Typography>
                  <Typography
                    variant="h5"
                    weight="700"
                    color={theme.colors.primary[600]}
                    style={[styles.totalAmount, {
                      fontSize: chartSizes.fontSize,
                      lineHeight: chartSizes.lineHeight,
                      marginTop: responsiveSpacing(2),
                      textAlign: 'center',
                    }]}
                    numberOfLines={2}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.8}
                  >
                    {formatCurrency(expenseCategories.reduce((sum, cat) => sum + cat.amount, 0))}
                  </Typography>
                </LinearGradient>
              </View>
            </View>
          ) : (
            <View style={styles.emptyChartContainer}>
              <Ionicons name="wallet-outline" size={48} color={theme.colors.neutral[400]} style={styles.emptyIcon} />
              <Typography variant="body1" color={theme.colors.neutral[600]} weight="500" style={{ textAlign: 'center' }}>
                Belum ada data pengeluaran
              </Typography>
              <Typography variant="body2" color={theme.colors.neutral[500]} style={{ textAlign: 'center', marginTop: theme.spacing.sm }}>
                Tambahkan transaksi pengeluaran untuk melihat analisis kategori
              </Typography>
            </View>
          )}

          {expenseCategories.length > 0 && (
            <View style={styles.legendContainer}>
              {expenseCategories.map(category => (
                <View key={category.id} style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendColor,
                      { backgroundColor: category.color },
                    ]}
                  >
                    <Ionicons
                      name={category.icon as keyof typeof Ionicons.glyphMap}
                      size={12}
                      color={theme.colors.white}
                    />
                  </View>
                  <View style={styles.legendText}>
                    <Typography variant="body2" weight="600" color={theme.colors.neutral[800]}>
                      {category.name}
                    </Typography>
                    <View style={styles.legendValueContainer}>
                      <Typography variant="body2" weight="600" color={theme.colors.primary[600]}>
                        {formatCurrency(category.amount)}
                      </Typography>
                      <Typography variant="caption" color={theme.colors.neutral[600]} style={styles.percentageText}>
                        ({(category.percentage * 100).toFixed(1)}%)
                      </Typography>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Card>
      </Animated.View>
    );
  };



  // Render summary
  const renderSummary = () => {
    // Perbaikan: Hitung total dari transaksi yang difilter berdasarkan periode yang dipilih
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpense = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const savings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? savings / totalIncome : 0;

    return (
      <Animated.View style={{
        opacity: animatedValues.summary,
        transform: [{
          translateY: animatedValues.summary.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0]
          })
        }]
      }}>
        <Card style={styles.summaryCard} elevation="lg">
          <LinearGradient
            colors={[theme.colors.primary[100], theme.colors.primary[50], theme.colors.white]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.summaryGradient}
          >
            <View style={styles.cardHeader}>
              <Ionicons name="stats-chart" size={24} color={theme.colors.primary[500]} />
              <Typography variant="h5" color={theme.colors.primary[700]} weight="600" style={styles.chartTitle}>
                Ringkasan Keuangan
              </Typography>
            </View>

            <View style={styles.summaryGrid}>
              {/* Pemasukan */}
              <View style={styles.summaryGridItem}>
                <LinearGradient
                  colors={[theme.colors.success[400], theme.colors.success[600]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.summaryIcon}
                >
                  <Ionicons name="arrow-up" size={24} color={theme.colors.white} />
                </LinearGradient>
                <View style={styles.summaryTextContainer}>
                  <Typography variant="body2" color={theme.colors.neutral[700]} weight="500">
                    Pemasukan
                  </Typography>
                  <Typography variant="h5" color={theme.colors.success[600]} weight="700" style={styles.summaryAmount}>
                    {formatCurrency(totalIncome)}
                  </Typography>
                </View>
              </View>

              {/* Pengeluaran */}
              <View style={styles.summaryGridItem}>
                <LinearGradient
                  colors={[theme.colors.danger[400], theme.colors.danger[600]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.summaryIcon}
                >
                  <Ionicons name="arrow-down" size={24} color={theme.colors.white} />
                </LinearGradient>
                <View style={styles.summaryTextContainer}>
                  <Typography variant="body2" color={theme.colors.neutral[700]} weight="500">
                    Pengeluaran
                  </Typography>
                  <Typography variant="h5" color={theme.colors.danger[600]} weight="700" style={styles.summaryAmount}>
                    {formatCurrency(totalExpense)}
                  </Typography>
                </View>
              </View>

              {/* Tabungan */}
              <View style={styles.summaryGridItem}>
                <LinearGradient
                  colors={[theme.colors.primary[400], theme.colors.primary[600]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.summaryIcon}
                >
                  <Ionicons name="wallet" size={24} color={theme.colors.white} />
                </LinearGradient>
                <View style={styles.summaryTextContainer}>
                  <Typography variant="body2" color={theme.colors.neutral[700]} weight="500">
                    Tabungan
                  </Typography>
                  <Typography variant="h5" color={theme.colors.primary[600]} weight="700" style={styles.summaryAmount}>
                    {formatCurrency(savings)}
                  </Typography>
                </View>
              </View>

              {/* Tingkat Tabungan */}
              <View style={styles.summaryGridItem}>
                <LinearGradient
                  colors={[theme.colors.info[400], theme.colors.info[600]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.summaryIcon}
                >
                  <Ionicons name="trending-up" size={24} color={theme.colors.white} />
                </LinearGradient>
                <View style={styles.summaryTextContainer}>
                  <Typography variant="body2" color={theme.colors.neutral[700]} weight="500">
                    Rasio Tabungan
                  </Typography>
                  <Typography variant="h5" color={theme.colors.info[600]} weight="700" style={styles.summaryAmount}>
                    {formatPercentage(savingsRate)}
                  </Typography>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Card>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left', 'top']}>
      <Animated.View
        style={[
          styles.headerContainer,
          {
            opacity: animatedValues.header,
            transform: [{
              translateY: animatedValues.header.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0]
              })
            }]
          }
        ]}
      >
        <View style={styles.header}>
          <Typography
            variant="h5"
            color={theme.colors.primary[500]}
            weight="700"
            style={styles.headerTitle}
          >
            Analisis
          </Typography>
        </View>
      </Animated.View>

      {renderPeriodButtons()}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={theme.colors.primary[500]} />
            <Typography variant="body1" color={theme.colors.primary[600]} style={styles.loadingText}>
              Memuat data analisis...
            </Typography>
          </View>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <View style={styles.errorContent}>
            <Ionicons name="alert-circle-outline" size={48} color={theme.colors.danger[500]} />
            <Typography variant="h6" color={theme.colors.danger[600]} style={styles.errorTitle}>
              Terjadi Kesalahan
            </Typography>
            <Typography variant="body2" color={theme.colors.neutral[600]} style={styles.errorMessage}>
              {error}
            </Typography>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setError(null);
                categoriesLoaded.current = false;
                loadAnalyticsData();
              }}
            >
              <Typography variant="body2" color={theme.colors.primary[600]} weight="600">
                Coba Lagi
              </Typography>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
        >
          {renderSummary()}
          {renderExpenseCategoriesChart()}
        </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
    backgroundColor: theme.colors.white,
    ...theme.elevation.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.layout.sm,
    paddingTop: theme.spacing.layout.xs,
    paddingBottom: theme.spacing.layout.sm,
  },
  headerTitle: {
    textAlign: 'center',
    fontSize: 20,
    lineHeight: 24,
  },
  periodContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.layout.sm,
    paddingVertical: theme.spacing.md,
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
    marginBottom: theme.spacing.md,
    ...theme.elevation.xs,
  },
  periodButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.neutral[100],
    marginHorizontal: theme.spacing.sm,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.elevation.xs,
  },
  activePeriodButton: {
    backgroundColor: 'transparent',
    ...theme.elevation.sm,
  },
  gradientButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.round,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.elevation.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral[50],
  },
  loadingContent: {
    padding: theme.spacing.layout.md,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.elevation.md,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral[50],
    padding: theme.spacing.layout.md,
  },
  errorContent: {
    padding: theme.spacing.layout.md,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 300,
    ...theme.elevation.md,
  },
  errorTitle: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  errorMessage: {
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },
  retryButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary[500],
    backgroundColor: theme.colors.primary[50],
  },
  scrollContent: {
    padding: theme.spacing.layout.sm,
    paddingBottom: theme.spacing.layout.lg,
  },
  scrollView: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  chartCard: {
    padding: theme.spacing.layout.sm,
    marginBottom: theme.spacing.layout.sm,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.white,
  },
  summaryCard: {
    padding: 0,
    marginBottom: theme.spacing.layout.sm,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  summaryGradient: {
    padding: theme.spacing.layout.sm,
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  summaryAmount: {
    marginTop: theme.spacing.xs,
    fontSize: 20,
    lineHeight: 24,
  },
  chartTitle: {
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  pieChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: theme.spacing.layout.sm,
  },
  pieChart: {
    // Ukuran akan diatur secara dinamis melalui inline styles
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pieChartSegment: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: theme.colors.white,
    ...theme.elevation.sm,
  },
  pieChartCenter: {
    // Ukuran akan diatur secara dinamis melalui inline styles
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.elevation.md,
    shadowColor: theme.colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    zIndex: 10,
  },
  totalAmount: {
    // Font size dan line height akan diatur secara dinamis melalui inline styles
    fontWeight: '700',
  },
  emptyChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 280,
    backgroundColor: theme.colors.neutral[50],
    borderRadius: theme.borderRadius.lg,
    marginVertical: theme.spacing.md,
    padding: theme.spacing.layout.md,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    borderStyle: 'dashed',
  },
  emptyIcon: {
    marginBottom: theme.spacing.md,
  },
  emptyChartIconContainer: {
    marginBottom: theme.spacing.lg,
  },
  emptyChartIconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.elevation.xs,
  },

  legendContainer: {
    marginTop: theme.spacing.layout.xs,
    backgroundColor: theme.colors.neutral[50],
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  legendColor: {
    width: 24,
    height: 24,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.elevation.xs,
  },
  legendText: {
    flex: 1,
    flexDirection: 'column',
  },
  legendValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  percentageText: {
    marginLeft: theme.spacing.sm,
  },

  // Styles lama (tetap dipertahankan untuk kompatibilitas)
  summaryRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  summaryItem: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  summaryIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
    elevation: 2,
    shadowColor: theme.colors.neutral[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  // Styles baru untuk layout grid
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -theme.spacing.xs,
  },
  summaryGridItem: {
    width: '50%',
    paddingHorizontal: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  summaryTextContainer: {
    marginTop: theme.spacing.xs,
    paddingLeft: 4,
  },
});
