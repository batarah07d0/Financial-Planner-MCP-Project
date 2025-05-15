import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { Typography } from './Typography';
import { Button } from './Button';
import { Card } from './Card';
import { theme } from '../theme';
import { useCamera, useOCR, ImageResult, OCRResult, ParsedReceipt } from '../hooks';
import { formatCurrency, formatDate } from '../utils';

interface ReceiptScannerProps {
  onScanComplete: (data: {
    total?: number;
    date?: string;
    merchant?: string;
    items?: Array<{
      name: string;
      price: number;
      quantity?: number;
    }>;
    imageUri?: string;
  }) => void;
  onCancel?: () => void;
}

export const ReceiptScanner: React.FC<ReceiptScannerProps> = ({
  onScanComplete,
  onCancel,
}) => {
  const [step, setStep] = useState<'capture' | 'preview' | 'processing' | 'result'>('capture');
  const [capturedImage, setCapturedImage] = useState<ImageResult | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [parsedReceipt, setParsedReceipt] = useState<ParsedReceipt | null>(null);

  const {
    takePicture,
    pickImage,
    isLoading: cameraLoading,
    errorMsg: cameraError,
  } = useCamera();

  const {
    recognizeText,
    parseReceipt,
    isLoading: ocrLoading,
    progress: ocrProgress,
    error: ocrError,
  } = useOCR();

  // Fungsi untuk mengambil gambar dari kamera
  const handleTakePicture = async () => {
    const result = await takePicture();

    if (result) {
      setCapturedImage(result);
      setStep('preview');
    }
  };

  // Fungsi untuk memilih gambar dari galeri
  const handlePickImage = async () => {
    const result = await pickImage();

    if (result) {
      setCapturedImage(result);
      setStep('preview');
    }
  };

  // Fungsi untuk memproses gambar
  const handleProcessImage = async () => {
    if (!capturedImage) return;

    setStep('processing');

    try {
      // Lakukan OCR pada gambar
      const result = await recognizeText(capturedImage.uri);

      if (result) {
        setOcrResult(result);

        // Parse hasil OCR
        const parsed = parseReceipt(result);
        setParsedReceipt(parsed);

        setStep('result');
      } else {
        Alert.alert(
          'Gagal Memproses Struk',
          'Tidak dapat mengenali teks pada gambar. Silakan coba lagi dengan gambar yang lebih jelas.'
        );
        setStep('preview');
      }
    } catch (error) {
      console.error('Error processing receipt:', error);
      Alert.alert(
        'Terjadi Kesalahan',
        'Terjadi kesalahan saat memproses struk. Silakan coba lagi.'
      );
      setStep('preview');
    }
  };

  // Fungsi untuk mengonfirmasi hasil
  const handleConfirm = () => {
    if (parsedReceipt) {
      onScanComplete({
        ...parsedReceipt,
        imageUri: capturedImage?.uri || undefined,
      });
    }
  };

  // Fungsi untuk membatalkan
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  // Fungsi untuk mengambil ulang gambar
  const handleRetake = () => {
    setCapturedImage(null);
    setOcrResult(null);
    setParsedReceipt(null);
    setStep('capture');
  };

  // Render berdasarkan step
  const renderContent = () => {
    switch (step) {
      case 'capture':
        return (
          <View style={styles.captureContainer}>
            <Typography variant="h4" align="center" style={styles.title}>
              Pindai Struk
            </Typography>
            <Typography variant="body1" align="center" color={theme.colors.neutral[600]} style={styles.subtitle}>
              Ambil foto struk atau pilih dari galeri
            </Typography>

            <View style={styles.buttonContainer}>
              <Button
                title="Ambil Foto"
                onPress={handleTakePicture}
                loading={cameraLoading}
                style={styles.button}
              />
              <Button
                title="Pilih dari Galeri"
                variant="outline"
                onPress={handlePickImage}
                loading={cameraLoading}
                style={styles.button}
              />
            </View>

            {cameraError && (
              <Typography variant="body2" color={theme.colors.danger[500]} align="center" style={styles.error}>
                {cameraError}
              </Typography>
            )}
          </View>
        );

      case 'preview':
        return (
          <View style={styles.previewContainer}>
            <Typography variant="h4" align="center" style={styles.title}>
              Pratinjau Struk
            </Typography>
            <Typography variant="body1" align="center" color={theme.colors.neutral[600]} style={styles.subtitle}>
              Pastikan struk terlihat jelas dan teks dapat dibaca
            </Typography>

            {capturedImage && (
              <Image
                source={{ uri: capturedImage.uri }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            )}

            <View style={styles.buttonContainer}>
              <Button
                title="Proses Struk"
                onPress={handleProcessImage}
                style={styles.button}
              />
              <Button
                title="Ambil Ulang"
                variant="outline"
                onPress={handleRetake}
                style={styles.button}
              />
            </View>
          </View>
        );

      case 'processing':
        return (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary[500]} />
            <Typography variant="h4" align="center" style={styles.title}>
              Memproses Struk
            </Typography>
            <Typography variant="body1" align="center" color={theme.colors.neutral[600]} style={styles.subtitle}>
              Mohon tunggu sebentar...
            </Typography>
            <Typography variant="body2" align="center" color={theme.colors.primary[500]} style={styles.progress}>
              {Math.round(ocrProgress * 100)}%
            </Typography>
          </View>
        );

      case 'result':
        return (
          <ScrollView contentContainerStyle={styles.resultContainer}>
            <Typography variant="h4" align="center" style={styles.title}>
              Hasil Pemindaian
            </Typography>

            <Card style={styles.resultCard}>
              {parsedReceipt?.merchant && (
                <View style={styles.resultItem}>
                  <Typography variant="body1" color={theme.colors.neutral[600]}>
                    Merchant
                  </Typography>
                  <Typography variant="body1" weight="600">
                    {parsedReceipt.merchant}
                  </Typography>
                </View>
              )}

              {parsedReceipt?.date && (
                <View style={styles.resultItem}>
                  <Typography variant="body1" color={theme.colors.neutral[600]}>
                    Tanggal
                  </Typography>
                  <Typography variant="body1">
                    {parsedReceipt.date}
                  </Typography>
                </View>
              )}

              {parsedReceipt?.total && (
                <View style={styles.resultItem}>
                  <Typography variant="body1" color={theme.colors.neutral[600]}>
                    Total
                  </Typography>
                  <Typography variant="h5" color={theme.colors.primary[500]}>
                    {formatCurrency(parsedReceipt.total)}
                  </Typography>
                </View>
              )}

              {parsedReceipt?.items && parsedReceipt.items.length > 0 && (
                <View style={styles.itemsContainer}>
                  <Typography variant="body1" color={theme.colors.neutral[600]} style={styles.itemsTitle}>
                    Item
                  </Typography>

                  {parsedReceipt.items.map((item, index) => (
                    <View key={index} style={styles.item}>
                      <View style={styles.itemDetails}>
                        <Typography variant="body1">
                          {item.name}
                        </Typography>
                        {item.quantity && (
                          <Typography variant="body2" color={theme.colors.neutral[600]}>
                            x{item.quantity}
                          </Typography>
                        )}
                      </View>
                      <Typography variant="body1">
                        {formatCurrency(item.price)}
                      </Typography>
                    </View>
                  ))}
                </View>
              )}
            </Card>

            <View style={styles.buttonContainer}>
              <Button
                title="Konfirmasi"
                onPress={handleConfirm}
                style={styles.button}
              />
              <Button
                title="Pindai Ulang"
                variant="outline"
                onPress={handleRetake}
                style={styles.button}
              />
            </View>
          </ScrollView>
        );
    }
  };

  return (
    <View style={styles.container}>
      {renderContent()}

      <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
        <Typography variant="body1" color={theme.colors.neutral[600]}>
          Batal
        </Typography>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  captureContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.layout.md,
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.layout.md,
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.layout.md,
  },
  resultContainer: {
    flexGrow: 1,
    padding: theme.spacing.layout.md,
  },
  title: {
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    marginBottom: theme.spacing.layout.md,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: theme.spacing.layout.md,
  },
  button: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  error: {
    marginTop: theme.spacing.md,
  },
  previewImage: {
    width: '100%',
    height: 400,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
  },
  progress: {
    marginTop: theme.spacing.md,
  },
  resultCard: {
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  itemsContainer: {
    marginTop: theme.spacing.md,
  },
  itemsTitle: {
    marginBottom: theme.spacing.sm,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  itemDetails: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  cancelButton: {
    padding: theme.spacing.md,
    alignItems: 'center',
  },
});
