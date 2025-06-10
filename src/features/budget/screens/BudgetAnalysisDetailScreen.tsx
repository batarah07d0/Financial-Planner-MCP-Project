import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography, Card, SuperiorDialog } from '../../../core/components';
import { theme } from '../../../core/theme';
import { formatCurrency, formatDate } from '../../../core/utils';
import { useSuperiorDialog } from '../../../core/hooks';
// import { useAppDimensions } from '../../../core/hooks/useAppDimensions';
import { getBudgetById, getBudgetSpending } from '../../../core/services/supabase/budget.service';
import { getCategories } from '../../../core/services/supabase/category.service';
import { getTransactions } from '../../../core/services/supabase/transaction.service';
import { useAuthStore } from '../../../core/services/store/authStore';
import { Budget, Category, Transaction } from '../../../core/services/supabase/types';
import { RootStackParamList } from '../../../core/navigation/types';

// const { width: screenWidth } = Dimensions.get('window');

type BudgetAnalysisDetailRouteProp = RouteProp<{ BudgetAnalysisDetail: { budgetId: string; categoryId: string } }, 'BudgetAnalysisDetail'>;
type BudgetAnalysisDetailNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface AnalysisData {
  totalSpent: number;
  transactionCount: number;
  averageTransaction: number;
  dailyAverage: number;
  weeklyTrend: Array<{ day: string; amount: number }>;
  monthlyTrend: Array<{ month: string; amount: number }>;
  categoryBreakdown: Array<{ category: string; amount: number; percentage: number }>;
  spendingPattern: {
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
  };
  topTransactions: Transaction[];
  insights: string[];
}

