import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  Animated,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../../core/navigation/types';
import { Typography, Button } from '../../../core/components';
import { theme } from '../../../core/theme';
import { useAuthStore } from '../../../core/services/store';
import { useAppDimensions } from '../../../core/hooks/useAppDimensions';
import AsyncStorage from '@react-native-async-storage/async-storage';

type OnboardingScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

// Konstanta untuk ukuran gambar yang responsif
const ONBOARDING_STORAGE_KEY = '@onboarding_completed';

// Data untuk halaman onboarding dengan desain superior
const onboardingData = [
  {
    id: '1',
    title: 'Selamat Datang di\nBudgetWise',
    subtitle: 'Kelola Keuangan dengan Bijak',
    description: 'Solusi manajemen keuangan pribadi terlengkap untuk membantu Anda mengelola keuangan dengan lebih bijak dan mencapai tujuan finansial.',
    image: require('../../../../assets/onboarding-1.png'),
    gradient: [theme.colors.primary[500], theme.colors.primary[600]],
    icon: 'wallet-outline',
    features: ['Pencatatan Otomatis', 'Analisis Mendalam', 'Keamanan Terjamin'],
  },
  {
    id: '2',
    title: 'Lacak Pengeluaran\nAnda',
    subtitle: 'Pantau Setiap Transaksi',
    description: 'Pantau semua pengeluaran Anda dengan mudah dan dapatkan wawasan mendalam tentang kebiasaan belanja untuk kontrol finansial yang lebih baik.',
    image: require('../../../../assets/onboarding-2.png'),
    gradient: [theme.colors.success[500], theme.colors.success[600]],
    icon: 'trending-down-outline',
    features: ['Kategori Otomatis', 'Notifikasi Real-time', 'Laporan Detail'],
  },
  {
    id: '3',
    title: 'Atur Anggaran\ndengan Mudah',
    subtitle: 'Rencanakan Masa Depan',
    description: 'Buat dan kelola anggaran untuk berbagai kategori pengeluaran, pantau progres Anda, dan dapatkan peringatan sebelum melebihi batas.',
    image: require('../../../../assets/onboarding-3.png'),
    gradient: [theme.colors.warning[500], theme.colors.warning[600]],
    icon: 'pie-chart-outline',
    features: ['Budget Fleksibel', 'Alert Otomatis', 'Target Realistis'],
  },
  {
    id: '4',
    title: 'Analisis Keuangan\nMendalam',
    subtitle: 'Wawasan Finansial Cerdas',
    description: 'Dapatkan analisis mendalam tentang kesehatan keuangan Anda dengan visualisasi interaktif dan rekomendasi personal untuk masa depan yang lebih cerah.',
    image: require('../../../../assets/onboarding-4.png'),
    gradient: [theme.colors.info[500], theme.colors.info[600]],
    icon: 'analytics-outline',
    features: ['Dashboard Interaktif', 'Laporan Bulanan', 'Rekomendasi Personal'],
  },
];

// Fungsi untuk mendapatkan ukuran gambar yang responsif berdasarkan device
const getImageDimensions = (
  width: number,
  height: number,
  isSmallDevice: boolean,
  isMediumDevice: boolean,
  isLargeDevice: boolean,
  isLandscape: boolean
) => {
  const statusBarHeight = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24;
  const safeAreaTop = Platform.OS === 'ios' ? 44 : 0;
  const availableHeight = height - statusBarHeight - safeAreaTop - (isLandscape ? 150 : 200);

  // Responsif berdasarkan ukuran device
  let imageHeightPercentage = 0.35; // Default untuk medium device
  let maxImageHeight = 300;
  let minImageHeight = 180;

  if (isSmallDevice) {
    imageHeightPercentage = 0.3;
    maxImageHeight = 250;
    minImageHeight = 150;
  } else if (isLargeDevice) {
    imageHeightPercentage = 0.4;
    maxImageHeight = 400;
    minImageHeight = 220;
  }

  // Adjustment untuk landscape mode
  if (isLandscape) {
    imageHeightPercentage *= 0.8;
    maxImageHeight *= 0.8;
  }

  const imageHeight = Math.min(Math.max(availableHeight * imageHeightPercentage, minImageHeight), maxImageHeight);
  const imageWidth = Math.min(width * (isLandscape ? 0.5 : 0.7), imageHeight * 1.2); // Aspect ratio 1.2:1

  return { width: imageWidth, height: imageHeight };
};

