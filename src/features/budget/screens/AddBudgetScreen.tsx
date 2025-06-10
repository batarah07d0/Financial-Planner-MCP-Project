import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Typography, Input, Card, SuperiorDialog } from '../../../core/components';
import { theme } from '../../../core/theme';
import { formatCurrency, formatDate } from '../../../core/utils';
import { Ionicons } from '@expo/vector-icons';
import { useSuperiorDialog } from '../../../core/hooks';
import { useBudgetStore } from '../../../core/services/store/budgetStore';
import { useAuthStore } from '../../../core/services/store/authStore';
import { getCategories } from '../../../core/services/supabase/category.service';
import { Category } from '../../../core/services/supabase/types';

// Tipe data untuk form anggaran
interface BudgetFormData {
  amount: string;
  category: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate?: Date;
}

export const AddBudgetScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const { dialogState, showError, showSuccess, hideDialog } = useSuperiorDialog();

  // Store hooks
  const { addBudget } = useBudgetStore();
  const { user } = useAuthStore();



  // Efek untuk memuat kategori saat komponen dimount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const expenseCategories = await getCategories({ type: 'expense' });
        setCategories(expenseCategories);
      } catch (error) {
        showError('Error', 'Gagal memuat kategori. Silakan coba lagi.');
      }
    };

    loadCategories();
  }, [showError]);

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<BudgetFormData>({
    defaultValues: {
      amount: '',
      category: '',
      period: 'monthly',
      startDate: new Date(),
    }
  });

  const selectedStartDate = watch('startDate');
  const selectedEndDate = watch('endDate');
  const selectedCategory = watch('category');
  const selectedPeriod = watch('period');

  // Menangani hasil dari CategoryPicker menggunakan navigation state
  useFocusEffect(
    React.useCallback(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const state = (navigation as any).getState();
      const currentRoute = state.routes[state.index];

      // Cek apakah ada parameter selectedCategoryId dari CategoryPicker
      if (currentRoute.params?.selectedCategoryFromPicker) {
        const categoryId = currentRoute.params.selectedCategoryFromPicker;
        setValue('category', categoryId);

        // Bersihkan parameter setelah digunakan
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (navigation as any).setParams({ selectedCategoryFromPicker: undefined });
      }
    }, [navigation, setValue])
  );

  // Fungsi untuk menangani submit form
  const onSubmit = async (data: BudgetFormData) => {
    try {
      setIsSubmitting(true);

      // Validasi user
      if (!user?.id) {
        showError('Error', 'Anda harus login terlebih dahulu');
        return;
      }

      // Konversi amount dari string ke number
      const amount = parseFloat(data.amount.replace(/[^0-9]/g, ''));

      // Validasi amount
      if (isNaN(amount) || amount <= 0) {
        showError('Error', 'Jumlah harus lebih dari 0');
        return;
      }

      // Validasi kategori
      if (!data.category) {
        showError('Error', 'Kategori harus dipilih');
        return;
      }

      // Cari kategori yang dipilih untuk mendapatkan nama
      const selectedCategoryData = categories.find(cat => cat.id === data.category);
      if (!selectedCategoryData) {
        showError('Error', 'Kategori tidak valid');
        return;
      }

      // Persiapkan data budget untuk Supabase
      const budgetData = {
        user_id: user.id,
        name: `Anggaran ${selectedCategoryData.name}`,
        amount,
        category_id: data.category,
        period: data.period,
        start_date: data.startDate.toISOString(),
        end_date: data.endDate?.toISOString(),
      };

      

      // Simpan ke Supabase menggunakan store
      await addBudget(budgetData);

      showSuccess('Sukses', 'Anggaran berhasil disimpan');

      // Kembali ke halaman sebelumnya setelah delay singkat
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      showError('Error', 'Terjadi kesalahan saat menyimpan anggaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fungsi untuk menangani perubahan tanggal mulai
  const handleStartDateChange = (_event: unknown, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setValue('startDate', selectedDate);
    }
  };

  // Fungsi untuk menangani perubahan tanggal akhir
  const handleEndDateChange = (_event: unknown, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setValue('endDate', selectedDate);
    }
  };

  // Fungsi untuk menangani perubahan periode
  const handlePeriodChange = (period: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
    setValue('period', period);
  };

  // Fungsi untuk membuka category picker screen
  const openCategoryPicker = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigation as any).navigate('CategoryPicker', {
      selectedCategoryId: selectedCategory,
    });
  };

  // Mendapatkan nama kategori berdasarkan ID
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : '';
  };

  // Render periode selector
  const renderPeriodSelector = () => (
    <View style={styles.periodContainer}>
      <TouchableOpacity
        style={[
          styles.periodButton,
          selectedPeriod === 'daily' && styles.activePeriodButton,
        ]}
        onPress={() => handlePeriodChange('daily')}
      >
        <Typography
          variant="body2"
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
        onPress={() => handlePeriodChange('weekly')}
      >
        <Typography
          variant="body2"
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
        onPress={() => handlePeriodChange('monthly')}
      >
        <Typography
          variant="body2"
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
        onPress={() => handlePeriodChange('yearly')}
      >
        <Typography
          variant="body2"
          color={selectedPeriod === 'yearly' ? theme.colors.white : theme.colors.neutral[700]}
        >
          Tahunan
        </Typography>
      </TouchableOpacity>
    </View>
  );



  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color={theme.colors.primary[500]} />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Typography
              variant="h5"
              weight="700"
              color={theme.colors.primary[500]}
              style={{
                fontSize: 18,
                textAlign: 'center',
                lineHeight: 22,
              }}
            >
              Tambah Anggaran
            </Typography>
          </View>

          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card style={styles.card}>
            <View style={styles.sectionContainer}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="wallet-outline" size={22} color={theme.colors.primary[500]} />
              </View>
              <View style={styles.sectionContent}>
                <Controller
                  control={control}
                  rules={{
                    required: 'Jumlah harus diisi',
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Jumlah"
                      placeholder="Masukkan jumlah"
                      value={value}
                      onChangeText={text => {
                        // Format sebagai mata uang
                        const numericValue = text.replace(/[^0-9]/g, '');
                        if (numericValue) {
                          onChange(formatCurrency(parseInt(numericValue), { showSymbol: false }));
                        } else {
                          onChange('');
                        }
                      }}
                      onBlur={onBlur}
                      keyboardType="numeric"
                      error={errors.amount?.message}
                      leftIcon={<Typography variant="body1" weight="600" color={theme.colors.primary[500]}>Rp</Typography>}
                      containerStyle={styles.inputContainer}
                    />
                  )}
                  name="amount"
                />
              </View>
            </View>

            <View style={styles.sectionContainer}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="pricetag-outline" size={22} color={theme.colors.primary[500]} />
              </View>
              <View style={styles.sectionContent}>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={openCategoryPicker}
                  activeOpacity={0.7}
                >
                  <View>
                    <Typography variant="body2" color={theme.colors.neutral[700]} style={styles.pickerLabel}>
                      Kategori
                    </Typography>
                    <View style={styles.pickerValueContainer}>
                      {selectedCategory ? (
                        <View style={styles.selectedCategoryContainer}>
                          <Ionicons
                            name={(categories.find(cat => cat.id === selectedCategory)?.icon || 'help-circle-outline') as keyof typeof Ionicons.glyphMap}
                            size={18}
                            color={categories.find(cat => cat.id === selectedCategory)?.color || theme.colors.primary[500]}
                            style={styles.selectedCategoryIcon}
                          />
                          <Typography
                            variant="body1"
                            weight="500"
                            color={theme.colors.neutral[900]}
                          >
                            {getCategoryName(selectedCategory)}
                          </Typography>
                        </View>
                      ) : (
                        <Typography
                          variant="body1"
                          color={theme.colors.neutral[400]}
                        >
                          Pilih kategori
                        </Typography>
                      )}
                    </View>
                  </View>
                  <Ionicons name="chevron-down" size={20} color={theme.colors.neutral[500]} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.sectionContainer}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="calendar-outline" size={22} color={theme.colors.primary[500]} />
              </View>
              <View style={styles.sectionContent}>
                <Typography variant="body2" color={theme.colors.neutral[700]} style={styles.pickerLabel}>
                  Periode
                </Typography>
                {renderPeriodSelector()}
              </View>
            </View>

            <View style={styles.sectionContainer}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="today-outline" size={22} color={theme.colors.primary[500]} />
              </View>
              <View style={styles.sectionContent}>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowStartDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <View>
                    <Typography variant="body2" color={theme.colors.neutral[700]} style={styles.pickerLabel}>
                      Tanggal Mulai
                    </Typography>
                    <Typography
                      variant="body1"
                      weight="500"
                      color={theme.colors.neutral[900]}
                    >
                      {formatDate(selectedStartDate, { format: 'medium' })}
                    </Typography>
                  </View>
                  <Ionicons name="calendar" size={20} color={theme.colors.primary[500]} />
                </TouchableOpacity>
              </View>
            </View>

            {showStartDatePicker && (
              <DateTimePicker
                value={selectedStartDate}
                mode="date"
                display="default"
                onChange={handleStartDateChange}
              />
            )}

            <View style={styles.sectionContainer}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="time-outline" size={22} color={theme.colors.primary[500]} />
              </View>
              <View style={styles.sectionContent}>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowEndDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <View>
                    <Typography variant="body2" color={theme.colors.neutral[700]} style={styles.pickerLabel}>
                      Tanggal Akhir (Opsional)
                    </Typography>
                    <Typography
                      variant="body1"
                      weight="500"
                      color={selectedEndDate ? theme.colors.neutral[900] : theme.colors.neutral[400]}
                    >
                      {selectedEndDate !== null && selectedEndDate !== undefined ? formatDate(selectedEndDate, { format: 'medium' }) : 'Pilih tanggal akhir'}
                    </Typography>
                  </View>
                  <Ionicons name="calendar" size={20} color={theme.colors.primary[500]} />
                </TouchableOpacity>
              </View>
            </View>

            {showEndDatePicker && (
              <DateTimePicker
                value={selectedEndDate || new Date()}
                mode="date"
                display="default"
                onChange={handleEndDateChange}
                minimumDate={selectedStartDate}
              />
            )}
          </Card>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, theme.spacing.md) }]}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSubmit(onSubmit)}
            activeOpacity={0.8}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={theme.colors.white} size="small" />
            ) : (
              <View style={styles.saveButtonContent}>
                <Ionicons
                  name="save"
                  size={20}
                  color={theme.colors.white}
                  style={{ marginRight: 8 }}
                />
                <Typography variant="body1" weight="700" color={theme.colors.white}>
                  SIMPAN
                </Typography>
              </View>
            )}
          </TouchableOpacity>
        </View>

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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
    paddingHorizontal: theme.spacing.layout.sm,
    paddingVertical: theme.spacing.md,
    minHeight: 64,
    ...theme.elevation.xs,
  },
  backButton: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.borderRadius.round,
    backgroundColor: 'transparent',
    width: 40,
    height: 40,
  },
  headerTitleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  scrollContent: {
    padding: theme.spacing.layout.sm,
    paddingBottom: theme.spacing.md,
  },
  card: {
    padding: theme.spacing.layout.md,
    paddingVertical: theme.spacing.layout.md,
    borderRadius: theme.borderRadius.lg,
    ...theme.elevation.md,
    marginBottom: theme.spacing.md,
  },
  sectionContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  sectionIconContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
  },
  sectionContent: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 0,
  },
  sectionTitle: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  periodContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  periodButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.neutral[200],
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.elevation.xs,
  },
  activePeriodButton: {
    backgroundColor: theme.colors.primary[500],
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    marginVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[300],
  },
  pickerLabel: {
    marginBottom: theme.spacing.xs,
  },
  pickerValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedCategoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedCategoryIcon: {
    marginRight: theme.spacing.xs,
  },

  footer: {
    paddingHorizontal: theme.spacing.layout.sm,
    paddingTop: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
    ...theme.elevation.lg,
  },
  saveButton: {
    backgroundColor: '#2196F3',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    ...theme.elevation.md,
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
