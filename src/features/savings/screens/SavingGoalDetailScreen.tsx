import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  Animated,
  Easing,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp, useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

import { RootStackParamList } from '../../../core/navigation/types';
import { Typography, Card, Button, SuperiorDialog } from '../../../core/components';
import { theme } from '../../../core/theme';
import {
  getSavingGoal,
  addToSavingGoal,
  deleteSavingGoal,
  SavingGoal
} from '../../../core/services/supabase/savingGoal.service';
import { useSuperiorDialog } from '../../../core/hooks';

const { width: screenWidth } = Dimensions.get('window');

type SavingGoalDetailScreenRouteProp = RouteProp<RootStackParamList, 'SavingGoalDetail'>;
type SavingGoalDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SavingGoalDetail'>;

// Responsive helper functions
const responsiveWidth = (percentage: number) => (screenWidth * percentage) / 100;
const responsiveSpacing = (size: number) => Math.round(screenWidth * (size / 375));
const responsiveFontSize = (size: number) => Math.round(screenWidth * (size / 375));

interface AddAmountModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (amount: number) => void;
  currentAmount: number;
  targetAmount: number;
}

const AddAmountModal: React.FC<AddAmountModalProps> = ({
  visible,
  onClose,
  onAdd,
  currentAmount,
  targetAmount,
}) => {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    if (!numericValue) return '';
    const number = parseInt(numericValue);
    return new Intl.NumberFormat('id-ID').format(number);
  };

  const parseCurrency = (value: string): number => {
    return parseInt(value.replace(/[^\d]/g, '')) || 0;
  };

  const handleAdd = async () => {
    const numericAmount = parseCurrency(amount);
    if (numericAmount <= 0) return;

    setIsLoading(true);
    onAdd(numericAmount);
    setIsLoading(false);
    setAmount('');
    onClose();
  };

  const remainingAmount = targetAmount - currentAmount;
  const quickAmounts = [
    Math.min(50000, remainingAmount),
    Math.min(100000, remainingAmount),
    Math.min(250000, remainingAmount),
    remainingAmount,
  ].filter(amount => amount > 0);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={modalStyles.overlay}>
        <Animated.View style={[modalStyles.container, { transform: [{ scale: 1 }] }]}>
          <LinearGradient
            colors={[theme.colors.white, theme.colors.neutral[50]]}
            style={modalStyles.gradient}
          >
            <View style={modalStyles.header}>
              <Typography variant="h5" weight="700" color={theme.colors.neutral[800]}>
                Tambah Tabungan
              </Typography>
              <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
                <Ionicons name="close" size={24} color={theme.colors.neutral[600]} />
              </TouchableOpacity>
            </View>

            <View style={modalStyles.content}>
              <Typography variant="body2" color={theme.colors.neutral[600]} style={modalStyles.description}>
                Masukkan jumlah yang ingin ditambahkan ke tabungan Anda
              </Typography>

              <View style={modalStyles.inputContainer}>
                <Typography variant="body2" color={theme.colors.neutral[700]} style={modalStyles.inputLabel}>
                  Jumlah Tabungan
                </Typography>
                <View style={modalStyles.currencyInputContainer}>
                  <Typography variant="h6" color={theme.colors.neutral[600]} style={modalStyles.currencySymbol}>
                    Rp
                  </Typography>
                  <TextInput
                    style={modalStyles.currencyInput}
                    value={amount}
                    onChangeText={(text: string) => setAmount(formatCurrency(text))}
                    placeholder="0"
                    keyboardType="numeric"
                    placeholderTextColor={theme.colors.neutral[400]}
                  />
                </View>
              </View>

              {quickAmounts.length > 0 && (
                <View style={modalStyles.quickAmountContainer}>
                  <Typography variant="body2" color={theme.colors.neutral[700]} style={modalStyles.quickAmountLabel}>
                    Jumlah Cepat
                  </Typography>
                  <View style={modalStyles.quickAmountGrid}>
                    {quickAmounts.map((quickAmount, index) => (
                      <TouchableOpacity
                        key={index}
                        style={modalStyles.quickAmountButton}
                        onPress={() => setAmount(new Intl.NumberFormat('id-ID').format(quickAmount))}
                      >
                        <Typography variant="caption" color={theme.colors.primary[600]} weight="600">
                          {new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0,
                          }).format(quickAmount)}
                        </Typography>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <View style={modalStyles.actions}>
                <Button
                  title="Batal"
                  variant="outline"
                  onPress={onClose}
                  style={modalStyles.button}
                />
                <Button
                  title="Tambah"
                  variant="primary"
                  onPress={handleAdd}
                  loading={isLoading}
                  disabled={parseCurrency(amount) <= 0}
                  style={modalStyles.button}
                />
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

export const SavingGoalDetailScreen = () => {
  const route = useRoute<SavingGoalDetailScreenRouteProp>();
  const navigation = useNavigation<SavingGoalDetailScreenNavigationProp>();
  const { goalId } = route.params;
  const { dialogState, showError, showSuccess, showDelete, hideDialog } = useSuperiorDialog();

  const [goal, setGoal] = useState<SavingGoal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [progressAnimation] = useState(new Animated.Value(0));

  const loadGoalDetail = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getSavingGoal(goalId);
      if (data) {
        setGoal(data);
        // Animate progress bar
        const progress = Math.min(data.current_amount / data.target_amount, 1);
        Animated.timing(progressAnimation, {
          toValue: progress,
          duration: 1000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }).start();
      } else {
        showError('Error', 'Tujuan tabungan tidak ditemukan');
        navigation.goBack();
      }
    } catch (error) {
      // Error loading goal detail - silently handled
      showError('Error', 'Gagal memuat detail tujuan tabungan');
    } finally {
      setIsLoading(false);
    }
  }, [goalId, progressAnimation, showError, navigation]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadGoalDetail();
    setIsRefreshing(false);
  };

  const handleAddAmount = async (amount: number) => {
    if (!goal) return;

    try {
      const updatedGoal = await addToSavingGoal(goalId, amount);
      if (updatedGoal) {
        setGoal(updatedGoal);

        // Animate progress bar
        const progress = Math.min(updatedGoal.current_amount / updatedGoal.target_amount, 1);
        Animated.timing(progressAnimation, {
          toValue: progress,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }).start();

        if (updatedGoal.is_completed) {
          showSuccess('Selamat!', 'Tujuan tabungan Anda telah tercapai! 🎉');
        } else {
          showSuccess('Berhasil', `Berhasil menambahkan ${new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
          }).format(amount)} ke tabungan`);
        }
      } else {
        showError('Error', 'Gagal menambahkan jumlah tabungan');
      }
    } catch (error) {
      // Error adding amount - silently handled
      showError('Error', 'Gagal menambahkan jumlah tabungan');
    }
  };

  const handleEdit = () => {
    navigation.navigate('EditSavingGoal', { goalId });
  };

  const handleDelete = () => {
    showDelete(
      'Hapus Tujuan Tabungan',
      'Apakah Anda yakin ingin menghapus tujuan tabungan ini? Tindakan ini tidak dapat dibatalkan.',
      async () => {
        try {
          const success = await deleteSavingGoal(goalId);
          if (success) {
            showSuccess('Berhasil', 'Tujuan tabungan berhasil dihapus');
            setTimeout(() => navigation.goBack(), 1500);
          } else {
            showError('Error', 'Gagal menghapus tujuan tabungan');
          }
        } catch (error) {
          // Error deleting goal - silently handled
          showError('Error', 'Gagal menghapus tujuan tabungan');
        }
      }
    );
  };

  useFocusEffect(
    useCallback(() => {
      loadGoalDetail();
    }, [loadGoalDetail])
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.primary[500]} />
          </TouchableOpacity>
          <Typography variant="h4" weight="700" color={theme.colors.primary[500]}>
            Detail Tabungan
          </Typography>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.loadingContainer}>
          <View style={styles.loadingContent}>
            <LinearGradient
              colors={[theme.colors.primary[100], theme.colors.primary[200]]}
              style={styles.loadingIconContainer}
            >
              <MaterialCommunityIcons name="piggy-bank" size={48} color={theme.colors.primary[600]} />
            </LinearGradient>
            <ActivityIndicator size="large" color={theme.colors.primary[500]} style={styles.loadingSpinner} />
            <Typography variant="h6" weight="600" color={theme.colors.neutral[800]} style={styles.loadingTitle}>
              Memuat Detail Tabungan
            </Typography>
            <Typography variant="body2" color={theme.colors.neutral[600]} style={styles.loadingText}>
              Sedang mengambil informasi tujuan tabungan Anda...
            </Typography>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!goal) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.primary[500]} />
          </TouchableOpacity>
          <Typography variant="h4" weight="700" color={theme.colors.primary[500]}>
            Detail Tabungan
          </Typography>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={64} color={theme.colors.danger[500]} />
          <Typography variant="h6" weight="600" color={theme.colors.neutral[800]} style={styles.errorTitle}>
            Tujuan Tabungan Tidak Ditemukan
          </Typography>
          <Typography variant="body2" color={theme.colors.neutral[600]} style={styles.errorText}>
            Tujuan tabungan yang Anda cari tidak dapat ditemukan atau telah dihapus.
          </Typography>
          <Button
            title="Kembali"
            variant="primary"
            onPress={() => navigation.goBack()}
            style={styles.errorButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  const progress = goal.current_amount / goal.target_amount;
  const progressPercentage = Math.min(progress * 100, 100);
  const remainingAmount = Math.max(goal.target_amount - goal.current_amount, 0);
  const isCompleted = goal.is_completed || progress >= 1;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getDaysRemaining = () => {
    const targetDate = new Date(goal.target_date);
    const today = new Date();
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary[500]} />
        </TouchableOpacity>
        <Typography variant="h4" weight="700" color={theme.colors.primary[500]}>
          Detail Tabungan
        </Typography>
        <TouchableOpacity
          onPress={handleEdit}
          style={styles.editButton}
        >
          <Ionicons name="create-outline" size={24} color={theme.colors.primary[600]} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary[500]]}
            tintColor={theme.colors.primary[500]}
          />
        }
      >
        {/* Hero Card */}
        <Card style={styles.heroCard} elevation="lg">
          <LinearGradient
            colors={[goal.color || theme.colors.primary[500], goal.color || theme.colors.primary[700]]}
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.heroContent}>
              <View style={styles.heroIcon}>
                <MaterialCommunityIcons
                  name={(goal.icon as keyof typeof MaterialCommunityIcons.glyphMap) || 'piggy-bank'}
                  size={48}
                  color={theme.colors.white}
                />
              </View>

              <Typography variant="h4" weight="700" color={theme.colors.white} style={styles.heroTitle}>
                {goal.name}
              </Typography>

              {goal.description && (
                <Typography variant="body2" color={theme.colors.white} style={styles.heroDescription}>
                  {goal.description}
                </Typography>
              )}

              <View style={styles.heroStats}>
                <View style={styles.heroStat}>
                  <Typography variant="caption" color={theme.colors.white} style={styles.heroStatLabel}>
                    Terkumpul
                  </Typography>
                  <Typography variant="h5" weight="700" color={theme.colors.white} style={styles.heroStatAmount}>
                    {formatCurrency(goal.current_amount)}
                  </Typography>
                </View>

                <View style={styles.heroStatDivider} />

                <View style={styles.heroStat}>
                  <Typography variant="caption" color={theme.colors.white} style={styles.heroStatLabel}>
                    Target
                  </Typography>
                  <Typography variant="h5" weight="700" color={theme.colors.white} style={styles.heroStatAmount}>
                    {formatCurrency(goal.target_amount)}
                  </Typography>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBackground}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        width: progressAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                          extrapolate: 'clamp',
                        }),
                      }
                    ]}
                  />
                </View>
                <Typography variant="body2" weight="600" color={theme.colors.white} style={styles.progressText}>
                  {progressPercentage.toFixed(1)}%
                </Typography>
              </View>

              {isCompleted && (
                <View style={styles.completedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color={theme.colors.success[500]} />
                  <Typography variant="body2" weight="600" color={theme.colors.success[500]} style={styles.completedText}>
                    Target Tercapai!
                  </Typography>
                </View>
              )}
            </View>
          </LinearGradient>
        </Card>

        {/* Info Cards */}
        <View style={styles.infoGrid}>
          <Card style={styles.infoCard} elevation="sm">
            <View style={styles.infoCardContent}>
              <View style={[styles.infoIcon, { backgroundColor: theme.colors.success[50] }]}>
                <Ionicons name="trending-up" size={24} color={theme.colors.success[500]} />
              </View>
              <Typography variant="body2" color={theme.colors.neutral[600]} style={styles.infoLabel}>
                Progress
              </Typography>
              <Typography variant="h6" weight="600" color={theme.colors.neutral[800]}>
                {progressPercentage.toFixed(1)}%
              </Typography>
            </View>
          </Card>

          <Card style={styles.infoCard} elevation="sm">
            <View style={styles.infoCardContent}>
              <View style={[styles.infoIcon, { backgroundColor: theme.colors.warning[50] }]}>
                <MaterialCommunityIcons name="calendar-clock" size={24} color={theme.colors.warning[500]} />
              </View>
              <Typography variant="body2" color={theme.colors.neutral[600]} style={styles.infoLabel}>
                Sisa Hari
              </Typography>
              <Typography variant="h6" weight="600" color={theme.colors.neutral[800]}>
                {daysRemaining > 0 ? `${daysRemaining} hari` : 'Berakhir'}
              </Typography>
            </View>
          </Card>

          <Card style={styles.infoCard} elevation="sm">
            <View style={styles.infoCardContent}>
              <View style={[styles.infoIcon, { backgroundColor: theme.colors.primary[50] }]}>
                <FontAwesome5 name="coins" size={20} color={theme.colors.primary[500]} />
              </View>
              <Typography variant="body2" color={theme.colors.neutral[600]} style={styles.infoLabel}>
                Sisa Target
              </Typography>
              <Typography variant="h6" weight="600" color={theme.colors.neutral[800]}>
                {formatCurrency(remainingAmount)}
              </Typography>
            </View>
          </Card>

          <Card style={styles.infoCard} elevation="sm">
            <View style={styles.infoCardContent}>
              <View style={[styles.infoIcon, { backgroundColor: theme.colors.info[50] }]}>
                <Ionicons name="calendar" size={24} color={theme.colors.info[500]} />
              </View>
              <Typography variant="body2" color={theme.colors.neutral[600]} style={styles.infoLabel}>
                Target Tanggal
              </Typography>
              <Typography variant="body2" weight="600" color={theme.colors.neutral[800]} style={styles.dateText}>
                {formatDate(goal.target_date)}
              </Typography>
            </View>
          </Card>
        </View>

        {/* Action Buttons */}
        {!isCompleted && (
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={styles.superiorAddButton}
              onPress={() => setShowAddModal(true)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[theme.colors.primary[500], theme.colors.primary[600]]}
                style={styles.addButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.addButtonContent}>
                  <Typography variant="h6" weight="700" color={theme.colors.white} style={styles.addButtonText}>
                    TAMBAH TABUNGAN
                  </Typography>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Danger Zone */}
        <Card style={styles.dangerCard} elevation="sm">
          <View style={styles.dangerHeader}>
            <View style={styles.dangerIcon}>
              <Ionicons name="warning" size={20} color={theme.colors.danger[500]} />
            </View>
            <Typography variant="h6" weight="600" color={theme.colors.danger[500]}>
              Zona Berbahaya
            </Typography>
          </View>

          <Typography variant="body2" color={theme.colors.neutral[600]} style={styles.dangerDescription}>
            Tindakan di bawah ini tidak dapat dibatalkan. Pastikan Anda yakin sebelum melanjutkan.
          </Typography>

          <TouchableOpacity
            style={styles.superiorDeleteButton}
            onPress={handleDelete}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[theme.colors.danger[500], theme.colors.danger[600]]}
              style={styles.deleteButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.deleteButtonContent}>
                <Typography variant="body1" weight="700" color={theme.colors.white} style={styles.deleteButtonText}>
                  HAPUS TUJUAN TABUNGAN
                </Typography>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Card>
      </ScrollView>

      {/* Add Amount Modal */}
      <AddAmountModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddAmount}
        currentAmount={goal.current_amount}
        targetAmount={goal.target_amount}
      />

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

