import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Typography, SuperiorDialog } from '../../../core/components';
import { theme } from '../../../core/theme';
import { formatCurrency, formatDate, formatPercentage } from '../../../core/utils';
import { useSuperiorDialog } from '../../../core/hooks';
import { useAppDimensions } from '../../../core/hooks/useAppDimensions';
import { getBudgetById, deleteBudget, getBudgetSpending } from '../../../core/services/supabase/budget.service';
import { getCategories } from '../../../core/services/supabase/category.service';
import { getTransactions } from '../../../core/services/supabase/transaction.service';
import { useAuthStore } from '../../../core/services/store/authStore';
import { useBudgetStore } from '../../../core/services/store/budgetStore';
import { Budget, Category, Transaction } from '../../../core/services/supabase/types';

type BudgetDetailRouteProp = RouteProp<{ BudgetDetail: { id: string } }, 'BudgetDetail'>;

export const BudgetDetailScreen = () => {
    const navigation = useNavigation();
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
    const { showDelete, showSuccess, showError, dialogState, hideDialog } = useSuperiorDialog();
    const { responsiveSpacing, responsiveFontSize, isSmallDevice } = useAppDimensions();

    // Load budget data
    const loadBudgetData = async () => {
        try {
            if (!user?.id) return;

            setIsLoading(true);

            // Get budget details
            const budgetData = await getBudgetById(budgetId);
            setBudget(budgetData);

            // Get category data
            const categories = await getCategories({ type: 'expense' });
            const categoryData = categories.find(cat => cat.id === budgetData.category_id);
            setCategory(categoryData || null);

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
            console.error('Error loading budget data:', error);
            showError('Error', 'Gagal memuat data anggaran');
        } finally {
            setIsLoading(false);
        }
    };

    // Refresh data
    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadBudgetData();
        setIsRefreshing(false);
    };

    // Handle edit budget
    const handleEdit = () => {
        (navigation as any).navigate('EditBudget', { id: budgetId });
    };

    // Handle delete budget
    const handleDelete = () => {
        showDelete(
            'Hapus Anggaran',
            'Apakah Anda yakin ingin menghapus anggaran ini? Tindakan ini tidak dapat dibatalkan.',
            async () => {
                try {
                    setIsDeleting(true);
                    await deleteBudget(budgetId);
                    await deleteBudgetFromStore(budgetId);
                    showSuccess('Berhasil', 'Anggaran berhasil dihapus');
                    setTimeout(() => navigation.goBack(), 1500);
                } catch (error) {
                    console.error('Error deleting budget:', error);
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

    useEffect(() => {
        loadBudgetData();
    }, [budgetId, user?.id]);

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

    // Get progress colors
    const getProgressColors = (): [string, string] => {
        if (percentage >= 1) {
            return [theme.colors.danger[400], theme.colors.danger[600]];
        } else if (percentage >= 0.8) {
            return [theme.colors.warning[400], theme.colors.warning[600]];
        } else {
            return [theme.colors.success[400], theme.colors.success[600]];
        }
    };

    const progressColors = getProgressColors();

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
                        Detail Anggaran
                    </Typography>
                </View>

                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={[styles.actionButton, {
                            width: responsiveSpacing(isSmallDevice ? 36 : 40),
                            height: responsiveSpacing(isSmallDevice ? 36 : 40),
                            marginRight: responsiveSpacing(theme.spacing.sm),
                        }]}
                        onPress={handleEdit}
                    >
                        <Ionicons
                            name="create-outline"
                            size={responsiveSpacing(isSmallDevice ? 18 : 20)}
                            color={theme.colors.primary[500]}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, {
                            width: responsiveSpacing(isSmallDevice ? 36 : 40),
                            height: responsiveSpacing(isSmallDevice ? 36 : 40),
                        }]}
                        onPress={handleDelete}
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <ActivityIndicator size="small" color={theme.colors.danger[500]} />
                        ) : (
                            <Ionicons
                                name="trash-outline"
                                size={responsiveSpacing(isSmallDevice ? 18 : 20)}
                                color={theme.colors.danger[500]}
                            />
                        )}
                    </TouchableOpacity>
                </View>
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
                    {/* Category Header */}
                    <View style={[styles.categoryHeader, {
                        marginBottom: responsiveSpacing(theme.spacing.lg),
                    }]}>
                        <View style={[styles.categoryIcon, {
                            backgroundColor: category?.color || theme.colors.primary[100],
                            width: responsiveSpacing(isSmallDevice ? 48 : 56),
                            height: responsiveSpacing(isSmallDevice ? 48 : 56),
                            borderRadius: responsiveSpacing(isSmallDevice ? 24 : 28),
                        }]}>
                            <Ionicons
                                name={(category?.icon || 'wallet-outline') as any}
                                size={responsiveSpacing(isSmallDevice ? 24 : 28)}
                                color={category?.color || theme.colors.primary[600]}
                            />
                        </View>
                        <View style={styles.categoryInfo}>
                            <Typography
                                variant="h4"
                                weight="700"
                                color={theme.colors.neutral[800]}
                                style={{
                                    fontSize: responsiveFontSize(isSmallDevice ? 20 : 24),
                                }}
                            >
                                {category?.name || 'Kategori'}
                            </Typography>
                            <Typography
                                variant="body2"
                                color={theme.colors.neutral[500]}
                                style={{
                                    fontSize: responsiveFontSize(isSmallDevice ? 13 : 15),
                                    marginTop: responsiveSpacing(4),
                                }}
                            >
                                Anggaran {getPeriodText()}
                            </Typography>
                        </View>
                        <View style={[styles.statusBadge, {
                            backgroundColor: statusInfo.bgColor,
                            paddingHorizontal: responsiveSpacing(theme.spacing.sm),
                            paddingVertical: responsiveSpacing(6),
                            borderRadius: theme.borderRadius.round,
                        }]}>
                            <Ionicons
                                name={statusInfo.icon}
                                size={responsiveSpacing(14)}
                                color={statusInfo.color}
                                style={{ marginRight: responsiveSpacing(4) }}
                            />
                            <Typography
                                variant="caption"
                                weight="600"
                                color={statusInfo.color}
                                style={{
                                    fontSize: responsiveFontSize(isSmallDevice ? 11 : 12),
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

                    {/* Progress Section */}
                    <View style={styles.progressSection}>
                        <View style={[styles.progressHeader, {
                            marginBottom: responsiveSpacing(theme.spacing.sm),
                        }]}>
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
                            <Typography
                                variant="h5"
                                weight="700"
                                color={percentage >= 1 ? theme.colors.danger[500] : theme.colors.primary[600]}
                                style={{
                                    fontSize: responsiveFontSize(isSmallDevice ? 18 : 20),
                                }}
                            >
                                {formatPercentage(percentage)}
                            </Typography>
                        </View>

                        <View style={[styles.progressBar, {
                            height: responsiveSpacing(isSmallDevice ? 12 : 16),
                            borderRadius: theme.borderRadius.round,
                            marginBottom: responsiveSpacing(theme.spacing.sm),
                        }]}>
                            <LinearGradient
                                colors={progressColors}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={[
                                    styles.progressFill,
                                    {
                                        width: `${Math.min(percentage * 100, 100)}%`,
                                        borderRadius: theme.borderRadius.round,
                                    },
                                ]}
                            />
                        </View>

                        {percentage >= 1 && (
                            <View style={[styles.warningMessage, {
                                backgroundColor: theme.colors.danger[50],
                                padding: responsiveSpacing(theme.spacing.sm),
                                borderRadius: theme.borderRadius.md,
                                borderLeftWidth: 4,
                                borderLeftColor: theme.colors.danger[500],
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
                                    <View style={[styles.transactionIcon, {
                                        backgroundColor: theme.colors.danger[100],
                                        width: responsiveSpacing(isSmallDevice ? 32 : 36),
                                        height: responsiveSpacing(isSmallDevice ? 32 : 36),
                                        borderRadius: responsiveSpacing(isSmallDevice ? 16 : 18),
                                    }]}>
                                        <Ionicons
                                            name="arrow-up"
                                            size={responsiveSpacing(isSmallDevice ? 14 : 16)}
                                            color={theme.colors.danger[500]}
                                        />
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
    },
    headerTitleContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: theme.borderRadius.round,
        backgroundColor: theme.colors.neutral[100],
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
        // Container for progress
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
        // Warning message styling
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
});