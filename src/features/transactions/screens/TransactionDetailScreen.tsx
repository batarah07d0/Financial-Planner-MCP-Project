import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { Typography, Card, SuperiorDialog } from '../../../core/components';
import { theme } from '../../../core/theme';
import { formatCurrency, formatDate } from '../../../core/utils';
import { Category } from '../../../core/services/supabase/types';

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
import { useSensitiveActionAuth } from '../../../core/hooks/useSensitiveActionAuth';
import { supabase } from '../../../config/supabase';

type TransactionDetailRouteProp = RouteProp<{ TransactionDetail: { id: string } }, 'TransactionDetail'>;
type TransactionDetailNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const TransactionDetailScreen = () => {
  const navigation = useNavigation<TransactionDetailNavigationProp>();
  const route = useRoute<TransactionDetailRouteProp>();
  const { id: transactionId } = route.params;
  const { responsiveSpacing } = useAppDimensions();

  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // Animation values
  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const slideAnim = useMemo(() => new Animated.Value(50), []);
  const scaleAnim = useMemo(() => new Animated.Value(0.95), []);

  const { user } = useAuthStore();
  const { fetchTransactions } = useTransactionStore();
  const { dialogState, showSuccess, showError, showConfirm, hideDialog } = useSuperiorDialog();
  const { authenticateEdit, authenticateDelete } = useSensitiveActionAuth({
    showConfirm,
    showError,
  });

  // Animation functions
  const startEntranceAnimation = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, scaleAnim]);

  // Load transaction data
  const loadTransactionData = useCallback(async () => {
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

      // Start entrance animation after data is loaded
      startEntranceAnimation();
    } catch (error) {
      showError('Error', 'Gagal memuat detail transaksi');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  }, [transactionId, showError, navigation, startEntranceAnimation]);

  // Handle delete transaction
  const handleDelete = async () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    await authenticateDelete(
      'transaksi',
      category?.name ? `${transaction?.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} ${category.name}` : 'transaksi ini',
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
          showError('Error', 'Gagal menghapus transaksi');
        } finally {
          setIsDeleting(false);
        }
      }
    );
  };

  // Handle edit transaction
  const handleEdit = async () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    await authenticateEdit(
      'transaksi',
      category?.name ? `${transaction?.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} ${category.name}` : 'transaksi ini',
      () => {
        navigation.navigate('EditTransaction', { id: transactionId });
      }
    );
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
  }, [transactionId, loadTransactionData]);

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
      
      {/* Enhanced Header */}
      <LinearGradient
        colors={[theme.colors.white, theme.colors.neutral[50]]}
        style={[styles.headerGradient, {
          paddingHorizontal: responsiveSpacing(theme.spacing.layout.sm),
          paddingVertical: responsiveSpacing(theme.spacing.lg)
        }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.enhancedBackButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <View style={styles.backButtonContainer}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.primary[500]} />
            </View>
          </TouchableOpacity>

          <View style={styles.titleContainer}>
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
              Detail Transaksi
            </Typography>
            <View style={styles.titleUnderline} />
          </View>

          {/* Spacer untuk menjaga keseimbangan layout */}
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      <Animated.ScrollView
        style={[styles.content, {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: responsiveSpacing(theme.spacing.layout.sm),
          paddingBottom: responsiveSpacing(theme.spacing.layout.lg)
        }}
      >
        {/* Enhanced Amount Card */}
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
            marginBottom: responsiveSpacing(theme.spacing.xl)
          }}
        >
          <Card
            style={styles.enhancedAmountCard}
            elevation="lg"
          >
            <LinearGradient
              colors={
                transaction.type === 'income'
                  ? [theme.colors.success[400], theme.colors.success[600], theme.colors.success[700]]
                  : [theme.colors.danger[400], theme.colors.danger[600], theme.colors.danger[700]]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.enhancedAmountGradient}
            >
              {/* Decorative elements */}
              <View style={styles.decorativeCircle1} />
              <View style={styles.decorativeCircle2} />

              <View style={styles.enhancedAmountIconContainer}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                  style={styles.iconGradientBackground}
                >
                  <Ionicons
                    name={getCategoryIcon()}
                    size={36}
                    color={theme.colors.white}
                  />
                </LinearGradient>
              </View>

              <Typography
                variant="h2"
                weight="800"
                color={theme.colors.white}
                style={styles.enhancedAmountText}
              >
                {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
              </Typography>

              <View style={styles.amountTypeContainer}>
                <View style={styles.amountTypeBadge}>
                  <Typography
                    variant="body1"
                    weight="600"
                    color={theme.colors.white}
                    style={styles.enhancedAmountType}
                  >
                    {transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                  </Typography>
                </View>
              </View>
            </LinearGradient>
          </Card>
        </Animated.View>

        {/* Enhanced Transaction Details */}
        <Card
          style={{
            ...styles.enhancedDetailCard,
            marginBottom: responsiveSpacing(theme.spacing.lg)
          }}
          elevation="md"
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderIcon}>
              <Ionicons name="information-circle" size={24} color={theme.colors.primary[500]} />
            </View>
            <Typography
              variant="h5"
              weight="700"
              color={theme.colors.neutral[800]}
              style={styles.enhancedSectionTitle}
            >
              Informasi Transaksi
            </Typography>
          </View>

          <View style={styles.cardDivider} />

          {/* Enhanced Category */}
          <View style={[styles.enhancedDetailRow, {
            marginBottom: responsiveSpacing(theme.spacing.lg)
          }]}>
            <View style={styles.enhancedDetailLabel}>
              <View style={styles.labelIconContainer}>
                <Ionicons name="pricetag-outline" size={22} color={theme.colors.primary[500]} />
              </View>
              <Typography variant="body1" weight="600" color={theme.colors.neutral[700]} style={styles.enhancedLabelText}>
                Kategori
              </Typography>
            </View>
            <View style={styles.enhancedDetailValue}>
              <View style={styles.enhancedCategoryBadge}>
                <Ionicons
                  name={getCategoryIcon()}
                  size={20}
                  color={getCategoryColor()}
                />
                <Typography
                  variant="body1"
                  weight="700"
                  color={getCategoryColor()}
                  style={styles.enhancedCategoryText}
                >
                  {category?.name || 'Lainnya'}
                </Typography>
              </View>
            </View>
          </View>

          {/* Enhanced Date */}
          <View style={[styles.enhancedDetailRow, {
            marginBottom: responsiveSpacing(theme.spacing.lg)
          }]}>
            <View style={styles.enhancedDetailLabel}>
              <View style={styles.labelIconContainer}>
                <Ionicons name="calendar-outline" size={22} color={theme.colors.primary[500]} />
              </View>
              <Typography variant="body1" weight="600" color={theme.colors.neutral[700]} style={styles.enhancedLabelText}>
                Tanggal
              </Typography>
            </View>
            <View style={styles.enhancedDetailValue}>
              <Typography variant="body1" weight="700" color={theme.colors.neutral[800]} style={styles.enhancedValueText}>
                {formatDate(transaction.date, { format: 'full' })}
              </Typography>
            </View>
          </View>

          {/* Enhanced Description */}
          {transaction.description && (
            <View style={[styles.enhancedDetailRow, {
              marginBottom: responsiveSpacing(theme.spacing.lg)
            }]}>
              <View style={styles.enhancedDetailLabel}>
                <View style={styles.labelIconContainer}>
                  <Ionicons name="document-text-outline" size={22} color={theme.colors.primary[500]} />
                </View>
                <Typography variant="body1" weight="600" color={theme.colors.neutral[700]} style={styles.enhancedLabelText}>
                  Deskripsi
                </Typography>
              </View>
              <View style={styles.enhancedDetailValue}>
                <Typography
                  variant="body1"
                  weight="600"
                  color={theme.colors.neutral[800]}
                  style={styles.enhancedDescriptionText}
                >
                  {transaction.description}
                </Typography>
              </View>
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
                  }}
                >
                  <Ionicons name="map" size={16} color={theme.colors.primary[500]} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Card>

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

        {/* Action Buttons */}
        <Animated.View
          style={[
            styles.actionButtonsContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
              marginBottom: responsiveSpacing(theme.spacing.layout.lg)
            }
          ]}
        >
          {/* Edit Button */}
          <TouchableOpacity
            onPress={handleEdit}
            style={[styles.actionButton, styles.editActionButton, {
              marginBottom: responsiveSpacing(theme.spacing.md)
            }]}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <View style={styles.actionButtonContent}>
              <Ionicons name="create-outline" size={22} color={theme.colors.white} />
              <Typography
                variant="body1"
                weight="600"
                color={theme.colors.white}
                style={styles.actionButtonText}
              >
                Edit Transaksi
              </Typography>
            </View>
          </TouchableOpacity>

          {/* Delete Button */}
          <TouchableOpacity
            onPress={handleDelete}
            style={[styles.actionButton, styles.deleteActionButton]}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            disabled={isDeleting}
          >
            <View style={styles.actionButtonContent}>
              {isDeleting ? (
                <ActivityIndicator size="small" color={theme.colors.white} />
              ) : (
                <Ionicons name="trash-outline" size={22} color={theme.colors.white} />
              )}
              <Typography
                variant="body1"
                weight="600"
                color={theme.colors.white}
                style={styles.actionButtonText}
              >
                {isDeleting ? 'Menghapus...' : 'Hapus Transaksi'}
              </Typography>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </Animated.ScrollView>

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
    marginLeft: theme.spacing.xs, 
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

  // Enhanced Header Styles
  headerGradient: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[100],
    ...theme.elevation.sm,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  enhancedBackButton: {
    padding: theme.spacing.sm,
  },
  backButtonContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: theme.spacing.md,
    minHeight: 40, 
  },
  headerTitle: {
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  titleUnderline: {
    width: 40,
    height: 3,
    backgroundColor: theme.colors.primary[500],
    borderRadius: 2,
    marginTop: theme.spacing.xs,
  },
  enhancedAmountCard: {
    overflow: 'hidden',
    marginTop: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    ...theme.elevation.lg,
  },
  enhancedAmountGradient: {
    padding: theme.spacing.xl * 1.5,
    alignItems: 'center',
    position: 'relative',
    minHeight: 200,
    justifyContent: 'center',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  enhancedAmountIconContainer: {
    marginBottom: theme.spacing.lg,
  },
  iconGradientBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  enhancedAmountText: {
    marginBottom: theme.spacing.md,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  amountTypeContainer: {
    alignItems: 'center',
  },
  amountTypeBadge: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.round,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  enhancedAmountType: {
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  enhancedDetailCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginVertical: theme.spacing.sm,
    ...theme.elevation.md,
    borderWidth: 1,
    borderColor: theme.colors.neutral[100],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  cardHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  enhancedSectionTitle: {
    flex: 1,
    letterSpacing: 0.3,
  },
  cardDivider: {
    height: 1,
    backgroundColor: theme.colors.neutral[200],
    marginBottom: theme.spacing.lg,
  },
  enhancedDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: theme.spacing.sm,
  },
  enhancedDetailLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: theme.spacing.md,
  },
  labelIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  enhancedLabelText: {
    flex: 1,
    letterSpacing: 0.2,
  },
  enhancedDetailValue: {
    flex: 1,
    alignItems: 'flex-end',
  },
  enhancedValueText: {
    textAlign: 'right',
    letterSpacing: 0.2,
  },
  enhancedCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: 'transparent',
  },
  enhancedCategoryText: {
    marginLeft: theme.spacing.sm,
    letterSpacing: 0.2,
  },
  enhancedDescriptionText: {
    textAlign: 'right',
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  enhancedLocationContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  enhancedLocationText: {
    flex: 1,
    textAlign: 'right',
    marginRight: theme.spacing.sm,
    letterSpacing: 0.2,
  },
  enhancedMapButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.elevation.xs,
  },

  headerSpacer: {
    width: 40, 
  },

  actionButtonsContainer: {
    flexDirection: 'column',
  },
  actionButton: {
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
  actionButtonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  actionButtonText: {
    letterSpacing: 0.3,
  },
  editActionButton: {
    backgroundColor: theme.colors.primary[500],
  },
  deleteActionButton: {
    backgroundColor: theme.colors.danger[500],
  },
});
