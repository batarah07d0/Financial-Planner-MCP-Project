import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Typography } from '../../../core/components';
import { theme } from '../../../core/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../config/supabase';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../../core/services/store';
import { decode } from 'base64-arraybuffer';

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

  const pickImage = async () => {
    try {
      // Meminta izin akses galeri
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Izin Diperlukan', 'Aplikasi memerlukan izin untuk mengakses galeri foto Anda');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0].base64) {
        await uploadAvatar(result.assets[0].base64);
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal memilih gambar');
    }
  };

  const uploadAvatar = async (base64Image: string) => {
    try {
      if (!user) {
        Alert.alert('Error', 'Anda harus login untuk mengubah foto profil');
        return;
      }

      setUploading(true);

      const fileName = `avatar-${user.id}-${Date.now()}.jpg`;
      const contentType = 'image/jpeg';

      // Hapus avatar lama jika ada
      if (profileData?.avatar_url) {
        const oldFileName = profileData.avatar_url.split('/').pop();
        if (oldFileName && oldFileName.startsWith('avatar-' + user.id)) {
          try {
            await supabase.storage
              .from('avatars')
              .remove([oldFileName]);
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
        throw uploadError;
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
        throw updateError;
      }

      // Refresh profile data
      await fetchProfile();

      Alert.alert('Sukses', 'Foto profil berhasil diperbarui');
    } catch (error) {
      Alert.alert('Error', 'Gagal mengunggah foto profil. Silakan coba lagi.');
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
            onPress={pickImage}
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
