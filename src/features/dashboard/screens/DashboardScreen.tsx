import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  AppState,
  AppStateStatus,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, PrivacyProtectedText, SuperiorDialog, TransactionCard, Typography } from '../../../core/components';
import { useSuperiorDialog } from '../../../core/hooks';
import { useAppDimensions } from '../../../core/hooks/useAppDimensions';
import { useAuthStore } from '../../../core/services/store';
import { theme } from '../../../core/theme';

import { supabase } from '../../../config/supabase';
import { PeriodVisitService } from '../../../core/services/periodVisitService';
import { Transaction } from '../../../core/services/supabase/types';
import { formatCardCurrency, getCurrencyExplanation, needsExplanation } from '../../../core/utils';
import {
  getConsistentMessageIndex,
  getGreetingType,
  getLocalTimeInfo,
  shouldUpdateGreeting
} from '../../../core/utils/timeUtils';

export const DashboardScreen = () => {
  const [scrollY] = useState(new Animated.Value(0));
  const [greetingMessage, setGreetingMessage] = useState('');
  const [periodVisitCount, setPeriodVisitCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpense, setMonthlyExpense] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  const [userDisplayName, setUserDisplayName] = useState('');
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { dialogState, showDialog, hideDialog } = useSuperiorDialog();

  // Refs untuk mencegah infinite re-render dan throttling
  const lastFocusTime = useRef<number>(0);
  const greetingInitialized = useRef<boolean>(false);
  const appState = useRef(AppState.currentState);
  const lastGreetingUpdate = useRef<number>(0);
  const currentGreetingType = useRef<string>('');

  // Hook responsif untuk mendapatkan dimensi dan breakpoint
  const {
    responsiveFontSize,
    responsiveSpacing,
    isSmallDevice,
    isLargeDevice
  } = useAppDimensions();

  // Fungsi untuk memuat profil pengguna dan membatasi nama
  const loadUserProfile = useCallback(async () => {
    try {
      if (!user) {
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, name')
        .eq('id', user.id)
        .single();

      if (error) {
        // Jika error, gunakan nama dari auth store sebagai fallback
        const fallbackName = user?.name || 'Pengguna';
        const limitedName = fallbackName.split(' ').slice(0, 2).join(' ');
        setUserDisplayName(limitedName);
        return;
      }

      if (data) {
        // Prioritas: full_name > name > fallback
        const fullName = data.full_name || data.name || user?.name || 'Pengguna';
        // Batasi nama menjadi 2 kata pertama
        const limitedName = fullName.split(' ').slice(0, 2).join(' ');
        setUserDisplayName(limitedName);
      }
    } catch (error) {
      // Error handling, gunakan fallback
      const fallbackName = user?.name || 'Pengguna';
      const limitedName = fallbackName.split(' ').slice(0, 2).join(' ');
      setUserDisplayName(limitedName);
    }
  }, [user]);

  // Fungsi untuk memuat kategori
  const loadCategories = useCallback(async () => {
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
      // Error handling tanpa console.error untuk menghindari ESLint warning
    }
  }, []);

  // Fungsi untuk memuat data dashboard dari Supabase
  const loadDashboardData = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Memuat profil pengguna dan kategori secara paralel
      await Promise.all([
        loadUserProfile(),
        loadCategories()
      ]);

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

      const balance = totalIncome - totalExpense;
      setCurrentBalance(balance);

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
      // Error handling tanpa console.error untuk menghindari ESLint warning
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  }, [user, loadCategories, loadUserProfile]);

  // Memoized greeting messages untuk mencegah re-render
  const greetingMessages = useMemo(() => {
    const userName = userDisplayName || 'Pengguna';
    return {
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
      returnVisit: [
        `Kembali lagi, ${userName}!`,
        `Hai ${userName}, gimana kabar?`,
        `Senang melihatmu lagi, ${userName}!`,
        `Halo lagi, ${userName}!`,
        `Welcome back, ${userName}!`,
      ],
    };
  }, [userDisplayName]);

  // Fungsi untuk mendapatkan greeting message yang konsisten dan akurat
  const getGreetingMessage = useCallback(() => {
    const timeInfo = getLocalTimeInfo();
    const { hour, timeKey, timestamp, dateKey } = timeInfo;

    // Cek apakah perlu update greeting (setiap 30 menit atau pertama kali)
    const shouldUpdate = !greetingInitialized.current ||
                        shouldUpdateGreeting(lastGreetingUpdate.current, timestamp) ||
                        currentGreetingType.current !== timeKey;

    if (shouldUpdate) {
      // Update refs untuk tracking
      currentGreetingType.current = timeKey;
      lastGreetingUpdate.current = timestamp;
      greetingInitialized.current = true;


    }

    // Tentukan tipe greeting berdasarkan period visit count dan waktu
    const greetingType = getGreetingType(periodVisitCount, hour);

    // Pilih messages berdasarkan tipe greeting
    const messagesToUse = greetingMessages[greetingType];

    // Gunakan utility function untuk mendapatkan index yang konsisten
    const messageIndex = getConsistentMessageIndex(user?.id, dateKey, messagesToUse.length);

    return messagesToUse[messageIndex];
  }, [greetingMessages, periodVisitCount, user?.id]);

  // Effect untuk load dan update period visit count - hanya sekali saat mount
  useEffect(() => {
    const loadPeriodVisitCount = async () => {
      if (!user?.id) return;

      try {
        // Migrasi dari daily visit count ke period visit count jika diperlukan
        await PeriodVisitService.migrateToPeriodVisitCount(user.id);

        // Load dan update period visit count
        const newPeriodCount = await PeriodVisitService.incrementPeriodVisitCount(user.id);
        setPeriodVisitCount(newPeriodCount);

        // Cleanup old data setiap 10 kunjungan periode
        if (newPeriodCount % 10 === 0) {
          await PeriodVisitService.cleanupOldPeriodData(user.id);
        }
      } catch (error) {
        // Error handling tanpa console.error untuk menghindari ESLint warning
        setPeriodVisitCount(1);
      }
    };

    if (user && !greetingInitialized.current) {
      loadPeriodVisitCount();
    }
  }, [user]);

  // Effect terpisah untuk load dashboard data
  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, loadDashboardData]);

  // Effect untuk update greeting message ketika userDisplayName berubah
  useEffect(() => {
    if (userDisplayName && periodVisitCount > 0) {
      const newMessage = getGreetingMessage();
      setGreetingMessage(newMessage);
    }
  }, [userDisplayName, periodVisitCount, getGreetingMessage]);

  // Effect untuk update greeting message berdasarkan perubahan periode waktu
  useEffect(() => {
    if (!user || !userDisplayName) return;

    const updateGreetingAndPeriodCount = async () => {
      try {
        // Update period visit count jika periode berubah
        const newPeriodCount = await PeriodVisitService.getPeriodVisitCount(user.id);
        setPeriodVisitCount(newPeriodCount);

        // Update greeting message
        const newMessage = getGreetingMessage();
        setGreetingMessage(newMessage);
      } catch (error) {
        // Error handling
        const newMessage = getGreetingMessage();
        setGreetingMessage(newMessage);
      }
    };

    // Update greeting pertama kali
    updateGreetingAndPeriodCount();

    // Update greeting setiap 30 menit untuk responsivitas yang lebih baik
    // dan untuk mendeteksi perubahan periode waktu
    const interval = setInterval(updateGreetingAndPeriodCount, 30 * 60 * 1000); // 30 menit

    return () => clearInterval(interval);
  }, [user, userDisplayName, getGreetingMessage]);

  // Handle app state changes untuk mencegah bug layout
  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App kembali ke foreground, hanya refresh data tanpa reset scroll position
      // untuk mencegah bug positioning header
      if (user) {
        loadDashboardData();
      }
    }
    appState.current = nextAppState;
  }, [user, loadDashboardData]);

  // Setup app state listener
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [handleAppStateChange]);

  // Refresh data ketika halaman difokuskan dengan throttling
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        const now = Date.now();
        // Hanya refresh jika sudah lebih dari 3 detik sejak focus terakhir
        if (now - lastFocusTime.current > 3000) {
          lastFocusTime.current = now;
          loadDashboardData();
        } else {
          // Selalu refresh profil untuk memastikan nama terbaru
          loadUserProfile();
        }
      }
    }, [user, loadDashboardData, loadUserProfile])
  );

  // Fungsi navigasi
  const handleNavigateToAddTransaction = useCallback((type?: 'income' | 'expense') => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigation as any).navigate('AddTransaction', type ? { type } : {});
  }, [navigation]);

  const handleNavigateToAnalytics = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigation as any).navigate('Analytics');
  }, [navigation]);

  const handleNavigateToSavingGoals = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigation as any).navigate('SavingGoals');
  }, [navigation]);

  const handleNavigateToTransactions = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigation as any).navigate('Transactions');
  }, [navigation]);

  const handleAddTransaction = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigation as any).navigate('AddTransaction');
  }, [navigation]);

  // Function untuk navigasi ke detail transaksi
  const handleTransactionPress = useCallback((transactionId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigation as any).navigate('TransactionDetail', { id: transactionId });
  }, [navigation]);

  // Function untuk menampilkan detail saldo
  const handleBalancePress = useCallback(() => {
    if (needsExplanation(currentBalance)) {
      showDialog({
        type: 'info',
        title: '💰 Detail Saldo',
        message: getCurrencyExplanation(currentBalance),
        actions: [
          {
            text: 'Tutup',
            onPress: hideDialog,
            style: 'default',
          },
        ],
      });
    }
  }, [currentBalance, showDialog, hideDialog]);

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
    <SafeAreaView style={styles.container} edges={['right', 'left', 'top']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary[700]} />

      {/* Header Animasi */}
      <Animated.View
        key={`header-${user?.id || 'guest'}`}
        style={[styles.animatedHeader, {
          height: headerHeight
        }]}
      >
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
            paddingHorizontal: responsiveSpacing(theme.spacing.xs),
            justifyContent: 'center',
            flex: 1
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
        key={`scroll-${user?.id || 'guest'}`}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerHeights.expanded,
            paddingBottom: responsiveSpacing(theme.spacing.layout.lg)
          }
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        bounces={true}
        alwaysBounceVertical={false}
      >
        {/* Kartu Saldo */}
        <Card style={[styles.balanceCard, {
          marginHorizontal: responsiveSpacing(theme.spacing.layout.sm),
          marginBottom: responsiveSpacing(theme.spacing.layout.md),
          padding: responsiveSpacing(theme.spacing.layout.xs),
          borderRadius: responsiveSpacing(20)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }] as any} elevation="md">
          <View style={[styles.balanceHeader, {
            marginBottom: responsiveSpacing(theme.spacing.md)
          }]}>
            <TouchableOpacity onPress={handleBalancePress} activeOpacity={0.7}>
              <Typography variant="body2" color={theme.colors.neutral[600]}>
                Saldo Saat Ini
              </Typography>
              {isLoading ? (
                <ActivityIndicator size="small" color={theme.colors.primary[500]} />
              ) : (
                <PrivacyProtectedText
                  type="balance"
                  fallbackText="••••••••"
                  showToggle={true}
                  requireAuth={true}
                  style={styles.balanceAmountContainer}
                >
                  <Typography variant="h3" color={theme.colors.primary[500]} weight="700">
                    {formatCardCurrency(currentBalance)}
                  </Typography>
                  {needsExplanation(currentBalance) && (
                    <Ionicons
                      name="information-circle-outline"
                      size={20}
                      color={theme.colors.primary[400]}
                      style={styles.balanceInfoIcon}
                    />
                  )}
                </PrivacyProtectedText>
              )}
            </TouchableOpacity>
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
                width: isSmallDevice ? '22%' : '25%',
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
                width: isSmallDevice ? '22%' : '26%',
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
              <Typography variant="caption" style={{
                  fontSize: responsiveFontSize(11)
                }} color={theme.colors.primary[500]}>
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
                padding: responsiveSpacing(theme.spacing.xxl),
                borderRadius: responsiveSpacing(16),
                marginRight: responsiveSpacing(theme.spacing.sm)
              }
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                <PrivacyProtectedText
                  type="balance"
                  fallbackText="••••••"
                  showToggle={false}
                >
                  <Typography variant="h5" color={theme.colors.success[500]} weight="600">
                    {formatCardCurrency(monthlyIncome)}
                  </Typography>
                </PrivacyProtectedText>
              )}
            </Card>

            <Card style={[
              styles.summaryCard,
              styles.expenseCard,
              {
                padding: responsiveSpacing(theme.spacing.xxl),
                borderRadius: responsiveSpacing(16),
                marginLeft: responsiveSpacing(theme.spacing.sm)
              }
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                <PrivacyProtectedText
                  type="balance"
                  fallbackText="••••••"
                  showToggle={false}
                >
                  <Typography variant="h5" color={theme.colors.danger[500]} weight="600">
                    {formatCardCurrency(monthlyExpense)}
                  </Typography>
                </PrivacyProtectedText>
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
              <Typography variant="caption" style={{
                  fontSize: responsiveFontSize(11)
                }} color={theme.colors.primary[500]}>
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
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                  onPress={handleTransactionPress}
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
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 100, // Memberikan tinggi minimum untuk stabilitas
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
    backgroundColor: theme.colors.neutral[50],
  },
  scrollContent: {
    paddingTop: 240, // Header height + some extra space (akan di-override dengan responsif)
    paddingBottom: theme.spacing.layout.lg,
    backgroundColor: theme.colors.neutral[50],
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
  balanceAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  balanceInfoIcon: {
    marginLeft: theme.spacing.sm,
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
