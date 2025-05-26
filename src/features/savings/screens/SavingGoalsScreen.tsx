import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { RootStackParamList } from '../../../core/navigation/types';
import { Typography, Card, SuperiorDialog } from '../../../core/components';
import { theme } from '../../../core/theme';
import { useAuthStore } from '../../../core/services/store';
import {
  getSavingGoals,
  deleteSavingGoal,
  SavingGoal
} from '../../../core/services/supabase/savingGoal.service';
import { useSuperiorDialog } from '../../../core/hooks';

type SavingGoalsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SavingGoals'>;

interface SavingGoalItemProps {
  goal: SavingGoal;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const SavingGoalItem: React.FC<SavingGoalItemProps> = ({ goal, onPress, onEdit, onDelete }) => {
  const progressPercentage = (goal.current_amount / goal.target_amount) * 100;
  const isCompleted = goal.is_completed || progressPercentage >= 100;
  const remainingAmount = goal.target_amount - goal.current_amount;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
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
  const isOverdue = daysRemaining < 0;

  return (
    <TouchableOpacity onPress={onPress} style={styles.goalItem} activeOpacity={0.7}>
      <Card style={styles.goalCard} elevation="lg">
        <LinearGradient
          colors={isCompleted
            ? [theme.colors.success[50], theme.colors.success[100]]
            : [theme.colors.white, theme.colors.neutral[50]]
          }
          style={styles.cardGradient}
        >
          <View style={styles.goalHeader}>
            <View style={styles.goalInfo}>
              <View style={[
                styles.iconContainer,
                {
                  backgroundColor: isCompleted
                    ? theme.colors.success[500]
                    : goal.color || theme.colors.primary[500]
                }
              ]}>
                <Ionicons
                  name={isCompleted ? 'trophy' : (goal.icon as any || 'wallet')}
                  size={28}
                  color={theme.colors.white}
                />
              </View>
              <View style={styles.goalDetails}>
                <Typography variant="h5" weight="700" color={theme.colors.neutral[800]}>
                  {goal.name}
                </Typography>
                <View style={styles.dateContainer}>
                  <Ionicons
                    name="calendar-outline"
                    size={14}
                    color={isOverdue ? theme.colors.danger[500] : theme.colors.neutral[600]}
                  />
                  <Typography
                    variant="body2"
                    color={isOverdue ? theme.colors.danger[500] : theme.colors.neutral[600]}
                    style={styles.dateText}
                  >
                    Target: {formatDate(goal.target_date)}
                  </Typography>
                </View>
                {!isCompleted && (
                  <Typography
                    variant="caption"
                    color={isOverdue ? theme.colors.danger[600] : theme.colors.info[600]}
                    weight="600"
                  >
                    {isOverdue
                      ? `Terlambat ${Math.abs(daysRemaining)} hari`
                      : `${daysRemaining} hari lagi`
                    }
                  </Typography>
                )}
              </View>
            </View>
            <View style={styles.goalActions}>
              <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
                <Ionicons name="pencil" size={18} color={theme.colors.neutral[600]} />
              </TouchableOpacity>
              <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
                <Ionicons name="trash" size={18} color={theme.colors.danger[500]} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.amountRow}>
              <View style={styles.amountInfo}>
                <Typography variant="h4" weight="800" color={theme.colors.primary[600]}>
                  {formatCurrency(goal.current_amount)}
                </Typography>
                <Typography variant="body2" color={theme.colors.neutral[600]}>
                  dari {formatCurrency(goal.target_amount)}
                </Typography>
              </View>
              <View style={styles.percentageContainer}>
                <Typography variant="h3" weight="800" color={isCompleted ? theme.colors.success[600] : theme.colors.primary[500]}>
                  {Math.round(progressPercentage)}%
                </Typography>
              </View>
            </View>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <LinearGradient
                colors={isCompleted
                  ? [theme.colors.success[400], theme.colors.success[600]]
                  : [goal.color || theme.colors.primary[400], goal.color || theme.colors.primary[600]]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(progressPercentage, 100)}%` }
                ]}
              />
            </View>
          </View>

          {!isCompleted && remainingAmount > 0 && (
            <View style={styles.remainingSection}>
              <MaterialCommunityIcons name="target" size={16} color={theme.colors.neutral[600]} />
              <Typography variant="body2" color={theme.colors.neutral[700]} weight="600" style={styles.remainingText}>
                Sisa: {formatCurrency(remainingAmount)}
              </Typography>
            </View>
          )}

          {goal.description && (
            <View style={styles.descriptionContainer}>
              <Typography variant="body2" color={theme.colors.neutral[600]} style={styles.description}>
                {goal.description}
              </Typography>
            </View>
          )}

          {isCompleted && (
            <View style={styles.completedBadge}>
              <LinearGradient
                colors={[theme.colors.success[500], theme.colors.success[600]]}
                style={styles.completedBadgeGradient}
              >
                <Ionicons name="trophy" size={16} color={theme.colors.white} />
                <Typography variant="caption" color={theme.colors.white} weight="700">
                  TUJUAN TERCAPAI!
                </Typography>
              </LinearGradient>
            </View>
          )}
        </LinearGradient>
      </Card>
    </TouchableOpacity>
  );
};

export const SavingGoalsScreen = () => {
  const navigation = useNavigation<SavingGoalsScreenNavigationProp>();
  const { user } = useAuthStore();
  const [goals, setGoals] = useState<SavingGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { dialogState, showError, showDelete, showSuccess, hideDialog } = useSuperiorDialog();

  const loadSavingGoals = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const data = await getSavingGoals(user.id);
      if (data) {
        setGoals(data);
      }
    } catch (error) {
      console.error('Error loading saving goals:', error);
      showError('Error', 'Gagal memuat data tujuan tabungan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadSavingGoals();
    setIsRefreshing(false);
  };

  const handleAddGoal = () => {
    navigation.navigate('AddSavingGoal');
  };

  const handleGoalPress = (goal: SavingGoal) => {
    navigation.navigate('SavingGoalDetail', { goalId: goal.id });
  };

  const handleEditGoal = (goal: SavingGoal) => {
    navigation.navigate('EditSavingGoal', { goalId: goal.id });
  };

  const handleDeleteGoal = (goal: SavingGoal) => {
    showDelete(
      'Hapus Tujuan Tabungan',
      `Apakah Anda yakin ingin menghapus "${goal.name}"? Tindakan ini tidak dapat dibatalkan.`,
      async () => {
        try {
          const success = await deleteSavingGoal(goal.id);
          if (success) {
            setGoals(prev => prev.filter(g => g.id !== goal.id));
            showSuccess('Sukses', 'Tujuan tabungan berhasil dihapus');
          } else {
            showError('Error', 'Gagal menghapus tujuan tabungan');
          }
        } catch (error) {
          console.error('Error deleting goal:', error);
          showError('Error', 'Gagal menghapus tujuan tabungan');
        }
      }
    );
  };

  useFocusEffect(
    useCallback(() => {
      loadSavingGoals();
    }, [user])
  );

  const renderGoalItem = ({ item }: { item: SavingGoal }) => (
    <SavingGoalItem
      goal={item}
      onPress={() => handleGoalPress(item)}
      onEdit={() => handleEditGoal(item)}
      onDelete={() => handleDeleteGoal(item)}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.neutral[800]} />
        </TouchableOpacity>
        <Typography variant="h4" weight="600" color={theme.colors.neutral[800]}>
          Tujuan Tabungan
        </Typography>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
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
              Memuat Tujuan Tabungan
            </Typography>
            <Typography variant="body2" color={theme.colors.neutral[600]} style={styles.loadingText}>
              Sedang mengambil data tujuan tabungan Anda...
            </Typography>
          </View>
        </View>
      ) : (
        <FlatList
          data={goals}
          renderItem={renderGoalItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyStateContainer}>
              <LinearGradient
                colors={[theme.colors.primary[50], theme.colors.primary[100]]}
                style={styles.emptyStateGradient}
              >
                <View style={styles.emptyIconContainer}>
                  <LinearGradient
                    colors={[theme.colors.primary[400], theme.colors.primary[600]]}
                    style={styles.emptyIconGradient}
                  >
                    <MaterialCommunityIcons name="piggy-bank" size={64} color={theme.colors.white} />
                  </LinearGradient>
                </View>

                <Typography variant="h3" weight="700" color={theme.colors.neutral[800]} style={styles.emptyTitle}>
                  Mulai Menabung untuk Impian Anda
                </Typography>

                <Typography variant="body1" color={theme.colors.neutral[600]} style={styles.emptyDescription}>
                  Wujudkan impian Anda dengan membuat tujuan tabungan yang terstruktur dan terarah
                </Typography>

                <View style={styles.emptyFeatures}>
                  <View style={styles.featureItem}>
                    <View style={styles.featureIcon}>
                      <MaterialCommunityIcons name="target" size={20} color={theme.colors.primary[500]} />
                    </View>
                    <Typography variant="body2" color={theme.colors.neutral[700]}>
                      Target yang jelas
                    </Typography>
                  </View>

                  <View style={styles.featureItem}>
                    <View style={styles.featureIcon}>
                      <Ionicons name="trending-up" size={20} color={theme.colors.success[500]} />
                    </View>
                    <Typography variant="body2" color={theme.colors.neutral[700]}>
                      Progress tracking
                    </Typography>
                  </View>

                  <View style={styles.featureItem}>
                    <View style={styles.featureIcon}>
                      <Ionicons name="calendar" size={20} color={theme.colors.info[500]} />
                    </View>
                    <Typography variant="body2" color={theme.colors.neutral[700]}>
                      Deadline reminder
                    </Typography>
                  </View>
                </View>

                <TouchableOpacity style={styles.emptyActionButton} onPress={handleAddGoal}>
                  <LinearGradient
                    colors={[theme.colors.primary[500], theme.colors.primary[700]]}
                    style={styles.emptyActionGradient}
                  >
                    <Ionicons name="add-circle" size={24} color={theme.colors.white} />
                    <Typography variant="h6" weight="600" color={theme.colors.white}>
                      Buat Tujuan Pertama
                    </Typography>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          }
        />
      )}

      {goals.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={handleAddGoal}>
          <LinearGradient
            colors={[theme.colors.primary[500], theme.colors.primary[700]]}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={24} color={theme.colors.white} />
          </LinearGradient>
        </TouchableOpacity>
      )}

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
    backgroundColor: 'transparent',
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    shadowColor: theme.colors.neutral[900],
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingSpinner: {
    marginBottom: 16,
  },
  loadingTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingText: {
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  goalItem: {
    marginBottom: 16,
  },
  goalCard: {
    padding: 0,
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    shadowColor: theme.colors.neutral[900],
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 20,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  goalInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: theme.colors.neutral[900],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  goalDetails: {
    flex: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 2,
  },
  dateText: {
    marginLeft: 6,
  },
  goalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.neutral[100],
  },
  progressSection: {
    marginBottom: 16,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  amountInfo: {
    flex: 1,
  },
  percentageContainer: {
    alignItems: 'flex-end',
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  remainingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  remainingText: {
    marginLeft: 6,
  },
  descriptionContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
  },
  completedBadge: {
    marginTop: 12,
    alignSelf: 'flex-start',
    borderRadius: 20,
    overflow: 'hidden',
  },
  completedBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  description: {
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    elevation: 8,
    shadowColor: theme.colors.neutral[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Empty State Styles
  emptyStateContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  emptyStateGradient: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: theme.colors.neutral[900],
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  emptyIconContainer: {
    marginBottom: 24,
    borderRadius: 40,
    overflow: 'hidden',
    shadowColor: theme.colors.primary[600],
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emptyIconGradient: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyDescription: {
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  emptyFeatures: {
    width: '100%',
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: theme.colors.neutral[900],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyActionButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: theme.colors.primary[600],
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emptyActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    gap: 12,
  },
});
