import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import { Typography } from './Typography';
import { Button } from './Button';
import { Card } from './Card';
import { theme } from '../theme';
import { useCamera, useOCR, ImageResult, OCRResult, ParsedReceipt } from '../hooks';
import { formatCurrency, formatDate } from '../utils';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

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
            <LinearGradient
              colors={[theme.colors.primary[500], theme.colors.primary[700]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.headerGradient}
            >
              <View style={styles.headerContent}>
                <TouchableOpacity
                  style={styles.headerBackButton}
                  onPress={handleCancel}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={24} color={theme.colors.white} />
                </TouchableOpacity>

                <Typography variant="h4" color={theme.colors.white} weight="600" style={styles.headerTitle}>
                  Pindai Struk
                </Typography>

                <View style={styles.headerButtonPlaceholder} />
              </View>
            </LinearGradient>

            <View style={styles.illustrationContainer}>
              <Ionicons name="receipt-outline" size={120} color={theme.colors.primary[300]} style={styles.receiptIcon} />
              <View style={styles.scanLineContainer}>
                <Animated.View
                  style={[
                    styles.scanLine,
                    {
                      transform: [
                        {
                          translateY: scanLineAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-100, 100],
                          })
                        }
                      ],
                    }
                  ]}
                />
              </View>
            </View>

            <Card style={styles.infoCard}>
              <View style={styles.infoCardContent}>
                <Ionicons name="information-circle-outline" size={24} color={theme.colors.primary[500]} />
                <Typography variant="body2" color={theme.colors.neutral[700]} style={styles.infoText}>
                  Pindai struk belanja Anda untuk menambahkan transaksi secara otomatis. Pastikan struk terlihat jelas dan tidak terlipat.
                </Typography>
              </View>
            </Card>

            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={styles.optionButton}
                onPress={handleTakePicture}
                disabled={cameraLoading}
              >
                <View style={styles.optionIconContainer}>
                  {cameraLoading ? (
                    <ActivityIndicator size="small" color={theme.colors.white} />
                  ) : (
                    <Ionicons name="camera" size={28} color={theme.colors.white} />
                  )}
                </View>
                <Typography variant="body1" weight="600" style={styles.optionText}>
                  Ambil Foto
                </Typography>
                <Typography variant="caption" color={theme.colors.neutral[500]} style={styles.optionSubtext}>
                  Gunakan kamera
                </Typography>
              </TouchableOpacity>

              <View style={styles.optionDivider} />

              <TouchableOpacity
                style={styles.optionButton}
                onPress={handlePickImage}
                disabled={cameraLoading}
              >
                <View style={[styles.optionIconContainer, styles.galleryIconContainer]}>
                  {cameraLoading ? (
                    <ActivityIndicator size="small" color={theme.colors.white} />
                  ) : (
                    <Ionicons name="images" size={28} color={theme.colors.white} />
                  )}
                </View>
                <Typography variant="body1" weight="600" style={styles.optionText}>
                  Pilih dari Galeri
                </Typography>
                <Typography variant="caption" color={theme.colors.neutral[500]} style={styles.optionSubtext}>
                  Pilih foto yang sudah ada
                </Typography>
              </TouchableOpacity>
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
            <LinearGradient
              colors={[theme.colors.primary[500], theme.colors.primary[700]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.headerGradient}
            >
              <View style={styles.headerContent}>
                <TouchableOpacity
                  style={styles.headerBackButton}
                  onPress={handleRetake}
                >
                  <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
                </TouchableOpacity>
                <Typography variant="h4" color={theme.colors.white} weight="600" style={styles.headerTitle}>
                  Pratinjau Struk
                </Typography>
                <TouchableOpacity
                  style={styles.headerBackButton}
                  onPress={handleCancel}
                >
                  <Ionicons name="close" size={24} color={theme.colors.white} />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <View style={styles.previewImageContainer}>
              {capturedImage && (
                <Image
                  source={{ uri: capturedImage.uri }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              )}

              <View style={styles.previewOverlay}>
                <View style={styles.previewCorner} />
                <View style={styles.previewCorner} />
                <View style={styles.previewCorner} />
                <View style={styles.previewCorner} />
              </View>
            </View>

            <Card style={styles.infoCard}>
              <View style={styles.infoCardContent}>
                <Ionicons name="checkmark-circle-outline" size={24} color={theme.colors.secondary[500]} />
                <Typography variant="body2" color={theme.colors.neutral[700]} style={styles.infoText}>
                  Pastikan struk terlihat jelas, tidak terpotong, dan semua teks dapat terbaca dengan baik.
                </Typography>
              </View>
            </Card>

            <View style={styles.previewButtonContainer}>
              <Button
                title="Proses Struk"
                variant="gradient"
                leftIcon={<Ionicons name="scan-outline" size={20} color={theme.colors.white} />}
                onPress={handleProcessImage}
                style={styles.processButton}
              />
              <Button
                title="Ambil Ulang"
                variant="outline"
                leftIcon={<Ionicons name="camera-outline" size={20} color={theme.colors.primary[500]} />}
                onPress={handleRetake}
                style={styles.retakeButton}
              />
            </View>
          </View>
        );

      case 'processing':
        return (
          <View style={styles.processingContainer}>
            <LinearGradient
              colors={[theme.colors.primary[500], theme.colors.primary[700]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.headerGradient}
            >
              <View style={styles.headerContent}>
                <View style={styles.headerButtonPlaceholder} />
                <Typography variant="h4" color={theme.colors.white} weight="600" style={styles.headerTitle}>
                  Memproses Struk
                </Typography>
                <TouchableOpacity
                  style={styles.headerBackButton}
                  onPress={handleCancel}
                >
                  <Ionicons name="close" size={24} color={theme.colors.white} />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <View style={styles.processingContent}>
              <View style={styles.processingAnimation}>
                <View style={styles.processingImageContainer}>
                  {capturedImage && (
                    <Image
                      source={{ uri: capturedImage.uri }}
                      style={styles.processingImage}
                      resizeMode="contain"
                      blurRadius={3}
                    />
                  )}
                </View>

                <View style={styles.scanningEffect}>
                  <Animated.View
                    style={[
                      styles.scanningLine,
                      {
                        transform: [
                          {
                            translateY: scanLineAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [-100, 100],
                            })
                          }
                        ],
                      }
                    ]}
                  />
                </View>

                <View style={styles.processingIconContainer}>
                  <ActivityIndicator size="large" color={theme.colors.primary[500]} />
                </View>
              </View>

              <Card style={styles.processingCard}>
                <Typography variant="h5" align="center" weight="600" style={styles.processingTitle}>
                  Menganalisis Struk
                </Typography>
                <Typography variant="body2" align="center" color={theme.colors.neutral[600]} style={styles.processingSubtitle}>
                  Mohon tunggu sebentar sementara kami memproses struk Anda...
                </Typography>

                <View style={styles.progressContainer}>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        { width: `${Math.round(ocrProgress * 100)}%` }
                      ]}
                    />
                  </View>
                  <Typography variant="body2" color={theme.colors.primary[500]} weight="600" style={styles.progressText}>
                    {Math.round(ocrProgress * 100)}%
                  </Typography>
                </View>

                <View style={styles.processingSteps}>
                  <View style={styles.processingStep}>
                    <View style={[styles.stepIndicator, ocrProgress > 0.3 && styles.stepCompleted]}>
                      <Ionicons
                        name={ocrProgress > 0.3 ? "checkmark" : "scan-outline"}
                        size={16}
                        color={ocrProgress > 0.3 ? theme.colors.white : theme.colors.primary[500]}
                      />
                    </View>
                    <Typography
                      variant="body2"
                      color={ocrProgress > 0.3 ? theme.colors.neutral[900] : theme.colors.neutral[600]}
                      weight={ocrProgress > 0.3 ? "600" : "400"}
                    >
                      Mengenali teks
                    </Typography>
                  </View>

                  <View style={styles.processingStep}>
                    <View style={[styles.stepIndicator, ocrProgress > 0.6 && styles.stepCompleted]}>
                      <Ionicons
                        name={ocrProgress > 0.6 ? "checkmark" : "document-text-outline"}
                        size={16}
                        color={ocrProgress > 0.6 ? theme.colors.white : theme.colors.primary[500]}
                      />
                    </View>
                    <Typography
                      variant="body2"
                      color={ocrProgress > 0.6 ? theme.colors.neutral[900] : theme.colors.neutral[600]}
                      weight={ocrProgress > 0.6 ? "600" : "400"}
                    >
                      Mengekstrak informasi
                    </Typography>
                  </View>

                  <View style={styles.processingStep}>
                    <View style={[styles.stepIndicator, ocrProgress > 0.9 && styles.stepCompleted]}>
                      <Ionicons
                        name={ocrProgress > 0.9 ? "checkmark" : "calculator-outline"}
                        size={16}
                        color={ocrProgress > 0.9 ? theme.colors.white : theme.colors.primary[500]}
                      />
                    </View>
                    <Typography
                      variant="body2"
                      color={ocrProgress > 0.9 ? theme.colors.neutral[900] : theme.colors.neutral[600]}
                      weight={ocrProgress > 0.9 ? "600" : "400"}
                    >
                      Menghitung total
                    </Typography>
                  </View>
                </View>
              </Card>
            </View>
          </View>
        );

      case 'result':
        return (
          <View style={styles.resultMainContainer}>
            <LinearGradient
              colors={[theme.colors.primary[500], theme.colors.primary[700]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.headerGradient}
            >
              <View style={styles.headerContent}>
                <TouchableOpacity
                  style={styles.headerBackButton}
                  onPress={handleRetake}
                >
                  <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
                </TouchableOpacity>
                <Typography variant="h4" color={theme.colors.white} weight="600" style={styles.headerTitle}>
                  Hasil Pemindaian
                </Typography>
                <TouchableOpacity
                  style={styles.headerBackButton}
                  onPress={handleCancel}
                >
                  <Ionicons name="close" size={24} color={theme.colors.white} />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <ScrollView
              contentContainerStyle={styles.resultContainer}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.resultSuccessContainer}>
                <View style={styles.resultSuccessIcon}>
                  <Ionicons name="checkmark-circle" size={60} color={theme.colors.secondary[500]} />
                </View>
                <Typography variant="h5" align="center" weight="600" style={styles.resultSuccessText}>
                  Pemindaian Berhasil!
                </Typography>
                <Typography variant="body2" align="center" color={theme.colors.neutral[600]} style={styles.resultSuccessSubtext}>
                  Berikut adalah informasi yang berhasil diekstrak dari struk Anda
                </Typography>
              </View>

              <Card style={styles.resultCard}>
                <View style={styles.resultCardHeader}>
                  <Ionicons name="receipt-outline" size={24} color={theme.colors.primary[500]} />
                  <Typography variant="h5" weight="600" color={theme.colors.primary[500]} style={styles.resultCardTitle}>
                    Detail Transaksi
                  </Typography>
                </View>

                {parsedReceipt?.merchant && (
                  <View style={styles.resultItem}>
                    <View style={styles.resultItemLabel}>
                      <Ionicons name="business-outline" size={20} color={theme.colors.neutral[500]} />
                      <Typography variant="body2" color={theme.colors.neutral[600]}>
                        Merchant
                      </Typography>
                    </View>
                    <Typography variant="body1" weight="600">
                      {parsedReceipt.merchant}
                    </Typography>
                  </View>
                )}

                {parsedReceipt?.date && (
                  <View style={styles.resultItem}>
                    <View style={styles.resultItemLabel}>
                      <Ionicons name="calendar-outline" size={20} color={theme.colors.neutral[500]} />
                      <Typography variant="body2" color={theme.colors.neutral[600]}>
                        Tanggal
                      </Typography>
                    </View>
                    <Typography variant="body1" weight="600">
                      {parsedReceipt.date}
                    </Typography>
                  </View>
                )}

                {parsedReceipt?.total && (
                  <View style={styles.resultItem}>
                    <View style={styles.resultItemLabel}>
                      <Ionicons name="cash-outline" size={20} color={theme.colors.neutral[500]} />
                      <Typography variant="body2" color={theme.colors.neutral[600]}>
                        Total
                      </Typography>
                    </View>
                    <Typography variant="h5" color={theme.colors.danger[500]} weight="600">
                      {formatCurrency(parsedReceipt.total)}
                    </Typography>
                  </View>
                )}
              </Card>

              {parsedReceipt?.items && parsedReceipt.items.length > 0 && (
                <Card style={styles.itemsCard}>
                  <View style={styles.resultCardHeader}>
                    <Ionicons name="list-outline" size={24} color={theme.colors.primary[500]} />
                    <Typography variant="h5" weight="600" color={theme.colors.primary[500]} style={styles.resultCardTitle}>
                      Daftar Item
                    </Typography>
                  </View>

                  <View style={styles.itemsContainer}>
                    {parsedReceipt.items.map((item, index) => (
                      <View key={index} style={styles.item}>
                        <View style={styles.itemDetails}>
                          <Typography variant="body1" weight="600">
                            {item.name}
                          </Typography>
                          {item.quantity && (
                            <Typography variant="body2" color={theme.colors.neutral[600]}>
                              x{item.quantity}
                            </Typography>
                          )}
                        </View>
                        <Typography variant="body1" weight="600" color={theme.colors.neutral[800]}>
                          {formatCurrency(item.price)}
                        </Typography>
                      </View>
                    ))}
                  </View>
                </Card>
              )}

              <View style={styles.resultImagePreview}>
                <Typography variant="body2" color={theme.colors.neutral[600]} style={styles.resultImageTitle}>
                  Gambar Struk
                </Typography>
                {capturedImage && (
                  <Image
                    source={{ uri: capturedImage.uri }}
                    style={styles.resultThumbnail}
                    resizeMode="contain"
                  />
                )}
              </View>

              <View style={styles.resultButtonContainer}>
                <Button
                  title="Konfirmasi & Simpan"
                  variant="gradient"
                  leftIcon={<Ionicons name="save-outline" size={20} color={theme.colors.white} />}
                  onPress={handleConfirm}
                  style={styles.confirmButton}
                  fullWidth
                />
                <Button
                  title="Pindai Ulang"
                  variant="outline"
                  leftIcon={<Ionicons name="scan-outline" size={20} color={theme.colors.primary[500]} />}
                  onPress={handleRetake}
                  style={styles.retakeResultButton}
                  fullWidth
                />
              </View>
            </ScrollView>
          </View>
        );
    }
  };

  // Animasi untuk scan line
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  // Memulai animasi scan line
  useEffect(() => {
    if (step === 'capture' || step === 'processing') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scanLineAnim.setValue(0);
    }

    return () => {
      scanLineAnim.stopAnimation();
    };
  }, [step]);

  return (
    <View style={styles.container}>
      {renderContent()}

      {/* Tombol Batal tidak lagi ditampilkan di sini */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  // Header styles
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    width: '100%',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonPlaceholder: {
    width: 40,
  },
  title: {
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPlaceholder: {
    width: 40,
  },

  // Capture screen styles
  captureContainer: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 30,
    height: 200,
    position: 'relative',
  },
  receiptIcon: {
    opacity: 0.8,
  },
  scanLineContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  scanLine: {
    width: 150,
    height: 2,
    backgroundColor: theme.colors.primary[400],
  },
  infoCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: theme.borderRadius.lg,
    ...theme.elevation.sm,
  },
  infoCardContent: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
  },
  optionsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.white,
    ...theme.elevation.md,
    overflow: 'hidden',
  },
  optionButton: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  optionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    ...theme.elevation.sm,
  },
  galleryIconContainer: {
    backgroundColor: theme.colors.accent[500],
  },
  optionText: {
    marginBottom: 5,
  },
  optionSubtext: {
    textAlign: 'center',
  },
  optionDivider: {
    width: 1,
    backgroundColor: theme.colors.neutral[200],
  },

  // Preview screen styles
  previewContainer: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  previewImageContainer: {
    margin: 20,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.elevation.md,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 400,
    borderRadius: theme.borderRadius.lg,
  },
  previewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: theme.colors.primary[500],
    borderRadius: theme.borderRadius.lg,
  },
  previewCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: theme.colors.primary[500],
  },
  previewButtonContainer: {
    padding: 20,
  },
  processButton: {
    marginBottom: 10,
  },
  retakeButton: {
    marginBottom: 20,
  },

  // Processing screen styles
  processingContainer: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  processingContent: {
    flex: 1,
    padding: 20,
  },
  processingAnimation: {
    height: 200,
    marginBottom: 20,
    position: 'relative',
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.elevation.md,
  },
  processingImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  processingImage: {
    width: '100%',
    height: '100%',
  },
  scanningEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanningLine: {
    width: '100%',
    height: 2,
    backgroundColor: theme.colors.primary[400],
  },
  processingIconContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  processingCard: {
    padding: 20,
    borderRadius: theme.borderRadius.lg,
    ...theme.elevation.md,
  },
  processingTitle: {
    marginBottom: 5,
  },
  processingSubtitle: {
    marginBottom: 20,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: 4,
    marginBottom: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary[500],
    borderRadius: 4,
  },
  progressText: {
    textAlign: 'right',
  },
  processingSteps: {
    marginTop: 10,
  },
  processingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  stepIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.white,
    borderWidth: 2,
    borderColor: theme.colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  stepCompleted: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[500],
  },

  // Result screen styles
  resultMainContainer: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  resultContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  resultSuccessContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resultSuccessIcon: {
    marginBottom: 10,
  },
  resultSuccessText: {
    marginBottom: 5,
  },
  resultSuccessSubtext: {
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  resultCard: {
    padding: 20,
    borderRadius: theme.borderRadius.lg,
    marginBottom: 20,
    ...theme.elevation.md,
  },
  resultCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  resultCardTitle: {
    marginLeft: 10,
  },
  resultItem: {
    marginBottom: 15,
  },
  resultItemLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  itemsCard: {
    padding: 20,
    borderRadius: theme.borderRadius.lg,
    marginBottom: 20,
    ...theme.elevation.md,
  },
  itemsContainer: {
    marginTop: 5,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[100],
  },
  itemDetails: {
    flex: 1,
    marginRight: 10,
  },
  resultImagePreview: {
    marginBottom: 30,
  },
  resultImageTitle: {
    marginBottom: 10,
  },
  resultThumbnail: {
    width: '100%',
    height: 150,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
  },
  resultButtonContainer: {
    marginTop: 10,
  },
  confirmButton: {
    marginBottom: 10,
  },
  retakeResultButton: {
    marginBottom: 20,
  },

  // Common styles
  error: {
    marginTop: 20,
    marginHorizontal: 20,
  },
});
