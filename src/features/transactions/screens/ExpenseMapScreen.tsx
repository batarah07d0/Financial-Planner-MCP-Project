import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
// Import dari mock untuk Expo Go
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { Typography, Card } from '../../../core/components';
import { theme } from '../../../core/theme';
import { formatCurrency, formatDate } from '../../../core/utils';
import { useLocation } from '../../../core/hooks';

// Tipe data untuk transaksi dengan lokasi
interface TransactionWithLocation {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description?: string;
  date: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

// Data dummy untuk transaksi dengan lokasi
const dummyTransactionsWithLocation: TransactionWithLocation[] = [
  {
    id: '1',
    amount: 150000,
    type: 'expense',
    category: 'Makanan',
    description: 'Makan Siang',
    date: new Date().toISOString(),
    location: {
      latitude: -6.2088,
      longitude: 106.8456,
      address: 'Jakarta',
    },
  },
  {
    id: '2',
    amount: 200000,
    type: 'expense',
    category: 'Belanja',
    description: 'Supermarket',
    date: new Date().toISOString(),
    location: {
      latitude: -6.2150,
      longitude: 106.8400,
      address: 'Jakarta Selatan',
    },
  },
  {
    id: '3',
    amount: 50000,
    type: 'expense',
    category: 'Transportasi',
    description: 'Ojek Online',
    date: new Date().toISOString(),
    location: {
      latitude: -6.2000,
      longitude: 106.8300,
      address: 'Jakarta Pusat',
    },
  },
  {
    id: '4',
    amount: 300000,
    type: 'expense',
    category: 'Hiburan',
    description: 'Bioskop',
    date: new Date().toISOString(),
    location: {
      latitude: -6.1900,
      longitude: 106.8200,
      address: 'Jakarta Utara',
    },
  },
  {
    id: '5',
    amount: 100000,
    type: 'expense',
    category: 'Kesehatan',
    description: 'Apotek',
    date: new Date().toISOString(),
    location: {
      latitude: -6.2200,
      longitude: 106.8500,
      address: 'Jakarta Timur',
    },
  },
];

export const ExpenseMapScreen = () => {
  const navigation = useNavigation();
  const mapRef = useRef<MapView>(null);
  const [transactions, setTransactions] = useState<TransactionWithLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithLocation | null>(null);
  const [mapType, setMapType] = useState<'standard' | 'heatmap'>('standard');

  const { getCurrentLocation } = useLocation();

  // Fungsi untuk memuat transaksi dengan lokasi
  const loadTransactionsWithLocation = async () => {
    try {
      setIsLoading(true);
      // Simulasi loading
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Gunakan data dummy untuk sementara
      // Nanti akan diganti dengan data dari database lokal atau Supabase
      setTransactions(dummyTransactionsWithLocation);
    } catch (error) {
      console.error('Error loading transactions with location:', error);
      Alert.alert('Error', 'Gagal memuat data transaksi');
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi untuk menangani klik pada marker
  const handleMarkerPress = (transaction: TransactionWithLocation) => {
    setSelectedTransaction(transaction);
  };

  // Fungsi untuk mendapatkan lokasi saat ini dan memindahkan peta
  const handleGetCurrentLocation = async () => {
    const currentLocation = await getCurrentLocation();

    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    }
  };

  // Fungsi untuk mengubah tipe peta
  const toggleMapType = () => {
    setMapType(prev => (prev === 'standard' ? 'heatmap' : 'standard'));
  };

  // Memuat transaksi saat komponen dimount
  useEffect(() => {
    loadTransactionsWithLocation();
    handleGetCurrentLocation();
  }, []);

  // Render marker untuk setiap transaksi
  const renderMarkers = () => {
    return transactions.map(transaction => (
      <Marker
        key={transaction.id}
        coordinate={{
          latitude: transaction.location.latitude,
          longitude: transaction.location.longitude,
        }}
        pinColor={theme.colors.danger[500]}
        onPress={() => handleMarkerPress(transaction)}
      >
        <Callout>
          <View style={styles.callout}>
            <Typography variant="body1" weight="600">
              {transaction.category}
            </Typography>
            {transaction.description && (
              <Typography variant="body2" color={theme.colors.neutral[600]}>
                {transaction.description}
              </Typography>
            )}
            <Typography variant="body1" color={theme.colors.danger[500]}>
              - {formatCurrency(transaction.amount)}
            </Typography>
            <Typography variant="caption" color={theme.colors.neutral[500]}>
              {formatDate(transaction.date, { format: 'medium' })}
            </Typography>
          </View>
        </Callout>
      </Marker>
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Typography variant="body1" color={theme.colors.primary[500]}>
            Kembali
          </Typography>
        </TouchableOpacity>
        <Typography variant="h4">Peta Pengeluaran</Typography>
        <TouchableOpacity onPress={toggleMapType}>
          <Typography variant="body1" color={theme.colors.primary[500]}>
            {mapType === 'standard' ? 'Heatmap' : 'Standar'}
          </Typography>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        </View>
      ) : (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: -6.2088,
              longitude: 106.8456,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
          >
            {mapType === 'standard' ? (
              renderMarkers()
            ) : (
              // Heatmap dinonaktifkan sementara karena masalah tipe
              // Gunakan marker biasa sebagai alternatif
              renderMarkers()
            )}
          </MapView>

          <View style={styles.mapOverlay}>
            <TouchableOpacity
              style={styles.currentLocationButton}
              onPress={handleGetCurrentLocation}
            >
              <Typography variant="body2" color={theme.colors.primary[500]}>
                Lokasi Saat Ini
              </Typography>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {selectedTransaction && (
        <Card style={styles.selectedTransactionCard}>
          <Typography variant="h5">
            {selectedTransaction.category}
          </Typography>
          {selectedTransaction.description && (
            <Typography variant="body1" color={theme.colors.neutral[600]}>
              {selectedTransaction.description}
            </Typography>
          )}
          <Typography variant="h4" color={theme.colors.danger[500]} style={styles.amount}>
            - {formatCurrency(selectedTransaction.amount)}
          </Typography>
          <Typography variant="body2" color={theme.colors.neutral[500]}>
            {formatDate(selectedTransaction.date, { format: 'medium' })}
          </Typography>
          {selectedTransaction.location.address && (
            <Typography variant="body2" color={theme.colors.neutral[600]}>
              {selectedTransaction.location.address}
            </Typography>
          )}
        </Card>
      )}
    </SafeAreaView>
  );
};

// Dimensi layar dapat digunakan jika diperlukan
// const { width, height } = Dimensions.get('window');

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  currentLocationButton: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    ...theme.elevation.sm,
  },
  callout: {
    width: 200,
    padding: theme.spacing.sm,
  },
  selectedTransactionCard: {
    margin: theme.spacing.layout.sm,
  },
  amount: {
    marginVertical: theme.spacing.sm,
  },
});
