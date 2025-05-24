import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography, Card } from '../../../core/components';
import { theme } from '../../../core/theme';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../../core/services/store';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DashboardScreen = () => {
  const [scrollY] = useState(new Animated.Value(0));
  const [greetingMessage, setGreetingMessage] = useState('');
  const [visitCount, setVisitCount] = useState(0);
  const navigation = useNavigation();
  const { user } = useAuthStore();

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
    }
  }, [user]);

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

  // Efek animasi untuk header
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [220, 140],
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
          style={styles.headerGradient}
        >
          <Animated.View style={[styles.headerContent, { opacity: headerOpacity }]}>
            <Typography variant="h3" color={theme.colors.white} weight="700" style={styles.greetingText}>
              {greetingMessage}
            </Typography>
            <Typography variant="body1" color={theme.colors.white} style={styles.subtitleText}>
              Kelola keuangan Anda dengan bijak
            </Typography>
          </Animated.View>

          <Animated.View style={[styles.headerTitle, { opacity: headerTitleOpacity }]}>
            <Typography variant="h5" color={theme.colors.white} weight="600">
              BudgetWise
            </Typography>
          </Animated.View>
        </LinearGradient>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Kartu Saldo */}
        <Card style={styles.balanceCard} elevation="md">
          <View style={styles.balanceHeader}>
            <View>
              <Typography variant="body2" color={theme.colors.neutral[600]}>
                Saldo Saat Ini
              </Typography>
              <Typography variant="h3" color={theme.colors.primary[500]} weight="700">
                Rp 0
              </Typography>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={handleAddTransaction}>
              <LinearGradient
                colors={[theme.colors.primary[500], theme.colors.primary[700]]}
                style={styles.addButtonGradient}
              >
                <Ionicons name="add" size={24} color={theme.colors.white} />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.balanceActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleNavigateToAddTransaction('income')}
            >
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.success[50] }]}>
                <Ionicons name="arrow-down" size={20} color={theme.colors.success[500]} />
              </View>
              <Typography variant="caption" align="center">Pemasukan</Typography>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleNavigateToAddTransaction('expense')}
            >
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.danger[50] }]}>
                <Ionicons name="arrow-up" size={20} color={theme.colors.danger[500]} />
              </View>
              <Typography variant="caption" align="center">Pengeluaran</Typography>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleNavigateToAnalytics}
            >
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.info[50] }]}>
                <MaterialCommunityIcons name="chart-line" size={20} color={theme.colors.info[500]} />
              </View>
              <Typography variant="caption" align="center">Analisis</Typography>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleNavigateToSavingGoals}
            >
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.warning[50] }]}>
                <FontAwesome5 name="piggy-bank" size={18} color={theme.colors.warning[500]} />
              </View>
              <Typography variant="caption" align="center">Tabungan</Typography>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Ringkasan Bulan Ini */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Typography variant="h5" weight="600" style={styles.sectionTitle}>
              Ringkasan Bulan Ini
            </Typography>
            <TouchableOpacity onPress={handleNavigateToAnalytics}>
              <Typography variant="caption" color={theme.colors.primary[500]}>
                Lihat Detail
              </Typography>
            </TouchableOpacity>
          </View>

          <View style={styles.summaryContainer}>
            <Card style={{ ...styles.summaryCard, ...styles.incomeCard }} elevation="sm">
              <View style={styles.summaryIconContainer}>
                <View style={[styles.summaryIcon, { backgroundColor: theme.colors.success[50] }]}>
                  <Ionicons name="arrow-down" size={20} color={theme.colors.success[500]} />
                </View>
              </View>
              <Typography variant="body2" color={theme.colors.neutral[600]}>
                Pemasukan
              </Typography>
              <Typography variant="h5" color={theme.colors.success[500]} weight="600">
                Rp 0
              </Typography>
            </Card>

            <Card style={{ ...styles.summaryCard, ...styles.expenseCard }} elevation="sm">
              <View style={styles.summaryIconContainer}>
                <View style={[styles.summaryIcon, { backgroundColor: theme.colors.danger[50] }]}>
                  <Ionicons name="arrow-up" size={20} color={theme.colors.danger[500]} />
                </View>
              </View>
              <Typography variant="body2" color={theme.colors.neutral[600]}>
                Pengeluaran
              </Typography>
              <Typography variant="h5" color={theme.colors.danger[500]} weight="600">
                Rp 0
              </Typography>
            </Card>
          </View>
        </View>

        {/* Transaksi Terbaru */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Typography variant="h5" weight="600" style={styles.sectionTitle}>
              Transaksi Terbaru
            </Typography>
            <TouchableOpacity onPress={handleNavigateToTransactions}>
              <Typography variant="caption" color={theme.colors.primary[500]}>
                Lihat Semua
              </Typography>
            </TouchableOpacity>
          </View>

          <Card style={styles.emptyTransactionCard} elevation="sm">
            <View style={styles.emptyStateContainer}>
              <Ionicons name="receipt-outline" size={48} color={theme.colors.neutral[300]} />
              <Typography variant="body1" color={theme.colors.neutral[500]} align="center" style={styles.emptyText}>
                Belum ada transaksi
              </Typography>
              <TouchableOpacity
                style={styles.addTransactionButton}
                onPress={handleAddTransaction}
              >
                <Typography variant="body2" color={theme.colors.primary[500]}>
                  + Tambah Transaksi
                </Typography>
              </TouchableOpacity>
            </View>
          </Card>
        </View>

        {/* Tips Keuangan */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Typography variant="h5" weight="600" style={styles.sectionTitle}>
              Tips Keuangan
            </Typography>
          </View>

          <Card style={styles.tipCard} elevation="sm">
            <LinearGradient
              colors={[theme.colors.info[50], theme.colors.info[100]]}
              style={styles.tipGradient}
            >
              <View style={styles.tipContent}>
                <View>
                  <Typography variant="body1" weight="600" color={theme.colors.info[900]}>
                    Atur Anggaran Bulanan
                  </Typography>
                  <Typography variant="body2" color={theme.colors.info[800]} style={styles.tipDescription}>
                    Tetapkan anggaran untuk setiap kategori pengeluaran untuk mengontrol keuangan Anda.
                  </Typography>
                </View>
                <View style={styles.tipIconContainer}>
                  <Ionicons name="wallet-outline" size={40} color={theme.colors.info[300]} />
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
    paddingTop: 230, // Header height + some extra space
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
    borderRadius: 12,
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
