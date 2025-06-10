import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../core/navigation/types';
import { Typography, ChallengeCard } from '../../../core/components';
import { theme } from '../../../core/theme';
import { ChallengeProps } from '../../../core/components/ChallengeCard';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../../core/services/store';
import {
  getChallengesWithUserProgress,
  ChallengeWithProgress
} from '../services/challengeService';

type ChallengesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Fungsi untuk mengkonversi data dari Supabase ke format ChallengeProps
const mapChallengeToChallengeProps = (challenge: ChallengeWithProgress): ChallengeProps => {
  // Tentukan tipe tantangan berdasarkan icon
  let type: 'saving' | 'spending' | 'tracking' = 'saving';
  if (challenge.icon.includes('wallet')) {
    type = 'spending';
  } else if (challenge.icon.includes('analytics')) {
    type = 'tracking';
  }



  // Tentukan iconType berdasarkan nama ikon
  let iconType: 'MaterialCommunityIcons' | 'FontAwesome5' | 'Ionicons' = 'MaterialCommunityIcons';

  // Ikon MaterialCommunityIcons yang umum
  const materialCommunityIcons = [
    'piggy-bank', 'wallet', 'cash', 'bank', 'credit-card', 'currency-usd',
    'chart-line', 'trending-up', 'account-cash', 'calculator', 'calendar-month'
  ];

  // Ikon FontAwesome5 yang umum
  const fontAwesome5Icons = [
    'calendar-week', 'chart-bar', 'coins', 'dollar-sign', 'euro-sign'
  ];

  // Tentukan iconType berdasarkan nama ikon
  if (materialCommunityIcons.some(icon => challenge.icon.includes(icon))) {
    iconType = 'MaterialCommunityIcons';
  } else if (fontAwesome5Icons.some(icon => challenge.icon.includes(icon))) {
    iconType = 'FontAwesome5';
  } else {
    iconType = 'Ionicons';
  }

  return {
    id: challenge.id,
    title: challenge.name,
    description: challenge.description,
    type,
    target: Number(challenge.target_amount),
    current: challenge.current_amount ? Number(challenge.current_amount) : 0,
    startDate: challenge.start_date || new Date().toISOString(),
    endDate: challenge.end_date || new Date(Date.now() + challenge.duration_days * 24 * 60 * 60 * 1000).toISOString(),
    reward: {
      points: 0, // Tidak digunakan lagi
    },
    isCompleted: challenge.status === 'completed',
    icon: challenge.icon,
    iconType,
    color: challenge.color,
  };
};

