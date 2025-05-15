import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Typography, ChallengeCard } from '../../../core/components';
import { theme } from '../../../core/theme';
import { ChallengeProps } from '../../../core/components/ChallengeCard';
import { Ionicons } from '@expo/vector-icons';

// Data dummy untuk tantangan
const dummyChallenges: ChallengeProps[] = [
  {
    id: '1',
    title: 'Tantangan Hemat 30 Hari',
    description: 'Tabung minimal Rp 50.000 setiap hari selama 30 hari berturut-turut.',
    type: 'saving',
    target: 1500000,
    current: 1000000,
    startDate: new Date(2023, 5, 1).toISOString(),
    endDate: new Date(2023, 5, 30).toISOString(),
    reward: {
      points: 500,
      badge: 'saver_badge',
    },
    participants: 120,
    isCompleted: false,
  },
  {
    id: '2',
    title: 'Kurangi Pengeluaran Makanan',
    description: 'Kurangi pengeluaran untuk makanan hingga maksimal Rp 1.000.000 bulan ini.',
    type: 'spending',
    target: 1000000,
    current: 800000,
    startDate: new Date(2023, 5, 1).toISOString(),
    endDate: new Date(2023, 5, 30).toISOString(),
    reward: {
      points: 300,
    },
    participants: 85,
    isCompleted: false,
  },
  {
    id: '3',
    title: 'Catat Semua Transaksi',
    description: 'Catat semua transaksi keuangan Anda selama 7 hari berturut-turut.',
    type: 'tracking',
    target: 7,
    current: 7,
    startDate: new Date(2023, 5, 1).toISOString(),
    endDate: new Date(2023, 5, 7).toISOString(),
    reward: {
      points: 200,
      badge: 'tracker_badge',
    },
    participants: 250,
    isCompleted: true,
  },
  {
    id: '4',
    title: 'Tantangan Belanja Bulanan',
    description: 'Belanja bulanan dengan anggaran maksimal Rp 2.000.000.',
    type: 'spending',
    target: 2000000,
    current: 1500000,
    startDate: new Date(2023, 5, 1).toISOString(),
    endDate: new Date(2023, 5, 30).toISOString(),
    reward: {
      points: 250,
    },
    participants: 75,
    isCompleted: false,
  },
];

export const ChallengesScreen = () => {
  const navigation = useNavigation();
  const [challenges, setChallenges] = useState<ChallengeProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  
  // Fungsi untuk memuat tantangan
  const loadChallenges = async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      
      // Simulasi loading
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Gunakan data dummy untuk sementara
      // Nanti akan diganti dengan data dari database lokal atau Supabase
      setChallenges(dummyChallenges);
    } catch (error) {
      console.error('Error loading challenges:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  
  // Fungsi untuk menangani refresh
  const handleRefresh = () => {
    loadChallenges(true);
  };
  
  // Fungsi untuk menangani klik pada tantangan
  const handleChallengePress = (challenge: ChallengeProps) => {
    // Navigasi ke halaman detail tantangan
    console.log('Challenge pressed:', challenge);
    // navigation.navigate('ChallengeDetail', { id: challenge.id });
  };
  
  // Fungsi untuk menangani klik pada tombol tambah tantangan
  const handleAddChallenge = () => {
    // Navigasi ke halaman tambah tantangan
    console.log('Add challenge pressed');
    // navigation.navigate('AddChallenge');
  };
  
  // Fungsi untuk memfilter tantangan
  const getFilteredChallenges = () => {
    switch (filter) {
      case 'active':
        return challenges.filter(challenge => !challenge.isCompleted);
      case 'completed':
        return challenges.filter(challenge => challenge.isCompleted);
      default:
        return challenges;
    }
  };
  
  // Memuat tantangan saat komponen dimount
  useEffect(() => {
    loadChallenges();
  }, []);
  
  // Render item untuk FlatList
  const renderItem = ({ item }: { item: ChallengeProps }) => (
    <ChallengeCard
      challenge={item}
      onPress={handleChallengePress}
    />
  );
  
  // Render konten berdasarkan status loading
  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        </View>
      );
    }
    
    const filteredChallenges = getFilteredChallenges();
    
    if (filteredChallenges.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="trophy-outline"
            size={64}
            color={theme.colors.neutral[400]}
          />
          <Typography
            variant="body1"
            color={theme.colors.neutral[600]}
            align="center"
            style={styles.emptyText}
          >
            {filter === 'all'
              ? 'Belum ada tantangan yang tersedia'
              : filter === 'active'
              ? 'Belum ada tantangan aktif'
              : 'Belum ada tantangan yang diselesaikan'}
          </Typography>
        </View>
      );
    }
    
    return (
      <FlatList
        data={filteredChallenges}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary[500]]}
          />
        }
      />
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Typography variant="h4">Tantangan</Typography>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddChallenge}
        >
          <Typography variant="body1" color={theme.colors.primary[500]}>
            + Tambah
          </Typography>
        </TouchableOpacity>
      </View>
      
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'all' && styles.filterButtonActive,
          ]}
          onPress={() => setFilter('all')}
        >
          <Typography
            variant="body2"
            color={filter === 'all' ? theme.colors.primary[500] : theme.colors.neutral[600]}
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
        >
          <Typography
            variant="body2"
            color={filter === 'active' ? theme.colors.primary[500] : theme.colors.neutral[600]}
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
        >
          <Typography
            variant="body2"
            color={filter === 'completed' ? theme.colors.primary[500] : theme.colors.neutral[600]}
          >
            Selesai
          </Typography>
        </TouchableOpacity>
      </View>
      
      {renderContent()}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.layout.sm,
    paddingBottom: theme.spacing.md,
  },
  addButton: {
    padding: theme.spacing.xs,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.layout.sm,
    marginBottom: theme.spacing.md,
  },
  filterButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.white,
    ...theme.elevation.xs,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary[50],
    borderWidth: 1,
    borderColor: theme.colors.primary[200],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.layout.md,
  },
  emptyText: {
    marginTop: theme.spacing.md,
  },
  listContent: {
    padding: theme.spacing.layout.sm,
  },
});
