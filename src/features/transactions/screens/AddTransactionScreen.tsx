import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  ActivityIndicator,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { Button as PaperButton, Dialog, Portal } from 'react-native-paper';
import { Typography, Input, Card, LocationPicker } from '../../../core/components';
import { theme } from '../../../core/theme';
import { formatCurrency, formatDate } from '../../../core/utils';
import { Ionicons } from '@expo/vector-icons';
import { useNotificationManager } from '../../../core/hooks';

// Tipe data untuk form transaksi
interface TransactionFormData {
  amount: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: Date;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  } | null;
}

// Kategori akan diambil dari Supabase
import { supabase } from '../../../config/supabase';

// Tipe untuk kategori
interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
}

export const AddTransactionScreen = () => {
  const navigation = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const { checkSpecificBudget, updateGoalProgress } = useNotificationManager();

  // Tidak perlu animasi lagi

  // Fungsi untuk memuat kategori dari Supabase
  const loadCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      if (data) {
        setCategories(data as Category[]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // Memuat kategori saat komponen dimount
  React.useEffect(() => {
    loadCategories();
  }, []);

  // const { getCurrentLocation } = useLocation();

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<TransactionFormData>({
    defaultValues: {
      amount: '',
      type: 'expense',
      category: '',
      description: '',
      date: new Date(),
      location: null,
    }
  });

  const selectedDate = watch('date');
  const selectedCategory = watch('category');
  const selectedLocation = watch('location');

  // Fungsi untuk menangani submit form
  const onSubmit = async (data: TransactionFormData) => {
    try {
      setIsSubmitting(true);

      // Konversi amount dari string ke number
      const amount = parseFloat(data.amount.replace(/[^0-9]/g, ''));

      // Validasi amount
      if (isNaN(amount) || amount <= 0) {
        Alert.alert('Error', 'Jumlah harus lebih dari 0');
        return;
      }

      // Validasi kategori
      if (!data.category) {
        Alert.alert('Error', 'Kategori harus dipilih');
        return;
      }

      // Simulasi submit
      console.log('Submitting transaction:', {
        ...data,
        amount,
      });

      // Simulasi delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Setelah transaksi berhasil disimpan, cek budget dan saving goals
      if (data.type === 'expense') {
        // Cek budget alert untuk kategori ini
        await checkSpecificBudget(data.category, 1000000); // Contoh budget amount
      }

      // Jika ada saving goal terkait, update progress
      // Contoh: jika ini transaksi income, bisa update saving goal
      if (data.type === 'income') {
        // Update saving goal progress (contoh goal ID)
        // await updateGoalProgress('goal-id', newAmount);
      }

      Alert.alert(
        'Sukses',
        'Transaksi berhasil disimpan',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting transaction:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat menyimpan transaksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fungsi untuk menangani pemilihan lokasi
  const handleLocationSelect = (location: {
    latitude: number;
    longitude: number;
    address?: string;
  } | null) => {
    setValue('location', location);
    setShowLocationPicker(false);
  };

  // Fungsi untuk mendapatkan lokasi saat ini - akan digunakan nanti
  // const handleGetCurrentLocation = async () => {
  //   const currentLocation = await getCurrentLocation();
  //
  //   if (currentLocation) {
  //     setValue('location', {
  //       latitude: currentLocation.latitude,
  //       longitude: currentLocation.longitude,
  //     });
  //   }
  // };

  // Fungsi untuk menangani perubahan tanggal
  const handleDateChange = (selectedDate: Date) => {
    setShowDatePicker(false);
    setValue('date', selectedDate);
  };

  // Fungsi untuk menangani perubahan tipe transaksi
  const handleTypeChange = (type: 'income' | 'expense') => {
    setTransactionType(type);
    setValue('type', type);
    setValue('category', ''); // Reset kategori saat tipe berubah
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

  // Render tipe transaksi selector
  const renderTypeSelector = () => (
    <View style={styles.typeContainer}>
      <TouchableOpacity
        style={[
          styles.typeButton,
          transactionType === 'expense' && styles.activeTypeButton,
        ]}
        onPress={() => handleTypeChange('expense')}
        activeOpacity={0.8}
      >
        <View style={styles.typeButtonContent}>
          <Ionicons
            name="arrow-up"
            size={20}
            color={transactionType === 'expense' ? theme.colors.white : '#F44336'}
            style={styles.typeIcon}
          />
          <Text
            style={{
              fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
              fontSize: 16,
              fontWeight: '600',
              color: transactionType === 'expense' ? theme.colors.white : '#212121',
              lineHeight: 28,
              paddingBottom: 4,
              includeFontPadding: false,
              textAlignVertical: 'center',
            }}
          >
            Pengeluaran
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.typeButton,
          transactionType === 'income' && styles.activeIncomeButton,
        ]}
        onPress={() => handleTypeChange('income')}
        activeOpacity={0.8}
      >
        <View style={styles.typeButtonContent}>
          <Ionicons
            name="arrow-down"
            size={20}
            color={transactionType === 'income' ? theme.colors.white : '#26A69A'}
            style={styles.typeIcon}
          />
          <Text
            style={{
              fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
              fontSize: 16,
              fontWeight: '600',
              color: transactionType === 'income' ? theme.colors.white : '#212121',
              lineHeight: 28,
              paddingBottom: 4,
              includeFontPadding: false,
              textAlignVertical: 'center',
            }}
          >
            Pemasukan
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  // Render kategori picker
  const renderCategoryPicker = () => {
    const filteredCategories = categories.filter(cat => cat.type === transactionType);

    return (
      <View style={styles.categoryPickerContainer}>
        <Typography variant="body1" style={styles.pickerTitle}>
          Pilih Kategori
        </Typography>

        {isLoadingCategories ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007BFF" />
            <Typography variant="body2">
              Memuat kategori...
            </Typography>
          </View>
        ) : filteredCategories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Typography variant="body2">
              Tidak ada kategori untuk tipe transaksi ini.
            </Typography>
          </View>
        ) : (
          <View style={styles.categoryGrid}>
            {filteredCategories.map(category => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryItem,
                  selectedCategory === category.id && styles.selectedCategoryItem,
                ]}
                onPress={() => handleCategorySelect(category.id)}
              >
                <Typography
                  variant="body2"
                  color={selectedCategory === category.id ? theme.colors.white : theme.colors.neutral[700]}
                >
                  {category.name}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.headerGradient}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color={theme.colors.white} />
            </TouchableOpacity>

            <Typography variant="h5" color={theme.colors.white} weight="600">
              Tambah Transaksi
            </Typography>

            <View style={styles.headerRight} />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card style={styles.card}>
            {renderTypeSelector()}

            <View style={{ marginBottom: 16 }}>
              <Controller
                control={control}
                rules={{
                  required: 'Jumlah harus diisi',
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Jumlah"
                    labelStyle={{ color: '#212121', fontWeight: '500' }}
                    placeholder="Masukkan jumlah"
                    placeholderTextColor="#BDBDBD"
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
                    leftIcon={
                      <Ionicons
                        name="cash-outline"
                        size={20}
                        color="#2196F3"
                      />
                    }
                    inputStyle={styles.amountInput}
                  />
                )}
                name="amount"
              />
            </View>

            <View>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowCategoryPicker(!showCategoryPicker)}
                activeOpacity={0.7}
              >
                <View style={styles.pickerLabelContainer}>
                  <Ionicons
                    name="pricetag-outline"
                    size={20}
                    color="#2196F3"
                    style={styles.pickerIcon}
                  />
                  <Typography variant="body1" weight="500" color="#212121">
                    Kategori
                  </Typography>
                </View>
                <View style={styles.pickerValueContainer}>
                  <Typography
                    variant="body1"
                    color={selectedCategory ? theme.colors.neutral[900] : theme.colors.neutral[400]}
                  >
                    {selectedCategory ? getCategoryName(selectedCategory) : 'Pilih kategori'}
                  </Typography>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={theme.colors.neutral[400]}
                  />
                </View>
              </TouchableOpacity>
            </View>

            {showCategoryPicker && renderCategoryPicker()}

            <View style={{ marginTop: 8 }}>
              <Controller
                control={control}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Deskripsi"
                    labelStyle={{ color: '#212121', fontWeight: '500' }}
                    placeholder="Masukkan deskripsi (opsional)"
                    placeholderTextColor="#BDBDBD"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    multiline
                    leftIcon={
                      <Ionicons
                        name="document-text-outline"
                        size={20}
                        color="#2196F3"
                      />
                    }
                  />
                )}
                name="description"
              />
            </View>

            <View style={{ marginTop: 8 }}>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <View style={styles.pickerLabelContainer}>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color="#2196F3"
                    style={styles.pickerIcon}
                  />
                  <Typography variant="body1" weight="500" color="#212121">
                    Tanggal
                  </Typography>
                </View>
                <View style={styles.pickerValueContainer}>
                  <Typography variant="body1" color={theme.colors.neutral[900]}>
                    {formatDate(selectedDate, { format: 'medium' })}
                  </Typography>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={theme.colors.neutral[400]}
                  />
                </View>
              </TouchableOpacity>
            </View>

            <Portal>
              <Dialog visible={showDatePicker} onDismiss={() => setShowDatePicker(false)}>
                <Dialog.Title>Pilih Tanggal</Dialog.Title>
                <Dialog.Content>
                  <View style={styles.datePickerContainer}>
                    {/* Tampilkan tanggal dalam format yang mudah dibaca */}
                    <Typography variant="h4" style={styles.selectedDate}>
                      {formatDate(selectedDate, { format: 'full' })}
                    </Typography>

                    {/* Tombol untuk mengubah tanggal */}
                    <View style={styles.dateControls}>
                      <View style={styles.dateControlRow}>
                        <PaperButton
                          mode="outlined"
                          onPress={() => {
                            const newDate = new Date(selectedDate);
                            newDate.setDate(newDate.getDate() - 1);
                            handleDateChange(newDate);
                          }}
                          style={styles.dateButton}
                          icon="chevron-left"
                        >
                          Hari Sebelumnya
                        </PaperButton>
                      </View>

                      <View style={styles.dateControlRow}>
                        <PaperButton
                          mode="contained"
                          onPress={() => {
                            const today = new Date();
                            handleDateChange(today);
                          }}
                          style={styles.dateButton}
                          icon="calendar-today"
                        >
                          Hari Ini
                        </PaperButton>
                      </View>

                      <View style={styles.dateControlRow}>
                        <PaperButton
                          mode="outlined"
                          disabled={selectedDate.toDateString() === new Date().toDateString()}
                          onPress={() => {
                            const newDate = new Date(selectedDate);
                            newDate.setDate(newDate.getDate() + 1);
                            const today = new Date();
                            if (newDate <= today) {
                              handleDateChange(newDate);
                            }
                          }}
                          style={styles.dateButton}
                          icon="chevron-right"
                        >
                          Hari Berikutnya
                        </PaperButton>
                      </View>
                    </View>
                  </View>
                </Dialog.Content>
                <Dialog.Actions>
                  <PaperButton onPress={() => setShowDatePicker(false)}>Tutup</PaperButton>
                </Dialog.Actions>
              </Dialog>
            </Portal>

            <View style={{ marginTop: 8 }}>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowLocationPicker(true)}
                activeOpacity={0.7}
              >
                <View style={styles.pickerLabelContainer}>
                  <Ionicons
                    name="location-outline"
                    size={20}
                    color="#2196F3"
                    style={styles.pickerIcon}
                  />
                  <Typography variant="body1" weight="500" color="#212121">
                    Lokasi
                  </Typography>
                </View>
                <View style={styles.pickerValueContainer}>
                  <Typography
                    variant="body1"
                    color={selectedLocation ? theme.colors.neutral[900] : theme.colors.neutral[400]}
                  >
                    {selectedLocation ? (selectedLocation.address !== null ? selectedLocation.address : 'Lokasi dipilih') : 'Pilih lokasi (opsional)'}
                  </Typography>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={theme.colors.neutral[400]}
                  />
                </View>
              </TouchableOpacity>
            </View>
          </Card>
        </ScrollView>

        <View style={styles.footer}>
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

        <Modal
          visible={showLocationPicker}
          animationType="slide"
          onRequestClose={() => setShowLocationPicker(false)}
        >
          <LocationPicker
            initialLocation={selectedLocation}
            onLocationSelected={handleLocationSelect}
            onCancel={() => setShowLocationPicker(false)}
          />
        </Modal>
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
  headerGradient: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    ...theme.elevation.none, // Menghilangkan bayangan
    backgroundColor: '#2196F3',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 56,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'transparent', // Menghilangkan background
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 16, // Menambahkan padding horizontal
    paddingTop: 12, // Menambahkan padding top
    paddingBottom: 0,
  },
  card: {
    padding: 20, // Meningkatkan padding dalam card
    borderRadius: 16,
    ...theme.elevation.md,
    marginTop: 0,
    marginBottom: 0,
  },
  typeContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    borderRadius: 8,
    overflow: 'hidden',
    marginHorizontal: 0,
    marginTop: 0,
    minHeight: 60,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    marginHorizontal: 4,
    borderRadius: 8,
    ...theme.elevation.xs,
    minHeight: 60,
  },
  typeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    minHeight: 44,
  },
  typeIcon: {
    marginRight: 8,
  },
  activeTypeButton: {
    backgroundColor: '#F44336', // Warna merah sesuai gambar
    ...theme.elevation.sm,
  },
  activeIncomeButton: {
    backgroundColor: '#26A69A', // Warna hijau sesuai gambar
    ...theme.elevation.sm,
  },
  amountInput: {
    fontSize: 16,
    fontWeight: '500',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    marginBottom: 8,
  },
  pickerLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerIcon: {
    marginRight: 8,
    color: theme.colors.primary[500],
  },
  categoryPickerContainer: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.neutral[100],
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    ...theme.elevation.xs,
  },
  pickerTitle: {
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryItem: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.md,
    margin: theme.spacing.xs,
    ...theme.elevation.xs,
  },
  selectedCategoryItem: {
    backgroundColor: theme.colors.primary[500],
    ...theme.elevation.sm,
  },
  // Style untuk date picker
  datePickerContainer: {
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  selectedDate: {
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  dateControls: {
    flexDirection: 'column',
    width: '100%',
    gap: theme.spacing.sm,
  },
  dateControlRow: {
    width: '100%',
    marginBottom: theme.spacing.xs,
  },
  dateButton: {
    width: '100%',
    borderRadius: theme.borderRadius.md,
  },
  footer: {
    padding: 0, // Menghilangkan padding
    paddingVertical: 10, // Hanya memberikan padding vertikal
    backgroundColor: 'transparent', // Membuat background transparan
    position: 'absolute', // Posisi absolut
    bottom: 0, // Menempel di bagian bawah
    left: 0,
    right: 0,
    ...theme.elevation.none, // Menghilangkan bayangan
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: '#2196F3',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    ...theme.elevation.sm,
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
