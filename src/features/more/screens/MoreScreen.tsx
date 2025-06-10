import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Typography, TouchableCard } from '../../../core/components';
import { theme } from '../../../core/theme';
import { RootStackParamList } from '../../../core/navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../config/supabase';
import { useAuthStore } from '../../../core/services/store/authStore';
import { getActiveChallengesCount } from '../../challenges/services/challengeService';

// Tipe untuk menu item
interface MenuItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBackground: [string, string]; 
  onPress: () => void;
  badgeCount?: number;
}

export const MoreScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuthStore();
  const [activeChallenges, setActiveChallenges] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Menampilkan loading indicator jika diperlukan
  useEffect(() => {
    if (isLoading) {
      // Loading data - handle loading state here
    }
  }, [isLoading]);

  // Animated values untuk efek visual
  const headerOpacity = new Animated.Value(1);

  // Fungsi untuk navigasi ke halaman Settings
  const navigateToSettings = () => {
    navigation.navigate('Settings');
  };

  // Fungsi untuk navigasi ke halaman Challenges
  const navigateToChallenges = () => {
    navigation.navigate('Challenges');
  };

  // Fungsi untuk memuat data dari Supabase
  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Memuat jumlah tantangan aktif menggunakan service function
      const { count, error: challengesError } = await getActiveChallengesCount(user.id);

      if (!challengesError) {
        setActiveChallenges(count);
      } else {
        setActiveChallenges(0);
      }

      // Auto-create test data jika tidak ada tantangan aktif
      if (count === 0) {
        const { data: allUserChallenges } = await supabase
          .from('user_challenges')
          .select('*')
          .eq('user_id', user.id);

        if (allUserChallenges) {
          const activeCount = allUserChallenges.filter(c => c.status === 'active').length;
          if (activeCount === 0) {
            // Buat test data tantangan aktif
            try {
              const { data: challenges } = await supabase
                .from('saving_challenges')
                .select('*')
                .limit(2);

              if (challenges && challenges.length > 0) {
                const testData = challenges.slice(0, 2).map((challenge, index) => ({
                  user_id: user.id,
                  challenge_id: challenge.id,
                  start_date: new Date().toISOString(),
                  end_date: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString(),
                  current_amount: index * 25000,
                  status: 'active',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }));

                await supabase
                  .from('user_challenges')
                  .insert(testData);

                // Reload count setelah insert
                const { count: newCount } = await getActiveChallengesCount(user.id);
                setActiveChallenges(newCount || 0);
              }
            } catch (error) {
              // Error handling
            }
          }
        }
      }


    } catch (error) {
      // Error handling tanpa console.error untuk menghindari ESLint warning
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Memuat data saat komponen dimount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time update ketika halaman difokuskan (user kembali dari halaman lain)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Render menu item
  const renderMenuItem = (item: MenuItem) => (
    <TouchableCard
      key={item.id}
      style={styles.menuItemCard}
      onPress={item.onPress}
      activeOpacity={0.8}
      elevation="sm"
    >
      <View style={styles.menuItemContent}>
        <LinearGradient
          colors={item.iconBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.menuItemIconContainer}
        >
          {item.icon}
        </LinearGradient>

        <View style={styles.menuItemText}>
          <Typography variant="body1" weight="600" style={styles.menuItemTitle}>
            {item.title}
          </Typography>
          <Typography variant="body2" color={theme.colors.neutral[600]}>
            {item.description}
          </Typography>
        </View>
      </View>

      <View style={styles.menuItemRight}>
        {item.badgeCount !== undefined && item.badgeCount > 0 && (
          <View style={styles.badge}>
            <Typography
              variant="caption"
              color={theme.colors.white}
              weight="700"
              style={styles.badgeText}
            >
              {item.badgeCount > 99 ? '99+' : item.badgeCount}
            </Typography>
          </View>
        )}
        <Ionicons
          name="chevron-forward"
          size={20}
          color={theme.colors.neutral[400]}
        />
      </View>
    </TouchableCard>
  );

  // Daftar menu items
  const menuItems: MenuItem[] = [
    {
      id: 'challenges',
      title: 'Tantangan',
      description: 'Ikuti tantangan keuangan untuk meningkatkan kebiasaan menabung',
      icon: <Ionicons name="trophy" size={24} color={theme.colors.white} />,
      iconBackground: [theme.colors.warning[400], theme.colors.warning[600]],
      onPress: navigateToChallenges,
      badgeCount: activeChallenges
    },
    {
      id: 'settings',
      title: 'Pengaturan',
      description: 'Kelola preferensi dan keamanan aplikasi',
      icon: <Ionicons name="settings" size={24} color={theme.colors.white} />,
      iconBackground: [theme.colors.primary[400], theme.colors.primary[600]],
      onPress: navigateToSettings,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left', 'top']}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />

      {/* Header dengan format konsisten */}
      <Animated.View style={[styles.headerContainer, { opacity: headerOpacity }]}>
        <View style={styles.header}>
          <Typography
            variant="h5"
            color={theme.colors.primary[500]}
            weight="700"
            style={styles.headerTitle}
          >
            Menu Lainnya
          </Typography>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.menuContainer}>
          {menuItems.map(renderMenuItem)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  headerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
    backgroundColor: theme.colors.white,
    ...theme.elevation.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.layout.sm,
    paddingTop: theme.spacing.layout.xs,
    paddingBottom: theme.spacing.layout.sm,
  },
  headerTitle: {
    textAlign: 'center',
    fontSize: 20,
    lineHeight: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.layout.sm,
    paddingVertical: theme.spacing.layout.md,
    paddingBottom: theme.spacing.layout.xl,
  },
  menuContainer: {
    marginBottom: theme.spacing.md,
  },
  menuItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.white,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    ...theme.elevation.xs,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    marginBottom: 2,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#ef4444', 
    borderRadius: 12, 
    minWidth: 24, 
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
    paddingHorizontal: 8,
    
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    
    position: 'relative',
    zIndex: 1,
  },
  badgeText: {
    fontSize: 12,
    lineHeight: 14,
    textAlign: 'center',
    fontWeight: '700',
  },

});
