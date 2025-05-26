import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../core/navigation/types';
import { Button, Input, Typography, Card, SuperiorDialog } from '../../../core/components';
import { theme } from '../../../core/theme';
import { useAuthStore } from '../../../core/services/store';
import { useAppDimensions } from '../../../core/hooks/useAppDimensions';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../config/supabase';
import { useSuperiorDialog } from '../../../core/hooks';

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

type FormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export const RegisterScreen = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { register: registerUser, isLoading, error, clearError } = useAuthStore();
  const { dialogState, showConfirm, showSuccess, hideDialog } = useSuperiorDialog();

  // Hook responsif untuk mendapatkan dimensi dan breakpoint
  const {
    width,
    height,
    breakpoint,
    isLandscape,
    responsiveFontSize,
    responsiveSpacing,
    isSmallDevice,
    isMediumDevice,
    isLargeDevice
  } = useAppDimensions();

  // Animasi untuk form
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

  // Responsive logo size berdasarkan device dan orientasi
  const getLogoSize = () => {
    if (isLandscape) {
      return isSmallDevice ? width * 0.12 : width * 0.1;
    }
    if (isSmallDevice) return width * 0.22;
    if (isLargeDevice) return width * 0.18;
    return width * 0.25; // medium device
  };

  const LOGO_SIZE = getLogoSize();

  // Responsive padding top berdasarkan device dan orientasi
  const getResponsivePaddingTop = () => {
    if (isLandscape) {
      return responsiveSpacing(theme.spacing.layout.xs);
    }
    if (isSmallDevice) return width * 0.08;
    if (isLargeDevice) return width * 0.06;
    return width * 0.1; // medium device
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

  const { control, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    }
  });

  const password = watch('password');

  // Animasi saat komponen mount
  useEffect(() => {
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
  }, []);

  const onSubmit = async (data: FormData) => {
    try {
      const result = await registerUser(data.email, data.password, data.name);

      if (result.success) {
        // Cek apakah email perlu konfirmasi
        const { data: authData } = await supabase.auth.getSession();

        if (!authData.session) {
          // Email perlu konfirmasi
          showSuccess('Pendaftaran Berhasil', 'Silakan cek email Anda untuk konfirmasi akun.');
        } else {
          // Email tidak perlu konfirmasi, langsung navigasi ke login
          showSuccess('Pendaftaran Berhasil', 'Akun Anda telah berhasil dibuat.');
          setTimeout(() => {
            navigation.navigate('Login', {
              email: data.email,
              password: data.password
            } as any);
          }, 2000);
        }
      } else if (result.error) {
        // Error sudah ditangani di authStore dan ditampilkan melalui error state
        console.error('Registration failed:', result.error);

        // Jika error menunjukkan email sudah terdaftar, tawarkan untuk login
        if (result.error.includes('sudah terdaftar')) {
          showConfirm(
            'Email Sudah Terdaftar',
            'Email ini sudah terdaftar. Apakah Anda ingin login?',
            () => {
              navigation.navigate('Login', {
                email: data.email
              } as any);
            }
          );
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  const navigateToLogin = () => {
    clearError();
    navigation.navigate('Login');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
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
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                marginBottom: isLandscape
                  ? responsiveSpacing(theme.spacing.layout.sm)
                  : responsiveSpacing(theme.spacing.layout.md)
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
              <Ionicons name="person-add-outline" size={LOGO_SIZE * 0.5} color={theme.colors.primary[500]} />
            </View>
            <Typography
              variant={isSmallDevice ? "h4" : "h3"}
              color={theme.colors.primary[700]}
              weight="700"
              style={styles.title}
            >
              Daftar Akun
            </Typography>
            <Typography
              variant={isSmallDevice ? "body2" : "body1"}
              align="center"
              color={theme.colors.neutral[600]}
              style={styles.subtitle}
            >
              Buat akun untuk mulai mengelola keuangan Anda
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
              <Controller
                control={control}
                rules={{
                  required: 'Nama harus diisi',
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Nama Lengkap"
                    placeholder="Masukkan nama lengkap Anda"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.name?.message}
                    leftIcon={<Ionicons name="person-outline" size={20} color={theme.colors.neutral[500]} />}
                    containerStyle={styles.inputContainer}
                  />
                )}
                name="name"
              />

              <Controller
                control={control}
                rules={{
                  required: 'Email harus diisi',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email tidak valid',
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Email"
                    placeholder="Masukkan email Anda"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    error={errors.email?.message}
                    leftIcon={<Ionicons name="mail-outline" size={20} color={theme.colors.neutral[500]} />}
                    containerStyle={styles.inputContainer}
                  />
                )}
                name="email"
              />

              <Controller
                control={control}
                rules={{
                  required: 'Password harus diisi',
                  minLength: {
                    value: 8,
                    message: 'Password minimal 8 karakter',
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Password"
                    placeholder="Masukkan password Anda"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry
                    error={errors.password?.message}
                    leftIcon={<Ionicons name="lock-closed-outline" size={20} color={theme.colors.neutral[500]} />}
                    containerStyle={styles.inputContainer}
                  />
                )}
                name="password"
              />

              <Controller
                control={control}
                rules={{
                  required: 'Konfirmasi password harus diisi',
                  validate: value => value === password || 'Password tidak cocok',
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Konfirmasi Password"
                    placeholder="Masukkan kembali password Anda"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry
                    error={errors.confirmPassword?.message}
                    leftIcon={<Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.neutral[500]} />}
                    containerStyle={styles.inputContainer}
                  />
                )}
                name="confirmPassword"
              />

              {error && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle-outline" size={20} color={theme.colors.danger[500]} />
                  <Typography variant="body2" color={theme.colors.danger[500]} style={styles.errorText}>
                    {error}
                  </Typography>
                </View>
              )}

              <Button
                title="Daftar"
                onPress={handleSubmit(onSubmit)}
                loading={isLoading}
                fullWidth
                style={styles.button}
                variant="gradient"
              />
            </Card>

            <View style={styles.footer}>
              <Typography variant="body2" color={theme.colors.neutral[600]}>
                Sudah punya akun?
              </Typography>
              <TouchableOpacity onPress={navigateToLogin} style={styles.loginButton}>
                <Typography variant="body2" color={theme.colors.primary[500]} weight="600">
                  Masuk
                </Typography>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </LinearGradient>
      </ScrollView>

      {/* Superior Dialog */}
      <SuperiorDialog
        visible={dialogState.visible}
        type={dialogState.type}
        title={dialogState.title}
        message={dialogState.message}
        actions={dialogState.actions}
        onClose={hideDialog}
        icon={dialogState.icon}
        autoClose={dialogState.autoClose}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  gradientBackground: {
    flex: 1,
    paddingBottom: theme.spacing.layout.md,
  },
  header: {
    alignItems: 'center',
  },
  logoCircle: {
    backgroundColor: theme.colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    ...theme.elevation.sm,
  },
  title: {
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    maxWidth: '80%',
  },
  formContainer: {
    width: '100%',
  },
  card: {
    padding: theme.spacing.layout.md,
    borderRadius: 16,
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
  button: {
    height: 50,
    borderRadius: 25,
    ...theme.elevation.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
  },
  loginButton: {
    marginLeft: theme.spacing.xs,
  },
});