// Modal styles
const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: responsiveSpacing(theme.spacing.layout.md),
  },
  container: {
    width: Math.min(screenWidth - 48, 340),
    borderRadius: responsiveSpacing(theme.borderRadius.xl),
    overflow: 'hidden',
    ...theme.elevation.lg,
  },
  gradient: {
    padding: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: responsiveSpacing(theme.spacing.xl),
    paddingHorizontal: responsiveSpacing(theme.spacing.lg),
    paddingBottom: responsiveSpacing(theme.spacing.md),
  },
  closeButton: {
    padding: responsiveSpacing(theme.spacing.xs),
    borderRadius: responsiveSpacing(theme.borderRadius.md),
    backgroundColor: theme.colors.neutral[100],
  },
  content: {
    paddingHorizontal: responsiveSpacing(theme.spacing.lg),
    paddingBottom: responsiveSpacing(theme.spacing.lg),
  },
  description: {
    textAlign: 'center',
    marginBottom: responsiveSpacing(theme.spacing.lg),
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: responsiveSpacing(theme.spacing.lg),
  },
  inputLabel: {
    marginBottom: responsiveSpacing(theme.spacing.xs),
    fontWeight: '600',
  },
  currencyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral[50],
    borderRadius: responsiveSpacing(theme.borderRadius.lg),
    borderWidth: 2,
    borderColor: theme.colors.neutral[200],
    paddingHorizontal: responsiveSpacing(theme.spacing.md),
    paddingVertical: responsiveSpacing(theme.spacing.sm),
  },
  currencySymbol: {
    marginRight: responsiveSpacing(theme.spacing.sm),
  },
  currencyInput: {
    flex: 1,
    fontSize: responsiveFontSize(16),
    fontWeight: '600',
    color: theme.colors.neutral[800],
    padding: 0,
  },
  quickAmountContainer: {
    marginBottom: responsiveSpacing(theme.spacing.lg),
  },
  quickAmountLabel: {
    marginBottom: responsiveSpacing(theme.spacing.sm),
    fontWeight: '600',
  },
  quickAmountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: responsiveSpacing(theme.spacing.xs),
  },
  quickAmountButton: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: theme.colors.primary[50],
    borderRadius: responsiveSpacing(theme.borderRadius.md),
    paddingVertical: responsiveSpacing(theme.spacing.sm),
    paddingHorizontal: responsiveSpacing(theme.spacing.xs),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary[200],
  },
  actions: {
    flexDirection: 'row',
    gap: responsiveSpacing(theme.spacing.sm),
  },
  button: {
    flex: 1,
  },
});

