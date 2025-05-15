import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography, Card, SyncIndicator, VoiceAssistant } from '../../../core/components';
import { theme } from '../../../core/theme';
import { useSync } from '../../../core/hooks';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

export const DashboardScreen = () => {
  const { sync } = useSync();
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  const [scrollY] = useState(new Animated.Value(0));
  const navigation = useNavigation();

  // Fungsi untuk menangani sinkronisasi manual
  const handleSync = async () => {
    await sync(true);
  };

  // Fungsi untuk menangani klik pada tombol asisten suara
  const handleVoiceAssistantToggle = () => {
    setShowVoiceAssistant(prev => !prev);
  };

  // Fungsi untuk menangani perintah suara
  const handleVoiceCommand = (command: string) => {
    console.log('Voice command:', command);
    // Implementasi logika berdasarkan perintah
  };

  // Efek animasi untuk header
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [200, 120],
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

  // Navigasi ke halaman tambah transaksi
  const handleAddTransaction = () => {
    navigation.navigate('AddTransaction' as never);
  };

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary[700]} />

      {/* Header Animasi */}
      <Animated.View style={[styles.animatedHeader, { height: headerHeight }]}>
        <LinearGradient
          colors={[theme.colors.primary[700], theme.colors.primary[500]]}
          style={styles.headerGradient}
        >
          <Animated.View style={[styles.headerContent, { opacity: headerOpacity }]}>
            <Typography variant="h4" color={theme.colors.white} weight="600">
              Selamat Datang di BudgetWise
            </Typography>
            <Typography variant="body2" color={theme.colors.white}>
              Kelola keuangan Anda dengan mudah
            </Typography>
          </Animated.View>

          <Animated.View style={[styles.headerTitle, { opacity: headerTitleOpacity }]}>
            <Typography variant="h5" color={theme.colors.white} weight="600">
              BudgetWise
            </Typography>
          </Animated.View>

          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.voiceButton}
              onPress={handleVoiceAssistantToggle}
            >
              <Ionicons name="mic-outline" size={24} color={theme.colors.white} />
            </TouchableOpacity>
            <SyncIndicator onPress={handleSync} color={theme.colors.white} />
          </View>
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
            <TouchableOpacity style={styles.actionButton}>
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.success[50] }]}>
                <Ionicons name="arrow-down" size={20} color={theme.colors.success[500]} />
              </View>
              <Typography variant="caption" align="center">Pemasukan</Typography>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.danger[50] }]}>
                <Ionicons name="arrow-up" size={20} color={theme.colors.danger[500]} />
              </View>
              <Typography variant="caption" align="center">Pengeluaran</Typography>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.info[50] }]}>
                <MaterialCommunityIcons name="chart-line" size={20} color={theme.colors.info[500]} />
              </View>
              <Typography variant="caption" align="center">Analisis</Typography>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
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
            <TouchableOpacity>
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
            <TouchableOpacity>
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

      <VoiceAssistant
        visible={showVoiceAssistant}
        onClose={() => setShowVoiceAssistant(false)}
        onCommand={handleVoiceCommand}
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
  },
  headerTitle: {
    position: 'absolute',
    bottom: 15,
    left: theme.spacing.layout.sm,
  },
  headerButtons: {
    position: 'absolute',
    right: theme.spacing.layout.sm,
    bottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  voiceButton: {
    padding: theme.spacing.xs,
    marginRight: theme.spacing.sm as number,
  },

  // ScrollView Styles
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingTop: 210, // Header height + some extra space
    paddingBottom: theme.spacing.layout.lg,
  },

  // Balance Card Styles
  balanceCard: {
    marginHorizontal: theme.spacing.layout.sm,
    marginBottom: theme.spacing.layout.md,
    padding: theme.spacing.layout.md,
    borderRadius: 16,
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
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
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
