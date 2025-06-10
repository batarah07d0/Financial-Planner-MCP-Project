import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Typography, SuperiorDialog } from '../../../core/components';
import { theme } from '../../../core/theme';
import { formatCurrency, formatDate, formatPercentage, getCategoryIcon, getCategoryColor } from '../../../core/utils';
import { useSuperiorDialog } from '../../../core/hooks';
import { useAppDimensions } from '../../../core/hooks/useAppDimensions';
import { useSensitiveActionAuth } from '../../../core/hooks/useSensitiveActionAuth';
import { getBudgetById, deleteBudget, getBudgetSpending } from '../../../core/services/supabase/budget.service';
import { getCategories } from '../../../core/services/supabase/category.service';
import { getTransactions } from '../../../core/services/supabase/transaction.service';
import { useAuthStore } from '../../../core/services/store/authStore';
import { useBudgetStore } from '../../../core/services/store/budgetStore';
import { Budget, Category, Transaction } from '../../../core/services/supabase/types';
import { RootStackParamList } from '../../../core/navigation/types';

type BudgetDetailRouteProp = RouteProp<{ BudgetDetail: { id: string } }, 'BudgetDetail'>;
type BudgetDetailNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const BudgetDetailScreen = () => {
  const navigation = useNavigation<BudgetDetailNavigationProp>();
  const route = useRoute<BudgetDetailRouteProp>();
  const { id: budgetId } = route.params;

  const [budget, setBudget] = useState<Budget | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [spent, setSpent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { user } = useAuthStore();
  const { deleteBudget: deleteBudgetFromStore } = useBudgetStore();
  const { showSuccess, showError, showConfirm, dialogState, hideDialog } = useSuperiorDialog();
  const { responsiveSpacing, responsiveFontSize, isSmallDevice } = useAppDimensions();
  const { authenticateEdit, authenticateDelete } = useSensitiveActionAuth({
    showConfirm,
    showError,
  });

  // Load budget data
  const loadBudgetData = useCallback(async () => {
    try {
      if (!user?.id) return;

      setIsLoading(true);

      // Get budget details
      const budgetData = await getBudgetById(budgetId);
      setBudget(budgetData);

      // Get category data dengan enhanced mapping
      const categories = await getCategories({ type: 'expense' });
      const categoryData = categories.find(cat => cat.id === budgetData.category_id);

      // Enhanced category data dengan fallback yang lebih baik
      if (categoryData) {
        const enhancedCategory = {
          ...categoryData,
          icon: getCategoryIcon(categoryData.name, categoryData.icon),
          color: getCategoryColor(categoryData.name, categoryData.color),
        };
        setCategory(enhancedCategory);
      } else {
        // Fallback jika kategori tidak ditemukan
        setCategory({
          id: budgetData.category_id,
          name: 'Kategori',
          type: 'expense' as const,
          icon: getCategoryIcon('Kategori'),
          color: getCategoryColor('Kategori'),
          is_default: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      // Calculate date range based on period
      const now = new Date();
      let startDate = '';
      let endDate = '';

      if (budgetData.period === 'daily') {
        const today = new Date();
        startDate = today.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
      } else if (budgetData.period === 'weekly') {
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(today.setDate(diff));
        const sunday = new Date(today);
        sunday.setDate(monday.getDate() + 6);
        startDate = monday.toISOString().split('T')[0];
        endDate = sunday.toISOString().split('T')[0];
      } else if (budgetData.period === 'monthly') {
        const year = now.getFullYear();
        const month = now.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        startDate = firstDay.toISOString().split('T')[0];
        endDate = lastDay.toISOString().split('T')[0];
      } else if (budgetData.period === 'yearly') {
        const year = now.getFullYear();
        const firstDay = new Date(year, 0, 1);
        const lastDay = new Date(year, 11, 31);
        startDate = firstDay.toISOString().split('T')[0];
        endDate = lastDay.toISOString().split('T')[0];
      }

      // Get spending data
      const spentAmount = await getBudgetSpending(
        user.id,
        budgetData.category_id,
        startDate,
        endDate
      );
      setSpent(spentAmount);

      // Get related transactions
      const transactionData = await getTransactions(user.id, {
        categoryId: budgetData.category_id,
        type: 'expense',
        startDate,
        endDate,
        limit: 10,
      });
      setTransactions(transactionData);

    } catch (error) {
      showError('Error', 'Gagal memuat data anggaran');
    } finally {
      setIsLoading(false);
    }
  }, [budgetId, user?.id, showError]);

  // Refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadBudgetData();
    setIsRefreshing(false);
  };

  // Handle edit budget
  const handleEdit = async () => {
    await authenticateEdit(
      'anggaran',
      category?.name ? `Anggaran ${category.name}` : 'anggaran ini',
      () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (navigation as any).navigate('EditBudget', { id: budgetId });
      }
    );
  };

  // Handle delete budget
  const handleDelete = async () => {
    await authenticateDelete(
      'anggaran',
      category?.name ? `Anggaran ${category.name}` : 'anggaran ini',
      async () => {
        try {
          setIsDeleting(true);

          // Hapus dari database terlebih dahulu
          await deleteBudget(budgetId);

          // Hapus dari store
          await deleteBudgetFromStore(budgetId);

          // Tampilkan pesan sukses
          showSuccess('Berhasil', 'Anggaran berhasil dihapus');

          // Navigasi kembali dengan delay yang lebih pendek
          setTimeout(() => {
            navigation.goBack();
          }, 1000);

        } catch (error) {
          showError('Error', 'Gagal menghapus anggaran');
        } finally {
          setIsDeleting(false);
        }
      }
    );
  };

  // Handle back navigation
  const handleBack = () => {
    navigation.goBack();
  };

  // Handle share budget report
  const handleShareBudget = async () => {
    try {
      if (!budget || !category) return;

      const statusInfo = getStatusInfo();
      const progressData = getProgressData();

      // Generate comprehensive report text
      const reportText = `
📊 LAPORAN ANGGARAN KEUANGAN

🏷️ Kategori: ${category.name}
💰 Total Anggaran: ${formatCurrency(budget.amount)}
💸 Terpakai: ${formatCurrency(spent)} (${formatPercentage(percentage)})
💵 Sisa: ${formatCurrency(remainingAmount)}
📅 Periode: ${getPeriodText()}
📈 Status: ${statusInfo.text}

📊 ANALISIS DETAIL:
• Persentase Penggunaan: ${formatPercentage(percentage)}
• Rata-rata Harian: ${formatCurrency(progressData.velocity.dailyRate)}
• Proyeksi Total: ${formatCurrency(progressData.velocity.projected)}
• Rekomendasi Harian: ${formatCurrency(progressData.insights.recommendedDailySpending)}

📈 INSIGHT:
• Hari Tersisa: ${progressData.insights.daysRemaining} hari
• Anggaran Tersisa: ${formatCurrency(progressData.insights.budgetRemaining)}
• Status Proyeksi: ${progressData.velocity.isOnTrack ? '✅ Sesuai Target' : '⚠️ Berpotensi Melebihi'}

📱 Generated by Financial Planner App
📅 ${formatDate(new Date())}
      `.trim();

      // Use React Native Share API
      const result = await Share.share({
        message: reportText,
        title: 'Laporan Anggaran Keuangan',
      });

      if (result.action === Share.sharedAction) {
        showSuccess('Berhasil', 'Laporan anggaran berhasil dibagikan');
      }

    } catch (error) {
      Alert.alert('Error', 'Gagal membagikan laporan. Silakan coba lagi.');
    }
  };

  useEffect(() => {
    loadBudgetData();
  }, [budgetId, user?.id, loadBudgetData]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          <Typography variant="body1" color={theme.colors.neutral[600]} style={styles.loadingText}>
            Memuat data anggaran...
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  if (!budget) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={theme.colors.danger[500]} />
          <Typography variant="h5" weight="600" color={theme.colors.neutral[800]} style={styles.errorTitle}>
            Anggaran Tidak Ditemukan
          </Typography>
          <Typography variant="body1" color={theme.colors.neutral[600]} style={styles.errorText}>
            Anggaran yang Anda cari tidak dapat ditemukan atau telah dihapus.
          </Typography>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Typography variant="body1" weight="600" color={theme.colors.primary[500]}>
              Kembali
            </Typography>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const percentage = budget.amount > 0 ? spent / budget.amount : 0;
  const remainingAmount = Math.max(budget.amount - spent, 0);

  // Get status info
  const getStatusInfo = () => {
    if (percentage >= 1) {
      return {
        text: 'Melebihi Anggaran',
        color: theme.colors.danger[500],
        bgColor: theme.colors.danger[100],
        icon: 'warning' as const,
      };
    } else if (percentage >= 0.9) {
      return {
        text: 'Hampir Habis',
        color: theme.colors.warning[600],
        bgColor: theme.colors.warning[100],
        icon: 'alert-circle' as const,
      };
    } else if (percentage >= 0.7) {
      return {
        text: 'Perhatian',
        color: theme.colors.warning[500],
        bgColor: theme.colors.warning[50],
        icon: 'information-circle' as const,
      };
    } else {
      return {
        text: 'Aman',
        color: theme.colors.success[600],
        bgColor: theme.colors.success[100],
        icon: 'checkmark-circle' as const,
      };
    }
  };

  const statusInfo = getStatusInfo();

  // Enhanced Progress Logic dengan Multiple Indicators
  const getProgressData = () => {
    const safePercentage = Math.max(0, percentage);
    const displayPercentage = Math.min(safePercentage, 1.5); // Allow up to 150% for visual

    // Progress Zones dengan logic yang lebih detail
    const zones = {
      safe: { min: 0, max: 0.5, color: theme.colors.success[500], label: 'Aman' },
      moderate: { min: 0.5, max: 0.7, color: theme.colors.info[500], label: 'Moderat' },
      caution: { min: 0.7, max: 0.85, color: theme.colors.warning[500], label: 'Hati-hati' },
      warning: { min: 0.85, max: 1, color: theme.colors.warning[600], label: 'Hampir Habis' },
      danger: { min: 1, max: 1.5, color: theme.colors.danger[500], label: 'Melebihi' },
    };

    // Determine current zone
    let currentZone = zones.safe;
    if (safePercentage >= zones.danger.min) currentZone = zones.danger;
    else if (safePercentage >= zones.warning.min) currentZone = zones.warning;
    else if (safePercentage >= zones.caution.min) currentZone = zones.caution;
    else if (safePercentage >= zones.moderate.min) currentZone = zones.moderate;

    // Progress colors dengan gradient yang lebih smooth
    const getProgressColors = (): [string, string] => {
      if (safePercentage >= 1) {
        return [theme.colors.danger[400], theme.colors.danger[600]];
      } else if (safePercentage >= 0.85) {
        return [theme.colors.warning[400], theme.colors.warning[600]];
      } else if (safePercentage >= 0.7) {
        return [theme.colors.warning[300], theme.colors.warning[500]];
      } else if (safePercentage >= 0.5) {
        return [theme.colors.info[300], theme.colors.info[500]];
      } else {
        return [theme.colors.success[400], theme.colors.success[600]];
      }
    };

    // Velocity calculation (spending rate)
    const now = new Date();
    const periodStart = new Date();
    let totalDays = 30; // Default monthly

    if (budget.period === 'daily') {
      totalDays = 1;
    } else if (budget.period === 'weekly') {
      totalDays = 7;
    } else if (budget.period === 'yearly') {
      totalDays = 365;
    }

    const daysPassed = Math.max(1, Math.ceil((now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)));
    const dailySpendingRate = spent / Math.min(daysPassed, totalDays);
    const projectedSpending = dailySpendingRate * totalDays;
    const projectedPercentage = budget.amount > 0 ? projectedSpending / budget.amount : 0;

    return {
      percentage: safePercentage,
      displayPercentage,
      currentZone,
      progressColors: getProgressColors(),
      zones,
      velocity: {
        dailyRate: dailySpendingRate,
        projected: projectedSpending,
        projectedPercentage,
        isOnTrack: projectedPercentage <= 1,
      },
      insights: {
        daysRemaining: Math.max(0, totalDays - daysPassed),
        budgetRemaining: Math.max(0, budget.amount - spent),
        averageDailyBudget: budget.amount / totalDays,
        recommendedDailySpending: Math.max(0, (budget.amount - spent) / Math.max(1, totalDays - daysPassed)),
      }
    };
  };

  const progressData = getProgressData();

  // Format period text
  const getPeriodText = () => {
    switch (budget.period) {
      case 'daily': return 'Harian';
      case 'weekly': return 'Mingguan';
      case 'monthly': return 'Bulanan';
      case 'yearly': return 'Tahunan';
      default: return 'Bulanan';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, {
        paddingHorizontal: responsiveSpacing(theme.spacing.layout.sm),
        paddingVertical: responsiveSpacing(theme.spacing.md),
        minHeight: responsiveSpacing(isSmallDevice ? 56 : 64),
      }]}>
        <TouchableOpacity
          style={[styles.backButton, {
            width: responsiveSpacing(isSmallDevice ? 36 : 40),
            height: responsiveSpacing(isSmallDevice ? 36 : 40),
          }]}
          onPress={handleBack}
        >
          <Ionicons
            name="arrow-back"
            size={responsiveSpacing(isSmallDevice ? 20 : 24)}
            color={theme.colors.primary[500]}
          />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Typography
            variant="h5"
            weight="700"
            color={theme.colors.primary[500]}
            style={{
              fontSize: 20,
              textAlign: 'center',
              lineHeight: 24,
              includeFontPadding: false,
              textAlignVertical: 'center',
            }}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.8}
          >
            Detail Anggaran
          </Typography>
        </View>

        {/* Spacer untuk menjaga keseimbangan layout */}
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, {
          paddingHorizontal: responsiveSpacing(theme.spacing.layout.sm),
        }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary[500]]}
          />
        }
      >
        {/* Budget Overview Card */}
        <LinearGradient
          colors={[theme.colors.white, theme.colors.neutral[50]]}
          style={[styles.overviewCard, {
            padding: responsiveSpacing(isSmallDevice ? theme.spacing.lg : theme.spacing.xl),
            marginBottom: responsiveSpacing(theme.spacing.lg),
            borderRadius: theme.borderRadius.xl,
          }]}
        >
          {/* Category Header dengan Enhanced Icon */}
          <View style={[styles.categoryHeader, {
            marginBottom: responsiveSpacing(theme.spacing.lg),
          }]}>
            {/* Enhanced Icon Container dengan gradient dan shadow */}
            <View style={[styles.categoryIconContainer, {
              width: responsiveSpacing(isSmallDevice ? 64 : 72),
              height: responsiveSpacing(isSmallDevice ? 64 : 72),
              borderRadius: responsiveSpacing(isSmallDevice ? 32 : 36),
              marginRight: responsiveSpacing(theme.spacing.lg),
            }]}>
              <LinearGradient
                colors={[
                  category?.color || theme.colors.primary[400],
                  category?.color ? `${category.color}CC` : theme.colors.primary[600]
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.categoryIconGradient, {
                  width: responsiveSpacing(isSmallDevice ? 64 : 72),
                  height: responsiveSpacing(isSmallDevice ? 64 : 72),
                  borderRadius: responsiveSpacing(isSmallDevice ? 32 : 36),
                }]}
              >
                <Ionicons
                  name={(category?.icon || 'wallet-outline') as keyof typeof Ionicons.glyphMap}
                  size={responsiveSpacing(isSmallDevice ? 32 : 36)}
                  color={theme.colors.white}
                />
              </LinearGradient>

              {/* Subtle glow effect */}
              <View style={[styles.categoryIconGlow, {
                width: responsiveSpacing(isSmallDevice ? 64 : 72),
                height: responsiveSpacing(isSmallDevice ? 64 : 72),
                borderRadius: responsiveSpacing(isSmallDevice ? 32 : 36),
                backgroundColor: `${category?.color || theme.colors.primary[500]}20`,
              }]} />
            </View>

            <View style={styles.categoryInfo}>
              <Typography
                variant="h4"
                weight="700"
                color={theme.colors.neutral[800]}
                style={{
                  fontSize: responsiveFontSize(isSmallDevice ? 22 : 26),
                  letterSpacing: -0.5,
                  lineHeight: responsiveFontSize(isSmallDevice ? 28 : 32),
                }}
              >
                {category?.name || 'Kategori'}
              </Typography>
              <Typography
                variant="body2"
                color={theme.colors.neutral[500]}
                style={{
                  fontSize: responsiveFontSize(isSmallDevice ? 14 : 16),
                  marginTop: responsiveSpacing(6),
                  fontWeight: '500',
                }}
              >
                Anggaran {getPeriodText()}
              </Typography>
            </View>

            <View style={[styles.statusBadge, {
              backgroundColor: statusInfo.bgColor,
              paddingHorizontal: responsiveSpacing(theme.spacing.md),
              paddingVertical: responsiveSpacing(8),
              borderRadius: theme.borderRadius.round,
              shadowColor: statusInfo.color,
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }]}>
              <Ionicons
                name={statusInfo.icon}
                size={responsiveSpacing(16)}
                color={statusInfo.color}
                style={{ marginRight: responsiveSpacing(6) }}
              />
              <Typography
                variant="caption"
                weight="700"
                color={statusInfo.color}
                style={{
                  fontSize: responsiveFontSize(isSmallDevice ? 12 : 14),
                  letterSpacing: 0.2,
                }}
              >
                {statusInfo.text}
              </Typography>
            </View>
          </View>

          {/* Amount Display */}
          <View style={[styles.amountDisplay, {
            marginBottom: responsiveSpacing(theme.spacing.lg),
          }]}>
            <View style={styles.amountItem}>
              <Typography
                variant="caption"
                color={theme.colors.neutral[500]}
                style={{
                  fontSize: responsiveFontSize(isSmallDevice ? 12 : 14),
                  marginBottom: responsiveSpacing(4),
                }}
              >
                Total Anggaran
              </Typography>
              <Typography
                variant="h4"
                weight="700"
                color={theme.colors.primary[600]}
                style={{
                  fontSize: responsiveFontSize(isSmallDevice ? 18 : 20),
                  lineHeight: responsiveFontSize(isSmallDevice ? 24 : 28),
                }}
              >
                {formatCurrency(budget.amount)}
              </Typography>
            </View>

            <View style={styles.amountItem}>
              <Typography
                variant="caption"
                color={theme.colors.neutral[500]}
                style={{
                  fontSize: responsiveFontSize(isSmallDevice ? 12 : 14),
                  marginBottom: responsiveSpacing(4),
                }}
              >
                Terpakai
              </Typography>
              <Typography
                variant="h4"
                weight="700"
                color={percentage >= 1 ? theme.colors.danger[500] : theme.colors.neutral[800]}
                style={{
                  fontSize: responsiveFontSize(isSmallDevice ? 18 : 20),
                  lineHeight: responsiveFontSize(isSmallDevice ? 24 : 28),
                }}
              >
                {formatCurrency(spent)}
              </Typography>
            </View>

            <View style={styles.amountItem}>
              <Typography
                variant="caption"
                color={theme.colors.neutral[500]}
                style={{
                  fontSize: responsiveFontSize(isSmallDevice ? 12 : 14),
                  marginBottom: responsiveSpacing(4),
                }}
              >
                Sisa
              </Typography>
              <Typography
                variant="h4"
                weight="700"
                color={percentage >= 0.9 ? theme.colors.danger[500] : theme.colors.success[600]}
                style={{
                  fontSize: responsiveFontSize(isSmallDevice ? 18 : 20),
                  lineHeight: responsiveFontSize(isSmallDevice ? 24 : 28),
                }}
              >
                {formatCurrency(remainingAmount)}
              </Typography>
            </View>
          </View>

          {/* Enhanced Progress Section dengan Multiple Indicators */}
          <View style={styles.progressSection}>
            {/* Progress Header dengan Zone Indicator */}
            <View style={[styles.progressHeader, {
              marginBottom: responsiveSpacing(theme.spacing.sm),
            }]}>
              <View style={styles.progressTitleContainer}>
                <Typography
                  variant="body1"
                  weight="600"
                  color={theme.colors.neutral[700]}
                  style={{
                    fontSize: responsiveFontSize(isSmallDevice ? 14 : 16),
                  }}
                >
                  Progress Penggunaan
                </Typography>
                <View style={[styles.zoneBadge, {
                  backgroundColor: `${progressData.currentZone.color}20`,
                  paddingHorizontal: responsiveSpacing(8),
                  paddingVertical: responsiveSpacing(4),
                  borderRadius: theme.borderRadius.sm,
                  marginLeft: responsiveSpacing(8),
                }]}>
                  <Typography
                    variant="caption"
                    weight="600"
                    color={progressData.currentZone.color}
                    style={{
                      fontSize: responsiveFontSize(isSmallDevice ? 10 : 11),
                    }}
                  >
                    {progressData.currentZone.label}
                  </Typography>
                </View>
              </View>
              <Typography
                variant="h5"
                weight="700"
                color={progressData.currentZone.color}
                style={{
                  fontSize: responsiveFontSize(isSmallDevice ? 18 : 20),
                }}
              >
                {formatPercentage(progressData.percentage)}
              </Typography>
            </View>

            {/* Enhanced Progress Bar dengan Zone Markers */}
            <View style={[styles.progressBarContainer, {
              marginBottom: responsiveSpacing(theme.spacing.md),
            }]}>
              <View style={[styles.progressBar, {
                height: responsiveSpacing(isSmallDevice ? 12 : 16),
                borderRadius: theme.borderRadius.round,
                backgroundColor: theme.colors.neutral[200],
              }]}>
                <LinearGradient
                  colors={progressData.progressColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(progressData.displayPercentage * 100, 100)}%`,
                      borderRadius: theme.borderRadius.round,
                    },
                  ]}
                />

                {/* Zone Markers */}
                <View style={[styles.zoneMarker, {
                  left: '50%',
                  backgroundColor: theme.colors.neutral[400],
                }]} />
                <View style={[styles.zoneMarker, {
                  left: '70%',
                  backgroundColor: theme.colors.warning[400],
                }]} />
                <View style={[styles.zoneMarker, {
                  left: '85%',
                  backgroundColor: theme.colors.warning[500],
                }]} />
              </View>

              {/* Progress Labels */}
              <View style={styles.progressLabels}>
                <Typography variant="caption" color={theme.colors.neutral[500]} style={{ fontSize: responsiveFontSize(9) }}>
                  0%
                </Typography>
                <Typography variant="caption" color={theme.colors.neutral[500]} style={{ fontSize: responsiveFontSize(9) }}>
                  50%
                </Typography>
                <Typography variant="caption" color={theme.colors.neutral[500]} style={{ fontSize: responsiveFontSize(9) }}>
                  100%
                </Typography>
              </View>
            </View>

            {/* Velocity & Insights Cards */}
            <View style={styles.insightsContainer}>
              {/* Spending Velocity Card */}
              <View style={[styles.insightCard, {
                backgroundColor: progressData.velocity.isOnTrack ? theme.colors.success[50] : theme.colors.warning[50],
                borderLeftColor: progressData.velocity.isOnTrack ? theme.colors.success[500] : theme.colors.warning[500],
              }]}>
                <View style={styles.insightHeader}>
                  <Ionicons
                    name={progressData.velocity.isOnTrack ? "trending-down" : "trending-up"}
                    size={responsiveSpacing(16)}
                    color={progressData.velocity.isOnTrack ? theme.colors.success[500] : theme.colors.warning[500]}
                  />
                  <Typography
                    variant="body2"
                    weight="600"
                    color={theme.colors.neutral[700]}
                    style={{
                      fontSize: responsiveFontSize(isSmallDevice ? 12 : 14),
                      marginLeft: responsiveSpacing(6),
                    }}
                  >
                    Kecepatan Pengeluaran
                  </Typography>
                </View>
                <Typography
                  variant="caption"
                  color={theme.colors.neutral[600]}
                  style={{
                    fontSize: responsiveFontSize(isSmallDevice ? 10 : 12),
                    marginTop: responsiveSpacing(4),
                  }}
                >
                  {formatCurrency(progressData.velocity.dailyRate)}/hari • Proyeksi: {formatPercentage(progressData.velocity.projectedPercentage)}
                </Typography>
              </View>

              {/* Budget Recommendation Card */}
              <View style={[styles.insightCard, {
                backgroundColor: theme.colors.info[50],
                borderLeftColor: theme.colors.info[500],
              }]}>
                <View style={styles.insightHeader}>
                  <Ionicons
                    name="bulb"
                    size={responsiveSpacing(16)}
                    color={theme.colors.info[500]}
                  />
                  <Typography
                    variant="body2"
                    weight="600"
                    color={theme.colors.neutral[700]}
                    style={{
                      fontSize: responsiveFontSize(isSmallDevice ? 12 : 14),
                      marginLeft: responsiveSpacing(6),
                    }}
                  >
                    Rekomendasi Harian
                  </Typography>
                </View>
                <Typography
                  variant="caption"
                  color={theme.colors.neutral[600]}
                  style={{
                    fontSize: responsiveFontSize(isSmallDevice ? 10 : 12),
                    marginTop: responsiveSpacing(4),
                  }}
                >
                  {formatCurrency(progressData.insights.recommendedDailySpending)}/hari untuk {progressData.insights.daysRemaining} hari tersisa
                </Typography>
              </View>
            </View>

            {/* Warning/Alert Messages */}
            {progressData.percentage >= 1 && (
              <View style={[styles.warningMessage, {
                backgroundColor: theme.colors.danger[50],
                padding: responsiveSpacing(theme.spacing.sm),
                borderRadius: theme.borderRadius.md,
                borderLeftWidth: 4,
                borderLeftColor: theme.colors.danger[500],
                marginTop: responsiveSpacing(theme.spacing.sm),
              }]}>
                <View style={styles.warningHeader}>
                  <Ionicons
                    name="warning"
                    size={responsiveSpacing(16)}
                    color={theme.colors.danger[500]}
                  />
                  <Typography
                    variant="body2"
                    weight="600"
                    color={theme.colors.danger[700]}
                    style={{
                      fontSize: responsiveFontSize(isSmallDevice ? 13 : 15),
                      marginLeft: responsiveSpacing(6),
                    }}
                  >
                    Anggaran Terlampaui
                  </Typography>
                </View>
                <Typography
                  variant="caption"
                  color={theme.colors.danger[600]}
                  style={{
                    fontSize: responsiveFontSize(isSmallDevice ? 11 : 13),
                    marginTop: responsiveSpacing(4),
                  }}
                >
                  Anda telah melebihi anggaran sebesar {formatCurrency(spent - budget.amount)}
                </Typography>
              </View>
            )}

            {progressData.percentage >= 0.85 && progressData.percentage < 1 && (
              <View style={[styles.warningMessage, {
                backgroundColor: theme.colors.warning[50],
                padding: responsiveSpacing(theme.spacing.sm),
                borderRadius: theme.borderRadius.md,
                borderLeftWidth: 4,
                borderLeftColor: theme.colors.warning[500],
                marginTop: responsiveSpacing(theme.spacing.sm),
              }]}>
                <View style={styles.warningHeader}>
                  <Ionicons
                    name="alert-circle"
                    size={responsiveSpacing(16)}
                    color={theme.colors.warning[500]}
                  />
                  <Typography
                    variant="body2"
                    weight="600"
                    color={theme.colors.warning[700]}
                    style={{
                      fontSize: responsiveFontSize(isSmallDevice ? 13 : 15),
                      marginLeft: responsiveSpacing(6),
                    }}
                  >
                    Hampir Mencapai Batas
                  </Typography>
                </View>
                <Typography
                  variant="caption"
                  color={theme.colors.warning[600]}
                  style={{
                    fontSize: responsiveFontSize(isSmallDevice ? 11 : 13),
                    marginTop: responsiveSpacing(4),
                  }}
                >
                  Sisa anggaran: {formatCurrency(remainingAmount)}. Pertimbangkan untuk mengurangi pengeluaran.
                </Typography>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Recent Transactions */}
        {transactions.length > 0 && (
          <View style={[styles.transactionsCard, {
            backgroundColor: theme.colors.white,
            padding: responsiveSpacing(isSmallDevice ? theme.spacing.md : theme.spacing.lg),
            borderRadius: theme.borderRadius.xl,
            marginBottom: responsiveSpacing(theme.spacing.lg),
          }]}>
            <View style={[styles.transactionsHeader, {
              marginBottom: responsiveSpacing(theme.spacing.md),
            }]}>
              <Typography
                variant="h6"
                weight="700"
                color={theme.colors.neutral[800]}
                style={{
                  fontSize: responsiveFontSize(isSmallDevice ? 16 : 18),
                }}
              >
                Transaksi Terkini
              </Typography>
              <Typography
                variant="caption"
                color={theme.colors.neutral[500]}
                style={{
                  fontSize: responsiveFontSize(isSmallDevice ? 11 : 13),
                }}
              >
                {transactions.length} transaksi
              </Typography>
            </View>

            {transactions.slice(0, 5).map((transaction, index) => (
              <View
                key={transaction.id}
                style={[
                  styles.transactionItem,
                  {
                    paddingVertical: responsiveSpacing(theme.spacing.sm),
                    borderBottomWidth: index < Math.min(transactions.length - 1, 4) ? 1 : 0,
                    borderBottomColor: theme.colors.neutral[200],
                  },
                ]}
              >
                <View style={styles.transactionLeft}>
                  {/* Enhanced Transaction Icon dengan kategori */}
                  <View style={[styles.transactionIconContainer, {
                    width: responsiveSpacing(isSmallDevice ? 36 : 40),
                    height: responsiveSpacing(isSmallDevice ? 36 : 40),
                    borderRadius: responsiveSpacing(isSmallDevice ? 18 : 20),
                  }]}>
                    <LinearGradient
                      colors={[
                        category?.color || theme.colors.danger[400],
                        category?.color ? `${category.color}DD` : theme.colors.danger[600]
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[styles.transactionIconGradient, {
                        width: responsiveSpacing(isSmallDevice ? 36 : 40),
                        height: responsiveSpacing(isSmallDevice ? 36 : 40),
                        borderRadius: responsiveSpacing(isSmallDevice ? 18 : 20),
                      }]}
                    >
                      <Ionicons
                        name={(category?.icon || 'wallet-outline') as keyof typeof Ionicons.glyphMap}
                        size={responsiveSpacing(isSmallDevice ? 16 : 18)}
                        color={theme.colors.white}
                      />
                    </LinearGradient>
                  </View>
                  <View style={styles.transactionInfo}>
                    <Typography
                      variant="body2"
                      weight="600"
                      color={theme.colors.neutral[800]}
                      style={{
                        fontSize: responsiveFontSize(isSmallDevice ? 13 : 15),
                      }}
                    >
                      {transaction.description || 'Pengeluaran'}
                    </Typography>
                    <Typography
                      variant="caption"
                      color={theme.colors.neutral[500]}
                      style={{
                        fontSize: responsiveFontSize(isSmallDevice ? 11 : 12),
                        marginTop: responsiveSpacing(2),
                      }}
                    >
                      {formatDate(transaction.date, { format: 'short' })}
                    </Typography>
                  </View>
                </View>
                <Typography
                  variant="body2"
                  weight="700"
                  color={theme.colors.danger[500]}
                  style={{
                    fontSize: responsiveFontSize(isSmallDevice ? 13 : 15),
                  }}
                >
                  -{formatCurrency(transaction.amount)}
                </Typography>
              </View>
            ))}

            {transactions.length > 5 && (
              <TouchableOpacity
                style={[styles.viewAllButton, {
                  marginTop: responsiveSpacing(theme.spacing.sm),
                  paddingVertical: responsiveSpacing(theme.spacing.sm),
                }]}
                onPress={() => {
                  // Navigate to transactions with filter
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (navigation as any).navigate('Transactions', {
                    categoryId: budget.category_id,
                    type: 'expense'
                  });
                }}
              >
                <Typography
                  variant="body2"
                  weight="600"
                  color={theme.colors.primary[500]}
                  style={{
                    fontSize: responsiveFontSize(isSmallDevice ? 13 : 15),
                    textAlign: 'center',
                  }}
                >
                  Lihat Semua Transaksi ({transactions.length})
                </Typography>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Quick Actions Card */}
        <View style={[styles.actionsCard, {
          backgroundColor: theme.colors.white,
          padding: responsiveSpacing(isSmallDevice ? theme.spacing.md : theme.spacing.lg),
          borderRadius: theme.borderRadius.xl,
          marginBottom: responsiveSpacing(theme.spacing.lg),
        }]}>
          <Typography
            variant="h6"
            weight="700"
            color={theme.colors.neutral[800]}
            style={{
              fontSize: responsiveFontSize(isSmallDevice ? 16 : 18),
              marginBottom: responsiveSpacing(theme.spacing.md),
            }}
          >
            Aksi Cepat
          </Typography>

          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.quickActionButton, {
                backgroundColor: theme.colors.primary[50],
                borderColor: theme.colors.primary[200],
              }]}
              onPress={() => {
                // Navigate to add transaction with pre-filled category
                navigation.navigate('AddTransaction', {
                  type: 'expense',
                  categoryId: budget.category_id,
                  budgetId: budget.id,
                });
              }}
            >
              <View style={[styles.quickActionIcon, {
                backgroundColor: theme.colors.primary[100],
              }]}>
                <Ionicons
                  name="add-circle"
                  size={responsiveSpacing(24)}
                  color={theme.colors.primary[600]}
                />
              </View>
              <Typography
                variant="body2"
                weight="600"
                color={theme.colors.primary[700]}
                style={{
                  fontSize: responsiveFontSize(isSmallDevice ? 12 : 14),
                  textAlign: 'center',
                  marginTop: responsiveSpacing(8),
                }}
              >
                Tambah{'\n'}Pengeluaran
              </Typography>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionButton, {
                backgroundColor: theme.colors.info[50],
                borderColor: theme.colors.info[200],
              }]}
              onPress={() => {
                // Navigate to transactions filtered by this budget's category
                navigation.navigate('Main', {
                  screen: 'Transactions',
                  params: {
                    categoryId: budget.category_id,
                    type: 'expense',
                    budgetId: budget.id,
                  }
                });
              }}
            >
              <View style={[styles.quickActionIcon, {
                backgroundColor: theme.colors.info[100],
              }]}>
                <Ionicons
                  name="list"
                  size={responsiveSpacing(24)}
                  color={theme.colors.info[600]}
                />
              </View>
              <Typography
                variant="body2"
                weight="600"
                color={theme.colors.info[700]}
                style={{
                  fontSize: responsiveFontSize(isSmallDevice ? 12 : 14),
                  textAlign: 'center',
                  marginTop: responsiveSpacing(8),
                }}
              >
                Lihat Semua{'\n'}Transaksi
              </Typography>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionButton, {
                backgroundColor: theme.colors.success[50],
                borderColor: theme.colors.success[200],
              }]}
              onPress={() => {
                // Navigate to budget analytics/reports
                navigation.navigate('BudgetAnalysisDetail', {
                  budgetId: budget.id,
                  categoryId: budget.category_id,
                });
              }}
            >
              <View style={[styles.quickActionIcon, {
                backgroundColor: theme.colors.success[100],
              }]}>
                <Ionicons
                  name="analytics"
                  size={responsiveSpacing(24)}
                  color={theme.colors.success[600]}
                />
              </View>
              <Typography
                variant="body2"
                weight="600"
                color={theme.colors.success[700]}
                style={{
                  fontSize: responsiveFontSize(isSmallDevice ? 12 : 14),
                  textAlign: 'center',
                  marginTop: responsiveSpacing(8),
                }}
              >
                Analisis{'\n'}Detail
              </Typography>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionButton, {
                backgroundColor: theme.colors.warning[50],
                borderColor: theme.colors.warning[200],
              }]}
              onPress={() => {
                // Share budget report
                handleShareBudget();
              }}
            >
              <View style={[styles.quickActionIcon, {
                backgroundColor: theme.colors.warning[100],
              }]}>
                <Ionicons
                  name="share"
                  size={responsiveSpacing(24)}
                  color={theme.colors.warning[600]}
                />
              </View>
              <Typography
                variant="body2"
                weight="600"
                color={theme.colors.warning[700]}
                style={{
                  fontSize: responsiveFontSize(isSmallDevice ? 12 : 14),
                  textAlign: 'center',
                  marginTop: responsiveSpacing(8),
                }}
              >
                Bagikan{'\n'}Laporan
              </Typography>
            </TouchableOpacity>
          </View>
        </View>

        {/* Budget Info Card */}
        <View style={[styles.infoCard, {
          backgroundColor: theme.colors.white,
          padding: responsiveSpacing(isSmallDevice ? theme.spacing.md : theme.spacing.lg),
          borderRadius: theme.borderRadius.xl,
          marginBottom: responsiveSpacing(theme.spacing.xl),
        }]}>
          <View style={styles.sectionTitleContainer}>
            <Typography
              variant="h6"
              weight="700"
              color={theme.colors.neutral[800]}
              style={{
                fontSize: responsiveFontSize(isSmallDevice ? 16 : 18),
                lineHeight: responsiveFontSize(isSmallDevice ? 22 : 26),
                marginBottom: responsiveSpacing(theme.spacing.md),
              }}
            >
              Informasi Anggaran
            </Typography>
          </View>

          <View style={styles.infoRow}>
            <Typography
              variant="body2"
              color={theme.colors.neutral[600]}
              style={{
                fontSize: responsiveFontSize(isSmallDevice ? 13 : 15),
              }}
            >
              Periode
            </Typography>
            <Typography
              variant="body2"
              weight="600"
              color={theme.colors.neutral[800]}
              style={{
                fontSize: responsiveFontSize(isSmallDevice ? 13 : 15),
              }}
            >
              {getPeriodText()}
            </Typography>
          </View>

          <View style={styles.infoRow}>
            <Typography
              variant="body2"
              color={theme.colors.neutral[600]}
              style={{
                fontSize: responsiveFontSize(isSmallDevice ? 13 : 15),
              }}
            >
              Rata-rata Harian
            </Typography>
            <Typography
              variant="body2"
              weight="600"
              color={theme.colors.neutral[800]}
              style={{
                fontSize: responsiveFontSize(isSmallDevice ? 13 : 15),
              }}
            >
              {formatCurrency(progressData.insights.averageDailyBudget)}
            </Typography>
          </View>

          <View style={styles.infoRow}>
            <Typography
              variant="body2"
              color={theme.colors.neutral[600]}
              style={{
                fontSize: responsiveFontSize(isSmallDevice ? 13 : 15),
              }}
            >
              Tanggal Dibuat
            </Typography>
            <Typography
              variant="body2"
              weight="600"
              color={theme.colors.neutral[800]}
              style={{
                fontSize: responsiveFontSize(isSmallDevice ? 13 : 15),
              }}
            >
              {formatDate(budget.created_at, { format: 'medium' })}
            </Typography>
          </View>

          <View style={styles.infoRow}>
            <Typography
              variant="body2"
              color={theme.colors.neutral[600]}
              style={{
                fontSize: responsiveFontSize(isSmallDevice ? 13 : 15),
              }}
            >
              Terakhir Diperbarui
            </Typography>
            <Typography
              variant="body2"
              weight="600"
              color={theme.colors.neutral[800]}
              style={{
                fontSize: responsiveFontSize(isSmallDevice ? 13 : 15),
              }}
            >
              {formatDate(budget.updated_at, { format: 'medium' })}
            </Typography>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={[styles.budgetActionButtonsContainer, {
          marginBottom: responsiveSpacing(theme.spacing.xl),
        }]}>
          {/* Edit Button */}
          <TouchableOpacity
            onPress={handleEdit}
            style={[styles.budgetActionButton, styles.editBudgetActionButton, {
              marginBottom: responsiveSpacing(theme.spacing.md)
            }]}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <View style={styles.budgetActionButtonContent}>
              <Ionicons name="create-outline" size={22} color={theme.colors.white} />
              <Typography
                variant="body1"
                weight="600"
                color={theme.colors.white}
                style={styles.budgetActionButtonText}
              >
                Edit Anggaran
              </Typography>
            </View>
          </TouchableOpacity>

          {/* Delete Button */}
          <TouchableOpacity
            onPress={handleDelete}
            style={[styles.budgetActionButton, styles.deleteBudgetActionButton]}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            disabled={isDeleting}
          >
            <View style={styles.budgetActionButtonContent}>
              {isDeleting ? (
                <ActivityIndicator size="small" color={theme.colors.white} />
              ) : (
                <Ionicons name="trash-outline" size={22} color={theme.colors.white} />
              )}
              <Typography
                variant="body1"
                weight="600"
                color={theme.colors.white}
                style={styles.budgetActionButtonText}
              >
                {isDeleting ? 'Menghapus...' : 'Hapus Anggaran'}
              </Typography>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorTitle: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  errorText: {
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
    ...theme.elevation.xs,
  },
  backButton: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.borderRadius.round,
    backgroundColor: 'transparent',
    marginLeft: theme.spacing.xs, // Proper spacing from left edge
  },
  headerTitleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    minHeight: 40, // Ensure consistent height
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: theme.spacing.lg,
  },
  overviewCard: {
    ...theme.elevation.md,
    shadowColor: theme.colors.neutral[900],
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  categoryIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: theme.colors.neutral[900],
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  categoryIconGradient: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIconGlow: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    zIndex: -1,
  },
  categoryInfo: {
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  amountDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  amountItem: {
    flex: 1,
    alignItems: 'center',
  },
  progressSection: {
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBar: {
    backgroundColor: theme.colors.neutral[200],
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  warningMessage: {
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionsCard: {
    ...theme.elevation.sm,
    shadowColor: theme.colors.neutral[900],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  transactionIconContainer: {
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
  transactionIconGradient: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  viewAllButton: {
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
  },
  infoCard: {
    ...theme.elevation.sm,
    shadowColor: theme.colors.neutral[900],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitleContainer: {
    minHeight: 32,
    justifyContent: 'center',
    paddingVertical: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[100],
  },

  progressTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  zoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarContainer: {
    position: 'relative',
  },
  zoneMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    borderRadius: 1,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
  },
  insightsContainer: {
    gap: theme.spacing.sm,
  },
  insightCard: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 4,
    ...theme.elevation.xs,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  actionsCard: {
    ...theme.elevation.sm,
    shadowColor: theme.colors.neutral[900],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    minHeight: 80,
    ...theme.elevation.xs,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },


  headerSpacer: {
    width: 40, 
  },


  budgetActionButtonsContainer: {
    flexDirection: 'column',
  },
  budgetActionButton: {
    width: '100%',
    height: 56,
    borderRadius: theme.borderRadius.lg,
    ...theme.elevation.md,
    shadowColor: theme.colors.neutral[900],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  budgetActionButtonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  budgetActionButtonText: {
    letterSpacing: 0.3,
  },
  editBudgetActionButton: {
    backgroundColor: theme.colors.primary[500],
  },
  deleteBudgetActionButton: {
    backgroundColor: theme.colors.danger[500],
  },
});
