import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../core/navigation/types';
import { Button, Input, Typography, Card, BudgetWiseLogo } from '../../../core/components';
import { theme } from '../../../core/theme';
import { useAuthStore } from '../../../core/services/store';
import { useAppDimensions } from '../../../core/hooks/useAppDimensions';
import { useBiometrics } from '../../../core/hooks/useBiometrics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  storeCredentials,
  getBiometricLoginCredentials,
  isBiometricLoginEnabled
} from '../../../core/services/security/credentialService';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;
type LoginScreenRouteProp = RouteProp<AuthStackParamList, 'Login'>;

interface LoginParams {
  email?: string;
  password?: string;
}

export const LoginScreen = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const route = useRoute<LoginScreenRouteProp>();
  const { login, isLoading, error, clearError } = useAuthStore();

  // Hook responsif untuk mendapatkan dimensi dan breakpoint
  const {
    width,
    isLandscape,
    responsiveSpacing,
    isSmallDevice,
    isLargeDevice
  } = useAppDimensions();

  // Animasi untuk logo dan form
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  // State untuk form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showBiometricOption, setShowBiometricOption] = useState(false);

  // Hook untuk biometrik
  const {
    isAvailable: biometricAvailable,
    authenticate
  } = useBiometrics();

  // Responsive logo size berdasarkan device dan orientasi
  const getLogoSize = () => {
    if (isLandscape) {
      return isSmallDevice ? width * 0.15 : width * 0.12;
    }
    if (isSmallDevice) return width * 0.25;
    if (isLargeDevice) return width * 0.2;
    return width * 0.28; // medium device
  };

  const LOGO_SIZE = getLogoSize();

  // Responsive padding top berdasarkan device dan orientasi dengan SafeAreaView
  const getResponsivePaddingTop = () => {
    if (isLandscape) {
      return responsiveSpacing(theme.spacing.layout.md);
    }
    if (isSmallDevice) return responsiveSpacing(theme.spacing.layout.lg);
    if (isLargeDevice) return responsiveSpacing(theme.spacing.layout.xl);
    return responsiveSpacing(theme.spacing.layout.lg); // medium device
  };

  // Responsive form max width untuk tablet
  const getFormMaxWidth = () => {
    if (isLargeDevice && !isLandscape) {
      return width * 0.6; // Limit form width di tablet portrait
    }
    if (isLargeDevice && isLandscape) {
      return width * 0.5; // Limit form width di tablet landscape
    }
    return '100%'; // Full width untuk phone
  };

  // Mengisi form dari parameter route jika ada
  useEffect(() => {
    if (route.params) {
      const params = route.params as LoginParams;
      if (params.email) setEmail(params.email);
      if (params.password) setPassword(params.password);
    }

    // Animasi saat komponen mount
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [route.params, fadeAnim, slideAnim]);

  // Check biometric availability saat mount
  useEffect(() => {
    const checkBiometricOption = async () => {
      // Tampilkan tombol biometric jika tersedia di perangkat DAN ada credentials tersimpan
      if (biometricAvailable) {
        const biometricEnabled = await isBiometricLoginEnabled();
        setShowBiometricOption(biometricEnabled);
      } else {
        setShowBiometricOption(false);
      }
    };

    checkBiometricOption();
  }, [biometricAvailable]);

  const handleLogin = async () => {
    if (!email.trim()) {
      // Tampilkan error jika email kosong
      return;
    }
    if (!password.trim()) {
      // Tampilkan error jika password kosong
      return;
    }

    try {
      await login(email, password);

      // Jika login berhasil (tidak ada error), simpan credentials untuk biometric login
      // Gunakan Promise untuk memastikan proses selesai
      const saveCredentials = async () => {
        // Tunggu beberapa saat untuk memastikan user state sudah terupdate
        await new Promise(resolve => setTimeout(resolve, 200));

        const currentUser = useAuthStore.getState().user;

        if (currentUser) {
          try {
            const storeSuccess = await storeCredentials(email, password, currentUser.id);

            if (storeSuccess) {
              // Aktifkan biometric login jika penyimpanan berhasil
              const { enableBiometricLogin } = await import('../../../core/services/security/credentialService');
              const enableSuccess = await enableBiometricLogin();

              // Refresh biometric option setelah credentials disimpan
              if (enableSuccess) {
                const biometricEnabled = await isBiometricLoginEnabled();
                setShowBiometricOption(biometricEnabled && biometricAvailable);
              }
            }
          } catch (error) {
            // Gagal menyimpan credentials - silently handled
          }
        }
      };

      // Jalankan penyimpanan credentials
      saveCredentials();
    } catch (error) {
      // Error akan ditangani oleh useAuthStore
    }
  };

  const handleBiometricLogin = async () => {
    try {
      // Clear any existing errors first
      clearError();

      // Periksa apakah biometric login diaktifkan dan ada credentials tersimpan
      const biometricEnabled = await isBiometricLoginEnabled();
      if (!biometricEnabled) {
        // Jika belum ada credentials tersimpan, return silently
        return;
      }

      const authSuccess = await authenticate({
        promptMessage: 'Gunakan biometrik untuk masuk',
        fallbackLabel: 'Gunakan PIN',
      });

      if (authSuccess) {
        // Ambil credentials yang tersimpan
        const credentials = await getBiometricLoginCredentials();

        if (credentials) {
          // Login menggunakan credentials yang tersimpan
          await login(credentials.email, credentials.password);
        } else {
          // No stored credentials found - fallback ke login manual
        }
      } else {
        // Biometric authentication gagal - silently handled
      }
    } catch (error) {
      // Biometric login error - error akan ditampilkan di UI jika login gagal
    }
  };

  const navigateToRegister = () => {
    clearError();
    navigation.navigate('Register');
  };

  const navigateToForgotPassword = () => {
    clearError();
    navigation.navigate('ForgotPassword');
  };





  return (
    <SafeAreaView style={styles.container} edges={['right', 'left', 'top']}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        <LinearGradient
          colors={[theme.colors.primary[50], theme.colors.white]}
          style={[
            styles.gradientBackground,
            {
              paddingTop: getResponsivePaddingTop(),
              paddingHorizontal: responsiveSpacing(theme.spacing.layout.md),
            }
          ]}
        >
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                marginBottom: isLandscape
                  ? responsiveSpacing(theme.spacing.layout.sm)
                  : responsiveSpacing(theme.spacing.layout.lg)
              }
            ]}
          >
            <View style={[
              styles.logoCircle,
              {
                width: LOGO_SIZE,
                height: LOGO_SIZE,
                borderRadius: LOGO_SIZE / 2,
              }
            ]}>
              <BudgetWiseLogo size={LOGO_SIZE * 0.65} variant="login" />
            </View>
            <Typography
              variant={isSmallDevice ? "h3" : "h2"}
              color={theme.colors.primary[700]}
              weight="700"
              style={styles.appName}
            >
              BudgetWise
            </Typography>
            <Typography
              variant={isSmallDevice ? "body2" : "body1"}
              color={theme.colors.neutral[600]}
              align="center"
            >
              Kelola keuangan Anda dengan mudah
            </Typography>
          </Animated.View>

          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                maxWidth: getFormMaxWidth(),
                alignSelf: 'center',
              }
            ]}
          >
            <Card style={styles.card} elevation="md">
              <Typography variant="h4" color={theme.colors.primary[700]} weight="600" style={styles.cardTitle}>
                Masuk
              </Typography>

              <Input
                label="Email"
                placeholder="Masukkan email Anda"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Ionicons name="mail-outline" size={20} color={theme.colors.neutral[500]} />}
                containerStyle={styles.inputContainer}
              />

              <Input
                label="Password"
                placeholder="Masukkan password Anda"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                leftIcon={<Ionicons name="lock-closed-outline" size={20} color={theme.colors.neutral[500]} />}
                containerStyle={styles.inputContainer}
              />

              {error && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle-outline" size={20} color={theme.colors.danger[500]} />
                  <Typography variant="body2" color={theme.colors.danger[500]} style={styles.errorText}>
                    {error}
                  </Typography>
                </View>
              )}

              <TouchableOpacity onPress={navigateToForgotPassword} style={styles.forgotPassword}>
                <Typography variant="body2" color={theme.colors.primary[500]}>
                  Lupa password?
                </Typography>
              </TouchableOpacity>

              <Button
                title="Masuk"
                onPress={handleLogin}
                loading={isLoading}
                fullWidth
                style={styles.button}
                variant="gradient"
              />



              {/* Tombol Biometric Login */}
              {showBiometricOption && (
                <TouchableOpacity
                  style={styles.biometricButton}
                  onPress={handleBiometricLogin}
                  disabled={isLoading}
                >
                  <View style={styles.biometricContent}>
                    <Ionicons
                      name="finger-print"
                      size={24}
                      color={theme.colors.primary[500]}
                    />
                    <Typography
                      variant="body2"
                      color={theme.colors.primary[500]}
                      style={styles.biometricText}
                    >
                      Masuk dengan Biometrik
                    </Typography>
                  </View>
                </TouchableOpacity>
              )}



              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Typography variant="body2" color={theme.colors.neutral[500]} style={styles.dividerText}>
                  atau
                </Typography>
                <View style={styles.dividerLine} />
              </View>

              <Button
                title="Daftar Akun Baru"
                onPress={navigateToRegister}
                fullWidth
                style={styles.registerButton}
                variant="outline"
              />
            </Card>
          </Animated.View>
        </LinearGradient>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: '100%',
  },
  gradientBackground: {
    flex: 1,
    paddingBottom: theme.spacing.layout.md,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoCircle: {
    backgroundColor: theme.colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    padding: theme.spacing.sm, 
    ...theme.elevation.sm,
  },
  appName: {
    marginBottom: theme.spacing.xs,
  },
  formContainer: {
    width: '100%',
  },
  card: {
    padding: theme.spacing.layout.md,
    borderRadius: 16,
  },
  cardTitle: {
    marginBottom: theme.spacing.md,
  },
  inputContainer: {
    marginBottom: theme.spacing.md,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.danger[50],
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    marginLeft: theme.spacing.xs,
    flex: 1,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: theme.spacing.lg,
  },
  button: {
    marginBottom: theme.spacing.md,
    height: 50,
    borderRadius: 25,
    ...theme.elevation.sm,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.neutral[200],
  },
  dividerText: {
    marginHorizontal: theme.spacing.md,
  },
  registerButton: {
    borderColor: theme.colors.primary[500],
    height: 50,
    borderRadius: 25,
  },
  biometricButton: {
    marginTop: theme.spacing.lg,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: theme.colors.primary[300],
    backgroundColor: theme.colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.elevation.sm,
  },
  biometricContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  biometricText: {
    fontWeight: '500',
    fontSize: 16,
  },
});
