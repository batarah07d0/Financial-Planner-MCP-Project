import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../core/navigation/types';
import { Typography, EmptyState } from '../../../core/components';
import { theme } from '../../../core/theme';
import { SavingZoneItem } from '../components/SavingZoneItem';
import { SavingZone } from '../models/SavingZone';
import { getSavingZones, updateSavingZone, deleteSavingZone } from '../services/savingZoneService';
import { useGeofencing } from '../../../core/hooks/useGeofencing';
import { useLocation } from '../../../core/hooks/useLocation';

type SavingZonesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SavingZones'>;

export const SavingZonesScreen = () => {
  const navigation = useNavigation<SavingZonesScreenNavigationProp>();
  const [zones, setZones] = useState<SavingZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGeofencingEnabled, setIsGeofencingEnabled] = useState(false);
  
  const { location, getCurrentLocation } = useLocation();
  
  // Gunakan hook geofencing
  const {
    isTracking,
    zoneStatuses,
    currentZones,
    startGeofencing,
    stopGeofencing,
  } = useGeofencing(zones, {
    notifyOnEntry: true,
    notifyOnExit: false,
  });
  
  // Fungsi untuk memuat zona hemat
  const loadSavingZones = async () => {
    try {
      setIsLoading(true);
      const data = await getSavingZones();
      setZones(data);
    } catch (error) {
      console.error('Error loading saving zones:', error);
      Alert.alert('Error', 'Gagal memuat data zona hemat');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fungsi untuk refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadSavingZones();
    await getCurrentLocation();
    setIsRefreshing(false);
  };
  
  // Fungsi untuk menangani klik pada zona
  const handleZonePress = (zone: SavingZone) => {
    navigation.navigate('EditSavingZone', { zoneId: zone.id });
  };
  
  // Fungsi untuk menangani toggle notifikasi
  const handleToggleNotification = async (zone: SavingZone, enabled: boolean) => {
    try {
      await updateSavingZone(zone.id, {
        ...zone,
        notificationEnabled: enabled,
      });
      
      // Perbarui state lokal
      setZones(prevZones =>
        prevZones.map(z =>
          z.id === zone.id ? { ...z, notificationEnabled: enabled } : z
        )
      );
    } catch (error) {
      console.error('Error toggling notification:', error);
      Alert.alert('Error', 'Gagal mengubah pengaturan notifikasi');
    }
  };
  
  // Fungsi untuk menangani penghapusan zona
  const handleDeleteZone = (zone: SavingZone) => {
    Alert.alert(
      'Hapus Zona',
      `Apakah Anda yakin ingin menghapus zona "${zone.name}"?`,
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSavingZone(zone.id);
              
              // Perbarui state lokal
              setZones(prevZones => prevZones.filter(z => z.id !== zone.id));
            } catch (error) {
              console.error('Error deleting zone:', error);
              Alert.alert('Error', 'Gagal menghapus zona');
            }
          },
        },
      ]
    );
  };
  
  // Fungsi untuk menangani toggle geofencing
  const handleToggleGeofencing = async () => {
    if (isGeofencingEnabled) {
      await stopGeofencing();
      setIsGeofencingEnabled(false);
    } else {
      const success = await startGeofencing();
      setIsGeofencingEnabled(success);
    }
  };
  
  // Fungsi untuk menangani tambah zona baru
  const handleAddZone = () => {
    navigation.navigate('AddSavingZone');
  };
  
  // Memuat zona saat komponen dimount
  useEffect(() => {
    loadSavingZones();
    getCurrentLocation();
  }, []);
  
  // Memuat ulang zona saat layar mendapatkan fokus
  useFocusEffect(
    useCallback(() => {
      loadSavingZones();
      return () => {};
    }, [])
  );
  
  // Render item zona
  const renderZoneItem = ({ item }: { item: SavingZone }) => {
    const zoneStatus = zoneStatuses.find(status => status.zoneId === item.id);
    const isActive = zoneStatus?.isInside || false;
    const distance = zoneStatus?.distance;
    
    return (
      <SavingZoneItem
        zone={item}
        onPress={handleZonePress}
        onToggleNotification={handleToggleNotification}
        isActive={isActive}
        distance={distance}
      />
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Typography variant="h4">Zona Hemat</Typography>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[
              styles.geofencingButton,
              isGeofencingEnabled && styles.geofencingButtonActive,
            ]}
            onPress={handleToggleGeofencing}
          >
            <Typography
              variant="body2"
              color={isGeofencingEnabled ? theme.colors.white : theme.colors.primary[500]}
            >
              {isGeofencingEnabled ? 'Pemantauan Aktif' : 'Aktifkan Pemantauan'}
            </Typography>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.addButton} onPress={handleAddZone}>
            <Typography variant="body1" color={theme.colors.primary[500]}>
              + Tambah
            </Typography>
          </TouchableOpacity>
        </View>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        </View>
      ) : (
        <FlatList
          data={zones}
          renderItem={renderZoneItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <EmptyState
              title="Belum Ada Zona Hemat"
              description="Tambahkan zona hemat untuk mendapatkan notifikasi saat Anda memasuki area dengan pengeluaran tinggi atau peluang untuk menghemat."
              actionLabel="Tambah Zona"
              onAction={handleAddZone}
            />
          }
        />
      )}
      
      {currentZones.length > 0 && (
        <View style={styles.activeZoneContainer}>
          <Typography variant="body1" weight="600" color={theme.colors.white}>
            Anda berada di {currentZones.length} zona
          </Typography>
          <Typography variant="body2" color={theme.colors.white}>
            {currentZones.map(zone => zone.name).join(', ')}
          </Typography>
        </View>
      )}
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  geofencingButton: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary[500],
  },
  geofencingButtonActive: {
    backgroundColor: theme.colors.success[500],
    borderColor: theme.colors.success[500],
  },
  addButton: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary[500],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: theme.spacing.layout.sm,
    paddingTop: 0,
    flexGrow: 1,
  },
  activeZoneContainer: {
    backgroundColor: theme.colors.primary[500],
    padding: theme.spacing.md,
    margin: theme.spacing.layout.sm,
    borderRadius: theme.borderRadius.md,
    ...theme.elevation.md,
  },
});
