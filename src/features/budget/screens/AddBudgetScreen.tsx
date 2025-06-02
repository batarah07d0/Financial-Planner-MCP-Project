import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
// @ts-ignore
import DateTimePicker from '@react-native-community/datetimepicker';
import { Typography, Input, Button, Card, SuperiorDialog } from '../../../core/components';
import { theme } from '../../../core/theme';
import { formatCurrency, formatDate } from '../../../core/utils';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const { dialogState, showError, showSuccess, hideDialog } = useSuperiorDialog();

  // Store hooks
  const { addBudget } = useBudgetStore();
  const { user } = useAuthStore();

  // Animasi untuk kategori picker
  const categoryPickerAnimation = useRef(new Animated.Value(0)).current;
  const categoryPickerHeight = categoryPickerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 250]
  });

  // Efek untuk memuat kategori saat komponen dimount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const expenseCategories = await getCategories({ type: 'expense' });
        setCategories(expenseCategories);
      } catch (error) {
        console.error('Error loading categories:', error);
        showError('Error', 'Gagal memuat kategori. Silakan coba lagi.');
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  // Efek untuk animasi kategori picker
  useEffect(() => {
    Animated.timing(categoryPickerAnimation, {
      toValue: showCategoryPicker ? 1 : 0,
      duration: 300,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false
    }).start();
  }, [showCategoryPicker]);

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

      console.log('Submitting budget to Supabase:', budgetData);

      // Simpan ke Supabase menggunakan store
      await addBudget(budgetData);

      showSuccess('Sukses', 'Anggaran berhasil disimpan');

      // Kembali ke halaman sebelumnya setelah delay singkat
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      console.error('Error submitting budget:', error);
      showError('Error', 'Terjadi kesalahan saat menyimpan anggaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fungsi untuk menangani perubahan tanggal mulai
  const handleStartDateChange = (_event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setValue('startDate', selectedDate);
    }
  };

  // Fungsi untuk menangani perubahan tanggal akhir
  const handleEndDateChange = (_event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setValue('endDate', selectedDate);
    }
  };

  // Fungsi untuk menangani perubahan periode
  const handlePeriodChange = (period: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
    setValue('period', period);
  };

  // Fungsi untuk menangani pemilihan kategori
  const handleCategorySelect = (categoryId: string) => {
    setValue('category', categoryId);
    setShowCategoryPicker(false);
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

  // Render kategori picker
  const renderCategoryPicker = () => {
    return (
      <Animated.View
        style={[
          styles.categoryPickerContainer,
          { maxHeight: categoryPickerHeight }
        ]}
      >
        <Typography variant="body1" style={styles.pickerTitle} weight="600">
          Pilih Kategori
        </Typography>

        {isLoadingCategories ? (
          <View style={styles.categoryLoadingContainer}>
            <Typography variant="body2" color={theme.colors.neutral[600]}>
              Memuat kategori...
            </Typography>
          </View>
        ) : (
          <View style={styles.categoryGrid}>
            {categories.map(category => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryItem,
                  selectedCategory === category.id && styles.selectedCategoryItem,
                ]}
                onPress={() => handleCategorySelect(category.id)}
                activeOpacity={0.7}
              >
                <View style={styles.categoryIconContainer}>
                  <Ionicons
                    name={category.icon as any}
                    size={20}
                    color={selectedCategory === category.id ? theme.colors.white : category.color}
                  />
                </View>
                <Typography
                  variant="body2"
                  weight={selectedCategory === category.id ? "600" : "400"}
                  color={selectedCategory === category.id ? theme.colors.white : theme.colors.neutral[700]}
                >
                  {category.name}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <LinearGradient
          colors={[theme.colors.white, theme.colors.neutral[50]]}
          style={styles.headerContainer}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={22} color={theme.colors.primary[500]} />
            </TouchableOpacity>
            <Typography
              variant="h4"
              color={theme.colors.primary[700]}
              weight="600"
              style={styles.headerTitle}
            >
              Tambah Anggaran
            </Typography>
            <View style={styles.headerRight} />
          </View>
        </LinearGradient>

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
                  onPress={() => setShowCategoryPicker(!showCategoryPicker)}
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
                            name={(categories.find(cat => cat.id === selectedCategory)?.icon || 'help-circle-outline') as any}
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

            {showCategoryPicker && renderCategoryPicker()}

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

        <View style={styles.footer}>
          <View style={styles.buttonContainer}>
            <Button
              title="Simpan"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              fullWidth
              variant="gradient"
              size="large"
              leftIcon={<Ionicons name="save-outline" size={24} color={theme.colors.white} />}
              style={styles.saveButton}
            />
          </View>
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
  headerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
    ...theme.elevation.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.layout.sm,
    paddingBottom: theme.spacing.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.xs,
  },
  headerTitle: {
    textAlign: 'center',
    marginLeft: -40, // Kompensasi untuk tombol kembali
  },
  headerRight: {
    width: 40,
  },
  scrollContent: {
    padding: theme.spacing.layout.sm,
    paddingBottom: theme.spacing.layout.xl, // Meningkatkan padding bawah untuk memberikan ruang lebih
  },
  card: {
    padding: theme.spacing.layout.md, // Meningkatkan padding dari md ke layout.md
    paddingVertical: theme.spacing.layout.md, // Memastikan padding vertikal juga lebih besar
    borderRadius: theme.borderRadius.lg,
    ...theme.elevation.md,
    marginBottom: theme.spacing.layout.md, // Menambahkan margin bawah untuk memberikan ruang lebih
  },
  sectionContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.layout.sm, // Meningkatkan margin bawah dari md ke layout.sm
    paddingVertical: theme.spacing.sm, // Menambahkan padding vertikal
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
    paddingVertical: theme.spacing.md, // Meningkatkan padding vertikal dari sm ke md
    marginVertical: theme.spacing.sm, // Menambahkan margin vertikal
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
  categoryPickerContainer: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.neutral[100],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
    overflow: 'hidden',
    ...theme.elevation.sm,
  },
  pickerTitle: {
    marginBottom: theme.spacing.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    margin: theme.spacing.xs,
    ...theme.elevation.xs,
  },
  selectedCategoryItem: {
    backgroundColor: theme.colors.primary[500],
  },
  categoryIconContainer: {
    marginRight: theme.spacing.xs,
  },
  categoryLoadingContainer: {
    padding: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  footer: {
    padding: theme.spacing.layout.md, // Meningkatkan padding dari layout.sm ke layout.md
    paddingVertical: theme.spacing.layout.md, // Memastikan padding vertikal juga lebih besar
    backgroundColor: theme.colors.white,
    ...theme.elevation.lg, // Meningkatkan elevasi dari md ke lg
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
  },
  buttonContainer: {
    paddingHorizontal: theme.spacing.layout.sm, // Memberikan ruang di sisi kiri dan kanan
    paddingVertical: theme.spacing.md, // Memberikan ruang di atas dan bawah
  },
  saveButton: {
    height: 56, // Meningkatkan tinggi tombol untuk membuatnya lebih mudah ditekan
    borderRadius: theme.borderRadius.lg, // Meningkatkan border radius
    ...theme.elevation.md, // Menambahkan elevasi untuk efek visual
  },
});
