import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import * as Haptics from 'expo-haptics';

import { Typography, TextInput, SuperiorDialog } from '../../../core/components';
import { theme } from '../../../core/theme';
import { formatCurrency } from '../../../core/utils';
import { Category } from '../../../core/services/supabase/types';
import { RootStackParamList } from '../../../core/navigation/types';
import { updateTransaction } from '../../../core/services/supabase/transaction.service';
import { getCategories } from '../../../core/services/supabase/category.service';
import { useAuthStore, useTransactionStore } from '../../../core/services/store';
import { useSuperiorDialog } from '../../../core/hooks';
import { useAppDimensions } from '../../../core/hooks/useAppDimensions';
import { supabase } from '../../../config/supabase';

// Extended Transaction interface to match database structure
interface TransactionDetail {
  id: string;
  user_id: string;
  amount: number;
  type: 'income' | 'expense';
  category_id: string;
  description?: string;
  date: string;
  payment_method?: string;
  location_lat?: number;
  location_lng?: number;
  location_name?: string;
  receipt_image_url?: string;
  is_recurring?: boolean;
  recurring_frequency?: string;
  recurring_end_date?: string;
  created_at: string;
  updated_at: string;
}

// Form data interface
interface EditTransactionFormData {
  amount: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: Date;
  payment_method: string;
}

