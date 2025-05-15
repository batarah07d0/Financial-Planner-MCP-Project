import React, { useState } from 'react';
import { View, StyleSheet, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../core/navigation/types';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { BarcodeScanResultView } from '../components/BarcodeScanResult';
import { BarcodeScanStatus, BarcodeScanResult, BarcodeSearchResult } from '../models/Barcode';
import { searchBarcode, addBarcodeHistory } from '../services/barcodeService';
import { useAuthStore } from '../../../core/services/store';

type BarcodeScannerScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'BarcodeScanner'>;
type BarcodeScannerScreenRouteProp = RouteProp<RootStackParamList, 'BarcodeScanner'>;

export const BarcodeScannerScreen = () => {
  const navigation = useNavigation<BarcodeScannerScreenNavigationProp>();
  const route = useRoute<BarcodeScannerScreenRouteProp>();
  const { onScanComplete } = route.params || {};

  // State untuk menyimpan hasil pemindaian (tidak digunakan langsung di UI)
  const setScanResult = useState<BarcodeScanResult | null>(null)[1];
  const [searchResult, setSearchResult] = useState<BarcodeSearchResult | null>(null);
  const [isResultModalVisible, setIsResultModalVisible] = useState(false);

  const { user } = useAuthStore();

  // Fungsi untuk menangani hasil pemindaian barcode
  const handleBarcodeScanned = async (result: BarcodeScanResult) => {
    // Simpan hasil pemindaian ke state
    setScanResult(result);

    try {
      if (result.status === BarcodeScanStatus.FOUND && result.barcode) {
        // Jika barcode ditemukan, cari data produk
        if (!result.data) {
          // Cari data barcode jika belum ada dalam hasil pemindaian
          const data = await searchBarcode(result.barcode);
          if (data) {
            // Jika data ditemukan, tampilkan modal hasil
            setSearchResult(data);
            setIsResultModalVisible(true);
          } else {
            // Barcode tidak ditemukan di database
            // Gunakan setTimeout untuk menghindari masalah dengan Alert yang muncul terlalu cepat
            setTimeout(() => {
              Alert.alert(
                'Produk Tidak Ditemukan',
                'Produk dengan barcode ini tidak ditemukan. Apakah Anda ingin menambahkan produk baru?',
                [
                  {
                    text: 'Tidak',
                    style: 'cancel',
                  },
                  {
                    text: 'Ya',
                    onPress: () => {
                      // Navigasi ke layar tambah produk
                      navigation.navigate('AddProduct', { barcode: result.barcode });
                    },
                  },
                ]
              );
            }, 300);
          }
        } else {
          // Jika data sudah ada dalam hasil pemindaian
          setSearchResult(result.data);
          setIsResultModalVisible(true);
        }
      }
    } catch (error) {
      console.error('Error handling barcode scan:', error);
      Alert.alert(
        'Error',
        'Terjadi kesalahan saat memproses hasil pemindaian. Silakan coba lagi.'
      );
    }
  };

  // Fungsi untuk menangani penambahan ke transaksi
  const handleAddToTransaction = async (data: {
    productName: string;
    price: number;
    barcode: string;
    category: string;
  }) => {
    try {
      // Tutup modal hasil terlebih dahulu untuk menghindari masalah UI
      setIsResultModalVisible(false);

      // Tambahkan ke riwayat pemindaian
      if (user) {
        try {
          await addBarcodeHistory({
            barcode: data.barcode,
            productName: data.productName,
            price: data.price,
            addedToTransaction: true,
          });
        } catch (historyError) {
          console.error('Error adding to barcode history:', historyError);
          // Lanjutkan meskipun ada error pada riwayat
        }
      }

      // Siapkan data untuk callback
      const callbackData = {
        productName: data.productName,
        amount: data.price,
        category: data.category,
        barcode: data.barcode,
      };

      // Gunakan setTimeout untuk memastikan UI telah diperbarui sebelum navigasi
      setTimeout(() => {
        // Panggil callback jika ada
        if (onScanComplete) {
          onScanComplete(callbackData);
        }

        // Kembali ke layar sebelumnya
        navigation.goBack();
      }, 300);
    } catch (error) {
      console.error('Error adding to transaction:', error);
      Alert.alert('Error', 'Gagal menambahkan ke transaksi');
    }
  };

  // Fungsi untuk menangani penambahan produk baru
  const handleAddNewProduct = (barcode: string) => {
    // Tutup modal hasil terlebih dahulu
    setIsResultModalVisible(false);

    // Gunakan setTimeout untuk memastikan UI telah diperbarui sebelum navigasi
    setTimeout(() => {
      // Navigasi ke layar tambah produk
      navigation.navigate('AddProduct', { barcode });
    }, 300);
  };

  // Fungsi untuk menangani penutupan modal hasil
  const handleCloseResultModal = () => {
    setIsResultModalVisible(false);
  };

  // Fungsi untuk menangani penutupan layar pemindaian
  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <BarcodeScanner
        onBarcodeScanned={handleBarcodeScanned}
        onClose={handleClose}
        autoSearch={true}
        vibrate={true}
        searchDelay={500}
        sources={['local', 'community', 'api']}
      />

      {/* Modal untuk menampilkan hasil pemindaian */}
      <Modal
        visible={isResultModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseResultModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {searchResult && (
              <BarcodeScanResultView
                result={searchResult}
                onClose={handleCloseResultModal}
                onAddToTransaction={handleAddToTransaction}
                onAddNewProduct={handleAddNewProduct}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    height: '80%',
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
});
