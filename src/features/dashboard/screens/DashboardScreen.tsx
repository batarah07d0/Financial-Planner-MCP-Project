import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography, Card, TransactionCard } from '../../../core/components';
import { theme } from '../../../core/theme';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../../core/services/store';
import { useAppDimensions } from '../../../core/hooks/useAppDimensions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../../config/supabase';
import { formatCurrency } from '../../../core/utils';
import { Transaction } from '../../../core/services/supabase/types';

export const DashboardScreen = () => {
  const [scrollY] = useState(new Animated.Value(0));
  const [greetingMessage, setGreetingMessage] = useState('');
  const [visitCount, setVisitCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpense, setMonthlyExpense] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  const navigation = useNavigation();
  const { user } = useAuthStore();

  // Hook responsif untuk mendapatkan dimensi dan breakpoint
  const {
    responsiveFontSize,
    responsiveSpacing,
    isSmallDevice,
    isLargeDevice
  } = useAppDimensions();

  // Fungsi untuk mendapatkan greeting message
  const getGreetingMessage = () => {
    const hour = new Date().getHours();
    const userName = user?.name || 'Pengguna';

    const greetingMessages = {
      morning: [
        `Selamat Pagi, ${userName}!`,
        `Pagi yang cerah, ${userName}!`,
        `Semangat pagi, ${userName}!`,
      ],
      afternoon: [
        `Selamat Siang, ${userName}!`,
        `Siang yang produktif, ${userName}!`,
        `Halo ${userName}, semangat siang!`,
      ],
      evening: [
        `Selamat Malam, ${userName}!`,
        `Malam yang tenang, ${userName}!`,
        `Halo ${userName}, selamat beristirahat!`,
      ],
    };

    const returnVisitMessages = [
      `Kembali lagi, ${userName}!`,
      `Hai ${userName}, gimana kabar?`,
      `Senang melihatmu lagi, ${userName}!`,
      `Halo lagi, ${userName}!`,
      `Welcome back, ${userName}!`,
    ];

    let timeBasedMessages;
    if (hour >= 5 && hour < 12) {
      timeBasedMessages = greetingMessages.morning;
    } else if (hour >= 12 && hour < 18) {
      timeBasedMessages = greetingMessages.afternoon;
    } else {
      timeBasedMessages = greetingMessages.evening;
    }

    // Jika user sudah berkunjung >2 kali, gunakan pesan return visit
    if (visitCount > 2) {
      const randomIndex = Math.floor(Math.random() * returnVisitMessages.length);
      return returnVisitMessages[randomIndex];
    } else {
      const randomIndex = Math.floor(Math.random() * timeBasedMessages.length);
      return timeBasedMessages[randomIndex];
    }
  };

  // Fungsi untuk memuat data dashboard dari Supabase
  const loadDashboardData = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Memuat kategori terlebih dahulu
      await loadCategories();

      // Mendapatkan tanggal awal dan akhir bulan ini
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Query untuk mendapatkan semua transaksi user
      const { data: allTransactions, error: allError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (allError) throw allError;

      // Query untuk mendapatkan transaksi bulan ini
      const { data: monthlyTransactions, error: monthlyError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startOfMonth.toISOString())
        .lte('date', endOfMonth.toISOString());

      if (monthlyError) throw monthlyError;

      // Hitung saldo saat ini (total pemasukan - total pengeluaran)
      const totalIncome = allTransactions
        ?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const totalExpense = allTransactions
        ?.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      setCurrentBalance(totalIncome - totalExpense);

      // Hitung ringkasan bulan ini
      const monthlyIncomeTotal = monthlyTransactions
        ?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const monthlyExpenseTotal = monthlyTransactions
        ?.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      setMonthlyIncome(monthlyIncomeTotal);
      setMonthlyExpense(monthlyExpenseTotal);

      // Ambil 3 transaksi terbaru
      const recent = allTransactions?.slice(0, 3) || [];
      setRecentTransactions(recent);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi untuk memuat kategori
  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name');

      if (error) throw error;

      if (data) {
        const newCategoryMap: Record<string, string> = {};
        data.forEach(category => {
          newCategoryMap[category.id] = category.name;
        });
        setCategoryMap(newCategoryMap);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // Effect untuk load dan update visit count
  useEffect(() => {
    const loadVisitCount = async () => {
      try {
        const storedCount = await AsyncStorage.getItem('dashboard_visit_count');
        const currentCount = storedCount ? parseInt(storedCount, 10) : 0;
        const newCount = currentCount + 1;

        setVisitCount(newCount);
        await AsyncStorage.setItem('dashboard_visit_count', newCount.toString());

        // Update greeting message setelah visit count di-set
        setTimeout(() => {
          setGreetingMessage(getGreetingMessage());
        }, 100);
      } catch (error) {
        console.error('Error loading visit count:', error);
        setVisitCount(1);
        setGreetingMessage(getGreetingMessage());
      }
    };

    if (user) {
      loadVisitCount();
      loadDashboardData(); // Load dashboard data
    }
  }, [user]);

  // Refresh data ketika halaman difokuskan (misalnya setelah menambah transaksi)
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        loadDashboardData();
      }
    }, [user])
  );

  // Fungsi navigasi
  const handleNavigateToAddTransaction = (type?: 'income' | 'expense') => {
    (navigation as any).navigate('AddTransaction', type ? { type } : {});
  };

  const handleNavigateToAnalytics = () => {
    (navigation as any).navigate('Analytics');
  };

  const handleNavigateToSavingGoals = () => {
    (navigation as any).navigate('SavingGoals');
  };

  const handleNavigateToTransactions = () => {
    (navigation as any).navigate('Transactions');
  };

  const handleAddTransaction = () => {
    (navigation as any).navigate('AddTransaction');
  };

  // Efek animasi untuk header dengan responsivitas
  const getResponsiveHeaderHeight = () => {
    if (isSmallDevice) return { expanded: 200, collapsed: 120 };
    if (isLargeDevice) return { expanded: 260, collapsed: 160 };
    return { expanded: 220, collapsed: 140 }; // default untuk medium device
  };

  const headerHeights = getResponsiveHeaderHeight();

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [headerHeights.expanded, headerHeights.collapsed],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60, 90],
    outputRange: [1, 0.3, 0],
    extrapolate: 'clamp',
  });

  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [0, 60, 90],
    outputRange: [0, 0.7, 1],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary[700]} />

      {/* Header Animasi */}
      <Animated.View style={[styles.animatedHeader, { height: headerHeight }]}>
        <LinearGradient
          colors={[
            theme.colors.primary[800],
            theme.colors.primary[600],
            theme.colors.primary[500]
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.headerGradient, {
            paddingTop: responsiveSpacing(40),
            paddingHorizontal: responsiveSpacing(theme.spacing.layout.sm),
            paddingBottom: responsiveSpacing(theme.spacing.md)
          }]}
        >
          <Animated.View style={[styles.headerContent, {
            opacity: headerOpacity,
            marginTop: responsiveSpacing(20),
            paddingHorizontal: responsiveSpacing(theme.spacing.xs)
          }]}>
            <Typography variant="h3" color={theme.colors.white} weight="700" style={[styles.greetingText, {
              marginBottom: responsiveSpacing(theme.spacing.xs)
            }]}>
              {greetingMessage}
            </Typography>
            <Typography variant="body1" color={theme.colors.white} style={styles.subtitleText}>
              Kelola keuangan Anda dengan bijak
            </Typography>
          </Animated.View>

          <Animated.View style={[styles.headerTitle, {
            opacity: headerTitleOpacity,
            bottom: responsiveSpacing(15),
            left: responsiveSpacing(theme.spacing.layout.sm)
          }]}>
            <Typography variant="h5" color={theme.colors.white} weight="600">
              BudgetWise
            </Typography>
          </Animated.View>
        </LinearGradient>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerHeights.expanded + responsiveSpacing(20),
            paddingBottom: responsiveSpacing(theme.spacing.layout.lg)
          }
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Kartu Saldo */}
        <Card style={[styles.balanceCard, {
          marginHorizontal: responsiveSpacing(theme.spacing.layout.sm),
          marginBottom: responsiveSpacing(theme.spacing.layout.md),
          padding: responsiveSpacing(theme.spacing.layout.md),
          borderRadius: responsiveSpacing(20)
        }] as any} elevation="md">
          <View style={[styles.balanceHeader, {
            marginBottom: responsiveSpacing(theme.spacing.md)
          }]}>
            <View>
              <Typography variant="body2" color={theme.colors.neutral[600]}>
                Saldo Saat Ini
              </Typography>
              {isLoading ? (
                <ActivityIndicator size="small" color={theme.colors.primary[500]} />
              ) : (
                <Typography variant="h3" color={theme.colors.primary[500]} weight="700">
                  {formatCurrency(currentBalance)}
                </Typography>
              )}
            </View>
            <TouchableOpacity style={[styles.addButton, {
              width: responsiveSpacing(48),
              height: responsiveSpacing(48),
              borderRadius: responsiveSpacing(24)
            }]} onPress={handleAddTransaction}>
              <LinearGradient
                colors={[theme.colors.primary[500], theme.colors.primary[700]]}
                style={styles.addButtonGradient}
              >
                <Ionicons name="add" size={responsiveFontSize(24)} color={theme.colors.white} />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={[styles.balanceActions, {
            marginTop: responsiveSpacing(theme.spacing.md),
            paddingTop: responsiveSpacing(theme.spacing.md)
          }]}>
            <TouchableOpacity
              style={[styles.actionButton, {
                width: isSmallDevice ? '22%' : '23%',
                paddingVertical: responsiveSpacing(theme.spacing.sm)
              }]}
              onPress={() => handleNavigateToAddTransaction('income')}
            >
              <View style={[styles.actionIcon, {
                backgroundColor: theme.colors.success[50],
                width: responsiveSpacing(44),
                height: responsiveSpacing(44),
                borderRadius: responsiveSpacing(22)
              }]}>
                <Ionicons name="arrow-down" size={responsiveFontSize(20)} color={theme.colors.success[500]} />
              </View>
              <Typography
                variant="caption"
                align="center"
                style={{
                  fontSize: responsiveFontSize(12),
                  marginTop: responsiveSpacing(theme.spacing.xs),
                  lineHeight: responsiveFontSize(16)
                }}
              >
                Pemasukan
              </Typography>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, {
                width: isSmallDevice ? '22%' : '23%',
                paddingVertical: responsiveSpacing(theme.spacing.sm)
              }]}
              onPress={() => handleNavigateToAddTransaction('expense')}
            >
              <View style={[styles.actionIcon, {
                backgroundColor: theme.colors.danger[50],
                width: responsiveSpacing(44),
                height: responsiveSpacing(44),
                borderRadius: responsiveSpacing(22)
              }]}>
                <Ionicons name="arrow-up" size={responsiveFontSize(20)} color={theme.colors.danger[500]} />
              </View>
              <Typography
                variant="caption"
                align="center"
                style={{
                  fontSize: responsiveFontSize(12),
                  marginTop: responsiveSpacing(theme.spacing.xs),
                  lineHeight: responsiveFontSize(16)
                }}
              >
                Pengeluaran
              </Typography>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, {
                width: isSmallDevice ? '22%' : '23%',
                paddingVertical: responsiveSpacing(theme.spacing.sm)
              }]}
              onPress={handleNavigateToAnalytics}
            >
              <View style={[styles.actionIcon, {
                backgroundColor: theme.colors.info[50],
                width: responsiveSpacing(44),
                height: responsiveSpacing(44),
                borderRadius: responsiveSpacing(22)
              }]}>
                <MaterialCommunityIcons name="chart-line" size={responsiveFontSize(20)} color={theme.colors.info[500]} />
              </View>
              <Typography
                variant="caption"
                align="center"
                style={{
                  fontSize: responsiveFontSize(12),
                  marginTop: responsiveSpacing(theme.spacing.xs),
                  lineHeight: responsiveFontSize(16)
                }}
              >
                Analisis
              </Typography>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, {
                width: isSmallDevice ? '22%' : '23%',
                paddingVertical: responsiveSpacing(theme.spacing.sm)
              }]}
              onPress={handleNavigateToSavingGoals}
            >
              <View style={[styles.actionIcon, {
                backgroundColor: theme.colors.warning[50],
                width: responsiveSpacing(44),
                height: responsiveSpacing(44),
                borderRadius: responsiveSpacing(22)
              }]}>
                <FontAwesome5 name="piggy-bank" size={responsiveFontSize(18)} color={theme.colors.warning[500]} />
              </View>
              <Typography
                variant="caption"
                align="center"
                style={{
                  fontSize: responsiveFontSize(12),
                  marginTop: responsiveSpacing(theme.spacing.xs),
                  lineHeight: responsiveFontSize(16)
                }}
              >
                Tabungan
              </Typography>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Ringkasan Bulan Ini */}
        <View style={[styles.section, {
          marginBottom: responsiveSpacing(theme.spacing.layout.md)
        }]}>
          <View style={[styles.sectionHeader, {
            marginHorizontal: responsiveSpacing(theme.spacing.layout.sm),
            marginBottom: responsiveSpacing(theme.spacing.md)
          }]}>
            <Typography variant="h5" weight="600" style={styles.sectionTitle}>
              Ringkasan Bulan Ini
            </Typography>
            <TouchableOpacity onPress={handleNavigateToAnalytics}>
              <Typography variant="caption" color={theme.colors.primary[500]}>
                Lihat Detail
              </Typography>
            </TouchableOpacity>
          </View>

          <View style={[styles.summaryContainer, {
            marginHorizontal: responsiveSpacing(theme.spacing.layout.sm)
          }]}>
            <Card style={[
              styles.summaryCard,
              styles.incomeCard,
              {
                padding: responsiveSpacing(theme.spacing.md),
                borderRadius: responsiveSpacing(16),
                marginRight: responsiveSpacing(theme.spacing.sm)
              }
            ] as any} elevation="sm">
              <View style={[styles.summaryIconContainer, {
                marginBottom: responsiveSpacing(theme.spacing.sm)
              }]}>
                <View style={[styles.summaryIcon, {
                  backgroundColor: theme.colors.success[50],
                  width: responsiveSpacing(36),
                  height: responsiveSpacing(36),
                  borderRadius: responsiveSpacing(18)
                }]}>
                  <Ionicons name="arrow-down" size={responsiveFontSize(20)} color={theme.colors.success[500]} />
                </View>
              </View>
              <Typography variant="body2" color={theme.colors.neutral[600]}>
                Pemasukan
              </Typography>
              {isLoading ? (
                <ActivityIndicator size="small" color={theme.colors.success[500]} />
              ) : (
                <Typography variant="h5" color={theme.colors.success[500]} weight="600">
                  {formatCurrency(monthlyIncome)}
                </Typography>
              )}
            </Card>

            <Card style={[
              styles.summaryCard,
              styles.expenseCard,
              {
                padding: responsiveSpacing(theme.spacing.md),
                borderRadius: responsiveSpacing(16),
                marginLeft: responsiveSpacing(theme.spacing.sm)
              }
            ] as any} elevation="sm">
              <View style={[styles.summaryIconContainer, {
                marginBottom: responsiveSpacing(theme.spacing.sm)
              }]}>
                <View style={[styles.summaryIcon, {
                  backgroundColor: theme.colors.danger[50],
                  width: responsiveSpacing(36),
                  height: responsiveSpacing(36),
                  borderRadius: responsiveSpacing(18)
                }]}>
                  <Ionicons name="arrow-up" size={responsiveFontSize(20)} color={theme.colors.danger[500]} />
                </View>
              </View>
              <Typography variant="body2" color={theme.colors.neutral[600]}>
                Pengeluaran
              </Typography>
              {isLoading ? (
                <ActivityIndicator size="small" color={theme.colors.danger[500]} />
              ) : (
                <Typography variant="h5" color={theme.colors.danger[500]} weight="600">
                  {formatCurrency(monthlyExpense)}
                </Typography>
              )}
            </Card>
          </View>
        </View>

        {/* Transaksi Terbaru */}
        <View style={[styles.section, {
          marginBottom: responsiveSpacing(theme.spacing.layout.md)
        }]}>
          <View style={[styles.sectionHeader, {
            marginHorizontal: responsiveSpacing(theme.spacing.layout.sm),
            marginBottom: responsiveSpacing(theme.spacing.md)
          }]}>
            <Typography variant="h5" weight="600" style={styles.sectionTitle}>
              Transaksi Terbaru
            </Typography>
            <TouchableOpacity onPress={handleNavigateToTransactions}>
              <Typography variant="caption" color={theme.colors.primary[500]}>
                Lihat Semua
              </Typography>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <Card style={[
              styles.emptyTransactionCard,
              {
                marginHorizontal: responsiveSpacing(theme.spacing.layout.sm),
                padding: responsiveSpacing(theme.spacing.layout.md),
                borderRadius: responsiveSpacing(16)
              }
            ] as any} elevation="sm">
              <View style={[styles.emptyStateContainer, {
                padding: responsiveSpacing(theme.spacing.md)
              }]}>
                <ActivityIndicator size="large" color={theme.colors.primary[500]} />
                <Typography variant="body1" color={theme.colors.neutral[500]} align="center" style={[styles.emptyText, {
                  marginTop: responsiveSpacing(theme.spacing.md)
                }]}>
                  Memuat transaksi...
                </Typography>
              </View>
            </Card>
          ) : recentTransactions.length > 0 ? (
            <View style={{
              marginHorizontal: responsiveSpacing(theme.spacing.layout.sm)
            }}>
              {recentTransactions.map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  id={transaction.id}
                  amount={Number(transaction.amount)}
                  type={transaction.type}
                  category={categoryMap[transaction.category_id] || 'Lainnya'}
                  description={transaction.description}
                  date={transaction.date}
                  onPress={() => {}}
                />
              ))}
            </View>
          ) : (
            <Card style={[
              styles.emptyTransactionCard,
              {
                marginHorizontal: responsiveSpacing(theme.spacing.layout.sm),
                padding: responsiveSpacing(theme.spacing.layout.md),
                borderRadius: responsiveSpacing(16)
              }
            ] as any} elevation="sm">
              <View style={[styles.emptyStateContainer, {
                padding: responsiveSpacing(theme.spacing.md)
              }]}>
                <Ionicons name="receipt-outline" size={responsiveFontSize(48)} color={theme.colors.neutral[300]} />
                <Typography variant="body1" color={theme.colors.neutral[500]} align="center" style={[styles.emptyText, {
                  marginTop: responsiveSpacing(theme.spacing.md),
                  marginBottom: responsiveSpacing(theme.spacing.md)
                }]}>
                  Belum ada transaksi
                </Typography>
                <TouchableOpacity
                  style={[styles.addTransactionButton, {
                    paddingVertical: responsiveSpacing(theme.spacing.sm),
                    paddingHorizontal: responsiveSpacing(theme.spacing.md),
                    borderRadius: responsiveSpacing(theme.borderRadius.md),
                    marginTop: responsiveSpacing(theme.spacing.sm)
                  }]}
                  onPress={handleAddTransaction}
                >
                  <Typography variant="body2" color={theme.colors.primary[500]}>
                    + Tambah Transaksi
                  </Typography>
                </TouchableOpacity>
              </View>
            </Card>
          )}
        </View>

        {/* Tips Keuangan */}
        <View style={[styles.section, {
          marginBottom: responsiveSpacing(theme.spacing.layout.md)
        }]}>
          <View style={[styles.sectionHeader, {
            marginHorizontal: responsiveSpacing(theme.spacing.layout.sm),
            marginBottom: responsiveSpacing(theme.spacing.md)
          }]}>
            <Typography variant="h5" weight="600" style={styles.sectionTitle}>
              Tips Keuangan
            </Typography>
          </View>

          <Card style={[
            styles.tipCard,
            {
              marginHorizontal: responsiveSpacing(theme.spacing.layout.sm),
              borderRadius: responsiveSpacing(16)
            }
          ] as any} elevation="sm">
            <LinearGradient
              colors={[theme.colors.info[50], theme.colors.info[100]]}
              style={[styles.tipGradient, {
                padding: responsiveSpacing(theme.spacing.md)
              }]}
            >
              <View style={styles.tipContent}>
                <View style={{ maxWidth: isSmallDevice ? '75%' : '85%' }}>
                  <Typography variant="body1" weight="600" color={theme.colors.info[900]}>
                    Atur Anggaran Bulanan
                  </Typography>
                  <Typography variant="body2" color={theme.colors.info[800]} style={[styles.tipDescription, {
                    marginTop: responsiveSpacing(theme.spacing.xs)
                  }]}>
                    Tetapkan anggaran untuk setiap kategori pengeluaran untuk mengontrol keuangan Anda.
                  </Typography>
                </View>
                <View style={[styles.tipIconContainer, {
                  width: responsiveSpacing(60),
                  height: responsiveSpacing(60)
                }]}>
                  <Ionicons name="wallet-outline" size={responsiveFontSize(40)} color={theme.colors.info[300]} />
                </View>
              </View>
            </LinearGradient>
          </Card>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  // Header Styles
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: 'hidden',
  },
  headerGradient: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: theme.spacing.layout.sm,
    paddingBottom: theme.spacing.md,
    position: 'relative',
  },
  headerContent: {
    marginTop: 20,
    paddingHorizontal: theme.spacing.xs,
  },
  greetingText: {
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitleText: {
    textAlign: 'center',
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  headerTitle: {
    position: 'absolute',
    bottom: 15,
    left: theme.spacing.layout.sm,
  },

  // ScrollView Styles
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingTop: 240, // Header height + some extra space (akan di-override dengan responsif)
    paddingBottom: theme.spacing.layout.lg,
  },

  // Balance Card Styles
  balanceCard: {
    marginHorizontal: theme.spacing.layout.sm,
    marginBottom: theme.spacing.layout.md,
    padding: theme.spacing.layout.md,
    borderRadius: 20,
    shadowColor: theme.colors.neutral[900],
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  addButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[100],
  },
  actionButton: {
    alignItems: 'center',
    width: '23%',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: 12,
    minHeight: 80, // Memberikan tinggi minimum yang konsisten
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
    shadowColor: theme.colors.neutral[900],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Section Styles
  section: {
    marginBottom: theme.spacing.layout.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: theme.spacing.layout.sm,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    marginBottom: 0,
  },

  // Summary Styles
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: theme.spacing.layout.sm,
  },
  summaryCard: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: 16,
    shadowColor: theme.colors.neutral[900],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  summaryIconContainer: {
    marginBottom: theme.spacing.sm,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  incomeCard: {
    marginRight: theme.spacing.sm,
  },
  expenseCard: {
    marginLeft: theme.spacing.sm,
  },

  // Transaction Styles
  transactionCard: {
    marginHorizontal: theme.spacing.layout.sm,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  emptyTransactionCard: {
    marginHorizontal: theme.spacing.layout.sm,
    padding: theme.spacing.layout.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    shadowColor: theme.colors.neutral[900],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateContainer: {
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  emptyText: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  addTransactionButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary[500],
    marginTop: theme.spacing.sm,
  },
  amount: {
    marginTop: theme.spacing.sm,
  },

  // Tip Card Styles
  tipCard: {
    marginHorizontal: theme.spacing.layout.sm,
    padding: 0,
    overflow: 'hidden',
    borderRadius: 16,
    shadowColor: theme.colors.neutral[900],
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  tipGradient: {
    padding: theme.spacing.md,
  },
  tipContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tipDescription: {
    marginTop: theme.spacing.xs,
    maxWidth: '85%',
  },
  tipIconContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