type EditTransactionRouteProp = RouteProp<{ EditTransaction: { id: string } }, 'EditTransaction'>;
type EditTransactionNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const EditTransactionScreen = () => {
  const navigation = useNavigation<EditTransactionNavigationProp>();
  const route = useRoute<EditTransactionRouteProp>();
  const { id: transactionId } = route.params;
  const { responsiveSpacing } = useAppDimensions();

  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useAuthStore();
  const { fetchTransactions } = useTransactionStore();
  const { dialogState, showSuccess, showError, hideDialog } = useSuperiorDialog();

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<EditTransactionFormData>({
    defaultValues: {
      amount: '0',
      type: 'expense',
      category: '',
      description: '',
      date: new Date(),
      payment_method: '',
    }
  });

  // Load transaction and categories data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Get transaction details
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (transactionError) throw transactionError;
      if (!transactionData) throw new Error('Transaksi tidak ditemukan');

      setTransaction(transactionData as TransactionDetail);

      // Get categories
      const categoriesData = await getCategories();
      setCategories(categoriesData);

      // Set form values with proper defaults
      setValue('amount', transactionData.amount ? transactionData.amount.toString() : '0');
      setValue('type', transactionData.type || 'expense');
      setValue('category', transactionData.category_id || '');
      setValue('description', transactionData.description || '');
      setValue('date', transactionData.date ? new Date(transactionData.date) : new Date());
      setValue('payment_method', transactionData.payment_method || '');

    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Error loading data:', error);
      }
      showError('Error', 'Gagal memuat data transaksi');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  }, [transactionId, setValue, showError, navigation]);

  // Handle form submission
  const onSubmit = async (data: EditTransactionFormData) => {
    try {
      setIsSubmitting(true);

      if (!user) {
        showError('Error', 'Pengguna tidak terautentikasi');
        return;
      }

      const amount = parseFloat(data.amount.replace(/[^\d]/g, ''));
      if (isNaN(amount) || amount <= 0) {
        showError('Error', 'Jumlah tidak valid');
        return;
      }

      // Prepare update data
      const updateData = {
        amount: amount,
        type: data.type,
        category_id: data.category,
        description: data.description || '',
        date: data.date.toISOString(),
        payment_method: data.payment_method || null,
        updated_at: new Date().toISOString(),
      };

      // Update transaction
      await updateTransaction(transactionId, updateData);

      // Refresh transactions list
      if (user) {
        await fetchTransactions(user.id);
      }

      showSuccess('Berhasil', 'Transaksi berhasil diperbarui');
      setTimeout(() => navigation.goBack(), 1500);

    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Error updating transaction:', error);
      }
      showError('Error', 'Gagal memperbarui transaksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.goBack();
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          <Typography 
            variant="body1" 
            color={theme.colors.neutral[600]} 
            style={styles.loadingText}
          >
            Memuat data transaksi...
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  if (!transaction) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={theme.colors.danger[500]} />
          <Typography variant="h5" weight="600" color={theme.colors.neutral[800]} style={styles.errorTitle}>
            Transaksi Tidak Ditemukan
          </Typography>
          <Typography variant="body1" color={theme.colors.neutral[600]} style={styles.errorText}>
            Transaksi yang ingin Anda edit tidak dapat ditemukan.
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />
      
      {/* Header */}
      <View style={{
        ...styles.header,
        paddingHorizontal: responsiveSpacing(theme.spacing.layout.sm),
        paddingVertical: responsiveSpacing(theme.spacing.md)
      }}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary[500]} />
        </TouchableOpacity>
        
        <Typography variant="h5" weight="700" color={theme.colors.primary[500]} style={{ fontSize: 20, textAlign: 'center' }}>
          Edit Transaksi
        </Typography>
        
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: responsiveSpacing(theme.spacing.layout.sm),
          paddingBottom: responsiveSpacing(120) // Memberikan ruang yang cukup untuk tombol simpan
        }}
      >
        {/* Amount Card */}
        <View style={{
          ...styles.formCard,
          marginBottom: responsiveSpacing(theme.spacing.lg)
        }}>
          <Typography 
            variant="h6" 
            weight="600" 
            color={theme.colors.neutral[800]}
            style={{
              ...styles.sectionTitle,
              marginBottom: responsiveSpacing(theme.spacing.md)
            }}
          >
            Jumlah
          </Typography>

          <Controller
            control={control}
            name="amount"
            rules={{ required: 'Jumlah harus diisi' }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Jumlah"
                value={value}
                onChangeText={(text) => {
                  const numericValue = text.replace(/[^\d]/g, '');
                  const formattedValue = formatCurrency(parseInt(numericValue) || 0);
                  onChange(formattedValue);
                }}
                placeholder="Rp 0"
                keyboardType="numeric"
                error={errors.amount?.message}
                leftIcon={<Ionicons name="cash-outline" size={20} color={theme.colors.neutral[500]} />}
              />
            )}
          />
        </View>

        {/* Type Selection */}
        <View style={{
          ...styles.formCard,
          marginBottom: responsiveSpacing(theme.spacing.lg)
        }}>
          <Typography 
            variant="h6" 
            weight="600" 
            color={theme.colors.neutral[800]}
            style={{
              ...styles.sectionTitle,
              marginBottom: responsiveSpacing(theme.spacing.md)
            }}
          >
            Tipe Transaksi
          </Typography>

          <Controller
            control={control}
            name="type"
            render={({ field: { onChange, value } }) => (
              <View style={styles.typeContainer}>
                <TouchableOpacity
                  style={{
                    ...styles.typeButton,
                    ...(value === 'income' && styles.selectedTypeButton),
                    backgroundColor: value === 'income' ? theme.colors.success[50] : theme.colors.neutral[100]
                  }}
                  onPress={() => onChange('income')}
                >
                  <Ionicons 
                    name="arrow-down-circle" 
                    size={24} 
                    color={value === 'income' ? theme.colors.success[500] : theme.colors.neutral[500]} 
                  />
                  <Typography 
                    variant="body1" 
                    weight={value === 'income' ? '600' : '400'}
                    color={value === 'income' ? theme.colors.success[500] : theme.colors.neutral[600]}
                    style={styles.typeText}
                  >
                    Pemasukan
                  </Typography>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    ...styles.typeButton,
                    ...(value === 'expense' && styles.selectedTypeButton),
                    backgroundColor: value === 'expense' ? theme.colors.danger[50] : theme.colors.neutral[100]
                  }}
                  onPress={() => onChange('expense')}
                >
                  <Ionicons 
                    name="arrow-up-circle" 
                    size={24} 
                    color={value === 'expense' ? theme.colors.danger[500] : theme.colors.neutral[500]} 
                  />
                  <Typography 
                    variant="body1" 
                    weight={value === 'expense' ? '600' : '400'}
                    color={value === 'expense' ? theme.colors.danger[500] : theme.colors.neutral[600]}
                    style={styles.typeText}
                  >
                    Pengeluaran
                  </Typography>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>

        {/* Category Selection */}
        <View style={{
          ...styles.formCard,
          marginBottom: responsiveSpacing(theme.spacing.lg)
        }}>
          <Typography
            variant="h6"
            weight="600"
            color={theme.colors.neutral[800]}
            style={{
              ...styles.sectionTitle,
              marginBottom: responsiveSpacing(theme.spacing.md)
            }}
          >
            Kategori
          </Typography>

          <Controller
            control={control}
            name="category"
            rules={{ required: 'Kategori harus dipilih' }}
            render={({ field: { onChange, value } }) => (
              <View style={styles.categoryGrid}>
                {categories
                  .filter(cat => cat.type === watch('type'))
                  .map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={{
                        ...styles.categoryItem,
                        ...(value === category.id && styles.selectedCategoryItem),
                        backgroundColor: value === category.id ? category.color + '20' : theme.colors.neutral[100]
                      }}
                      onPress={() => onChange(category.id)}
                    >
                      <Ionicons
                        name={(category.icon || 'pricetag-outline') as keyof typeof Ionicons.glyphMap}
                        size={20}
                        color={value === category.id ? category.color : theme.colors.neutral[500]}
                      />
                      <Typography
                        variant="body2"
                        weight={value === category.id ? '600' : '400'}
                        color={value === category.id ? category.color : theme.colors.neutral[600]}
                        style={styles.categoryText}
                        numberOfLines={1}
                      >
                        {category.name}
                      </Typography>
                    </TouchableOpacity>
                  ))}
              </View>
            )}
          />
          {errors.category && (
            <Typography variant="caption" color={theme.colors.danger[500]} style={styles.errorText}>
              {errors.category.message}
            </Typography>
          )}
        </View>

        {/* Description */}
        <View style={{
          ...styles.formCard,
          marginBottom: responsiveSpacing(theme.spacing.lg)
        }}>
          <Typography
            variant="h6"
            weight="600"
            color={theme.colors.neutral[800]}
            style={{
              ...styles.sectionTitle,
              marginBottom: responsiveSpacing(theme.spacing.md)
            }}
          >
            Deskripsi
          </Typography>

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Deskripsi (Opsional)"
                value={value}
                onChangeText={onChange}
                placeholder="Masukkan deskripsi transaksi"
                multiline
                numberOfLines={3}
                leftIcon={<Ionicons name="document-text-outline" size={20} color={theme.colors.neutral[500]} />}
              />
            )}
          />
        </View>

        {/* Payment Method */}
        <View style={{
          ...styles.formCard,
          marginBottom: responsiveSpacing(theme.spacing.lg)
        }}>
          <Typography
            variant="h6"
            weight="600"
            color={theme.colors.neutral[800]}
            style={{
              ...styles.sectionTitle,
              marginBottom: responsiveSpacing(theme.spacing.md)
            }}
          >
            Metode Pembayaran
          </Typography>

          <Controller
            control={control}
            name="payment_method"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Metode Pembayaran (Opsional)"
                value={value}
                onChangeText={onChange}
                placeholder="Contoh: Tunai, Kartu Kredit, Transfer"
                leftIcon={<Ionicons name="card-outline" size={20} color={theme.colors.neutral[500]} />}
              />
            )}
          />
        </View>
      </ScrollView>

      {/* Submit Button */}
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
                SIMPAN PERUBAHAN
              </Typography>
            </View>
          )}
        </TouchableOpacity>
      </View>

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
    padding: theme.spacing.layout.md,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.layout.md,
  },
  errorTitle: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  errorText: {
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
    lineHeight: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
    position: 'relative',
  },
  backButton: {
    padding: theme.spacing.xs,
    position: 'absolute',
    left: 0,
    zIndex: 1,
  },
  content: {
    flex: 1,
  },
  formCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginVertical: theme.spacing.sm,
    ...theme.elevation.sm,
  },
  sectionTitle: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
    paddingBottom: theme.spacing.sm,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
  },
  selectedTypeButton: {
    borderWidth: 2,
  },
  typeText: {
    marginLeft: theme.spacing.sm,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 20,
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    minWidth: '45%',
    flex: 1,
  },
  selectedCategoryItem: {
    borderWidth: 2,
  },
  categoryText: {
    marginLeft: theme.spacing.xs,
    flex: 1,
  },
});
