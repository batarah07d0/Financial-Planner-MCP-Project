import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
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
import { Typography, Card, Input, SuperiorDialog } from '../../../core/components';
import { theme } from '../../../core/theme';
import { useAuthStore } from '../../../core/services/store';
import { useSuperiorDialog } from '../../../core/hooks';

export const AccountInfoScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuthStore();
  const { dialogState, showSuccess, showError, showConfirm, hideDialog } = useSuperiorDialog();

  // State untuk form
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Animasi
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;

  const fetchProfile = React.useCallback(async () => {
    try {
      if (!user) return;

      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();

      if (error) {
        return;
      }

      if (data) {
        setFullName(data.full_name || '');
        setEmail(data.email || user.email || '');
      }
    } catch (error) {
      // Error handling tanpa console.error
    } finally {
      setIsLoading(false);
    }
  }, [user]);

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

    // Ambil data profil dari Supabase
    fetchProfile();
  }, [fadeAnim, slideAnim, fetchProfile]);



  const handleSave = async () => {
    try {
      if (!user) return;

      // Validasi input
      if (!fullName.trim()) {
        showError('Error', 'Nama lengkap tidak boleh kosong');
        return;
      }

      setIsSaving(true);

      // Update profil di Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      // Tampilkan success dialog dengan navigasi
      showSuccess(
        '✅ Berhasil!',
        'Informasi akun berhasil diperbarui dengan sempurna',
        1500 // Auto close after 1.5 seconds
      );

      // Set timeout untuk navigasi setelah dialog tertutup
      setTimeout(() => {
        setIsEditing(false);
        navigation.navigate('Main' as never);
      }, 1600);

    } catch (error) {
      showError('❌ Gagal', 'Terjadi kesalahan saat memperbarui informasi akun. Silakan coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEditMode = () => {
    if (isEditing) {
      // Jika sedang dalam mode edit, konfirmasi batal
      showConfirm(
        '⚠️ Konfirmasi',
        'Apakah Anda yakin ingin membatalkan perubahan yang telah dibuat?',
        () => {
          fetchProfile(); // Reset data
          setIsEditing(false);
        },
        'Ya, Batalkan',
        'Tidak'
      );
    } else {
      // Masuk ke mode edit
      setIsEditing(true);
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
            <Ionicons name="arrow-back" size={24} color={theme.colors.primary[500]} />
          </TouchableOpacity>
          <Typography variant="h5" weight="700" color={theme.colors.primary[500]} style={{ fontSize: 18, textAlign: 'center' }}>Informasi Akun</Typography>
          <TouchableOpacity
            style={styles.editButton}
            onPress={toggleEditMode}
            disabled={isLoading || isSaving}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isEditing ? "close-outline" : "create-outline"}
              size={24}
              color={theme.colors.primary[500]}
            />
          </TouchableOpacity>
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
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary[500]} />
                <Typography variant="body1" style={styles.loadingText}>
                  Memuat informasi akun...
                </Typography>
              </View>
            ) : (
              <Card style={styles.card} elevation="md">
                <LinearGradient
                  colors={[theme.colors.primary[50], theme.colors.white]}
                  style={styles.cardHeader}
                >
                  <View style={styles.iconContainer}>
                    <Ionicons name="person" size={32} color={theme.colors.primary[500]} />
                  </View>
                  <Typography variant="h5" weight="600" style={styles.cardTitle}>
                    Data Pribadi
                  </Typography>
                </LinearGradient>

                <View style={styles.formContainer}>
                  <Input
                    label="Nama Lengkap"
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Masukkan nama lengkap Anda"
                    leftIcon={<Ionicons name="person-outline" size={20} color={theme.colors.neutral[500]} />}
                    containerStyle={styles.inputContainer}
                    editable={isEditing}
                  />

                  <Input
                    label="Email"
                    value={email}
                    placeholder="Email Anda"
                    leftIcon={<Ionicons name="mail-outline" size={20} color={theme.colors.neutral[500]} />}
                    containerStyle={styles.inputContainer}
                    editable={false}
                    inputStyle={styles.disabledInput}
                  />

                  {isEditing && (
                    <View style={styles.buttonContainer}>
                      <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSave}
                        activeOpacity={0.8}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <ActivityIndicator color={theme.colors.white} size="small" />
                        ) : (
                          <View style={styles.saveButtonContent}>
                            <Ionicons
                              name="save"
                              size={20}
                              color={theme.colors.white}
                              style={{ marginRight: 8 }}
                            />
                            <Typography variant="body1" weight="700" color={theme.colors.white}>
                              SIMPAN PERUBAHAN
                            </Typography>
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </Card>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

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
  editButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.layout.sm,
    paddingBottom: theme.spacing.layout.xl,
    paddingTop: theme.spacing.md,
  },
  animatedContainer: {
    width: '100%',
  },
  loadingContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.neutral[600],
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
  formContainer: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  inputContainer: {
    marginBottom: theme.spacing.md,
  },
  disabledInput: {
    backgroundColor: theme.colors.neutral[100],
    color: theme.colors.neutral[600],
  },
  buttonContainer: {
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
  },
  saveButton: {
    backgroundColor: '#2196F3',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    ...theme.elevation.md,
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