export const BudgetAnalysisDetailScreen = () => {
  const navigation = useNavigation<BudgetAnalysisDetailNavigationProp>();
  const route = useRoute<BudgetAnalysisDetailRouteProp>();
  const { budgetId, categoryId } = route.params;

  const [, setBudget] = useState<Budget | null>(null);
  const [, setCategory] = useState<Category | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  const { user } = useAuthStore();
  const { showError, dialogState, hideDialog } = useSuperiorDialog();
  // const { responsiveSpacing, responsiveFontSize, isSmallDevice } = useAppDimensions();

  // Process raw transaction data into analysis insights
  const processAnalysisData = useCallback((transactions: Transaction[], totalSpent: number, period: string): AnalysisData => {
    const transactionCount = transactions.length;
    const averageTransaction = transactionCount > 0 ? totalSpent / transactionCount : 0;

    const periodDays = period === 'week' ? 7 : period === 'month' ? 30 : 365;
    const dailyAverage = totalSpent / periodDays;

    // Weekly trend (last 7 days)
    const weeklyTrend = generateWeeklyTrend(transactions);

    // Monthly trend (last 12 months)
    const monthlyTrend = generateMonthlyTrend(transactions);

    // Spending pattern by time of day
    const spendingPattern = analyzeSpendingPattern(transactions);

    // Top transactions
    const topTransactions = transactions
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Generate insights
    const insights = generateInsights(transactions, totalSpent, averageTransaction, dailyAverage);

    return {
      totalSpent,
      transactionCount,
      averageTransaction,
      dailyAverage,
      weeklyTrend,
      monthlyTrend,
      categoryBreakdown: [], // Will be implemented if needed
      spendingPattern,
      topTransactions,
      insights,
    };
  }, []);

  // Load analysis data
  const loadAnalysisData = useCallback(async () => {
    try {
      if (!user?.id) return;

      setIsLoading(true);

      // Get budget details
      const budgetData = await getBudgetById(budgetId);
      setBudget(budgetData);

      // Get category data
      const categories = await getCategories({ type: 'expense' });
      const categoryData = categories.find(cat => cat.id === categoryId);
      setCategory(categoryData || null);

      // Calculate date range based on selected period
      const now = new Date();
      let startDate = '';
      const endDate = now.toISOString().split('T')[0];

      if (selectedPeriod === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = weekAgo.toISOString().split('T')[0];
      } else if (selectedPeriod === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate = monthAgo.toISOString().split('T')[0];
      } else {
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        startDate = yearAgo.toISOString().split('T')[0];
      }

      // Get spending data
      const totalSpent = await getBudgetSpending(user.id, categoryId, startDate, endDate);

      // Get all transactions for analysis
      const transactions = await getTransactions(user.id, {
        categoryId,
        type: 'expense',
        startDate,
        endDate,
        limit: 1000, // Get more data for analysis
      });

      // Process analysis data
      const analysis = processAnalysisData(transactions, totalSpent, selectedPeriod);
      setAnalysisData(analysis);

    } catch (error) {
      showError('Error', 'Gagal memuat data analisis');
    } finally {
      setIsLoading(false);
    }
  }, [budgetId, categoryId, user?.id, selectedPeriod, showError, processAnalysisData]);

  // Generate weekly trend data
  const generateWeeklyTrend = (transactions: Transaction[]) => {
    const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    const weekData = days.map(day => ({ day, amount: 0 }));

    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const dayIndex = (date.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
      weekData[dayIndex].amount += transaction.amount;
    });

    return weekData;
  };

  // Generate monthly trend data
  const generateMonthlyTrend = (transactions: Transaction[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthData = months.map(month => ({ month, amount: 0 }));

    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthIndex = date.getMonth();
      monthData[monthIndex].amount += transaction.amount;
    });

    return monthData.filter(item => item.amount > 0);
  };

  // Analyze spending pattern by time of day
  const analyzeSpendingPattern = (transactions: Transaction[]) => {
    const pattern = { morning: 0, afternoon: 0, evening: 0, night: 0 };

    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const hour = date.getHours();

      if (hour >= 6 && hour < 12) pattern.morning += transaction.amount;
      else if (hour >= 12 && hour < 18) pattern.afternoon += transaction.amount;
      else if (hour >= 18 && hour < 22) pattern.evening += transaction.amount;
      else pattern.night += transaction.amount;
    });

    return pattern;
  };

  // Generate insights based on spending data
  const generateInsights = (transactions: Transaction[], totalSpent: number, avgTransaction: number, dailyAvg: number): string[] => {
    const insights: string[] = [];

    // Transaction frequency insight
    if (transactions.length > 20) {
      insights.push('Anda memiliki frekuensi transaksi yang tinggi. Pertimbangkan untuk mengelompokkan pembelian kecil.');
    }

    // Average transaction insight
    if (avgTransaction > 100000) {
      insights.push('Rata-rata transaksi Anda cukup besar. Pastikan setiap pengeluaran sudah direncanakan dengan baik.');
    }

    // Daily spending insight
    if (dailyAvg > 50000) {
      insights.push('Pengeluaran harian Anda di atas rata-rata. Coba buat target harian yang lebih ketat.');
    }

    // Weekend vs weekday analysis
    const weekendSpending = transactions.filter(t => {
      const day = new Date(t.date).getDay();
      return day === 0 || day === 6;
    }).reduce((sum, t) => sum + t.amount, 0);

    const weekdaySpending = totalSpent - weekendSpending;
    if (weekendSpending > weekdaySpending) {
      insights.push('Pengeluaran weekend Anda lebih tinggi dari hari kerja. Pertimbangkan aktivitas weekend yang lebih hemat.');
    }

    return insights;
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAnalysisData();
    setIsRefreshing(false);
  };

  // Handle back navigation
  const handleBack = () => {
    navigation.goBack();
  };

  // Format date helper
  const formatDateHelper = (dateString: string) => {
    return formatDate(dateString, { format: 'short' });
  };

  useEffect(() => {
    loadAnalysisData();
  }, [loadAnalysisData]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          <Typography variant="body1" color={theme.colors.neutral[600]} style={styles.loadingText}>
            Memuat analisis detail...
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary[500]} />
        </TouchableOpacity>
        
        <Typography variant="h5" weight="700" color={theme.colors.primary[500]} style={styles.headerTitle}>
          Analisis Detail
        </Typography>
        
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[theme.colors.primary[500]]} />
        }
      >
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['week', 'month', 'year'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Typography
                variant="body2"
                weight={selectedPeriod === period ? '600' : '400'}
                color={selectedPeriod === period ? theme.colors.primary[600] : theme.colors.neutral[600]}
              >
                {period === 'week' ? 'Minggu' : period === 'month' ? 'Bulan' : 'Tahun'}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Cards */}
        {analysisData && (
          <>
            <View style={styles.summaryGrid}>
              <Card style={styles.summaryCard}>
                <Typography variant="caption" color={theme.colors.neutral[600]}>Total Pengeluaran</Typography>
                <Typography variant="h5" weight="700" color={theme.colors.primary[600]}>
                  {formatCurrency(analysisData.totalSpent)}
                </Typography>
              </Card>

              <Card style={styles.summaryCard}>
                <Typography variant="caption" color={theme.colors.neutral[600]}>Jumlah Transaksi</Typography>
                <Typography variant="h5" weight="700" color={theme.colors.success[600]}>
                  {analysisData.transactionCount}
                </Typography>
              </Card>
            </View>

            <View style={styles.summaryGrid}>
              <Card style={styles.summaryCard}>
                <Typography variant="caption" color={theme.colors.neutral[600]}>Rata-rata Transaksi</Typography>
                <Typography variant="h6" weight="600" color={theme.colors.warning[600]}>
                  {formatCurrency(analysisData.averageTransaction)}
                </Typography>
              </Card>

              <Card style={styles.summaryCard}>
                <Typography variant="caption" color={theme.colors.neutral[600]}>Rata-rata Harian</Typography>
                <Typography variant="h6" weight="600" color={theme.colors.info[600]}>
                  {formatCurrency(analysisData.dailyAverage)}
                </Typography>
              </Card>
            </View>

            {/* Weekly Trend Chart */}
            <Card style={styles.chartCard}>
              <Typography variant="h6" weight="700" color={theme.colors.neutral[800]} style={styles.chartTitle}>
                Tren Mingguan
              </Typography>
              <View style={styles.chartContainer}>
                {analysisData.weeklyTrend.map((item, index) => {
                  const maxAmount = Math.max(...analysisData.weeklyTrend.map(d => d.amount));
                  const height = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;

                  return (
                    <View key={index} style={styles.barContainer}>
                      <View style={styles.barWrapper}>
                        <LinearGradient
                          colors={[theme.colors.primary[400], theme.colors.primary[600]]}
                          style={[styles.bar, { height: `${height}%` }]}
                        />
                      </View>
                      <Typography variant="caption" color={theme.colors.neutral[600]} style={styles.barLabel}>
                        {item.day}
                      </Typography>
                      <Typography variant="caption" color={theme.colors.neutral[500]} style={styles.barValue}>
                        {formatCurrency(item.amount)}
                      </Typography>
                    </View>
                  );
                })}
              </View>
            </Card>

            {/* Spending Pattern */}
            <Card style={styles.chartCard}>
              <Typography variant="h6" weight="700" color={theme.colors.neutral[800]} style={styles.chartTitle}>
                Pola Pengeluaran Harian
              </Typography>
              <View style={styles.patternContainer}>
                {Object.entries(analysisData.spendingPattern).map(([period, amount], index) => {
                  const total = Object.values(analysisData.spendingPattern).reduce((sum, val) => sum + val, 0);
                  const percentage = total > 0 ? (amount / total) * 100 : 0;
                  const periodLabels = {
                    morning: 'Pagi (06-12)',
                    afternoon: 'Siang (12-18)',
                    evening: 'Sore (18-22)',
                    night: 'Malam (22-06)'
                  };
                  const colors = [
                    theme.colors.warning[500],
                    theme.colors.info[500],
                    theme.colors.success[500],
                    theme.colors.secondary[500]
                  ];

                  return (
                    <View key={period} style={styles.patternItem}>
                      <View style={styles.patternHeader}>
                        <View style={[styles.patternDot, { backgroundColor: colors[index] }]} />
                        <Typography variant="body2" weight="600" color={theme.colors.neutral[700]}>
                          {periodLabels[period as keyof typeof periodLabels]}
                        </Typography>
                      </View>
                      <View style={styles.patternBar}>
                        <LinearGradient
                          colors={[colors[index], `${colors[index]}80`]}
                          style={[styles.patternFill, { width: `${percentage}%` }]}
                        />
                      </View>
                      <Typography variant="caption" color={theme.colors.neutral[600]}>
                        {formatCurrency(amount)} ({percentage.toFixed(1)}%)
                      </Typography>
                    </View>
                  );
                })}
              </View>
            </Card>

            {/* Top Transactions */}
            <Card style={styles.chartCard}>
              <Typography variant="h6" weight="700" color={theme.colors.neutral[800]} style={styles.chartTitle}>
                Transaksi Terbesar
              </Typography>
              <View style={styles.transactionsList}>
                {analysisData.topTransactions.map((transaction, index) => (
                  <View key={transaction.id} style={styles.transactionItem}>
                    <View style={styles.transactionRank}>
                      <Typography variant="caption" weight="700" color={theme.colors.primary[600]}>
                        #{index + 1}
                      </Typography>
                    </View>
                    <View style={styles.transactionInfo}>
                      <Typography variant="body2" weight="600" color={theme.colors.neutral[800]}>
                        {transaction.description || 'Transaksi'}
                      </Typography>
                      <Typography variant="caption" color={theme.colors.neutral[600]}>
                        {formatDateHelper(transaction.date)}
                      </Typography>
                    </View>
                    <Typography variant="body2" weight="700" color={theme.colors.danger[600]}>
                      {formatCurrency(transaction.amount)}
                    </Typography>
                  </View>
                ))}
              </View>
            </Card>

            {/* Insights */}
            <Card style={styles.chartCard}>
              <Typography variant="h6" weight="700" color={theme.colors.neutral[800]} style={styles.chartTitle}>
                Insight & Rekomendasi
              </Typography>
              <View style={styles.insightsList}>
                {analysisData.insights.map((insight, index) => (
                  <View key={index} style={styles.insightItem}>
                    <Ionicons name="bulb" size={20} color={theme.colors.warning[500]} />
                    <Typography variant="body2" color={theme.colors.neutral[700]} style={styles.insightText}>
                      {insight}
                    </Typography>
                  </View>
                ))}
                {analysisData.insights.length === 0 && (
                  <View style={styles.noInsights}>
                    <Ionicons name="checkmark-circle" size={32} color={theme.colors.success[500]} />
                    <Typography variant="body2" color={theme.colors.neutral[600]} style={styles.noInsightsText}>
                      Pola pengeluaran Anda terlihat sehat! Pertahankan kebiasaan baik ini.
                    </Typography>
                  </View>
                )}
              </View>
            </Card>
          </>
        )}
      </ScrollView>

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.layout.sm,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
    minHeight: 64,
    ...theme.elevation.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.layout.sm,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
    ...theme.elevation.sm,
  },
  periodButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: theme.colors.primary[100],
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  summaryCard: {
    flex: 1,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  chartCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.elevation.sm,
  },
  chartTitle: {
    marginBottom: theme.spacing.md,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
    paddingHorizontal: theme.spacing.sm,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    height: 80,
    width: 20,
    justifyContent: 'flex-end',
    marginBottom: theme.spacing.xs,
  },
  bar: {
    width: '100%',
    borderRadius: theme.borderRadius.sm,
    minHeight: 2,
  },
  barLabel: {
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  barValue: {
    marginTop: 2,
    textAlign: 'center',
    fontSize: 10,
  },
  patternContainer: {
    gap: theme.spacing.md,
  },
  patternItem: {
    marginBottom: theme.spacing.sm,
  },
  patternHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  patternDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.sm,
  },
  patternBar: {
    height: 8,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: 4,
    marginBottom: theme.spacing.xs,
    overflow: 'hidden',
  },
  patternFill: {
    height: '100%',
    borderRadius: 4,
  },
  transactionsList: {
    gap: theme.spacing.sm,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[100],
  },
  transactionRank: {
    width: 30,
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  transactionInfo: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  insightsList: {
    gap: theme.spacing.md,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  insightText: {
    flex: 1,
    lineHeight: 20,
  },
  noInsights: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  noInsightsText: {
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
});
