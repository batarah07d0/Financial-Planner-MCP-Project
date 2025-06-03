import React from 'react';
import {
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../core/navigation/types';
import { ReceiptScanner } from '../../../core/components';
import { theme } from '../../../core/theme';

type ReceiptScannerScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ReceiptScanner'>;

export const ReceiptScannerScreen = () => {
  const navigation = useNavigation<ReceiptScannerScreenNavigationProp>();
  
  // Fungsi untuk menangani hasil pemindaian
  const handleScanComplete = (data: {
    total?: number;
    date?: string;
    merchant?: string;
    items?: Array<{
      name: string;
      price: number;
      quantity?: number;
    }>;
    imageUri?: string;
  }) => {
    // Navigasi ke halaman tambah transaksi dengan data hasil pemindaian
    navigation.navigate('AddTransaction', {
      scannedData: {
        amount: data.total,
        date: data.date ? new Date(data.date) : new Date(),
        description: data.merchant,
        receiptImageUri: data.imageUri,
      },
    });
  };
  
  // Fungsi untuk menangani pembatalan
  const handleCancel = () => {
    navigation.goBack();
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ReceiptScanner
        onScanComplete={handleScanComplete}
        onCancel={handleCancel}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
});
