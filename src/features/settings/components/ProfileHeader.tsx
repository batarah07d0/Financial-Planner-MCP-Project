import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Typography, SuperiorDialog } from '../../../core/components';
import { theme } from '../../../core/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../config/supabase';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../../core/services/store';
import { decode } from 'base64-arraybuffer';
import { useSuperiorDialog } from '../../../core/hooks/useSuperiorDialog';
import * as ImageManipulator from 'expo-image-manipulator';

interface ProfileData {
  full_name: string;
  avatar_url: string | null;
  email: string;
}

interface ProfileHeaderProps {
  isLoading?: boolean;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ isLoading = false }) => {
  const { user } = useAuthStore();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [uploading, setUploading] = useState(false);

  // Dialog hooks
  const {
    dialogState,
    showError,
    showSuccess,
    showLoading,
    showConfirm,
    showDialog,
    hideDialog,
  } = useSuperiorDialog();

  // Animasi
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  const fetchProfile = React.useCallback(async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, email')
        .eq('id', user.id)
        .single();

      if (error) {
        return;
      }

      setProfileData(data);
    } catch (error) {
      // Error handling tanpa console.error
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [user, fadeAnim, scaleAnim, fetchProfile]);

  const compressImage = async (uri: string): Promise<string | null> => {
    try {
      // Compress image to ensure it's under 1MB
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 400, height: 400 } }], // Resize to 400x400
        {
          compress: 0.7, // 70% quality
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );

      return manipulatedImage.base64 || null;
    } catch (error) {
      return null;
    }
  };

  const deleteAvatar = async () => {
    try {
      if (!user || !profileData?.avatar_url) {
        showError('Error', 'Tidak ada foto profil untuk dihapus');
        return;
      }

      setUploading(true);
      showLoading('Menghapus...', 'Sedang menghapus foto profil Anda');

      // Extract filename from URL
      const urlParts = profileData.avatar_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${user.id}/${fileName}`;

      // Hapus file dari storage
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([filePath]);

      if (deleteError) {
        throw new Error(`Gagal menghapus file: ${deleteError.message}`);
      }

      // Update profile untuk menghapus avatar_url
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        throw new Error(`Gagal update profil: ${updateError.message}`);
      }

      // Refresh profile data
      await fetchProfile();

      hideDialog();
      showSuccess('✅ Berhasil!', 'Foto profil berhasil dihapus');
    } catch (error: unknown) {
      hideDialog();
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak diketahui';
      showError('❌ Hapus Gagal', `Gagal menghapus foto profil: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  const showPhotoOptions = () => {
    const hasAvatar = profileData?.avatar_url;

    if (!hasAvatar) {
      // Jika belum ada foto, langsung ke galeri
      pickImage();
      return;
    }

    // Jika sudah ada foto, tampilkan dialog pilihan
    showConfirm(
      '📸 Foto Profil',
      'Pilih tindakan yang ingin Anda lakukan dengan foto profil',
      () => {
        // Callback untuk tombol pertama akan diatur di actions
      },
      'Ganti Foto',
      'Batal'
    );

    // Override actions untuk menambahkan tombol hapus
    setTimeout(() => {
      hideDialog();
      // Tampilkan dialog custom dengan 3 pilihan
      showCustomPhotoDialog();
    }, 100);
  };

  const showCustomPhotoDialog = () => {
    const customActions = [
      {
        text: 'Batal',
        onPress: hideDialog,
        style: 'cancel' as const,
      },
      {
        text: '🗑️ Hapus Foto',
        onPress: () => {
          hideDialog();
          setTimeout(() => {
            showConfirm(
              '⚠️ Konfirmasi Hapus',
              'Apakah Anda yakin ingin menghapus foto profil? Tindakan ini tidak dapat dibatalkan.',
              deleteAvatar,
              'Ya, Hapus',
              'Batal'
            );
          }, 100);
        },
        style: 'destructive' as const,
      },
      {
        text: '📷 Ganti Foto',
        onPress: () => {
          hideDialog();
          setTimeout(() => {
            pickImage();
          }, 100);
        },
        style: 'primary' as const,
      },
    ];

    // Gunakan showDialog yang sudah ada
    showDialog({
      type: 'info',
      title: '📸 Foto Profil',
      message: 'Pilih tindakan yang ingin Anda lakukan dengan foto profil Anda',
      actions: customActions,
    });
  };

  const pickImage = async () => {
    try {
      // Meminta izin akses galeri
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        showError(
          'Izin Diperlukan',
          'Aplikasi memerlukan izin untuk mengakses galeri foto Anda'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false, // We'll handle compression ourselves
        mediaTypes: ['images'], // Only images
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];

        // Compress the image
        const compressedBase64 = await compressImage(asset.uri);

        if (compressedBase64) {
          await uploadAvatar(compressedBase64);
        } else {
          showError('Error', 'Gagal memproses gambar. Silakan coba lagi.');
        }
      }
    } catch (error) {
      showError('Error', 'Gagal memilih gambar. Silakan coba lagi.');
    }
  };

  const uploadAvatar = async (base64Image: string) => {
    try {
      if (!user) {
        showError('Error', 'Anda harus login untuk mengubah foto profil');
        return;
      }

      setUploading(true);
      showLoading('Mengunggah...', 'Sedang mengunggah foto profil Anda');

      // Gunakan struktur folder sesuai dengan policy: user_id/filename
      const fileName = `${user.id}/avatar-${Date.now()}.jpg`;
      const contentType = 'image/jpeg';

      // Hapus avatar lama jika ada
      if (profileData?.avatar_url) {
        // Extract filename from URL
        const urlParts = profileData.avatar_url.split('/');
        const oldFileName = urlParts[urlParts.length - 1];
        const oldFilePath = `${user.id}/${oldFileName}`;

        if (oldFileName && oldFileName.startsWith('avatar-')) {
          try {
            await supabase.storage
              .from('avatars')
              .remove([oldFilePath]);
          } catch (removeError) {
            // Lanjutkan meskipun gagal menghapus avatar lama
          }
        }
      }

      // Upload ke storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, decode(base64Image), {
          contentType,
          upsert: true,
          cacheControl: '3600',
        });

      if (uploadError) {
        throw new Error(`Upload gagal: ${uploadError.message}`);
      }

      // Dapatkan URL publik
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const avatarUrl = publicUrlData.publicUrl;

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        throw new Error(`Update profil gagal: ${updateError.message}`);
      }

      // Refresh profile data
      await fetchProfile();

      hideDialog();
      showSuccess('✅ Berhasil!', 'Foto profil berhasil diperbarui dengan sempurna');
    } catch (error: unknown) {
      hideDialog();
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak diketahui';
      showError('❌ Upload Gagal', `Gagal mengunggah foto profil: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name && name.trim()) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    } else if (email && email.trim()) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={[theme.colors.primary[400], theme.colors.primary[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={showPhotoOptions}
            disabled={uploading || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <View style={styles.initialsContainer}>
                <ActivityIndicator size="large" color={theme.colors.white} />
              </View>
            ) : profileData?.avatar_url ? (
              <Animated.Image
                source={{ uri: profileData.avatar_url }}
                style={[styles.avatar, { opacity: fadeAnim }]}
                onLoadEnd={() => {
                  Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                  }).start();
                }}
              />
            ) : (
              <View style={styles.initialsContainer}>
                <Typography variant="h3" color={theme.colors.white} weight="600">
                  {getInitials(profileData?.full_name, profileData?.email)}
                </Typography>
              </View>
            )}
            {!isLoading && (
              <Animated.View
                style={[
                  styles.editIconContainer,
                  {
                    transform: [
                      { scale: scaleAnim }
                    ]
                  }
                ]}
              >
                <Ionicons name="camera" size={16} color={theme.colors.white} />
              </Animated.View>
            )}
          </TouchableOpacity>

          <View style={styles.infoContainer}>
            <Typography variant="h5" color={theme.colors.white} weight="600">
              {isLoading ? 'Memuat...' : profileData?.full_name || 'Pengguna'}
            </Typography>
            <Typography variant="body2" color={theme.colors.white} style={styles.email}>
              {isLoading ? '...' : profileData?.email || 'email@example.com'}
            </Typography>
          </View>
        </View>
      </LinearGradient>

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
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  gradient: {
    borderRadius: theme.borderRadius.lg,
    ...theme.elevation.md,
  },
  content: {
    padding: theme.spacing.layout.md,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: theme.spacing.md,
    borderRadius: 60,
    ...theme.elevation.md,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: theme.colors.white,
  },
  initialsContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.primary[300],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: theme.colors.white,
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary[500],
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.white,
    ...theme.elevation.md,
  },
  infoContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  email: {
    marginTop: theme.spacing.xs,
    opacity: 0.8,
  },
});
