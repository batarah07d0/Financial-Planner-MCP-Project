import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Button } from '../../../core/components';
import { theme } from '../../../core/theme';
import { BarcodeSearchResult } from '../models/Barcode';
import { formatCurrency } from '../../../core/utils';
import { addBarcodeHistory } from '../services/barcodeService';
import { useAuthStore } from '../../../core/services/store';

interface BarcodeScanResultProps {
  result: BarcodeSearchResult;
  onClose: () => void;
  onAddToTransaction?: (data: {
    productName: string;
    price: number;
    barcode: string;
    category: string;
  }) => void;
  onAddNewProduct?: (barcode: string) => void;
}

export const BarcodeScanResultView: React.FC<BarcodeScanResultProps> = ({
  result,
  onClose,
  onAddToTransaction,
  onAddNewProduct,
}) => {
  const [price, setPrice] = useState(
    result.defaultPrice !== undefined && result.defaultPrice !== null ? result.defaultPrice.toString() : ''
  );
  const [quantity, setQuantity] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useAuthStore();

  // Fungsi untuk menangani perubahan harga
  const handlePriceChange = (text: string) => {
    // Hapus semua karakter non-digit
    const numericValue = text.replace(/[^0-9]/g, '');
    setPrice(numericValue);
  };

  // Fungsi untuk menangani perubahan kuantitas
  const handleQuantityChange = (text: string) => {
    // Hapus semua karakter non-digit
    const numericValue = text.replace(/[^0-9]/g, '');
    setQuantity(numericValue || '1'); // Default ke 1 jika kosong
  };

  // Fungsi untuk menangani penambahan ke transaksi
  const handleAddToTransaction = async () => {
    if (!onAddToTransaction) return;

    const priceValue = parseInt(price, 10);
    const quantityValue = parseInt(quantity, 10) || 1;

    if (isNaN(priceValue) || priceValue <= 0) {
      // Tampilkan pesan error
      return;
    }

    setIsSubmitting(true);

    try {
      // Tambahkan ke riwayat pemindaian
      if (user) {
        await addBarcodeHistory({
          barcode: result.barcode,
          productName: result.productName,
          price: priceValue,
          addedToTransaction: true,
        });
      }

      // Panggil callback
      onAddToTransaction({
        productName: result.productName,
        price: priceValue * quantityValue,
        barcode: result.barcode,
        category: result.category,
      });
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Error adding to transaction:', error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fungsi untuk menangani penambahan produk baru
  const handleAddNewProduct = () => {
    if (onAddNewProduct) {
      onAddNewProduct(result.barcode);
    }
  };

  // Render badge sumber data
  const renderSourceBadge = () => {
    let color = theme.colors.neutral[500];
    let label = 'Unknown';

    switch (result.source) {
      case 'local':
        color = theme.colors.success[500];
        label = 'Lokal';
        break;
      case 'community':
        color = theme.colors.primary[500];
        label = 'Komunitas';
        break;
      case 'api':
        color = theme.colors.info[500];
        label = 'API';
        break;
    }

    return (
      <View style={[styles.sourceBadge, { backgroundColor: color }]}>
        <Typography variant="caption" color={theme.colors.white}>
          {label}
        </Typography>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Typography variant="h4">Hasil Pemindaian</Typography>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.neutral[500]} />
          </TouchableOpacity>
        </View>

        <View style={styles.productContainer}>
          {result.imageUrl ? (
            <Image
              source={{ uri: result.imageUrl }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Ionicons
                name="image-outline"
                size={40}
                color={theme.colors.neutral[400]}
              />
            </View>
          )}

          <View style={styles.productInfo}>
            <Typography variant="h5" style={styles.productName}>
              {result.productName}
            </Typography>

            <View style={styles.barcodeContainer}>
              <Typography variant="caption" color={theme.colors.neutral[600]}>
                Barcode: {result.barcode}
              </Typography>
              {renderSourceBadge()}
            </View>

            <Typography variant="body2" color={theme.colors.neutral[600]}>
              Kategori: {result.category}
            </Typography>

            {result.source === 'community' && result.trustScore !== undefined && (
              <View style={styles.trustScoreContainer}>
                <Typography variant="caption" color={theme.colors.neutral[600]}>
                  Skor Kepercayaan:
                </Typography>
                <View
                  style={[
                    styles.trustScoreBadge,
                    {
                      backgroundColor:
                        result.trustScore > 0
                          ? theme.colors.success[500]
                          : result.trustScore < 0
                            ? theme.colors.danger[500]
                            : theme.colors.neutral[500],
                    },
                  ]}
                >
                  <Typography variant="caption" color={theme.colors.white}>
                    {result.trustScore > 0 ? '+' : ''}
                    {result.trustScore}
                  </Typography>
                </View>
              </View>
            )}
          </View>
        </View>

        {result.description && (
          <View style={styles.descriptionContainer}>
            <Typography variant="body2" color={theme.colors.neutral[700]}>
              {result.description}
            </Typography>
          </View>
        )}

        <View style={styles.inputContainer}>
          <View style={styles.inputGroup}>
            <Typography variant="body1" weight="600" style={styles.inputLabel}>
              Harga
            </Typography>
            <View style={styles.priceInputContainer}>
              <Typography variant="body1" style={styles.currencySymbol}>
                Rp
              </Typography>
              <TextInput
                style={styles.priceInput}
                value={price}
                onChangeText={handlePriceChange}
                keyboardType="number-pad"
                placeholder="0"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Typography variant="body1" weight="600" style={styles.inputLabel}>
              Jumlah
            </Typography>
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => {
                  const currentValue = parseInt(quantity, 10) || 0;
                  if (currentValue > 1) {
                    setQuantity((currentValue - 1).toString());
                  }
                }}
              >
                <Ionicons name="remove" size={20} color={theme.colors.neutral[700]} />
              </TouchableOpacity>
              <TextInput
                style={styles.quantityInput}
                value={quantity}
                onChangeText={handleQuantityChange}
                keyboardType="number-pad"
              />
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => {
                  const currentValue = parseInt(quantity, 10) || 0;
                  setQuantity((currentValue + 1).toString());
                }}
              >
                <Ionicons name="add" size={20} color={theme.colors.neutral[700]} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.totalContainer}>
          <Typography variant="body1" weight="600">
            Total:
          </Typography>
          <Typography variant="h5" color={theme.colors.primary[500]}>
            {formatCurrency(
              (parseInt(price, 10) || 0) * (parseInt(quantity, 10) || 1)
            )}
          </Typography>
        </View>

        <View style={styles.actionsContainer}>
          <Button
            title="Tambahkan ke Transaksi"
            onPress={handleAddToTransaction}
            loading={isSubmitting}
            style={styles.addButton}
          />

          {result.source === 'local' || result.source === 'community' ? (
            <Button
              title="Edit Produk"
              variant="outline"
              onPress={handleAddNewProduct}
              style={styles.editButton}
            />
          ) : (
            <Button
              title="Tambah Produk Baru"
              variant="outline"
              onPress={handleAddNewProduct}
              style={styles.editButton}
            />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
  },
  scrollContent: {
    padding: theme.spacing.layout.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.layout.sm,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    padding: theme.spacing.xs,
  },
  productContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.layout.sm,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius.md,
  },
  productImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.neutral[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  productName: {
    marginBottom: theme.spacing.xs,
  },
  barcodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  sourceBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: theme.borderRadius.sm,
    marginLeft: theme.spacing.sm,
  },
  trustScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  trustScoreBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: theme.borderRadius.sm,
    marginLeft: theme.spacing.sm,
  },
  descriptionContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.neutral[100],
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.layout.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.layout.sm,
  },
  inputGroup: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  inputLabel: {
    marginBottom: theme.spacing.xs,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.neutral[300],
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
  },
  currencySymbol: {
    marginRight: theme.spacing.xs,
    color: theme.colors.neutral[600],
  },
  priceInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.neutral[300],
    borderRadius: theme.borderRadius.md,
    height: 48,
  },
  quantityButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.layout.md,
  },
  actionsContainer: {
    marginBottom: theme.spacing.layout.sm,
  },
  addButton: {
    marginBottom: theme.spacing.md,
  },
  editButton: {},
});
