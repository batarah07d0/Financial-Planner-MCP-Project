import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  Platform,
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
export const PrivacyPolicyScreen = () => {
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

  const HeaderCard = () => (
    <Card style={styles.headerCard}>
      <LinearGradient
        colors={[theme.colors.info[50], theme.colors.info[100]]}
        style={styles.headerGradient}
      >
        <View style={styles.headerIcon}>
          <LinearGradient
            colors={[theme.colors.info[500], theme.colors.info[600]]}
            style={styles.iconGradient}
          >
            <Ionicons name="shield-checkmark" size={32} color="white" />
          </LinearGradient>
        </View>
        <Typography variant="h4" weight="700" color={theme.colors.info[700]} style={styles.headerTitle}>
          Kebijakan Privasi
        </Typography>
        <Typography variant="body1" color={theme.colors.info[600]} style={styles.headerSubtitle}>
          Komitmen kami untuk melindungi privasi dan data pribadi Anda
        </Typography>
        <View style={styles.lastUpdated}>
          <Typography variant="caption" color={theme.colors.info[500]}>
            Terakhir diperbarui: 22 Mei 2025
          </Typography>
        </View>
      </LinearGradient>
    </Card>
  );

  const PolicySection = ({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) => (
    <Card style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={theme.colors.primary[500]} />
        </View>
        <View style={styles.sectionTitleContainer}>
          <Typography variant="h6" weight="600" color={theme.colors.neutral[800]} style={styles.sectionTitle}>
            {title}
          </Typography>
        </View>
      </View>
      <View style={styles.sectionContent}>
        {children}
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
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary[500]} />
        </TouchableOpacity>
        <Typography variant="h5" weight="700" color={theme.colors.primary[500]} style={{ fontSize: 18, textAlign: 'center' }}>Kebijakan Privasi</Typography>
        <View style={styles.headerRight} />
      </View>

      <Animated.ScrollView
        style={[styles.scrollView, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <HeaderCard />

        <PolicySection title="Informasi yang Kami Kumpulkan" icon="information-circle-outline">
          <Typography variant="body1" color={theme.colors.neutral[700]} style={styles.paragraph}>
            Kami mengumpulkan informasi yang Anda berikan secara langsung kepada kami, seperti:
          </Typography>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <View style={styles.bulletTextContainer}>
                <Typography variant="body2" color={theme.colors.neutral[600]} style={styles.bulletText}>
                  Informasi akun (nama, email, kata sandi)
                </Typography>
              </View>
            </View>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <View style={styles.bulletTextContainer}>
                <Typography variant="body2" color={theme.colors.neutral[600]} style={styles.bulletText}>
                  Data transaksi keuangan yang Anda input
                </Typography>
              </View>
            </View>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <View style={styles.bulletTextContainer}>
                <Typography variant="body2" color={theme.colors.neutral[600]} style={styles.bulletText}>
                  Preferensi dan pengaturan aplikasi
                </Typography>
              </View>
            </View>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <View style={styles.bulletTextContainer}>
                <Typography variant="body2" color={theme.colors.neutral[600]} style={styles.bulletText}>
                  Data biometrik (jika diaktifkan)
                </Typography>
              </View>
            </View>
          </View>
        </PolicySection>

        <PolicySection title="Bagaimana Kami Menggunakan Informasi" icon="settings-outline">
          <Typography variant="body1" color={theme.colors.neutral[700]} style={styles.paragraph}>
            Informasi yang kami kumpulkan digunakan untuk:
          </Typography>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <View style={styles.bulletTextContainer}>
                <Typography variant="body2" color={theme.colors.neutral[600]} style={styles.bulletText}>
                  Menyediakan dan memelihara layanan aplikasi
                </Typography>
              </View>
            </View>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <View style={styles.bulletTextContainer}>
                <Typography variant="body2" color={theme.colors.neutral[600]} style={styles.bulletText}>
                  Menganalisis pola keuangan dan memberikan wawasan
                </Typography>
              </View>
            </View>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <View style={styles.bulletTextContainer}>
                <Typography variant="body2" color={theme.colors.neutral[600]} style={styles.bulletText}>
                  Mengirim notifikasi dan pembaruan penting
                </Typography>
              </View>
            </View>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <View style={styles.bulletTextContainer}>
                <Typography variant="body2" color={theme.colors.neutral[600]} style={styles.bulletText}>
                  Meningkatkan keamanan dan mencegah penipuan
                </Typography>
              </View>
            </View>
          </View>
        </PolicySection>

        <PolicySection title="Keamanan Data" icon="lock-closed-outline">
          <Typography variant="body1" color={theme.colors.neutral[700]} style={styles.paragraph}>
            Kami menerapkan langkah-langkah keamanan tingkat enterprise untuk melindungi data Anda:
          </Typography>
          <View style={styles.securityFeatures}>
            <View style={styles.securityItem}>
              <View style={styles.securityIcon}>
                <Ionicons name="shield-checkmark" size={16} color={theme.colors.success[500]} />
              </View>
              <View style={styles.securityTextContainer}>
                <Typography variant="body2" color={theme.colors.neutral[600]} style={styles.securityText}>
                  Enkripsi end-to-end untuk semua data sensitif
                </Typography>
              </View>
            </View>
            <View style={styles.securityItem}>
              <View style={styles.securityIcon}>
                <Ionicons name="key" size={16} color={theme.colors.success[500]} />
              </View>
              <View style={styles.securityTextContainer}>
                <Typography variant="body2" color={theme.colors.neutral[600]} style={styles.securityText}>
                  Autentikasi dua faktor dan biometrik
                </Typography>
              </View>
            </View>
            <View style={styles.securityItem}>
              <View style={styles.securityIcon}>
                <Ionicons name="server" size={16} color={theme.colors.success[500]} />
              </View>
              <View style={styles.securityTextContainer}>
                <Typography variant="body2" color={theme.colors.neutral[600]} style={styles.securityText}>
                  Server aman dengan sertifikasi ISO 27001
                </Typography>
              </View>
            </View>
          </View>
        </PolicySection>

        <PolicySection title="Berbagi Informasi" icon="share-outline">
          <Typography variant="body1" color={theme.colors.neutral[700]} style={styles.paragraph}>
            Kami tidak akan menjual, menyewakan, atau membagikan informasi pribadi Anda kepada pihak ketiga tanpa persetujuan Anda, kecuali dalam situasi berikut:
          </Typography>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <View style={styles.bulletTextContainer}>
                <Typography variant="body2" color={theme.colors.neutral[600]} style={styles.bulletText}>
                  Ketika diwajibkan oleh hukum atau proses hukum
                </Typography>
              </View>
            </View>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <View style={styles.bulletTextContainer}>
                <Typography variant="body2" color={theme.colors.neutral[600]} style={styles.bulletText}>
                  Untuk melindungi hak, properti, atau keselamatan
                </Typography>
              </View>
            </View>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <View style={styles.bulletTextContainer}>
                <Typography variant="body2" color={theme.colors.neutral[600]} style={styles.bulletText}>
                  Dengan penyedia layanan tepercaya (dengan perjanjian kerahasiaan)
                </Typography>
              </View>
            </View>
          </View>
        </PolicySection>

        <PolicySection title="Hak Anda" icon="person-outline">
          <Typography variant="body1" color={theme.colors.neutral[700]} style={styles.paragraph}>
            Anda memiliki hak untuk:
          </Typography>
          <View style={styles.rightsList}>
            <View style={styles.rightItem}>
              <View style={styles.rightIcon}>
                <Ionicons name="eye" size={18} color={theme.colors.warning[500]} />
              </View>
              <View style={styles.rightContent}>
                <Typography variant="body1" weight="500">Mengakses Data</Typography>
                <Typography variant="body2" color={theme.colors.neutral[600]}>
                  Melihat data pribadi yang kami simpan
                </Typography>
              </View>
            </View>
            <View style={styles.rightItem}>
              <View style={styles.rightIcon}>
                <Ionicons name="create" size={18} color={theme.colors.info[500]} />
              </View>
              <View style={styles.rightContent}>
                <Typography variant="body1" weight="500">Memperbarui Data</Typography>
                <Typography variant="body2" color={theme.colors.neutral[600]}>
                  Mengubah atau memperbaiki informasi
                </Typography>
              </View>
            </View>
            <View style={styles.rightItem}>
              <View style={styles.rightIcon}>
                <Ionicons name="trash" size={18} color={theme.colors.danger[500]} />
              </View>
              <View style={styles.rightContent}>
                <Typography variant="body1" weight="500">Menghapus Data</Typography>
                <Typography variant="body2" color={theme.colors.neutral[600]}>
                  Meminta penghapusan data pribadi
                </Typography>
              </View>
            </View>
          </View>
        </PolicySection>

        <PolicySection title="Kontak Kami" icon="mail-outline">
          <Typography variant="body1" color={theme.colors.neutral[700]} style={styles.paragraph}>
            Jika Anda memiliki pertanyaan tentang kebijakan privasi ini atau memerlukan bantuan, silakan hubungi kami melalui:
          </Typography>
          <TouchableOpacity
            style={styles.githubContactButton}
            onPress={() => Linking.openURL('https://github.com/batarah07d0/Financial-Planner-MCP-Project')}
          >
            <LinearGradient
              colors={[theme.colors.neutral[800], theme.colors.neutral[900]]}
              style={styles.githubButtonGradient}
            >
              <Ionicons name="logo-github" size={20} color="white" />
              <Typography variant="body1" color="white" weight="600">
                GitHub Repository
              </Typography>
            </LinearGradient>
          </TouchableOpacity>
          <Typography variant="body2" color={theme.colors.neutral[600]} style={styles.githubDescription}>
            Kunjungi repository GitHub kami untuk melaporkan masalah, memberikan feedback, atau mengajukan pertanyaan terkait kebijakan privasi.
          </Typography>
        </PolicySection>

        <View style={styles.footer}>
          <Typography variant="caption" color={theme.colors.neutral[500]} style={styles.footerText}>
            Kebijakan ini dapat diperbarui sewaktu-waktu. Kami akan memberitahu Anda tentang perubahan penting melalui aplikasi atau email.
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
    paddingVertical: theme.spacing.lg, 
    paddingHorizontal: theme.spacing.layout.sm,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
    minHeight: 64, 
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
  headerCard: {
    marginBottom: theme.spacing.lg,
    padding: 0,
    overflow: 'hidden',
  },
  headerGradient: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  headerIcon: {
    marginBottom: theme.spacing.md,
  },
  iconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  headerSubtitle: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.md,
  },
  lastUpdated: {
    backgroundColor: theme.colors.info[50],
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
  },
  sectionCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    flexShrink: 0,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    flexWrap: 'wrap',
  },
  sectionContent: {
    flex: 1,
  },
  paragraph: {
    lineHeight: 24,
    marginBottom: theme.spacing.md,
    flexWrap: 'wrap',
  },
  bulletList: {
    gap: theme.spacing.sm,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary[400],
    marginTop: 8,
    marginRight: theme.spacing.sm,
    flexShrink: 0,
  },
  bulletTextContainer: {
    flex: 1,
  },
  bulletText: {
    flexWrap: 'wrap',
  },
  securityFeatures: {
    gap: theme.spacing.sm,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.success[50],
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    flex: 1,
  },
  securityIcon: {
    marginRight: theme.spacing.sm,
    flexShrink: 0,
    marginTop: 2,
  },
  securityTextContainer: {
    flex: 1,
  },
  securityText: {
    flexWrap: 'wrap',
  },
  rightsList: {
    gap: theme.spacing.md,
  },
  rightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  rightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  rightContent: {
    flex: 1,
    paddingRight: theme.spacing.xs,
  },
  contactInfo: {
    gap: theme.spacing.sm,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primary[50],
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  githubContactButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },
  githubButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  githubDescription: {
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    marginTop: theme.spacing.xl,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.neutral[100],
    borderRadius: theme.borderRadius.lg,
  },
  footerText: {
    textAlign: 'center',
    lineHeight: 18,
  },
});
