import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Dimensions,
  Animated
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../core/navigation/types';
import { Button, Input, Typography, Card } from '../../../core/components';
import { theme } from '../../../core/theme';
import { useAuthStore } from '../../../core/services/store';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../config/supabase';

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

type FormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const { width } = Dimensions.get('window');
const LOGO_SIZE = width * 0.25;

export const RegisterScreen = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { register: registerUser, isLoading, error, clearError } = useAuthStore();

  // Animasi untuk form
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

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
          alert('Pendaftaran berhasil! Silakan cek email Anda untuk konfirmasi akun.');
        } else {
          // Email tidak perlu konfirmasi, langsung navigasi ke login
          navigation.navigate('Login', {
            email: data.email,
            password: data.password
          } as any);
        }
      } else if (result.error) {
        // Error sudah ditangani di authStore dan ditampilkan melalui error state
        console.error('Registration failed:', result.error);

        // Jika error menunjukkan email sudah terdaftar, tawarkan untuk login
        if (result.error.includes('sudah terdaftar')) {
          const goToLogin = window.confirm('Email ini sudah terdaftar. Apakah Anda ingin login?');
          if (goToLogin) {
            navigation.navigate('Login', {
              email: data.email
            } as any);
          }
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
          style={styles.gradientBackground}
        >
          <Animated.View
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.logoCircle}>
              <Ionicons name="person-add-outline" size={LOGO_SIZE * 0.5} color={theme.colors.primary[500]} />
            </View>
            <Typography variant="h3" color={theme.colors.primary[700]} weight="700" style={styles.title}>
              Daftar Akun
            </Typography>
            <Typography variant="body1" align="center" color={theme.colors.neutral[600]} style={styles.subtitle}>
              Buat akun untuk mulai mengelola keuangan Anda
            </Typography>
          </Animated.View>

          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
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
    paddingHorizontal: theme.spacing.layout.md,
    paddingTop: width * 0.1,
    paddingBottom: theme.spacing.layout.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.layout.md,
  },
  logoCircle: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
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
