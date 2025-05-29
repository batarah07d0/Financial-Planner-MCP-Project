import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Typography, TouchableCard } from '../../../core/components';
import { theme } from '../../../core/theme';
import { RootStackParamList } from '../../../core/navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../config/supabase';
import { useAuthStore } from '../../../core/services/store/authStore';

// Tipe untuk menu item
interface MenuItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBackground: [string, string]; // Dua warna untuk gradient
  onPress: () => void;
  badgeCount?: number;
}

export const MoreScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuthStore();
  const [activeChallenges, setActiveChallenges] = useState<number>(0);
  const [barcodeScans, setBarcodeScans] = useState<number>(0);
  // State untuk loading (digunakan dalam loadData)
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Menampilkan loading indicator jika diperlukan
  useEffect(() => {
    if (isLoading) {
      // Bisa ditambahkan loading indicator jika diperlukan
      console.log('Loading data...');
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
  const loadData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Memuat jumlah tantangan aktif
      const { data: challengesData, error: challengesError } = await supabase
        .from('user_challenges')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (!challengesError && challengesData) {
        setActiveChallenges(challengesData.length);
      }



      // Memuat jumlah pemindaian barcode
      const { data: barcodeData, error: barcodeError } = await supabase
        .from('barcode_data')
        .select('id')
        .eq('created_by', user.id);

      if (!barcodeError && barcodeData) {
        setBarcodeScans(barcodeData.length);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Memuat data saat komponen dimount
  useEffect(() => {
    loadData();
  }, [user]);

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
            <Typography variant="caption" color={theme.colors.white}>
              {item.badgeCount}
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
      badgeCount: activeChallenges,
    },
    {
      id: 'settings',
      title: 'Pengaturan',
      description: 'Kelola preferensi dan keamanan aplikasi',
      icon: <Ionicons name="settings" size={24} color={theme.colors.white} />,
      iconBackground: [theme.colors.primary[400], theme.colors.primary[600]],
      onPress: navigateToSettings,
    },

    {
      id: 'barcodeHistory',
      title: 'Riwayat Pemindaian',
      description: 'Lihat riwayat pemindaian barcode',
      icon: <Ionicons name="barcode" size={24} color={theme.colors.white} />,
      iconBackground: [theme.colors.secondary[400], theme.colors.secondary[600]],
      onPress: () => navigation.navigate('BarcodeScanHistory'),
      badgeCount: barcodeScans,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left', 'top']}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />

      {/* Header dengan format konsisten */}
      <Animated.View style={[styles.headerContainer, { opacity: headerOpacity }]}>
        <View style={styles.header}>
          <Typography
            variant="h3"
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
    padding: theme.spacing.layout.sm,
    paddingTop: theme.spacing.layout.xs,
    paddingBottom: theme.spacing.layout.sm,
  },
  headerTitle: {
    textAlign: 'left',
    paddingLeft: theme.spacing.sm,
    fontSize: 28,
    lineHeight: 34,
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
    backgroundColor: theme.colors.danger[500],
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    ...theme.elevation.xs,
  },

});
