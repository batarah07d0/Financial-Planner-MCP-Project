import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Card, SuperiorDialog } from '../../../core/components';
import { theme } from '../../../core/theme';
import { formatCurrency } from '../../../core/utils';
import { useSuperiorDialog } from '../../../core/hooks';
import { useAppDimensions } from '../../../core/hooks/useAppDimensions';
import { getBudgetById, updateBudget } from '../../../core/services/supabase/budget.service';
import { getCategories } from '../../../core/services/supabase/category.service';
import { useAuthStore } from '../../../core/services/store/authStore';
import { useBudgetStore } from '../../../core/services/store/budgetStore';
import { Budget, Category } from '../../../core/services/supabase/types';

type EditBudgetRouteProp = RouteProp<{ EditBudget: { id: string } }, 'EditBudget'>;

interface FormData {
  amount: string;
  category: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export const EditBudgetScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<EditBudgetRouteProp>();
  const { id: budgetId } = route.params;

  const [budget, setBudget] = useState<Budget | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<FormData>({
    amount: '',
    category: '',
    period: 'monthly',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useAuthStore();
  const { updateBudget: updateBudgetInStore } = useBudgetStore();
  const { showSuccess, showError, dialogState, hideDialog } = useSuperiorDialog();
  const { responsiveSpacing, responsiveFontSize, isSmallDevice } = useAppDimensions();

  // Load budget and categories data
  const loadData = async () => {
    try {
      setIsLoading(true);

      // Get budget details
      const budgetData = await getBudgetById(budgetId);
      setBudget(budgetData);

      // Get categories
      const categoriesData = await getCategories({ type: 'expense' });
      setCategories(categoriesData);

      // Set form data with formatted amount
      setFormData({
        amount: formatCurrencyInput(budgetData.amount.toString()),
        category: budgetData.category_id,
        period: budgetData.period,
      });

    } catch (error) {
      console.error('Error loading data:', error);
      showError('Error', 'Gagal memuat data anggaran');
    } finally {
      setIsLoading(false);
    }
  };

  // Format currency input
  const formatCurrencyInput = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    if (!numericValue) return '';
    const number = parseInt(numericValue, 10);
    if (isNaN(number)) return '';
    return new Intl.NumberFormat('id-ID').format(number);
  };

  // Parse currency to number
  const parseCurrency = (value: string): number => {
    return parseInt(value.replace(/[^\d]/g, '')) || 0;
  };

  // Handle amount change
  const handleAmountChange = (value: string) => {
    const formatted = formatCurrencyInput(value);
    setFormData(prev => ({ ...prev, amount: formatted }));
  };

  // Handle category change
  const handleCategoryChange = (categoryId: string) => {
    setFormData(prev => ({ ...prev, category: categoryId }));
  };

  // Handle period change
  const handlePeriodChange = (period: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
    setFormData(prev => ({ ...prev, period }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      if (!user?.id || !budget) return;

      // Validation
      const amount = parseCurrency(formData.amount);
      if (amount <= 0) {
        showError('Error', 'Jumlah anggaran harus lebih dari 0');
        return;
      }

      if (!formData.category) {
        showError('Error', 'Silakan pilih kategori');
        return;
      }

      setIsSubmitting(true);

      // Calculate date range based on period
      const now = new Date();
      let startDate = '';
      let endDate = '';

      if (formData.period === 'daily') {
        const today = new Date();
        startDate = today.toISOString();
        endDate = today.toISOString();
      } else if (formData.period === 'weekly') {
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(today.setDate(diff));
        const sunday = new Date(today);
        sunday.setDate(monday.getDate() + 6);
        startDate = monday.toISOString();
        endDate = sunday.toISOString();
      } else if (formData.period === 'monthly') {
        const year = now.getFullYear();
        const month = now.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        startDate = firstDay.toISOString();
        endDate = lastDay.toISOString();
      } else if (formData.period === 'yearly') {
        const year = now.getFullYear();
        const firstDay = new Date(year, 0, 1);
        const lastDay = new Date(year, 11, 31);
        startDate = firstDay.toISOString();
        endDate = lastDay.toISOString();
      }

      // Get selected category data
      const selectedCategory = categories.find(cat => cat.id === formData.category);

      // Prepare update data
      const updateData = {
        amount,
        category_id: formData.category,
        period: formData.period,
        start_date: startDate,
        end_date: endDate,
        name: `Anggaran ${selectedCategory?.name || 'Kategori'}`,
        updated_at: new Date().toISOString(),
      };

      // Update budget
      await updateBudget(budgetId, updateData);
      await updateBudgetInStore(budgetId, updateData);

      showSuccess('Sukses', 'Anggaran berhasil diperbarui');

      // Navigate back after delay
      setTimeout(() => {
        navigation.goBack();
      }, 1500);

    } catch (error) {
      console.error('Error updating budget:', error);
      showError('Error', 'Gagal memperbarui anggaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    navigation.goBack();
  };

  useEffect(() => {
    loadData();
  }, [budgetId]);

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
            Anggaran yang ingin Anda edit tidak dapat ditemukan.
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

  // Get period options
  const periodOptions = [
    { value: 'daily', label: 'Harian', icon: 'today' },
    { value: 'weekly', label: 'Mingguan', icon: 'calendar' },
    { value: 'monthly', label: 'Bulanan', icon: 'calendar-outline' },
    { value: 'yearly', label: 'Tahunan', icon: 'calendar-clear' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, {
        paddingHorizontal: responsiveSpacing(theme.spacing.layout.sm),
        paddingVertical: responsiveSpacing(theme.spacing.md),
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
            color={theme.colors.neutral[700]}
          />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Typography
            variant="h5"
            weight="700"
            color={theme.colors.neutral[800]}
            style={{
              fontSize: responsiveFontSize(isSmallDevice ? 18 : 20),
              lineHeight: responsiveFontSize(isSmallDevice ? 24 : 28),
              textAlign: 'center',
            }}
          >
            Edit Anggaran
          </Typography>
        </View>

        <View style={{ width: responsiveSpacing(isSmallDevice ? 36 : 40) }} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, {
          paddingHorizontal: responsiveSpacing(theme.spacing.layout.sm),
        }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Amount Input Card */}
        <Card style={{
          ...styles.card,
          marginBottom: responsiveSpacing(theme.spacing.lg),
          padding: responsiveSpacing(isSmallDevice ? theme.spacing.md : theme.spacing.lg),
        }}>
          <View style={[styles.cardHeader, {
            marginBottom: responsiveSpacing(theme.spacing.md),
          }]}>
            <View style={[styles.cardIcon, {
              backgroundColor: theme.colors.primary[100],
              width: responsiveSpacing(isSmallDevice ? 40 : 48),
              height: responsiveSpacing(isSmallDevice ? 40 : 48),
              borderRadius: responsiveSpacing(isSmallDevice ? 20 : 24),
            }]}>
              <Ionicons
                name="wallet"
                size={responsiveSpacing(isSmallDevice ? 20 : 24)}
                color={theme.colors.primary[600]}
              />
            </View>
            <View style={styles.cardTitleContainer}>
              <Typography
                variant="h6"
                weight="700"
                color={theme.colors.neutral[800]}
                style={{
                  fontSize: responsiveFontSize(isSmallDevice ? 16 : 18),
                  lineHeight: responsiveFontSize(isSmallDevice ? 22 : 26),
                }}
              >
                Jumlah Anggaran
              </Typography>
              <Typography
                variant="caption"
                color={theme.colors.neutral[500]}
                style={{
                  fontSize: responsiveFontSize(isSmallDevice ? 11 : 13),
                  lineHeight: responsiveFontSize(isSmallDevice ? 16 : 18),
                  marginTop: responsiveSpacing(2),
                }}
              >
                Masukkan jumlah anggaran yang diinginkan
              </Typography>
            </View>
          </View>

          <View style={[styles.inputContainer, {
            borderWidth: 1,
            borderColor: theme.colors.neutral[300],
            borderRadius: theme.borderRadius.lg,
            paddingHorizontal: responsiveSpacing(theme.spacing.md),
            paddingVertical: responsiveSpacing(isSmallDevice ? theme.spacing.sm : theme.spacing.md),
          }]}>
            <Typography
              variant="body2"
              color={theme.colors.neutral[600]}
              style={{
                fontSize: responsiveFontSize(isSmallDevice ? 14 : 16),
                marginRight: responsiveSpacing(theme.spacing.sm),
              }}
            >
              Rp
            </Typography>
            <TextInput
              style={[styles.amountInput, {
                fontSize: responsiveFontSize(isSmallDevice ? 16 : 18),
                color: theme.colors.neutral[800],
              }]}
              value={formData.amount}
              onChangeText={handleAmountChange}
              placeholder="0"
              placeholderTextColor={theme.colors.neutral[400]}
              keyboardType="numeric"
              returnKeyType="done"
            />
          </View>
        </Card>

        {/* Category Selection Card */}
        <Card style={{
          ...styles.card,
          marginBottom: responsiveSpacing(theme.spacing.lg),
          padding: responsiveSpacing(isSmallDevice ? theme.spacing.md : theme.spacing.lg),
        }}>
          <View style={{
            ...styles.cardHeader,
            marginBottom: responsiveSpacing(theme.spacing.md),
          }}>
            <View style={{
              ...styles.cardIcon,
              backgroundColor: theme.colors.secondary[100],
              width: responsiveSpacing(isSmallDevice ? 40 : 48),
              height: responsiveSpacing(isSmallDevice ? 40 : 48),
              borderRadius: responsiveSpacing(isSmallDevice ? 20 : 24),
            }}>
              <Ionicons
                name="grid"
                size={responsiveSpacing(isSmallDevice ? 20 : 24)}
                color={theme.colors.secondary[600]}
              />
            </View>
            <View style={styles.cardTitleContainer}>
              <Typography
                variant="h6"
                weight="700"
                color={theme.colors.neutral[800]}
                style={{
                  fontSize: responsiveFontSize(isSmallDevice ? 16 : 18),
                  lineHeight: responsiveFontSize(isSmallDevice ? 22 : 26),
                }}
              >
                Kategori
              </Typography>
              <Typography
                variant="caption"
                color={theme.colors.neutral[500]}
                style={{
                  fontSize: responsiveFontSize(isSmallDevice ? 11 : 13),
                  lineHeight: responsiveFontSize(isSmallDevice ? 16 : 18),
                  marginTop: responsiveSpacing(2),
                }}
              >
                Pilih kategori pengeluaran
              </Typography>
            </View>
          </View>

          <View style={styles.categoryGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryItem,
                  {
                    backgroundColor: formData.category === category.id
                      ? theme.colors.primary[100]
                      : theme.colors.neutral[50],
                    borderColor: formData.category === category.id
                      ? theme.colors.primary[500]
                      : theme.colors.neutral[200],
                    borderWidth: 2,
                    borderRadius: theme.borderRadius.lg,
                    padding: responsiveSpacing(theme.spacing.md),
                    marginBottom: responsiveSpacing(theme.spacing.sm),
                  },
                ]}
                onPress={() => handleCategoryChange(category.id)}
              >
                <View style={[styles.categoryIcon, {
                  backgroundColor: category.color || theme.colors.primary[200],
                  width: responsiveSpacing(isSmallDevice ? 32 : 36),
                  height: responsiveSpacing(isSmallDevice ? 32 : 36),
                  borderRadius: responsiveSpacing(isSmallDevice ? 16 : 18),
                }]}>
                  <Ionicons
                    name={(category.icon || 'wallet-outline') as any}
                    size={responsiveSpacing(isSmallDevice ? 16 : 18)}
                    color={theme.colors.white}
                  />
                </View>
                <Typography
                  variant="body2"
                  weight={formData.category === category.id ? '600' : '400'}
                  color={
                    formData.category === category.id
                      ? theme.colors.primary[700]
                      : theme.colors.neutral[700]
                  }
                  style={{
                    fontSize: responsiveFontSize(isSmallDevice ? 13 : 15),
                    marginLeft: responsiveSpacing(theme.spacing.sm),
                    flex: 1,
                  }}
                >
                  {category.name}
                </Typography>
                {formData.category === category.id && (
                  <Ionicons
                    name="checkmark-circle"
                    size={responsiveSpacing(isSmallDevice ? 18 : 20)}
                    color={theme.colors.primary[500]}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Period Selection Card */}
        <Card style={{
          ...styles.card,
          marginBottom: responsiveSpacing(theme.spacing.lg),
          padding: responsiveSpacing(isSmallDevice ? theme.spacing.md : theme.spacing.lg),
        }}>
          <View style={[styles.cardHeader, {
            marginBottom: responsiveSpacing(theme.spacing.md),
          }]}>
            <View style={[styles.cardIcon, {
              backgroundColor: theme.colors.info[100],
              width: responsiveSpacing(isSmallDevice ? 40 : 48),
              height: responsiveSpacing(isSmallDevice ? 40 : 48),
              borderRadius: responsiveSpacing(isSmallDevice ? 20 : 24),
            }]}>
              <Ionicons
                name="time"
                size={responsiveSpacing(isSmallDevice ? 20 : 24)}
                color={theme.colors.info[600]}
              />
            </View>
            <View style={styles.cardTitleContainer}>
              <Typography
                variant="h6"
                weight="700"
                color={theme.colors.neutral[800]}
                style={{
                  fontSize: responsiveFontSize(isSmallDevice ? 16 : 18),
                  lineHeight: responsiveFontSize(isSmallDevice ? 22 : 26),
                }}
              >
                Periode Anggaran
              </Typography>
              <Typography
                variant="caption"
                color={theme.colors.neutral[500]}
                style={{
                  fontSize: responsiveFontSize(isSmallDevice ? 11 : 13),
                  lineHeight: responsiveFontSize(isSmallDevice ? 16 : 18),
                  marginTop: responsiveSpacing(2),
                }}
              >
                Pilih periode waktu anggaran
              </Typography>
            </View>
          </View>

          <View style={styles.periodGrid}>
            {periodOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.periodItem,
                  {
                    backgroundColor: formData.period === option.value
                      ? theme.colors.info[100]
                      : theme.colors.neutral[50],
                    borderColor: formData.period === option.value
                      ? theme.colors.info[500]
                      : theme.colors.neutral[200],
                    borderWidth: 2,
                    borderRadius: theme.borderRadius.lg,
                    padding: responsiveSpacing(theme.spacing.md),
                    marginBottom: responsiveSpacing(theme.spacing.sm),
                    flex: 1,
                    marginHorizontal: responsiveSpacing(4),
                  },
                ]}
                onPress={() => handlePeriodChange(option.value as any)}
              >
                <View style={[styles.periodIcon, {
                  backgroundColor: formData.period === option.value
                    ? theme.colors.info[200]
                    : theme.colors.neutral[200],
                  width: responsiveSpacing(isSmallDevice ? 32 : 36),
                  height: responsiveSpacing(isSmallDevice ? 32 : 36),
                  borderRadius: responsiveSpacing(isSmallDevice ? 16 : 18),
                  marginBottom: responsiveSpacing(theme.spacing.sm),
                }]}>
                  <Ionicons
                    name={option.icon as any}
                    size={responsiveSpacing(isSmallDevice ? 16 : 18)}
                    color={
                      formData.period === option.value
                        ? theme.colors.info[600]
                        : theme.colors.neutral[600]
                    }
                  />
                </View>
                <Typography
                  variant="body2"
                  weight={formData.period === option.value ? '600' : '400'}
                  color={
                    formData.period === option.value
                      ? theme.colors.info[700]
                      : theme.colors.neutral[700]
                  }
                  style={{
                    fontSize: responsiveFontSize(isSmallDevice ? 12 : 14),
                    textAlign: 'center',
                  }}
                >
                  {option.label}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: isSubmitting
                ? theme.colors.neutral[300]
                : theme.colors.primary[500],
              borderRadius: theme.borderRadius.lg,
              paddingVertical: responsiveSpacing(isSmallDevice ? theme.spacing.md : theme.spacing.lg),
              marginBottom: responsiveSpacing(theme.spacing.xl),
            },
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <LinearGradient
            colors={
              isSubmitting
                ? [theme.colors.neutral[300], theme.colors.neutral[400]]
                : [theme.colors.primary[500], theme.colors.primary[600]]
            }
            style={[styles.submitGradient, {
              borderRadius: theme.borderRadius.lg,
              paddingVertical: responsiveSpacing(isSmallDevice ? theme.spacing.md : theme.spacing.lg),
            }]}
          >
            {isSubmitting ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="white" />
                <Typography
                  variant="body1"
                  weight="600"
                  color="white"
                  style={{
                    fontSize: responsiveFontSize(isSmallDevice ? 15 : 17),
                    marginLeft: responsiveSpacing(theme.spacing.sm),
                  }}
                >
                  Menyimpan...
                </Typography>
              </View>
            ) : (
              <Typography
                variant="body1"
                weight="700"
                color="white"
                style={{
                  fontSize: responsiveFontSize(isSmallDevice ? 15 : 17),
                  textAlign: 'center',
                }}
              >
                Simpan Perubahan
              </Typography>
            )}
          </LinearGradient>
        </TouchableOpacity>
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
    flexDirection: 'row',
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
  },
  headerTitleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: theme.spacing.lg,
  },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  cardTitleContainer: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountInput: {
    flex: 1,
    fontWeight: '600',
  },
  categoryGrid: {
    // Container for category items
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  periodItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  periodIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButton: {
    overflow: 'hidden',
    ...theme.elevation.md,
    shadowColor: theme.colors.primary[600],
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitGradient: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
