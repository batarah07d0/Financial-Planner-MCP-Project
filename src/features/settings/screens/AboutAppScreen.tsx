import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  Platform,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Card } from '../../../core/components';
import { theme } from '../../../core/theme';
import { RootStackParamList } from '../../../core/navigation/types';

export const AboutAppScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Setup status bar
    StatusBar.setBarStyle('dark-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('transparent');
      StatusBar.setTranslucent(true);
    }

    // Animasi masuk
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@budgetwise.com?subject=Dukungan BudgetWise&body=Halo tim BudgetWise,%0D%0A%0D%0ASaya memerlukan bantuan dengan:%0D%0A%0D%0A[Jelaskan masalah Anda di sini]%0D%0A%0D%0AInformasi Perangkat:%0D%0A- Platform: ' + Platform.OS + '%0D%0A- Versi App: 1.0.0%0D%0A%0D%0ATerima kasih!');
  };

  const handleRateApp = () => {
    // Implementasi rating app
    const storeUrl = Platform.OS === 'ios'
      ? 'https://apps.apple.com/app/budgetwise'
      : 'https://play.google.com/store/apps/details?id=com.budgetwise';
    Linking.openURL(storeUrl);
  };

  const AppInfoCard = () => (
    <Card style={styles.appInfoCard}>
      <LinearGradient
        colors={[theme.colors.primary[50], theme.colors.primary[100]]}
        style={styles.appInfoGradient}
      >
        <View style={styles.appLogoContainer}>
          <View style={styles.logoWrapper}>
            <LinearGradient
              colors={[theme.colors.primary[500], theme.colors.primary[600]]}
              style={styles.logoGradient}
            >
              <Image
                source={require('../../../../assets/icon.png')}
                style={styles.appLogo}
                resizeMode="contain"
              />
            </LinearGradient>
          </View>
        </View>

        <View style={styles.appInfoContent}>
          <Typography variant="h3" weight="700" color={theme.colors.primary[700]} style={styles.appName}>
            BudgetWise
          </Typography>
          <Typography variant="h6" color={theme.colors.primary[600]} style={styles.appTagline}>
            Kelola Keuangan dengan Bijak
          </Typography>
          <View style={styles.versionContainer}>
            <Typography variant="body1" color={theme.colors.neutral[600]}>
              Versi 1.0.0
            </Typography>
            <View style={styles.versionBadge}>
              <Typography variant="caption" color={theme.colors.success[600]} weight="600">
                TERBARU
              </Typography>
            </View>
          </View>
        </View>
      </LinearGradient>
    </Card>
  );

  const FeatureCard = () => (
    <Card style={styles.featureCard}>
      <View style={styles.cardHeader}>
        <View style={styles.headerIcon}>
          <LinearGradient
            colors={[theme.colors.success[500], theme.colors.success[600]]}
            style={styles.iconGradient}
          >
            <Ionicons name="star" size={24} color="white" />
          </LinearGradient>
        </View>
        <Typography variant="h5" weight="600">Fitur Unggulan</Typography>
      </View>

      <View style={styles.featureList}>
        {[
          { icon: 'wallet-outline', title: 'Manajemen Anggaran', desc: 'Kelola anggaran harian, mingguan, dan bulanan dengan mudah', color: theme.colors.primary[500] },
          { icon: 'analytics-outline', title: 'Analisis Keuangan', desc: 'Laporan dan grafik keuangan yang detail dan interaktif', color: theme.colors.success[500] },
          { icon: 'trophy-outline', title: 'Tantangan Menabung', desc: 'Gamifikasi untuk meningkatkan kebiasaan menabung', color: theme.colors.warning[500] },
          { icon: 'shield-checkmark-outline', title: 'Keamanan Tinggi', desc: 'Enkripsi data dan autentikasi biometrik untuk perlindungan maksimal', color: theme.colors.info[500] },
          { icon: 'scan-outline', title: 'Scan Barcode & Struk', desc: 'Teknologi AI untuk memindai dan mencatat transaksi otomatis', color: theme.colors.secondary[500] },
          { icon: 'location-outline', title: 'Peta Pengeluaran', desc: 'Visualisasi lokasi pengeluaran untuk analisis pola belanja', color: theme.colors.danger[500] },
        ].map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: `${feature.color}20` }]}>
              <Ionicons name={feature.icon as keyof typeof Ionicons.glyphMap} size={20} color={feature.color} />
            </View>
            <View style={styles.featureContent}>
              <Typography variant="body1" weight="500">{feature.title}</Typography>
              <Typography variant="body2" color={theme.colors.neutral[600]}>{feature.desc}</Typography>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );

  const TeamIntroCard = () => (
    <Card style={styles.teamIntroCard}>
      <View style={styles.cardHeader}>
        <View style={styles.headerIcon}>
          <LinearGradient
            colors={[theme.colors.info[500], theme.colors.info[600]]}
            style={styles.iconGradient}
          >
            <Ionicons name="people" size={24} color="white" />
          </LinearGradient>
        </View>
        <Typography variant="h5" weight="600">Tim Pengembang</Typography>
      </View>

      <View style={styles.teamIntroContent}>
        <Typography variant="body1" color={theme.colors.neutral[700]} style={styles.teamIntroText}>
          BudgetWise dikembangkan dengan penuh dedikasi oleh tim ahli keuangan dan teknologi untuk membantu Anda mencapai kebebasan finansial.
        </Typography>

        <View style={styles.teamStatsContainer}>
          <View style={styles.teamStat}>
            <Typography variant="h6" weight="700" color={theme.colors.primary[600]}>3</Typography>
            <Typography variant="caption" color={theme.colors.neutral[600]}>Developer</Typography>
          </View>
          <View style={styles.teamStat}>
            <Typography variant="h6" weight="700" color={theme.colors.success[600]}>1000+</Typography>
            <Typography variant="caption" color={theme.colors.neutral[600]}>Jam Coding</Typography>
          </View>
          <View style={styles.teamStat}>
            <Typography variant="h6" weight="700" color={theme.colors.warning[600]}>100%</Typography>
            <Typography variant="caption" color={theme.colors.neutral[600]}>Dedikasi</Typography>
          </View>
        </View>
      </View>
    </Card>
  );

  const DeveloperCards = () => {
    const developers = [
      {
        name: 'Axel Reginald Wiranto',
        role: 'Lead Developer & UI/UX Designer',
        icon: 'person-circle',
        gradientColors: [theme.colors.primary[500], theme.colors.primary[600]],
        bgColor: theme.colors.primary[50],
        description: 'Memimpin pengembangan aplikasi dan merancang pengalaman pengguna yang intuitif'
      },
      {
        name: 'Batara Hotdo Horas Simbolon',
        role: 'Backend Developer & Database Architect',
        icon: 'server',
        gradientColors: [theme.colors.success[500], theme.colors.success[600]],
        bgColor: theme.colors.success[50],
        description: 'Mengembangkan infrastruktur backend yang robust dan arsitektur database yang efisien'
      },
      {
        name: 'Efri Ramadhan',
        role: 'Frontend Developer & Quality Assurance',
        icon: 'code-slash',
        gradientColors: [theme.colors.warning[500], theme.colors.warning[600]],
        bgColor: theme.colors.warning[50],
        description: 'Mengimplementasikan antarmuka pengguna yang responsif dan memastikan kualitas aplikasi'
      },
    ];

    return (
      <View style={styles.developerCardsContainer}>
        {developers.map((developer, index) => (
          <Card key={index} style={styles.individualDeveloperCard}>
            <LinearGradient
              colors={[developer.bgColor, `${developer.gradientColors[0]}10`]}
              style={styles.developerCardGradient}
            >
              <View style={styles.developerCardHeader}>
                <View style={styles.developerAvatar}>
                  <LinearGradient
                    colors={developer.gradientColors as [string, string]}
                    style={styles.avatarGradient}
                  >
                    <Ionicons name={developer.icon as keyof typeof Ionicons.glyphMap} size={28} color="white" />
                  </LinearGradient>
                </View>
                <View style={styles.developerNameContainer}>
                  <Typography variant="h6" weight="700" color={theme.colors.neutral[800]}>
                    {developer.name}
                  </Typography>
                  <Typography variant="body2" weight="500" color={developer.gradientColors[0]}>
                    {developer.role}
                  </Typography>
                </View>
              </View>

              <Typography variant="body2" color={theme.colors.neutral[600]} style={styles.developerDescription}>
                {developer.description}
              </Typography>

              <View style={styles.developerSkills}>
                <View style={[styles.skillBadge, { backgroundColor: `${developer.gradientColors[0]}20` }]}>
                  <Typography variant="caption" color={developer.gradientColors[0]} weight="600">
                    Expert
                  </Typography>
                </View>
                <View style={[styles.skillBadge, { backgroundColor: `${developer.gradientColors[0]}20` }]}>
                  <Typography variant="caption" color={developer.gradientColors[0]} weight="600">
                    Experienced
                  </Typography>
                </View>
              </View>
            </LinearGradient>
          </Card>
        ))}
      </View>
    );
  };

  const ContactCard = () => (
    <Card style={styles.contactCard}>
      <View style={styles.cardHeader}>
        <View style={styles.headerIcon}>
          <LinearGradient
            colors={[theme.colors.secondary[500], theme.colors.secondary[600]]}
            style={styles.iconGradient}
          >
            <Ionicons name="mail" size={24} color="white" />
          </LinearGradient>
        </View>
        <Typography variant="h5" weight="600">Hubungi Kami</Typography>
      </View>

      <View style={styles.contactCardContent}>
        <Typography variant="body1" color={theme.colors.neutral[700]} style={styles.contactText}>
          Butuh bantuan atau memiliki pertanyaan? Tim kami siap membantu Anda!
        </Typography>

        <TouchableOpacity style={styles.contactMainButton} onPress={handleContactSupport}>
          <LinearGradient
            colors={[theme.colors.secondary[500], theme.colors.secondary[600]]}
            style={styles.contactButtonGradient}
          >
            <Ionicons name="mail-outline" size={20} color="white" />
            <Typography variant="body1" color="white" weight="600">
              Hubungi Dukungan
            </Typography>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const ActionCard = () => (
    <Card style={styles.actionCard}>
      <View style={styles.cardHeader}>
        <View style={styles.headerIcon}>
          <LinearGradient
            colors={[theme.colors.warning[500], theme.colors.warning[600]]}
            style={styles.iconGradient}
          >
            <Ionicons name="heart" size={24} color="white" />
          </LinearGradient>
        </View>
        <Typography variant="h5" weight="600">Dukung Kami</Typography>
      </View>

      <View style={styles.actionContent}>
        <Typography variant="body1" color={theme.colors.neutral[700]} style={styles.actionText}>
          Bantu kami terus berkembang dengan memberikan rating dan ulasan di app store.
        </Typography>

        <TouchableOpacity style={styles.rateButton} onPress={handleRateApp}>
          <LinearGradient
            colors={[theme.colors.warning[500], theme.colors.warning[600]]}
            style={styles.rateButtonGradient}
          >
            <Ionicons name="star" size={20} color="white" />
            <Typography variant="body1" color="white" weight="600">
              Beri Rating
            </Typography>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.neutral[800]} />
        </TouchableOpacity>
        <Typography variant="h5" weight="700" color={theme.colors.primary[500]} style={{ fontSize: 20, textAlign: 'center' }}>Tentang Aplikasi</Typography>
        <View style={styles.headerRight} />
      </View>

      <Animated.ScrollView
        style={[styles.scrollView, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AppInfoCard />
        <FeatureCard />
        <TeamIntroCard />
        <DeveloperCards />
        <ContactCard />
        <ActionCard />

        <View style={styles.footer}>
          <Typography variant="caption" color={theme.colors.neutral[500]} style={styles.footerText}>
            © {new Date().getFullYear()} BudgetWise. Semua hak dilindungi.
          </Typography>
        </View>
      </Animated.ScrollView>
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
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.layout.sm,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
    ...theme.elevation.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    width: 40,
    height: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.layout.sm,
    paddingBottom: theme.spacing.layout.xl,
  },
  appInfoCard: {
    marginBottom: theme.spacing.lg,
    padding: 0,
    overflow: 'hidden',
  },
  appInfoGradient: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  appLogoContainer: {
    marginBottom: theme.spacing.lg,
  },
  logoWrapper: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.white,
    ...theme.elevation.md,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appLogo: {
    width: 50,
    height: 50,
  },
  appInfoContent: {
    alignItems: 'center',
  },
  appName: {
    marginBottom: theme.spacing.xs,
  },
  appTagline: {
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  versionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  versionBadge: {
    backgroundColor: theme.colors.success[100],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  featureCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  headerIcon: {
    marginRight: theme.spacing.md,
  },
  iconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureList: {
    gap: theme.spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  featureContent: {
    flex: 1,
  },
  teamStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.neutral[100],
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    marginHorizontal: theme.spacing.sm,
  },
  teamStat: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: theme.spacing.sm,
  },
  actionCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  actionContent: {
    alignItems: 'center',
  },
  actionText: {
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.lg,
  },
  rateButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  rateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  footerText: {
    textAlign: 'center',
  },

  // Team Intro Card Styles
  teamIntroCard: {
    marginBottom: theme.spacing.lg,
  },
  teamIntroContent: {
    alignItems: 'center',
  },
  teamIntroText: {
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.lg,
  },

  // Developer Cards Styles
  developerCardsContainer: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  individualDeveloperCard: {
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  developerCardGradient: {
    padding: theme.spacing.lg,
  },
  developerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  developerAvatar: {
    marginRight: theme.spacing.md,
  },
  avatarGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  developerNameContainer: {
    flex: 1,
  },
  developerDescription: {
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  developerSkills: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  skillBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },

  // Contact Card Styles
  contactCard: {
    marginBottom: theme.spacing.lg,
  },
  contactCardContent: {
    alignItems: 'center',
  },
  contactText: {
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.lg,
  },
  contactMainButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  contactButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
});
