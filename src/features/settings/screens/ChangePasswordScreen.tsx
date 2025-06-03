import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../config/supabase';
import { RootStackParamList } from '../../../core/navigation/types';
import { Typography, Card, Input, Button } from '../../../core/components';
import { theme } from '../../../core/theme';
import { useAuthStore } from '../../../core/services/store';
import { useNotificationManager } from '../../../core/hooks/useNotificationManager';

export const ChangePasswordScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuthStore();
  const { sendAccountUpdateNotification } = useNotificationManager();

  // State untuk form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animasi
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;

  useEffect(() => {
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
  }, [fadeAnim, slideAnim]);

  // Validasi password
  const validatePassword = () => {
    if (!currentPassword) {
      setError('Password saat ini harus diisi');
      return false;
    }

    if (!newPassword) {
      setError('Password baru harus diisi');
      return false;
    }

    if (newPassword.length < 8) {
      setError('Password baru minimal 8 karakter');
      return false;
    }

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak sesuai');
      return false;
    }

    setError(null);
    return true;
  };

  const handleChangePassword = async () => {
    try {
      Keyboard.dismiss();

      if (!user) {
        Alert.alert('Error', 'Anda harus login untuk mengubah password');
        return;
      }

      if (!validatePassword()) {
        return;
      }

      setIsLoading(true);

      // Validasi password lama dengan mencoba login ulang
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email || '',
        password: currentPassword,
      });

      if (verifyError) {
        setError('Password saat ini tidak valid');
        return;
      }

      // Ubah password di Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Kirim notifikasi sukses
      await sendAccountUpdateNotification('password', true);

      Alert.alert(
        'Sukses',
        'Password berhasil diubah',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Kirim notifikasi error
      await sendAccountUpdateNotification('password', false);

      // Handle specific error messages
      if (errorMessage.includes('Invalid login credentials')) {
        setError('Password saat ini tidak valid');
      } else if (errorMessage.includes('auth')) {
        setError('Terjadi kesalahan autentikasi');
      } else {
        setError('Gagal mengubah password. Silakan coba lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.neutral[800]} />
          </TouchableOpacity>
          <Typography variant="h4" weight="600">Ubah Password</Typography>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.animatedContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Card style={styles.card} elevation="md">
              <LinearGradient
                colors={[theme.colors.primary[50], theme.colors.white]}
                style={styles.cardHeader}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name="lock-closed" size={32} color={theme.colors.primary[500]} />
                </View>
                <Typography variant="h5" weight="600" style={styles.cardTitle}>
                  Ubah Password
                </Typography>
                <Typography variant="body2" color={theme.colors.neutral[600]} style={styles.cardSubtitle}>
                  Password minimal 8 karakter
                </Typography>
              </LinearGradient>

              <View style={styles.formContainer}>
                <Input
                  label="Password Saat Ini"
                  value={currentPassword}
                  onChangeText={(text) => {
                    setCurrentPassword(text);
                    setError(null);
                  }}
                  placeholder="Masukkan password saat ini"
                  secureTextEntry
                  leftIcon={<Ionicons name="lock-closed-outline" size={20} color={theme.colors.neutral[500]} />}
                  containerStyle={styles.inputContainer}
                />

                <Input
                  label="Password Baru"
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    setError(null);
                  }}
                  placeholder="Masukkan password baru"
                  secureTextEntry
                  leftIcon={<Ionicons name="key-outline" size={20} color={theme.colors.neutral[500]} />}
                  containerStyle={styles.inputContainer}
                />

                <Input
                  label="Konfirmasi Password Baru"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    setError(null);
                  }}
                  placeholder="Masukkan kembali password baru"
                  secureTextEntry
                  leftIcon={<Ionicons name="checkmark-circle-outline" size={20} color={theme.colors.neutral[500]} />}
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

                <View style={styles.buttonContainer}>
                  <Button
                    title="UBAH PASSWORD"
                    variant="primary"
                    size="large"
                    fullWidth
                    loading={isLoading}
                    onPress={handleChangePassword}
                    leftIcon={<Ionicons name="key-outline" size={22} color={theme.colors.white} />}
                    style={styles.changePasswordButton}
                    textStyle={styles.changePasswordButtonText}
                  />
                </View>

                <View style={styles.noteContainer}>
                  <Ionicons name="information-circle-outline" size={20} color={theme.colors.info[500]} />
                  <Typography variant="body2" color={theme.colors.info[500]} style={styles.noteText}>
                    Setelah mengubah password, Anda akan tetap login di perangkat ini.
                  </Typography>
                </View>
              </View>
            </Card>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  keyboardAvoidingView: {
    flex: 1,
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
  scrollContent: {
    paddingHorizontal: theme.spacing.layout.sm,
    paddingBottom: theme.spacing.layout.xl,
    paddingTop: theme.spacing.md,
  },
  animatedContainer: {
    width: '100%',
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: theme.spacing.md,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  cardTitle: {
    color: theme.colors.neutral[800],
  },
  cardSubtitle: {
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  formContainer: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
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
  buttonContainer: {
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
  },
  changePasswordButton: {
    backgroundColor: theme.colors.primary[500],
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    ...theme.elevation.md,
  },
  changePasswordButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: theme.colors.white,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.info[50],
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
  },
  noteText: {
    marginLeft: theme.spacing.xs,
    flex: 1,
  },
});
