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

export const TermsConditionsScreen = () => {
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
        colors={[theme.colors.warning[50], theme.colors.warning[100]]}
        style={styles.headerGradient}
      >
        <View style={styles.headerIcon}>
          <LinearGradient
            colors={[theme.colors.warning[500], theme.colors.warning[600]]}
            style={styles.iconGradient}
          >
            <Ionicons name="document-text" size={32} color="white" />
          </LinearGradient>
        </View>
        <Typography variant="h4" weight="700" color={theme.colors.warning[700]} style={styles.headerTitle}>
          Syarat & Ketentuan
        </Typography>
        <Typography variant="body1" color={theme.colors.warning[600]} style={styles.headerSubtitle}>
          Ketentuan penggunaan aplikasi BudgetWise yang harus Anda pahami dan setujui
        </Typography>
        <View style={styles.lastUpdated}>
          <Typography variant="caption" color={theme.colors.warning[500]}>
            Berlaku sejak: 22 Mei 2025
          </Typography>
        </View>
      </LinearGradient>
    </Card>
  );

  const TermSection = ({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) => (
    <Card style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={theme.colors.primary[500]} />
        </View>
        <Typography variant="h6" weight="600" color={theme.colors.neutral[800]}>
          {title}
        </Typography>
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
        <Typography variant="h5" weight="700" color={theme.colors.primary[500]} style={{ fontSize: 18, textAlign: 'center' }}>Syarat & Ketentuan</Typography>
        <View style={styles.headerRight} />
      </View>

      <Animated.ScrollView
        style={[styles.scrollView, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <HeaderCard />

        <TermSection title="Penerimaan Ketentuan" icon="checkmark-circle-outline">
          <Typography variant="body1" color={theme.colors.neutral[700]} style={styles.paragraph}>
            Dengan mengunduh, menginstal, atau menggunakan aplikasi BudgetWise, Anda menyetujui untuk terikat oleh syarat dan ketentuan ini. Jika Anda tidak setuju dengan ketentuan ini, mohon untuk tidak menggunakan aplikasi.
          </Typography>
        </TermSection>

        <TermSection title="Penggunaan Aplikasi" icon="phone-portrait-outline">
          <Typography variant="body1" color={theme.colors.neutral[700]} style={styles.paragraph}>
            BudgetWise adalah aplikasi manajemen keuangan pribadi yang dirancang untuk membantu Anda:
          </Typography>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Typography variant="body2" color={theme.colors.neutral[600]}>
                Melacak dan mengkategorikan transaksi keuangan
              </Typography>
            </View>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Typography variant="body2" color={theme.colors.neutral[600]}>
                Membuat dan memantau anggaran
              </Typography>
            </View>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Typography variant="body2" color={theme.colors.neutral[600]}>
                Menetapkan dan mencapai tujuan keuangan
              </Typography>
            </View>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Typography variant="body2" color={theme.colors.neutral[600]}>
                Menganalisis pola pengeluaran dan pendapatan
              </Typography>
            </View>
          </View>
        </TermSection>

        <TermSection title="Akun Pengguna" icon="person-circle-outline">
          <Typography variant="body1" color={theme.colors.neutral[700]} style={styles.paragraph}>
            Untuk menggunakan fitur lengkap aplikasi, Anda perlu membuat akun. Anda bertanggung jawab untuk:
          </Typography>
          <View style={styles.responsibilityList}>
            <View style={styles.responsibilityItem}>
              <View style={styles.responsibilityIcon}>
                <Ionicons name="key" size={16} color={theme.colors.success[500]} />
              </View>
              <Typography variant="body2" color={theme.colors.neutral[600]}>
                Menjaga kerahasiaan kata sandi dan informasi akun
              </Typography>
            </View>
            <View style={styles.responsibilityItem}>
              <View style={styles.responsibilityIcon}>
                <Ionicons name="shield-checkmark" size={16} color={theme.colors.success[500]} />
              </View>
              <Typography variant="body2" color={theme.colors.neutral[600]}>
                Memberikan informasi yang akurat dan terkini
              </Typography>
            </View>
            <View style={styles.responsibilityItem}>
              <View style={styles.responsibilityIcon}>
                <Ionicons name="alert-circle" size={16} color={theme.colors.warning[500]} />
              </View>
              <Typography variant="body2" color={theme.colors.neutral[600]}>
                Melaporkan penggunaan tidak sah pada akun Anda
              </Typography>
            </View>
          </View>
        </TermSection>

        <TermSection title="Larangan Penggunaan" icon="ban-outline">
          <Typography variant="body1" color={theme.colors.neutral[700]} style={styles.paragraph}>
            Anda dilarang menggunakan aplikasi untuk:
          </Typography>
          <View style={styles.prohibitionList}>
            <View style={styles.prohibitionItem}>
              <View style={styles.prohibitionIcon}>
                <Ionicons name="close-circle" size={16} color={theme.colors.danger[500]} />
              </View>
              <Typography variant="body2" color={theme.colors.neutral[600]}>
                Aktivitas ilegal atau melanggar hukum yang berlaku
              </Typography>
            </View>
            <View style={styles.prohibitionItem}>
              <View style={styles.prohibitionIcon}>
                <Ionicons name="close-circle" size={16} color={theme.colors.danger[500]} />
              </View>
              <Typography variant="body2" color={theme.colors.neutral[600]}>
                Mengganggu atau merusak sistem keamanan aplikasi
              </Typography>
            </View>
            <View style={styles.prohibitionItem}>
              <View style={styles.prohibitionIcon}>
                <Ionicons name="close-circle" size={16} color={theme.colors.danger[500]} />
              </View>
              <Typography variant="body2" color={theme.colors.neutral[600]}>
                Menyebarkan malware atau konten berbahaya
              </Typography>
            </View>
            <View style={styles.prohibitionItem}>
              <View style={styles.prohibitionIcon}>
                <Ionicons name="close-circle" size={16} color={theme.colors.danger[500]} />
              </View>
              <Typography variant="body2" color={theme.colors.neutral[600]}>
                Melakukan reverse engineering atau dekompilasi
              </Typography>
            </View>
          </View>
        </TermSection>

        <TermSection title="Keakuratan Data" icon="analytics-outline">
          <Typography variant="body1" color={theme.colors.neutral[700]} style={styles.paragraph}>
            Meskipun kami berusaha memberikan layanan terbaik, Anda memahami bahwa:
          </Typography>
          <View style={styles.disclaimerBox}>
            <View style={styles.disclaimerHeader}>
              <Ionicons name="warning" size={20} color={theme.colors.warning[500]} />
              <Typography variant="body1" weight="600" color={theme.colors.warning[600]}>
                Penting untuk Diketahui
              </Typography>
            </View>
            <View style={styles.disclaimerContent}>
              <Typography variant="body2" color={theme.colors.neutral[600]} style={styles.disclaimerText}>
                • Aplikasi ini adalah alat bantu manajemen keuangan, bukan penasehat keuangan profesional
              </Typography>
              <Typography variant="body2" color={theme.colors.neutral[600]} style={styles.disclaimerText}>
                • Keputusan keuangan tetap menjadi tanggung jawab Anda sepenuhnya
              </Typography>
              <Typography variant="body2" color={theme.colors.neutral[600]} style={styles.disclaimerText}>
                • Kami tidak bertanggung jawab atas kerugian finansial yang mungkin timbul
              </Typography>
            </View>
          </View>
        </TermSection>

        <TermSection title="Pembaruan Aplikasi" icon="refresh-outline">
          <Typography variant="body1" color={theme.colors.neutral[700]} style={styles.paragraph}>
            Kami dapat memperbarui aplikasi secara berkala untuk meningkatkan fitur, keamanan, dan performa. Pembaruan mungkin diperlukan untuk terus menggunakan aplikasi.
          </Typography>
        </TermSection>

        <TermSection title="Penghentian Layanan" icon="stop-circle-outline">
          <Typography variant="body1" color={theme.colors.neutral[700]} style={styles.paragraph}>
            Kami berhak menghentikan atau menangguhkan akses Anda ke aplikasi jika:
          </Typography>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Typography variant="body2" color={theme.colors.neutral[600]}>
                Anda melanggar syarat dan ketentuan ini
              </Typography>
            </View>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Typography variant="body2" color={theme.colors.neutral[600]}>
                Terdapat aktivitas mencurigakan pada akun Anda
              </Typography>
            </View>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Typography variant="body2" color={theme.colors.neutral[600]}>
                Diperlukan untuk menjaga keamanan sistem
              </Typography>
            </View>
          </View>
        </TermSection>

        <TermSection title="Perubahan Ketentuan" icon="document-outline">
          <Typography variant="body1" color={theme.colors.neutral[700]} style={styles.paragraph}>
            Kami dapat mengubah syarat dan ketentuan ini sewaktu-waktu. Perubahan akan diberitahukan melalui aplikasi atau email. Penggunaan berkelanjutan setelah perubahan dianggap sebagai persetujuan terhadap ketentuan baru.
          </Typography>
        </TermSection>

        <TermSection title="Hukum yang Berlaku" icon="library-outline">
          <Typography variant="body1" color={theme.colors.neutral[700]} style={styles.paragraph}>
            Syarat dan ketentuan ini diatur oleh hukum Republik Indonesia. Setiap sengketa akan diselesaikan melalui pengadilan yang berwenang di Jakarta.
          </Typography>
        </TermSection>

        <View style={styles.contactCard}>
          <View style={styles.contactHeader}>
            <Ionicons name="help-circle" size={24} color={theme.colors.info[500]} />
            <Typography variant="h6" weight="600" color={theme.colors.info[600]}>
              Butuh Bantuan?
            </Typography>
          </View>
          <Typography variant="body2" color={theme.colors.neutral[600]} style={styles.contactText}>
            Jika Anda memiliki pertanyaan tentang syarat dan ketentuan ini atau memerlukan bantuan, silakan kunjungi repository GitHub kami:
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
                Kunjungi GitHub
              </Typography>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Typography variant="caption" color={theme.colors.neutral[500]} style={styles.footerText}>
            Dengan menggunakan BudgetWise, Anda menyetujui syarat dan ketentuan di atas.
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
    paddingVertical: theme.spacing.lg, // Diperbesar dari md ke lg
    paddingHorizontal: theme.spacing.layout.sm,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
    minHeight: 64, // Tambahkan minimum height
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
    backgroundColor: theme.colors.warning[50],
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
  },
  sectionCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
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
  },
  sectionContent: {},
  paragraph: {
    lineHeight: 24,
    marginBottom: theme.spacing.md,
  },
  bulletList: {
    gap: theme.spacing.sm,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary[400],
    marginTop: 8,
    marginRight: theme.spacing.sm,
  },
  responsibilityList: {
    gap: theme.spacing.sm,
  },
  responsibilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.success[50],
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  responsibilityIcon: {
    marginRight: theme.spacing.sm,
  },
  prohibitionList: {
    gap: theme.spacing.sm,
  },
  prohibitionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.danger[50],
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  prohibitionIcon: {
    marginRight: theme.spacing.sm,
  },
  disclaimerBox: {
    backgroundColor: theme.colors.warning[50],
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning[400],
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  disclaimerContent: {
    gap: theme.spacing.xs,
  },
  disclaimerText: {
    lineHeight: 20,
  },
  contactCard: {
    backgroundColor: theme.colors.info[50],
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.info[200],
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  contactText: {
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  githubContactButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  githubButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.sm,
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
