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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../core/navigation/types';
import { Button, Input, Typography, Card } from '../../../core/components';
import { theme } from '../../../core/theme';
import { useAuthStore } from '../../../core/services/store';
import { useAppDimensions } from '../../../core/hooks/useAppDimensions';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

type FormData = {
  email: string;
};

export const ForgotPasswordScreen = () => {
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const { resetPassword, isLoading, error, clearError } = useAuthStore();
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Hook responsif untuk mendapatkan dimensi dan breakpoint
  const {
    width,
    isLandscape,
    responsiveSpacing,
    isSmallDevice,
    isLargeDevice
  } = useAppDimensions();

  // Animasi untuk form
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

  // Responsive logo size berdasarkan device dan orientasi
  const getLogoSize = () => {
    if (isLandscape) {
      return isSmallDevice ? width * 0.1 : width * 0.08;
    }
    if (isSmallDevice) return width * 0.2;
    if (isLargeDevice) return width * 0.15;
    return width * 0.22; // medium device
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

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      email: '',
    }
  });

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
  }, [fadeAnim, slideAnim]);

  const onSubmit = async (data: FormData) => {
    await resetPassword(data.email);
    setIsSubmitted(true);
  };

  const navigateToLogin = () => {
    clearError();
    navigation.navigate('Login');
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
              <Ionicons name="key-outline" size={LOGO_SIZE * 0.5} color={theme.colors.primary[500]} />
            </View>
            <Typography
              variant={isSmallDevice ? "h4" : "h3"}
              color={theme.colors.primary[700]}
              weight="700"
              style={styles.title}
            >
              Reset Password
            </Typography>
            <Typography
              variant={isSmallDevice ? "body2" : "body1"}
              align="center"
              color={theme.colors.neutral[600]}
              style={styles.subtitle}
            >
              Masukkan email Anda untuk menerima instruksi reset password
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
              {isSubmitted ? (
                <View style={styles.successContainer}>
                  <View style={styles.successIconContainer}>
                    <Ionicons name="checkmark-circle" size={60} color={theme.colors.success[500]} />
                  </View>
                  <Typography variant="h4" align="center" color={theme.colors.success[700]} weight="600" style={styles.successTitle}>
                    Email Terkirim!
                  </Typography>
                  <Typography variant="body1" align="center" color={theme.colors.neutral[600]} style={styles.successText}>
                    Silakan periksa email Anda untuk instruksi reset password.
                  </Typography>
                  <Button
                    title="Kembali ke Login"
                    onPress={navigateToLogin}
                    fullWidth
                    style={styles.button}
                    variant="gradient"
                  />
                </View>
              ) : (
                <>
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

                  {error && (
                    <View style={styles.errorContainer}>
                      <Ionicons name="alert-circle-outline" size={20} color={theme.colors.danger[500]} />
                      <Typography variant="body2" color={theme.colors.danger[500]} style={styles.errorText}>
                        {error}
                      </Typography>
                    </View>
                  )}

                  <Button
                    title="Kirim Instruksi Reset"
                    onPress={handleSubmit(onSubmit)}
                    loading={isLoading}
                    fullWidth
                    style={styles.button}
                    variant="gradient"
                  />
                </>
              )}
            </Card>

            {!isSubmitted && (
              <TouchableOpacity onPress={navigateToLogin} style={styles.footer}>
                <Ionicons name="arrow-back-outline" size={16} color={theme.colors.primary[500]} style={styles.backIcon} />
                <Typography variant="body2" color={theme.colors.primary[500]} weight="600">
                  Kembali ke Login
                </Typography>
              </TouchableOpacity>
            )}
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
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  backIcon: {
    marginRight: theme.spacing.xs,
  },
  successContainer: {
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  successIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.success[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    ...theme.elevation.sm,
  },
  successTitle: {
    marginBottom: theme.spacing.md,
  },
  successText: {
    marginBottom: theme.spacing.layout.md,
    textAlign: 'center',
  },
});
