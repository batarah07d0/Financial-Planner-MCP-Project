import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { Typography, Card, SuperiorDialog } from '../../../core/components';
import { theme } from '../../../core/theme';
import { formatCurrency, formatDate } from '../../../core/utils';
import { Category } from '../../../core/services/supabase/types';

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
import { RootStackParamList } from '../../../core/navigation/types';
import { deleteTransaction } from '../../../core/services/supabase/transaction.service';
import { getCategoryById } from '../../../core/services/supabase/category.service';
import { useAuthStore, useTransactionStore } from '../../../core/services/store';
import { useSuperiorDialog } from '../../../core/hooks';
import { useAppDimensions } from '../../../core/hooks/useAppDimensions';
import { supabase } from '../../../config/supabase';

type TransactionDetailRouteProp = RouteProp<{ TransactionDetail: { id: string } }, 'TransactionDetail'>;
type TransactionDetailNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const TransactionDetailScreen = () => {
  const navigation = useNavigation<TransactionDetailNavigationProp>();
  const route = useRoute<TransactionDetailRouteProp>();
  const { id: transactionId } = route.params;
  const { responsiveSpacing, responsiveFontSize } = useAppDimensions();

  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const { user } = useAuthStore();
  const { fetchTransactions } = useTransactionStore();
  const { dialogState, showSuccess, showError, showDelete, hideDialog } = useSuperiorDialog();

  // Load transaction data
  const loadTransactionData = async () => {
    try {
      setIsLoading(true);

      // Get transaction details directly from Supabase to get all fields
      const { data: transactionData, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (error) throw error;
      if (!transactionData) throw new Error('Transaksi tidak ditemukan');

      setTransaction(transactionData as TransactionDetail);

      // Get category details if category_id exists
      if (transactionData.category_id) {
        try {
          const categoryData = await getCategoryById(transactionData.category_id);
          setCategory(categoryData);
        } catch (error) {
          console.warn('Category not found:', error);
          // Set default category if not found
          setCategory({
            id: transactionData.category_id,
            name: 'Lainnya',
            icon: 'help-circle',
            color: theme.colors.neutral[500],
            type: transactionData.type,
            is_default: false,
            created_at: '',
            updated_at: '',
          });
        }
      }
    } catch (error) {
      console.error('Error loading transaction data:', error);
      showError('Error', 'Gagal memuat detail transaksi');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete transaction
  const handleDelete = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    showDelete(
      'Hapus Transaksi',
      'Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat dibatalkan.',
      async () => {
        try {
          setIsDeleting(true);
          await deleteTransaction(transactionId);
          
          // Refresh transactions list
          if (user) {
            await fetchTransactions(user.id);
          }
          
          showSuccess('Berhasil', 'Transaksi berhasil dihapus');
          setTimeout(() => navigation.goBack(), 1500);
        } catch (error) {
          console.error('Error deleting transaction:', error);
          showError('Error', 'Gagal menghapus transaksi');
        } finally {
          setIsDeleting(false);
        }
      }
    );
  };

  // Handle edit transaction
  const handleEdit = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('EditTransaction', { id: transactionId });
  };

  // Handle back navigation
  const handleBack = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.goBack();
  };

  useEffect(() => {
    loadTransactionData();
  }, [transactionId]);

  // Get category icon
  const getCategoryIcon = () => {
    if (category?.icon) {
      return category.icon as keyof typeof Ionicons.glyphMap;
    }
    
    // Default icons based on transaction type
    return transaction?.type === 'income' ? 'arrow-down-circle' : 'arrow-up-circle';
  };

  // Get category color
  const getCategoryColor = () => {
    if (category?.color) {
      return category.color;
    }
    
    // Default colors based on transaction type
    return transaction?.type === 'income' 
      ? theme.colors.success[500] 
      : theme.colors.danger[500];
  };

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
            Memuat detail transaksi...
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
            Transaksi yang Anda cari tidak dapat ditemukan atau telah dihapus.
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
      <View style={[styles.header, {
        paddingHorizontal: responsiveSpacing(theme.spacing.layout.sm),
        paddingVertical: responsiveSpacing(theme.spacing.md)
      }]}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.neutral[800]} />
        </TouchableOpacity>
        
        <Typography variant="h6" weight="600" color={theme.colors.neutral[800]}>
          Detail Transaksi
        </Typography>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={handleEdit}
            style={[styles.actionButton, { marginRight: responsiveSpacing(theme.spacing.sm) }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="create-outline" size={20} color={theme.colors.primary[500]} />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.actionButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color={theme.colors.danger[500]} />
            ) : (
              <Ionicons name="trash-outline" size={20} color={theme.colors.danger[500]} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: responsiveSpacing(theme.spacing.layout.sm),
          paddingBottom: responsiveSpacing(theme.spacing.layout.lg)
        }}
      >
        {/* Amount Card */}
        <Card
          style={{
            ...styles.amountCard,
            marginBottom: responsiveSpacing(theme.spacing.lg)
          }}
          elevation="md"
        >
          <LinearGradient
            colors={
              transaction.type === 'income'
                ? [theme.colors.success[500], theme.colors.success[600]]
                : [theme.colors.danger[500], theme.colors.danger[600]]
            }
            style={styles.amountGradient}
          >
            <View style={styles.amountIconContainer}>
              <Ionicons
                name={getCategoryIcon()}
                size={32}
                color={theme.colors.white}
              />
            </View>
            
            <Typography 
              variant="h3" 
              weight="700" 
              color={theme.colors.white}
              style={styles.amountText}
            >
              {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
            </Typography>
            
            <Typography 
              variant="body1" 
              color={theme.colors.white}
              style={styles.amountType}
            >
              {transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
            </Typography>
          </LinearGradient>
        </Card>

        {/* Transaction Details */}
        <View style={{
          ...styles.detailCard,
          marginBottom: responsiveSpacing(theme.spacing.lg)
        }}>
          <Typography 
            variant="h6" 
            weight="600" 
            color={theme.colors.neutral[800]}
            style={[styles.sectionTitle, {
              marginBottom: responsiveSpacing(theme.spacing.md)
            }]}
          >
            Informasi Transaksi
          </Typography>

          {/* Category */}
          <View style={[styles.detailRow, {
            marginBottom: responsiveSpacing(theme.spacing.md)
          }]}>
            <View style={styles.detailLabel}>
              <Ionicons name="pricetag-outline" size={20} color={theme.colors.neutral[600]} />
              <Typography variant="body1" color={theme.colors.neutral[600]} style={styles.labelText}>
                Kategori
              </Typography>
            </View>
            <View style={styles.detailValue}>
              <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor() + '20' }]}>
                <Ionicons 
                  name={getCategoryIcon()} 
                  size={16} 
                  color={getCategoryColor()} 
                />
                <Typography 
                  variant="body2" 
                  weight="600" 
                  color={getCategoryColor()}
                  style={styles.categoryText}
                >
                  {category?.name || 'Lainnya'}
                </Typography>
              </View>
            </View>
          </View>

          {/* Date */}
          <View style={[styles.detailRow, {
            marginBottom: responsiveSpacing(theme.spacing.md)
          }]}>
            <View style={styles.detailLabel}>
              <Ionicons name="calendar-outline" size={20} color={theme.colors.neutral[600]} />
              <Typography variant="body1" color={theme.colors.neutral[600]} style={styles.labelText}>
                Tanggal
              </Typography>
            </View>
            <Typography variant="body1" weight="600" color={theme.colors.neutral[800]}>
              {formatDate(transaction.date, { format: 'full' })}
            </Typography>
          </View>

          {/* Description */}
          {transaction.description && (
            <View style={[styles.detailRow, {
              marginBottom: responsiveSpacing(theme.spacing.md)
            }]}>
              <View style={styles.detailLabel}>
                <Ionicons name="document-text-outline" size={20} color={theme.colors.neutral[600]} />
                <Typography variant="body1" color={theme.colors.neutral[600]} style={styles.labelText}>
                  Deskripsi
                </Typography>
              </View>
              <Typography
                variant="body1"
                color={theme.colors.neutral[800]}
                style={styles.descriptionText}
              >
                {transaction.description}
              </Typography>
            </View>
          )}

          {/* Payment Method */}
          {transaction.payment_method && (
            <View style={[styles.detailRow, {
              marginBottom: responsiveSpacing(theme.spacing.md)
            }]}>
              <View style={styles.detailLabel}>
                <Ionicons name="card-outline" size={20} color={theme.colors.neutral[600]} />
                <Typography variant="body1" color={theme.colors.neutral[600]} style={styles.labelText}>
                  Metode Pembayaran
                </Typography>
              </View>
              <Typography variant="body1" weight="600" color={theme.colors.neutral[800]}>
                {transaction.payment_method}
              </Typography>
            </View>
          )}

          {/* Location */}
          {(transaction.location_lat && transaction.location_lng) && (
            <View style={[styles.detailRow, {
              marginBottom: responsiveSpacing(theme.spacing.md)
            }]}>
              <View style={styles.detailLabel}>
                <Ionicons name="location-outline" size={20} color={theme.colors.neutral[600]} />
                <Typography variant="body1" color={theme.colors.neutral[600]} style={styles.labelText}>
                  Lokasi
                </Typography>
              </View>
              <View style={styles.locationContainer}>
                {transaction.location_name ? (
                  <Typography
                    variant="body1"
                    weight="600"
                    color={theme.colors.neutral[800]}
                    style={styles.locationText}
                  >
                    {transaction.location_name}
                  </Typography>
                ) : (
                  <Typography
                    variant="body2"
                    color={theme.colors.neutral[600]}
                    style={styles.locationText}
                  >
                    {transaction.location_lat.toFixed(6)}, {transaction.location_lng.toFixed(6)}
                  </Typography>
                )}
                <TouchableOpacity
                  style={styles.mapButton}
                  onPress={() => {
                    // TODO: Open in maps app
                    console.log('Open location in maps:', transaction.location_lat, transaction.location_lng);
                  }}
                >
                  <Ionicons name="map" size={16} color={theme.colors.primary[500]} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Additional Information */}
        <View style={{
          ...styles.detailCard,
          marginBottom: responsiveSpacing(theme.spacing.lg)
        }}>
          <Typography
            variant="h6"
            weight="600"
            color={theme.colors.neutral[800]}
            style={[styles.sectionTitle, {
              marginBottom: responsiveSpacing(theme.spacing.md)
            }]}
          >
            Informasi Tambahan
          </Typography>

          {/* Created Date */}
          <View style={[styles.detailRow, {
            marginBottom: responsiveSpacing(theme.spacing.md)
          }]}>
            <View style={styles.detailLabel}>
              <Ionicons name="time-outline" size={20} color={theme.colors.neutral[600]} />
              <Typography variant="body1" color={theme.colors.neutral[600]} style={styles.labelText}>
                Dibuat
              </Typography>
            </View>
            <Typography variant="body2" color={theme.colors.neutral[600]}>
              {formatDate(transaction.created_at, { format: 'full', includeTime: true })}
            </Typography>
          </View>

          {/* Updated Date */}
          {transaction.updated_at !== transaction.created_at && (
            <View style={[styles.detailRow, {
              marginBottom: responsiveSpacing(theme.spacing.md)
            }]}>
              <View style={styles.detailLabel}>
                <Ionicons name="refresh-outline" size={20} color={theme.colors.neutral[600]} />
                <Typography variant="body1" color={theme.colors.neutral[600]} style={styles.labelText}>
                  Diperbarui
                </Typography>
              </View>
              <Typography variant="body2" color={theme.colors.neutral[600]}>
                {formatDate(transaction.updated_at, { format: 'full', includeTime: true })}
              </Typography>
            </View>
          )}

          {/* Transaction ID */}
          <View style={styles.detailRow}>
            <View style={styles.detailLabel}>
              <Ionicons name="finger-print-outline" size={20} color={theme.colors.neutral[600]} />
              <Typography variant="body1" color={theme.colors.neutral[600]} style={styles.labelText}>
                ID Transaksi
              </Typography>
            </View>
            <Typography
              variant="body2"
              color={theme.colors.neutral[600]}
              style={styles.transactionId}
            >
              {transaction.id.substring(0, 8)}...
            </Typography>
          </View>
        </View>
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
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: theme.spacing.xs,
  },
  content: {
    flex: 1,
  },
  amountCard: {
    overflow: 'hidden',
    marginTop: theme.spacing.lg,
  },
  amountGradient: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  amountIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  amountText: {
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  amountType: {
    opacity: 0.9,
  },
  detailCard: {
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
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  labelText: {
    marginLeft: theme.spacing.sm,
  },
  detailValue: {
    flex: 1,
    alignItems: 'flex-end',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  categoryText: {
    marginLeft: theme.spacing.xs,
  },
  descriptionText: {
    flex: 1,
    textAlign: 'right',
    lineHeight: 20,
  },
  locationContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  locationText: {
    flex: 1,
    textAlign: 'right',
    marginRight: theme.spacing.sm,
  },
  mapButton: {
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.primary[50],
  },
  transactionId: {
    fontFamily: 'monospace',
  },
});