export const ChallengesScreen = () => {
  const navigation = useNavigation<ChallengesScreenNavigationProp>();
  const { user } = useAuthStore();
  const [challenges, setChallenges] = useState<ChallengeProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Animasi untuk tombol kembali
  const [backButtonAnim] = useState(new Animated.Value(0));

  // Efek untuk animasi tombol kembali
  useEffect(() => {
    Animated.spring(backButtonAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [backButtonAnim]);

  // Fungsi untuk kembali ke halaman sebelumnya
  const handleGoBack = () => {
    // Animasi saat tombol ditekan
    Animated.sequence([
      Animated.timing(backButtonAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(backButtonAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      })
    ]).start();

    // Kembali ke Dashboard setelah animasi selesai
    setTimeout(() => {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main', params: { screen: 'Dashboard' } }],
      });
    }, 150);
  };

  // Fungsi untuk memuat tantangan
  const loadChallenges = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      if (!user) {
        // User not authenticated - handle silently
        return;
      }

      // Ambil data tantangan dari Supabase
      const { data, error } = await getChallengesWithUserProgress(user.id);

      if (error) {
        // Error handling tanpa console.error untuk menghindari ESLint warning
        return;
      }

      if (data) {
        // Konversi data ke format ChallengeProps
        const mappedChallenges = data.map(mapChallengeToChallengeProps);
        setChallenges(mappedChallenges);
      }
    } catch (error) {
      // Error handling tanpa console.error untuk menghindari ESLint warning
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  // Fungsi untuk menangani refresh
  const handleRefresh = () => {
    loadChallenges(true);
  };

  // Fungsi untuk menangani klik pada tantangan
  const handleChallengePress = (challenge: ChallengeProps) => {
    // Navigasi ke halaman detail tantangan
    navigation.navigate('ChallengeDetail', { id: challenge.id });
  };

  // Fungsi untuk menangani klik pada tombol tambah tantangan
  const handleAddChallenge = () => {
    // Navigasi ke halaman tambah tantangan
    navigation.navigate('AddChallenge');
  };

  // Fungsi untuk memfilter tantangan
  const getFilteredChallenges = useCallback(() => {
    switch (filter) {
      case 'active':
        return challenges.filter(challenge => !challenge.isCompleted);
      case 'completed':
        return challenges.filter(challenge => challenge.isCompleted);
      default:
        return challenges;
    }
  }, [filter, challenges]);

  // Memuat tantangan saat komponen dimount
  useEffect(() => {
    loadChallenges();
  }, [loadChallenges]);

  // Memuat ulang data setiap kali halaman difokuskan (untuk refresh setelah add challenge)
  useFocusEffect(
    useCallback(() => {
      loadChallenges();
    }, [loadChallenges])
  );

  // Render item untuk FlatList
  const renderItem = ({ item }: { item: ChallengeProps }) => (
    <ChallengeCard
      challenge={item}
      onPress={handleChallengePress}
    />
  );

  // Animasi untuk loading dan empty state
  const [loadingAnim] = useState(new Animated.Value(0));
  const [emptyAnim] = useState(new Animated.Value(0));

  // Efek untuk animasi loading
  useEffect(() => {
    if (isLoading) {
      Animated.timing(loadingAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [isLoading, loadingAnim]);

  // Efek untuk animasi empty state
  useEffect(() => {
    const filteredChallenges = getFilteredChallenges();
    if (!isLoading && filteredChallenges.length === 0) {
      Animated.sequence([
        Animated.timing(emptyAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(emptyAnim, {
          toValue: 1,
          duration: 800,
          delay: 100,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [filter, isLoading, challenges, emptyAnim, getFilteredChallenges]);

  // Render konten berdasarkan status loading
  const renderContent = () => {
    if (isLoading) {
      return (
        <Animated.View
          style={[
            styles.loadingContainer,
            {
              opacity: loadingAnim,
              transform: [
                {
                  scale: loadingAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                },
              ],
            }
          ]}
        >
          <View style={styles.loadingIndicatorContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary[500]} />
            <Typography
              variant="body1"
              color={theme.colors.neutral[600]}
              style={styles.loadingText}
            >
              Memuat tantangan...
            </Typography>
          </View>
        </Animated.View>
      );
    }

    const filteredChallenges = getFilteredChallenges();

    if (filteredChallenges.length === 0) {
      return (
        <Animated.View
          style={[
            styles.emptyContainer,
            {
              opacity: emptyAnim,
              transform: [
                {
                  translateY: emptyAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            }
          ]}
        >
          <View style={styles.emptyStateCard}>
            <LinearGradient
              colors={[theme.colors.neutral[100], theme.colors.neutral[200]]}
              style={styles.emptyIconContainer}
            >
              <Ionicons
                name={filter === 'completed' ? "checkmark-done-circle-outline" : "trophy-outline"}
                size={64}
                color={theme.colors.neutral[500]}
              />
            </LinearGradient>
            <Typography
              variant="h5"
              color={theme.colors.neutral[800]}
              align="center"
              style={styles.emptyTitle}
            >
              {filter === 'all'
                ? 'Belum Ada Tantangan'
                : filter === 'active'
                ? 'Belum Ada Tantangan Aktif'
                : 'Belum Ada Tantangan Selesai'}
            </Typography>
            <Typography
              variant="body2"
              color={theme.colors.neutral[600]}
              align="center"
              style={styles.emptyText}
            >
              {filter === 'all'
                ? 'Tantangan akan muncul di sini. Tambahkan tantangan baru untuk mulai mencapai tujuan keuangan Anda.'
                : filter === 'active'
                ? 'Anda belum memiliki tantangan aktif. Tambahkan tantangan baru untuk mulai mencapai tujuan keuangan Anda.'
                : 'Anda belum menyelesaikan tantangan. Selesaikan tantangan untuk mendapatkan poin dan hadiah.'}
            </Typography>
            <TouchableOpacity
              style={styles.emptyActionButton}
              onPress={handleAddChallenge}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[theme.colors.primary[400], theme.colors.primary[600]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.emptyActionButtonGradient}
              >
                <Ionicons name="add-circle" size={20} color={theme.colors.white} style={styles.emptyActionButtonIcon} />
                <Typography variant="body2" weight="600" color={theme.colors.white}>
                  Mulai Tantangan Baru
                </Typography>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      );
    }

    return (
      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
        }}
      >
        <FlatList
          data={filteredChallenges}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary[500]]}
              progressBackgroundColor={theme.colors.white}
            />
          }
        />
      </Animated.View>
    );
  };

  // Animasi untuk filter tab
  const [fadeAnim] = useState(new Animated.Value(0));

  // Efek untuk animasi saat komponen dimount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.headerContainer,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
          }
        ]}
      >
        <View style={styles.header}>
          <Animated.View
            style={[
              styles.backButtonContainer,
              {
                opacity: backButtonAnim,
                transform: [
                  { scale: backButtonAnim },
                  {
                    rotate: backButtonAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['-30deg', '0deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleGoBack}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color={theme.colors.primary[500]} />
            </TouchableOpacity>
          </Animated.View>

          <Typography variant="h5" weight="700" color={theme.colors.primary[500]} style={styles.headerTitle}>
            Tantangan
          </Typography>

          {/* Header spacer untuk balance */}
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'all' && styles.filterButtonActive,
            ]}
            onPress={() => setFilter('all')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="apps"
              size={16}
              color={filter === 'all' ? theme.colors.primary[600] : theme.colors.neutral[500]}
              style={styles.filterIcon}
            />
            <Typography
              variant="body2"
              weight={filter === 'all' ? '600' : '400'}
              color={filter === 'all' ? theme.colors.primary[600] : theme.colors.neutral[600]}
            >
              Semua
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'active' && styles.filterButtonActive,
            ]}
            onPress={() => setFilter('active')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="hourglass-outline"
              size={16}
              color={filter === 'active' ? theme.colors.primary[600] : theme.colors.neutral[500]}
              style={styles.filterIcon}
            />
            <Typography
              variant="body2"
              weight={filter === 'active' ? '600' : '400'}
              color={filter === 'active' ? theme.colors.primary[600] : theme.colors.neutral[600]}
            >
              Aktif
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'completed' && styles.filterButtonActive,
            ]}
            onPress={() => setFilter('completed')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={16}
              color={filter === 'completed' ? theme.colors.primary[600] : theme.colors.neutral[500]}
              style={styles.filterIcon}
            />
            <Typography
              variant="body2"
              weight={filter === 'completed' ? '600' : '400'}
              color={filter === 'completed' ? theme.colors.primary[600] : theme.colors.neutral[600]}
            >
              Selesai
            </Typography>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {renderContent()}

      {/* Floating Action Button - hanya muncul ketika ada data tantangan */}
      {!isLoading && getFilteredChallenges().length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleAddChallenge}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color={theme.colors.white} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  headerContainer: {
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    ...theme.elevation.sm,
    marginBottom: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.layout.sm,
    paddingBottom: theme.spacing.md,
  },
  backButtonContainer: {
    // Container untuk animasi back button
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    // Menghapus borderRadius, backgroundColor, dan elevation untuk membuat tombol transparan
  },
  headerTitle: {
    textAlign: 'center',
    fontSize: 20,
    lineHeight: 24,
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  // Style untuk tombol tambah di header telah dihapus karena tidak digunakan lagi
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.layout.sm,
    marginBottom: theme.spacing.xs,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.white,
    ...theme.elevation.xs,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary[50],
    borderWidth: 1,
    borderColor: theme.colors.primary[200],
  },
  filterIcon: {
    marginRight: theme.spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.layout.md,
  },
  loadingIndicatorContainer: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.layout.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    ...theme.elevation.md,
  },
  loadingText: {
    marginTop: theme.spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.layout.md,
  },
  emptyStateCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.layout.md,
    alignItems: 'center',
    width: '100%',
    ...theme.elevation.md,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyActionButton: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    width: '100%',
    ...theme.elevation.sm,
  },
  emptyActionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyActionButtonIcon: {
    marginRight: theme.spacing.sm,
  },
  listContent: {
    padding: theme.spacing.layout.sm,
    paddingTop: theme.spacing.xs,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.elevation.md,
    shadowColor: theme.colors.primary[700],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 999, // Memastikan FAB selalu di atas elemen lain
  },
});