export const OnboardingScreen = () => {
  const { width, height } = useWindowDimensions();
  const navigation = useNavigation<OnboardingScreenNavigationProp>();
  const { setOnboardingComplete } = useAuthStore();

  // Hook responsif untuk mendapatkan dimensi dan breakpoint
  const {
    breakpoint,
    isLandscape,
    responsiveFontSize,
    responsiveSpacing,
    isSmallDevice,
    isMediumDevice,
    isLargeDevice
  } = useAppDimensions();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  // Animasi masuk saat komponen dimount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: theme.duration.normal,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: theme.duration.normal,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // COMMENTED FOR PRESENTATION: Cek apakah onboarding sudah pernah diselesaikan
  // useEffect(() => {
  //   checkOnboardingStatus();
  // }, []);

  const checkOnboardingStatus = async () => {
    try {
      const completed = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (completed === 'true') {
        // Jika sudah pernah menyelesaikan onboarding, langsung ke login
        setOnboardingComplete(true);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  // Fungsi untuk melanjutkan ke slide berikutnya
  const scrollToNextSlide = async () => {
    if (isLoading) return;

    if (currentIndex < onboardingData.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      await completeOnboarding();
    }
  };

  // Fungsi untuk menyelesaikan onboarding
  const completeOnboarding = async () => {
    try {
      setIsLoading(true);

      // Simpan status onboarding ke AsyncStorage
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');

      // Animasi keluar
      await new Promise(resolve => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: theme.duration.fast,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: -50,
            duration: theme.duration.fast,
            useNativeDriver: true,
          }),
        ]).start(resolve);
      });

      // Set onboarding complete
      setOnboardingComplete(true);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setOnboardingComplete(true); // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi untuk melewati onboarding
  const skipOnboarding = async () => {
    await completeOnboarding();
  };

  // Render item untuk FlatList dengan desain superior
  const renderItem = ({ item }: { item: typeof onboardingData[0] }) => {
    const imageDimensions = getImageDimensions(width, height, isSmallDevice, isMediumDevice, isLargeDevice, isLandscape);

    return (
      <View style={[styles.slide, { width }]}>
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.1)']}
          style={styles.slideGradient}
        />

        {/* Header dengan ikon */}
        <View style={[styles.headerContainer, { marginBottom: responsiveSpacing(theme.spacing.lg) }]}>
          <View style={[styles.iconContainer, {
            width: responsiveSpacing(isSmallDevice ? 70 : isLargeDevice ? 90 : 80),
            height: responsiveSpacing(isSmallDevice ? 70 : isLargeDevice ? 90 : 80),
          }]}>
            <Ionicons
              name={item.icon as any}
              size={responsiveSpacing(isSmallDevice ? 28 : isLargeDevice ? 36 : 32)}
              color={item.gradient[0]}
            />
          </View>
        </View>

        {/* Gambar dengan ukuran responsif */}
        <View style={styles.imageContainer}>
          <View style={[styles.imageWrapper, {
            width: imageDimensions.width + 20,
            height: imageDimensions.height + 20,
            backgroundColor: `${item.gradient[0]}10`,
          }]}>
            <Image
              source={item.image}
              style={[styles.image, imageDimensions]}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Konten teks */}
        <View style={[styles.contentContainer, {
          paddingHorizontal: responsiveSpacing(isLandscape ? theme.spacing.xl : theme.spacing.md)
        }]}>
          <Typography
            variant="caption"
            align="center"
            color={item.gradient[0]}
            weight="600"
            style={[styles.subtitle, {
              fontSize: responsiveFontSize(isSmallDevice ? 11 : 12),
              marginBottom: responsiveSpacing(theme.spacing.sm)
            }]}
          >
            {item.subtitle}
          </Typography>

          <Typography
            variant={isSmallDevice ? "h3" : isLargeDevice ? "h1" : "h2"}
            align="center"
            weight="700"
            style={[styles.title, {
              marginBottom: responsiveSpacing(theme.spacing.lg),
              lineHeight: responsiveFontSize(isSmallDevice ? 28 : isLargeDevice ? 44 : 36)
            }]}
          >
            {item.title}
          </Typography>

          <Typography
            variant={isSmallDevice ? "body2" : "body1"}
            align="center"
            color={theme.colors.neutral[600]}
            style={[styles.description, {
              marginBottom: responsiveSpacing(theme.spacing.xl),
              lineHeight: responsiveFontSize(isSmallDevice ? 20 : 24),
              paddingHorizontal: responsiveSpacing(isLandscape ? theme.spacing.lg : 0)
            }]}
          >
            {item.description}
          </Typography>

          {/* Fitur highlights */}
          <View style={[styles.featuresContainer, {
            marginTop: responsiveSpacing(theme.spacing.md)
          }]}>
            {item.features.map((feature, index) => (
              <View key={index} style={[styles.featureItem, {
                marginBottom: responsiveSpacing(theme.spacing.sm)
              }]}>
                <View style={[styles.featureDot, {
                  backgroundColor: item.gradient[0],
                  width: responsiveSpacing(6),
                  height: responsiveSpacing(6),
                  borderRadius: responsiveSpacing(3),
                  marginRight: responsiveSpacing(theme.spacing.md)
                }]} />
                <Typography
                  variant="body2"
                  color={theme.colors.neutral[700]}
                  style={[styles.featureText, {
                    fontSize: responsiveFontSize(isSmallDevice ? 12 : 13)
                  }]}
                >
                  {feature}
                </Typography>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  // Render indikator pagination dengan desain superior
  const Paginator = () => {
    const currentItem = onboardingData[currentIndex];

    return (
      <View style={[styles.paginationContainer, {
        paddingHorizontal: responsiveSpacing(theme.spacing.lg),
        paddingVertical: responsiveSpacing(theme.spacing.lg)
      }]}>
        <View style={[styles.dotsContainer, {
          marginBottom: responsiveSpacing(theme.spacing.sm)
        }]}>
          {onboardingData.map((_, index) => {
            const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [
                responsiveSpacing(isSmallDevice ? 6 : 8),
                responsiveSpacing(isSmallDevice ? 20 : 24),
                responsiveSpacing(isSmallDevice ? 6 : 8)
              ],
              extrapolate: 'clamp',
            });

            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });

            const backgroundColor = scrollX.interpolate({
              inputRange,
              outputRange: [
                theme.colors.neutral[300],
                currentItem.gradient[0],
                theme.colors.neutral[300],
              ],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  {
                    width: dotWidth,
                    height: responsiveSpacing(isSmallDevice ? 6 : 8),
                    borderRadius: responsiveSpacing(4),
                    marginHorizontal: responsiveSpacing(4),
                    opacity,
                    backgroundColor,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <Typography
            variant="caption"
            color={theme.colors.neutral[500]}
            style={[styles.progressText, {
              fontSize: responsiveFontSize(isSmallDevice ? 11 : 12)
            }]}
          >
            {currentIndex + 1} dari {onboardingData.length}
          </Typography>
        </View>
      </View>
    );
  };

  const currentItem = onboardingData[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Background gradient */}
      <LinearGradient
        colors={[theme.colors.white, `${currentItem.gradient[0]}05`]}
        style={styles.backgroundGradient}
      />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Skip button */}
        <View style={[styles.skipContainer, {
          top: Platform.OS === 'ios' ? responsiveSpacing(50) : responsiveSpacing(30),
          right: responsiveSpacing(theme.spacing.lg)
        }]}>
          {currentIndex < onboardingData.length - 1 && (
            <TouchableOpacity
              onPress={skipOnboarding}
              style={[styles.skipButton, {
                paddingHorizontal: responsiveSpacing(theme.spacing.md),
                paddingVertical: responsiveSpacing(theme.spacing.sm),
              }]}
              activeOpacity={0.7}
            >
              <Typography
                variant="body1"
                color={theme.colors.neutral[600]}
                weight="500"
                style={{ fontSize: responsiveFontSize(isSmallDevice ? 14 : 16) }}
              >
                Lewati
              </Typography>
              <Ionicons
                name="chevron-forward"
                size={responsiveSpacing(16)}
                color={theme.colors.neutral[600]}
                style={[styles.skipIcon, { marginLeft: responsiveSpacing(theme.spacing.xs) }]}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Main content */}
        <FlatList
          data={onboardingData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
          ref={slidesRef}
          scrollEventThrottle={32}
          style={[styles.flatList, {
            marginTop: isLandscape ? responsiveSpacing(10) : 0
          }]}
          contentContainerStyle={isLandscape ? {
            paddingVertical: responsiveSpacing(theme.spacing.sm)
          } : undefined}
        />

        {/* Pagination */}
        <Paginator />

        {/* Action buttons */}
        <View style={[styles.buttonContainer, {
          paddingHorizontal: responsiveSpacing(theme.spacing.lg),
          paddingBottom: Platform.OS === 'ios' ? responsiveSpacing(theme.spacing.xl) : responsiveSpacing(theme.spacing.lg)
        }]}>
          <LinearGradient
            colors={currentItem.gradient as [string, string]}
            style={[styles.buttonGradient, {
              borderRadius: responsiveSpacing(theme.borderRadius.xl)
            }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <TouchableOpacity
              onPress={scrollToNextSlide}
              style={[styles.actionButton, {
                paddingVertical: responsiveSpacing(isSmallDevice ? theme.spacing.md : theme.spacing.lg),
                paddingHorizontal: responsiveSpacing(theme.spacing.xl)
              }]}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <Animated.View style={[styles.loadingSpinner, {
                    marginRight: responsiveSpacing(theme.spacing.sm)
                  }]}>
                    <Ionicons
                      name="hourglass"
                      size={responsiveSpacing(20)}
                      color={theme.colors.white}
                    />
                  </Animated.View>
                  <Typography
                    variant="body1"
                    color={theme.colors.white}
                    weight="600"
                    style={[styles.buttonText, {
                      fontSize: responsiveFontSize(isSmallDevice ? 14 : 16)
                    }]}
                  >
                    Memuat...
                  </Typography>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Typography
                    variant="body1"
                    color={theme.colors.white}
                    weight="600"
                    style={[styles.buttonText, {
                      fontSize: responsiveFontSize(isSmallDevice ? 14 : 16)
                    }]}
                  >
                    {currentIndex === onboardingData.length - 1 ? "Mulai Sekarang" : "Lanjut"}
                  </Typography>
                  <Ionicons
                    name={currentIndex === onboardingData.length - 1 ? "rocket" : "chevron-forward"}
                    size={responsiveSpacing(20)}
                    color={theme.colors.white}
                    style={[styles.buttonIcon, {
                      marginLeft: responsiveSpacing(theme.spacing.sm)
                    }]}
                  />
                </View>
              )}
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
  },
  skipContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: theme.spacing.lg,
    zIndex: 1000,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  skipIcon: {
    marginLeft: theme.spacing.xs,
  },
  flatList: {
    flex: 1,
  },
  slide: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
  },
  slideGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  iconContainer: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  imageWrapper: {
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.elevation.sm,
  },
  image: {
    borderRadius: theme.borderRadius.lg,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  subtitle: {
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    marginBottom: theme.spacing.lg,
    lineHeight: 36,
  },
  description: {
    marginBottom: theme.spacing.xl,
    lineHeight: 24,
  },
  featuresContainer: {
    marginTop: theme.spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: theme.spacing.md,
  },
  featureText: {
    flex: 1,
  },
  paginationContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
  },
  buttonContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? theme.spacing.xl : theme.spacing.lg,
  },
  buttonGradient: {
    borderRadius: theme.borderRadius.xl,
    ...theme.elevation.md,
  },
  actionButton: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
  },
  buttonIcon: {
    marginLeft: theme.spacing.sm,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingSpinner: {
    marginRight: theme.spacing.sm,
  },
});
