import React, { useState, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  Dimensions, 
  Animated, 
  TouchableOpacity,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../core/navigation/types';
import { Typography, Button } from '../../../core/components';
import { theme } from '../../../core/theme';
import { useAuthStore } from '../../../core/services/store';

type OnboardingScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

// Data untuk halaman onboarding
const onboardingData = [
  {
    id: '1',
    title: 'Selamat Datang di BudgetWise',
    description: 'Solusi manajemen keuangan pribadi terlengkap untuk membantu Anda mengelola keuangan dengan lebih bijak.',
    image: require('../../../../assets/onboarding-1.png'),
  },
  {
    id: '2',
    title: 'Lacak Pengeluaran Anda',
    description: 'Pantau semua pengeluaran Anda dengan mudah dan dapatkan wawasan tentang kebiasaan belanja Anda.',
    image: require('../../../../assets/onboarding-2.png'),
  },
  {
    id: '3',
    title: 'Atur Anggaran dengan Mudah',
    description: 'Buat dan kelola anggaran untuk berbagai kategori pengeluaran dan pantau progres Anda.',
    image: require('../../../../assets/onboarding-3.png'),
  },
  {
    id: '4',
    title: 'Analisis Keuangan Mendalam',
    description: 'Dapatkan analisis mendalam tentang kesehatan keuangan Anda dengan visualisasi yang interaktif.',
    image: require('../../../../assets/onboarding-4.png'),
  },
];

export const OnboardingScreen = () => {
  const { width, height } = useWindowDimensions();
  const navigation = useNavigation<OnboardingScreenNavigationProp>();
  const { setOnboardingComplete } = useAuthStore();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);
  
  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    setCurrentIndex(viewableItems[0].index);
  }).current;
  
  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;
  
  // Fungsi untuk melanjutkan ke slide berikutnya
  const scrollToNextSlide = () => {
    if (currentIndex < onboardingData.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      completeOnboarding();
    }
  };
  
  // Fungsi untuk menyelesaikan onboarding
  const completeOnboarding = () => {
    setOnboardingComplete(true);
  };
  
  // Fungsi untuk melewati onboarding
  const skipOnboarding = () => {
    completeOnboarding();
  };
  
  // Render item untuk FlatList
  const renderItem = ({ item }: { item: typeof onboardingData[0] }) => {
    return (
      <View style={[styles.slide, { width }]}>
        <Image 
          source={item.image} 
          style={[styles.image, { width: width * 0.8, height: height * 0.4 }]} 
          resizeMode="contain"
        />
        <View style={styles.textContainer}>
          <Typography variant="h2" align="center" style={styles.title}>
            {item.title}
          </Typography>
          <Typography variant="body1" align="center" color={theme.colors.neutral[600]} style={styles.description}>
            {item.description}
          </Typography>
        </View>
      </View>
    );
  };
  
  // Render indikator pagination
  const Paginator = () => {
    return (
      <View style={styles.paginationContainer}>
        {onboardingData.map((_, index) => {
          const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
          
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [10, 20, 10],
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
              theme.colors.neutral[400],
              theme.colors.primary[500],
              theme.colors.neutral[400],
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
                  opacity,
                  backgroundColor,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.skipContainer}>
        {currentIndex < onboardingData.length - 1 && (
          <TouchableOpacity onPress={skipOnboarding}>
            <Typography variant="body1" color={theme.colors.primary[500]}>
              Lewati
            </Typography>
          </TouchableOpacity>
        )}
      </View>
      
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
      />
      
      <Paginator />
      
      <View style={styles.buttonContainer}>
        <Button
          title={currentIndex === onboardingData.length - 1 ? "Mulai Sekarang" : "Lanjut"}
          onPress={scrollToNextSlide}
          fullWidth
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.layout.sm,
  },
  image: {
    marginBottom: theme.spacing.layout.md,
  },
  textContainer: {
    paddingHorizontal: theme.spacing.layout.sm,
  },
  title: {
    marginBottom: theme.spacing.md,
  },
  description: {
    marginBottom: theme.spacing.layout.md,
  },
  paginationContainer: {
    flexDirection: 'row',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    height: 10,
    borderRadius: 5,
    marginHorizontal: 8,
  },
  buttonContainer: {
    width: '80%',
    marginBottom: 50,
  },
});
