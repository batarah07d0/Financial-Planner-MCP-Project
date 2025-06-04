import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
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
import { Typography, Card, Input, Button } from '../../../core/components';
import { theme } from '../../../core/theme';
import { useAuthStore } from '../../../core/services/store';

export const AccountInfoScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuthStore();

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
        Alert.alert('Error', 'Nama lengkap tidak boleh kosong');
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

      Alert.alert('Sukses', 'Informasi akun berhasil diperbarui');
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Error', 'Gagal memperbarui informasi akun');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEditMode = () => {
    if (isEditing) {
      // Jika sedang dalam mode edit, konfirmasi batal
      Alert.alert(
        'Konfirmasi',
        'Apakah Anda yakin ingin membatalkan perubahan?',
        [
          {
            text: 'Tidak',
            style: 'cancel',
          },
          {
            text: 'Ya',
            onPress: () => {
              fetchProfile(); // Reset data
              setIsEditing(false);
            },
          },
        ]
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
            <Ionicons name="arrow-back" size={24} color={theme.colors.neutral[800]} />
          </TouchableOpacity>
          <Typography variant="h4" weight="600">Informasi Akun</Typography>
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
                      <Button
                        title="SIMPAN PERUBAHAN"
                        variant="primary"
                        size="large"
                        fullWidth
                        loading={isSaving}
                        onPress={handleSave}
                        leftIcon={<Ionicons name="save-outline" size={22} color={theme.colors.white} />}
                        style={styles.saveButton}
                        textStyle={styles.saveButtonText}
                      />
                    </View>
                  )}
                </View>
              </Card>
            )}
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
    backgroundColor: theme.colors.primary[500],
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    ...theme.elevation.md,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: theme.colors.white,
  },
});