// Main styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: responsiveSpacing(theme.spacing.layout.sm),
    paddingVertical: responsiveSpacing(theme.spacing.md),
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[100],
    ...theme.elevation.sm,
  },
  backButton: {
    width: responsiveSpacing(40),
    height: responsiveSpacing(40),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: responsiveSpacing(theme.borderRadius.round),
    backgroundColor: 'transparent',
    marginLeft: responsiveSpacing(theme.spacing.xs), // Proper spacing from left edge
  },
  editButton: {
    padding: responsiveSpacing(theme.spacing.xs),
    borderRadius: responsiveSpacing(theme.borderRadius.round),
    backgroundColor: theme.colors.primary[50],
  },
  headerSpacer: {
    width: responsiveSpacing(40),
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsiveSpacing(theme.spacing.layout.lg),
  },
  loadingContent: {
    alignItems: 'center',
    maxWidth: responsiveSpacing(280),
  },
  loadingIconContainer: {
    width: responsiveSpacing(80),
    height: responsiveSpacing(80),
    borderRadius: responsiveSpacing(40),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsiveSpacing(theme.spacing.lg),
    ...theme.elevation.md,
  },
  loadingSpinner: {
    marginVertical: responsiveSpacing(theme.spacing.lg),
  },
  loadingTitle: {
    textAlign: 'center',
    marginBottom: responsiveSpacing(theme.spacing.sm),
  },
  loadingText: {
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsiveSpacing(theme.spacing.layout.lg),
  },
  errorTitle: {
    textAlign: 'center',
    marginTop: responsiveSpacing(theme.spacing.lg),
    marginBottom: responsiveSpacing(theme.spacing.sm),
  },
  errorText: {
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: responsiveSpacing(theme.spacing.xl),
  },
  errorButton: {
    minWidth: responsiveSpacing(120),
  },
  heroCard: {
    margin: responsiveSpacing(theme.spacing.layout.md),
    marginBottom: responsiveSpacing(theme.spacing.lg),
    borderRadius: responsiveSpacing(theme.borderRadius.xl),
    overflow: 'hidden',
  },
  heroGradient: {
    padding: responsiveSpacing(theme.spacing.layout.lg),
  },
  heroContent: {
    alignItems: 'center',
  },
  heroIcon: {
    width: responsiveSpacing(80),
    height: responsiveSpacing(80),
    borderRadius: responsiveSpacing(40),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsiveSpacing(theme.spacing.lg),
    ...theme.elevation.sm,
  },
  heroTitle: {
    textAlign: 'center',
    marginBottom: responsiveSpacing(theme.spacing.sm),
  },
  heroDescription: {
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: responsiveSpacing(theme.spacing.lg),
    lineHeight: 20,
  },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: responsiveSpacing(theme.spacing.xl),
    paddingHorizontal: responsiveSpacing(theme.spacing.md),
  },
  heroStat: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: responsiveSpacing(theme.spacing.sm),
  },
  heroStatLabel: {
    opacity: 0.8,
    marginBottom: responsiveSpacing(theme.spacing.sm),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: responsiveFontSize(12),
  },
  heroStatAmount: {
    textAlign: 'center',
    lineHeight: responsiveFontSize(24),
    fontSize: responsiveFontSize(18),
    paddingHorizontal: responsiveSpacing(theme.spacing.xs),
  },
  heroStatDivider: {
    width: 1,
    height: responsiveSpacing(40),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: responsiveSpacing(theme.spacing.sm),
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: responsiveSpacing(theme.spacing.lg),
  },
  progressBackground: {
    width: '100%',
    height: responsiveSpacing(8),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: responsiveSpacing(4),
    overflow: 'hidden',
    marginBottom: responsiveSpacing(theme.spacing.sm),
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.white,
    borderRadius: responsiveSpacing(4),
    ...theme.elevation.sm,
  },
  progressText: {
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    paddingHorizontal: responsiveSpacing(theme.spacing.md),
    paddingVertical: responsiveSpacing(theme.spacing.sm),
    borderRadius: responsiveSpacing(theme.borderRadius.round),
    ...theme.elevation.sm,
  },
  completedText: {
    marginLeft: responsiveSpacing(theme.spacing.xs),
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: responsiveSpacing(theme.spacing.layout.md),
    gap: responsiveSpacing(theme.spacing.md),
    marginBottom: responsiveSpacing(theme.spacing.lg),
  },
  infoCard: {
    flex: 1,
    minWidth: responsiveWidth(42),
    borderRadius: responsiveSpacing(theme.borderRadius.lg),
    backgroundColor: theme.colors.white,
  },
  infoCardContent: {
    padding: responsiveSpacing(theme.spacing.lg),
    alignItems: 'center',
  },
  infoIcon: {
    width: responsiveSpacing(48),
    height: responsiveSpacing(48),
    borderRadius: responsiveSpacing(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsiveSpacing(theme.spacing.md),
  },
  infoLabel: {
    textAlign: 'center',
    marginBottom: responsiveSpacing(theme.spacing.xs),
    fontWeight: '500',
  },
  dateText: {
    textAlign: 'center',
    lineHeight: 18,
  },
  actionContainer: {
    paddingHorizontal: responsiveSpacing(theme.spacing.layout.md),
    marginBottom: responsiveSpacing(theme.spacing.xl), // Increased bottom margin
    marginTop: responsiveSpacing(theme.spacing.md), // Added top margin
  },
  addButton: {
    borderRadius: responsiveSpacing(theme.borderRadius.lg),
    paddingVertical: responsiveSpacing(theme.spacing.md),
  },
  // Superior Add Button Styles
  superiorAddButton: {
    borderRadius: responsiveSpacing(theme.borderRadius.xl),
    overflow: 'hidden',
    minHeight: responsiveSpacing(64), // Increased height
    ...theme.elevation.lg,
  },
  addButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: responsiveSpacing(theme.spacing.xl), // Increased vertical padding
    paddingHorizontal: responsiveSpacing(theme.spacing.xxl), // Increased horizontal padding
    minHeight: responsiveSpacing(64), // Ensure minimum height
  },
  addButtonContent: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: responsiveSpacing(32), // Ensure content has minimum height
  },
  addButtonText: {
    textAlign: 'center', // Ensure horizontal center alignment
    textAlignVertical: 'center', // Ensure vertical center alignment
    letterSpacing: 0.8, // Slightly increased letter spacing
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    fontSize: responsiveFontSize(18), // Increased font size
    lineHeight: responsiveFontSize(22), // Better line height
    includeFontPadding: false, // Remove extra font padding for better centering
  },
  dangerCard: {
    margin: responsiveSpacing(theme.spacing.layout.md),
    marginTop: responsiveSpacing(theme.spacing.xl),
    borderRadius: responsiveSpacing(theme.borderRadius.lg),
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.danger[200],
    padding: responsiveSpacing(theme.spacing.lg),
  },
  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveSpacing(theme.spacing.md),
  },
  dangerIcon: {
    width: responsiveSpacing(32),
    height: responsiveSpacing(32),
    borderRadius: responsiveSpacing(16),
    backgroundColor: theme.colors.danger[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: responsiveSpacing(theme.spacing.sm),
  },
  dangerDescription: {
    lineHeight: 20,
    marginBottom: responsiveSpacing(theme.spacing.lg),
  },
  deleteButton: {
    borderColor: theme.colors.danger[500],
    borderRadius: responsiveSpacing(theme.borderRadius.lg),
  },
  // Superior Delete Button Styles
  superiorDeleteButton: {
    borderRadius: responsiveSpacing(theme.borderRadius.xl),
    overflow: 'hidden',
    marginTop: responsiveSpacing(theme.spacing.sm),
    ...theme.elevation.md,
  },
  deleteButtonGradient: {
    paddingVertical: responsiveSpacing(theme.spacing.lg),
    paddingHorizontal: responsiveSpacing(theme.spacing.xl),
  },
  deleteButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});