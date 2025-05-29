import React, { useState, useEffect } from 'react';
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

// Tipe data untuk kategori pengeluaran
interface ExpenseCategory {
  id: string;
  name: string;
  amount: number;
  color: string;
  percentage: number;
  icon: string;
}

// Tipe data untuk tren pengeluaran
interface ExpenseTrend {
  month: string;
  income: number;
  expense: number;
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
  const [expenseTrends, setExpenseTrends] = useState<ExpenseTrend[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]); // Untuk summary
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const { user } = useAuthStore();
  const [categoryMap, setCategoryMap] = useState<Record<string, { name: string, color: string, icon: string }>>({});
  const [animatedValues] = useState({
    summary: new Animated.Value(0),
    categories: new Animated.Value(0),
    trends: new Animated.Value(0),
    header: new Animated.Value(0),
    periodButtons: new Animated.Value(0),
  });

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
    const baseChartSize = Math.min(width * 0.55, 240); // Maksimal 240px, minimal 55% dari lebar layar
    const centerSize = baseChartSize * 0.41; // 41% dari ukuran chart
    const fontSize = responsiveFontSize(isSmallDevice ? 14 : isMediumDevice ? 16 : 18);
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

  // Fungsi untuk memuat kategori
  const loadCategories = async () => {
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
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // Fungsi untuk memuat data analisis
  const loadAnalyticsData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Memuat kategori terlebih dahulu
      await loadCategories();

      // Mendapatkan SEMUA transaksi untuk konsistensi dengan Dashboard
      const { data: allTransactions, error: allError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (allError) throw allError;

      // Simpan semua transaksi untuk summary
      setAllTransactions(allTransactions || []);

      // Hitung tanggal mulai berdasarkan periode yang dipilih untuk tren dan kategori
      const today = new Date();
      let startDate = new Date();

      switch (selectedPeriod) {
        case 'weekly':
          startDate.setDate(today.getDate() - 7);
          break;
        case 'monthly':
          startDate.setMonth(today.getMonth() - 1);
          break;
        case 'yearly':
          startDate.setFullYear(today.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(today.getMonth() - 6); // Default 6 bulan
      }

      // Filter transaksi berdasarkan periode untuk tren dan kategori
      const filteredTransactions = allTransactions?.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= startDate;
      }) || [];

      const transactions = filteredTransactions;

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

        // Membuat data kategori pengeluaran
        const categories: ExpenseCategory[] = Object.keys(expensesByCategory).map((categoryId, index) => {
          const amount = expensesByCategory[categoryId];
          const percentage = totalExpense > 0 ? amount / totalExpense : 0;
          const categoryInfo = categoryMap[categoryId] || {
            name: 'Lainnya',
            color: categoryColors[index % categoryColors.length],
            icon: 'pricetag-outline'
          };

          return {
            id: categoryId,
            name: categoryInfo.name,
            amount,
            color: categoryInfo.color,
            percentage,
            icon: categoryInfo.icon,
          };
        }).sort((a, b) => b.amount - a.amount); // Urutkan berdasarkan jumlah terbesar

        // Mengelompokkan transaksi berdasarkan periode untuk tren pengeluaran
        const trendsByPeriod: Record<string, { income: number, expense: number }> = {};
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

        // Inisialisasi periode berdasarkan selectedPeriod
        const today = new Date();
        let periodCount = 6;
        let periodUnit = 'month';

        switch (selectedPeriod) {
          case 'weekly':
            periodCount = 7;
            periodUnit = 'week';
            break;
          case 'monthly':
            periodCount = 6;
            periodUnit = 'month';
            break;
          case 'yearly':
            periodCount = 5;
            periodUnit = 'year';
            break;
        }

        // Inisialisasi periode
        for (let i = periodCount - 1; i >= 0; i--) {
          let periodKey = '';
          const date = new Date(today);

          if (periodUnit === 'week') {
            date.setDate(today.getDate() - (i * 7));
            periodKey = `Minggu ${periodCount - i}`;
          } else if (periodUnit === 'month') {
            date.setMonth(today.getMonth() - i);
            periodKey = months[date.getMonth()];
          } else if (periodUnit === 'year') {
            date.setFullYear(today.getFullYear() - i);
            periodKey = date.getFullYear().toString();
          }

          trendsByPeriod[periodKey] = { income: 0, expense: 0 };
        }

        transactions.forEach(transaction => {
          const date = new Date(transaction.date);
          let periodKey = '';

          if (periodUnit === 'week') {
            const weeksDiff = Math.floor((today.getTime() - date.getTime()) / (7 * 24 * 60 * 60 * 1000));
            if (weeksDiff < periodCount) {
              periodKey = `Minggu ${periodCount - weeksDiff}`;
            }
          } else if (periodUnit === 'month') {
            periodKey = months[date.getMonth()];
          } else if (periodUnit === 'year') {
            periodKey = date.getFullYear().toString();
          }

          if (trendsByPeriod[periodKey]) {
            if (transaction.type === 'income') {
              trendsByPeriod[periodKey].income += transaction.amount;
            } else {
              trendsByPeriod[periodKey].expense += transaction.amount;
            }
          }
        });

        // Membuat data tren pengeluaran
        const trends: ExpenseTrend[] = Object.keys(trendsByPeriod).map(period => ({
          month: period,
          income: trendsByPeriod[period].income,
          expense: trendsByPeriod[period].expense,
        }));

        setExpenseCategories(categories);
        setExpenseTrends(trends);

        // Animasi komponen
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
          Animated.timing(animatedValues.trends, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Memuat data analisis saat komponen dimount atau user berubah
  useEffect(() => {
    if (user) {
      loadAnalyticsData();
    }
  }, [user, selectedPeriod]);

  // Refresh data ketika halaman difokuskan (misalnya setelah menambah transaksi)
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        loadAnalyticsData();
      }
    }, [user, selectedPeriod])
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
                  // Hitung ukuran berdasarkan persentase dengan ukuran responsif
                  const baseSize = chartSizes.chartSize * 0.73; // 73% dari ukuran chart
                  const sizeMultiplier = Math.sqrt(category.percentage);
                  const segmentSize = Math.max(baseSize * sizeMultiplier, chartSizes.chartSize * 0.18); // Minimum 18% dari chart
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
                          opacity: 0.9 - (index * 0.05),
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
                      name={category.icon as any}
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

  // Render bar chart untuk tren pengeluaran
  const renderExpenseTrendsChart = () => {
    // Cek apakah ada data yang tidak kosong
    const hasData = expenseTrends.length > 0 && expenseTrends.some(trend => trend.income > 0 || trend.expense > 0);
    const maxValue = Math.max(
      ...expenseTrends.map(trend => Math.max(trend.income, trend.expense)),
      1 // Minimum value untuk menghindari pembagian dengan 0
    );

    return (
      <Animated.View style={{
        opacity: animatedValues.trends,
        transform: [{
          translateY: animatedValues.trends.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0]
          })
        }]
      }}>
        <Card style={styles.chartCard} elevation="lg">
          <View style={styles.cardHeader}>
            <Ionicons name="bar-chart" size={24} color={theme.colors.primary[500]} />
            <Typography variant="h5" color={theme.colors.primary[700]} weight="600" style={styles.chartTitle}>
              Tren Pemasukan & Pengeluaran
            </Typography>
          </View>

          {hasData ? (
            <View style={styles.barChartContainer}>
              <View style={styles.barChartHeader}>
                <View style={styles.barAxisLabels}>
                  <Typography variant="caption" color={theme.colors.neutral[600]} weight="500">
                    Rp
                  </Typography>
                </View>
              </View>
              <View style={styles.barChart}>
                {expenseTrends.map((trend, index) => {
                  // Hitung tinggi bar, jika 0 maka tidak tampil
                  const incomeHeight = trend.income > 0 ? Math.max((trend.income / maxValue) * 150, 8) : 0;
                  const expenseHeight = trend.expense > 0 ? Math.max((trend.expense / maxValue) * 150, 8) : 0;

                  return (
                    <Animated.View
                      key={index}
                      style={styles.barGroup}
                    >
                      <View style={styles.barPair}>
                        <View style={styles.barContainer}>
                          {incomeHeight > 0 && (
                            <LinearGradient
                              colors={[theme.colors.success[300], theme.colors.success[600]]}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 0, y: 1 }}
                              style={[
                                styles.bar,
                                {
                                  height: incomeHeight,
                                }
                              ]}
                            />
                          )}
                        </View>
                        <View style={styles.barContainer}>
                          {expenseHeight > 0 && (
                            <LinearGradient
                              colors={[theme.colors.danger[300], theme.colors.danger[600]]}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 0, y: 1 }}
                              style={[
                                styles.bar,
                                {
                                  height: expenseHeight,
                                }
                              ]}
                            />
                          )}
                        </View>
                      </View>
                      <View style={styles.barLabelContainer}>
                        <Typography variant="caption" color={theme.colors.neutral[700]} weight="500">
                          {trend.month}
                        </Typography>
                      </View>
                    </Animated.View>
                  );
                })}
              </View>
            </View>
          ) : (
            <View style={styles.emptyChartContainer}>
              <View style={styles.emptyChartIconContainer}>
                <LinearGradient
                  colors={[theme.colors.neutral[100], theme.colors.neutral[50]]}
                  style={styles.emptyChartIconBackground}
                >
                  <Ionicons name="analytics-outline" size={48} color={theme.colors.neutral[400]} />
                </LinearGradient>
              </View>
              <Typography variant="h6" color={theme.colors.neutral[700]} weight="600" style={{ textAlign: 'center', marginBottom: theme.spacing.xs }}>
                Belum Ada Data Transaksi
              </Typography>
              <Typography variant="body2" color={theme.colors.neutral[500]} style={{ textAlign: 'center', lineHeight: 20 }}>
                Mulai tambahkan transaksi pemasukan dan pengeluaran untuk melihat tren keuangan Anda
              </Typography>
              <View style={styles.emptyChartPlaceholder}>
                <View style={styles.placeholderBars}>
                  {['Des', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei'].map((month) => (
                    <View key={month} style={styles.placeholderBarGroup}>
                      <View style={styles.placeholderBarPair}>
                        <View style={[styles.placeholderBar, styles.placeholderIncomeBar]} />
                        <View style={[styles.placeholderBar, styles.placeholderExpenseBar]} />
                      </View>
                      <Typography variant="caption" color={theme.colors.neutral[400]} style={styles.placeholderLabel}>
                        {month}
                      </Typography>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          <View style={styles.barLegendContainer}>
            <View style={styles.barLegendItem}>
              <LinearGradient
                colors={[theme.colors.success[300], theme.colors.success[600]]}
                style={styles.barLegendColor}
              />
              <Typography variant="body2" weight="600" color={theme.colors.neutral[800]}>
                Pemasukan
              </Typography>
            </View>

            <View style={styles.barLegendItem}>
              <LinearGradient
                colors={[theme.colors.danger[300], theme.colors.danger[600]]}
                style={styles.barLegendColor}
              />
              <Typography variant="body2" weight="600" color={theme.colors.neutral[800]}>
                Pengeluaran
              </Typography>
            </View>
          </View>
        </Card>
      </Animated.View>
    );
  };

  // Render summary
  const renderSummary = () => {
    // Hitung total dari SEMUA transaksi (seperti Dashboard)
    const totalIncome = allTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpense = allTransactions
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
    <SafeAreaView style={styles.container}>
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
            variant="h3"
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
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {renderSummary()}
          {renderExpenseCategoriesChart()}
          {renderExpenseTrendsChart()}
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
    padding: theme.spacing.layout.sm,
    paddingTop: theme.spacing.layout.xs,
    paddingBottom: theme.spacing.layout.sm,
  },
  headerTitle: {
    textAlign: 'left',
    paddingLeft: theme.spacing.sm,
    fontSize: 28,
    lineHeight: 34,
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
  scrollContent: {
    padding: theme.spacing.layout.sm,
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
  emptyChartPlaceholder: {
    marginTop: theme.spacing.lg,
    width: '100%',
    alignItems: 'center',
  },
  placeholderBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 80,
    width: '100%',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    ...theme.elevation.xs,
  },
  placeholderBarGroup: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    flex: 1,
  },
  placeholderBarPair: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: '80%',
    width: '100%',
  },
  placeholderBar: {
    width: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    marginHorizontal: 2,
    opacity: 0.3,
  },
  placeholderIncomeBar: {
    height: 20,
    backgroundColor: theme.colors.success[300],
  },
  placeholderExpenseBar: {
    height: 15,
    backgroundColor: theme.colors.danger[300],
  },
  placeholderLabel: {
    marginTop: theme.spacing.xs,
    textAlign: 'center',
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
  barChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: theme.spacing.layout.sm,
    height: 250,
  },
  barChartHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    width: '100%',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  barAxisLabels: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: '90%',
    width: '100%',
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.neutral[50],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  barGroup: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    flex: 1,
  },
  barLabelContainer: {
    marginTop: theme.spacing.sm,
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  barPair: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: '90%',
    width: '100%',
  },
  barContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    width: 24,
    marginHorizontal: 4,
  },
  bar: {
    width: '100%',
    minHeight: 5,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    ...theme.elevation.xs,
  },
  barLegendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.neutral[50],
    padding: theme.spacing.md,
    borderRadius: theme.spacing.md,
  },
  barLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.md,
  },
  barLegendColor: {
    width: 18,
    height: 18,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.sm,
    ...theme.elevation.xs,
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
