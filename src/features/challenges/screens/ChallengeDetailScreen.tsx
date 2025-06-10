import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../../core/navigation/types';
import { Typography, Card, Button, SuperiorDialog } from '../../../core/components';
import { theme } from '../../../core/theme';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../../core/services/store';
import { supabase } from '../../../config/supabase';
import {
  getChallengeWithUserProgress,
  updateChallengeProgress,
  completeChallenge,
  startChallenge,
  ChallengeWithProgress
} from '../services/challengeService';
import { useSuperiorDialog } from '../../../core/hooks';
import { useSensitiveActionAuth } from '../../../core/hooks/useSensitiveActionAuth';
import { formatCurrency, formatDate } from '../../../core/utils';

type ChallengeDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ChallengeDetail'>;
type ChallengeDetailScreenRouteProp = RouteProp<RootStackParamList, 'ChallengeDetail'>;

export const ChallengeDetailScreen = () => {
  const navigation = useNavigation<ChallengeDetailScreenNavigationProp>();
  const route = useRoute<ChallengeDetailScreenRouteProp>();
  const { id: challengeId } = route.params;
  const { user } = useAuthStore();
  const { dialogState, showError, showSuccess, showDialog, showConfirm, hideDialog } = useSuperiorDialog();
  const { authenticateDelete } = useSensitiveActionAuth({
    showConfirm,
    showError,
  });

  // State
  const [challenge, setChallenge] = useState<ChallengeWithProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [progressInput, setProgressInput] = useState('');
  const [rawProgressValue, setRawProgressValue] = useState(0);
  const [progressPercentage, setProgressPercentage] = useState(0);

  // Animasi
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  // Fungsi untuk format input dengan pemisah ribuan
  const formatInputValue = (value: string): string => {
    // Hapus semua karakter non-digit
    const numericValue = value.replace(/[^\d]/g, '');

    // Jika kosong, return kosong
    if (!numericValue) return '';

    // Convert ke number dan format dengan pemisah ribuan
    const number = parseInt(numericValue, 10);
    return number.toLocaleString('id-ID');
  };

  // Fungsi untuk mengubah formatted value kembali ke number
  const parseInputValue = (formattedValue: string): number => {
    const numericValue = formattedValue.replace(/[^\d]/g, '');
    return numericValue ? parseInt(numericValue, 10) : 0;
  };

  // Fungsi untuk handle perubahan input
  const handleProgressInputChange = (value: string) => {
    const formattedValue = formatInputValue(value);
    setProgressInput(formattedValue);
    const newRawValue = parseInputValue(formattedValue);
    setRawProgressValue(newRawValue);

    // Update progress percentage real-time
    if (challenge) {
      const percentage = Math.min((newRawValue / challenge.target_amount) * 100, 100);
      setProgressPercentage(percentage);
    }
  };

  // Load challenge data
  const loadChallenge = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      if (!user) return;

      const { data, error } = await getChallengeWithUserProgress(user.id, challengeId);

      if (error) {
        showError('Error', 'Gagal memuat data tantangan');
        return;
      }

      if (data && data.length > 0) {
        setChallenge(data[0]);
        const currentAmount = data[0].current_amount || 0;
        setProgressInput(formatInputValue(currentAmount.toString()));
        setRawProgressValue(currentAmount);

        // Update progress percentage
        const percentage = Math.min((currentAmount / data[0].target_amount) * 100, 100);
        setProgressPercentage(percentage);
      }
    } catch (error) {
      showError('Error', 'Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, challengeId, showError]);

  // Function untuk menghapus tantangan
  const handleDeleteChallenge = async () => {
    if (!challenge || !user || !challenge.user_challenge?.id) return;

    await authenticateDelete(
      'tantangan',
      challenge.name,
      async () => {
        await deleteChallenge();
      }
    );
  };

  // Function untuk menghapus data dari Supabase
  const deleteChallenge = async () => {
    if (!challenge?.user_challenge?.id) return;

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('user_challenges')
        .delete()
        .eq('id', challenge.user_challenge.id);

      if (error) {
        showError('Error', 'Gagal menghapus tantangan');
        return;
      }

      showSuccess('✅ Berhasil', 'Tantangan berhasil dihapus');

      // Kembali ke halaman challenges setelah 1 detik
      setTimeout(() => {
        navigation.navigate('Challenges');
      }, 1000);

    } catch (error) {
      showError('Error', 'Terjadi kesalahan saat menghapus tantangan');
    } finally {
      setIsLoading(false);
    }
  };

  // Update progress
  const handleUpdateProgress = async () => {
    if (!challenge || !user) return;

    // Gunakan rawProgressValue yang sudah di-parse
    const newAmount = rawProgressValue;

    if (newAmount < 0) {
      showError('Error', 'Jumlah tidak boleh negatif');
      return;
    }

    if (newAmount > challenge.target_amount * 1.5) {
      showError('Error', 'Jumlah terlalu besar. Maksimal 150% dari target.');
      return;
    }

    setIsUpdating(true);
    try {
      // Jika belum ada user_challenge, buat dulu
      let userChallengeId = challenge.user_challenge?.id;

      if (!userChallengeId) {
        // Start challenge terlebih dahulu
        const { data: newUserChallenge, error: startError } = await startChallenge(
          user.id,
          challenge.id
        );

        if (startError || !newUserChallenge) {
          showError('Error', 'Gagal memulai tantangan');
          return;
        }

        userChallengeId = newUserChallenge.id;
      }

      // Update progress
      if (!userChallengeId) {
        showError('Error', 'ID tantangan tidak valid');
        return;
      }

      const { error } = await updateChallengeProgress(userChallengeId, newAmount);

      if (error) {
        showError('Error', 'Gagal memperbarui progress');
        return;
      }

      // Reload data untuk update UI terlebih dahulu
      await loadChallenge();

      // Check if challenge is completed
      if (newAmount >= challenge.target_amount) {
        await completeChallenge(userChallengeId);
        // Reload lagi setelah complete
        await loadChallenge();

        // Show completion dialog dengan navigasi
        showDialog({
          type: 'success',
          title: '🎉 Selamat!',
          message: `Tantangan "${challenge.name}" berhasil diselesaikan!\n\nAnda telah mencapai target ${formatCurrency(challenge.target_amount)}`,
          actions: [
            {
              text: 'Tetap di Sini',
              onPress: hideDialog,
              style: 'cancel',
            },
            {
              text: 'Lihat Tantangan Lain',
              onPress: () => {
                hideDialog();
                navigation.navigate('Challenges');
              },
              style: 'primary',
            },
          ],
        });
      } else {
        const percentage = ((newAmount / challenge.target_amount) * 100).toFixed(1);
        showSuccess(
          '✅ Berhasil',
          `Progress berhasil diperbarui!\n\nProgress saat ini: ${percentage}% (${formatCurrency(newAmount)})`
        );
      }
    } catch (error) {
      showError('Error', 'Terjadi kesalahan saat memperbarui progress');
    } finally {
      setIsUpdating(false);
    }
  };

  // Animation effects
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Load data on mount and focus
  useEffect(() => {
    loadChallenge();
  }, [loadChallenge]);

  useFocusEffect(
    useCallback(() => {
      loadChallenge();
    }, [loadChallenge])
  );

  // Get icon component with fallback
  const getIconComponent = () => {
    if (!challenge) return null;

    const iconName = challenge.icon;
    const iconSize = 32;
    const iconColor = theme.colors.white;

    // Icon mapping dengan fallback
    const iconMap: { [key: string]: { type: 'Ionicons' | 'MaterialCommunityIcons' | 'FontAwesome5'; name: string } } = {
      // Travel & Transportation
      'airplane': { type: 'Ionicons', name: 'airplane' },
      'car': { type: 'Ionicons', name: 'car' },
      'train': { type: 'Ionicons', name: 'train' },

      // Technology
      'phone-portrait': { type: 'Ionicons', name: 'phone-portrait' },
      'laptop': { type: 'Ionicons', name: 'laptop' },
      'desktop': { type: 'Ionicons', name: 'desktop' },
      'tablet-portrait': { type: 'Ionicons', name: 'tablet-portrait' },

      // Security & Finance
      'shield-checkmark': { type: 'Ionicons', name: 'shield-checkmark' },
      'shield': { type: 'Ionicons', name: 'shield' },
      'wallet': { type: 'FontAwesome5', name: 'wallet' },
      'money-bill': { type: 'FontAwesome5', name: 'money-bill' },

      // Savings & Goals
      'home': { type: 'Ionicons', name: 'home' },
      'school': { type: 'Ionicons', name: 'school' },
      'medical': { type: 'Ionicons', name: 'medical' },
      'fitness': { type: 'Ionicons', name: 'fitness' },
      'restaurant': { type: 'Ionicons', name: 'restaurant' },

      // Default fallbacks
      'star': { type: 'Ionicons', name: 'star' },
      'heart': { type: 'Ionicons', name: 'heart' },
      'trophy': { type: 'Ionicons', name: 'trophy' },
    };

    // Cari ikon yang sesuai atau gunakan fallback
    const iconConfig = iconMap[iconName] || { type: 'Ionicons', name: 'star' };

    try {
      switch (iconConfig.type) {
        case 'FontAwesome5':
          return <FontAwesome5 name={iconConfig.name as keyof typeof FontAwesome5.glyphMap} size={iconSize} color={iconColor} />;
        case 'MaterialCommunityIcons':
          return <MaterialCommunityIcons name={iconConfig.name as keyof typeof MaterialCommunityIcons.glyphMap} size={iconSize} color={iconColor} />;
        default:
          return <Ionicons name={iconConfig.name as keyof typeof Ionicons.glyphMap} size={iconSize} color={iconColor} />;
      }
    } catch (error) {
      // Fallback jika ikon tidak ditemukan
      return <Ionicons name="star" size={iconSize} color={iconColor} />;
    }
  };

  // Calculate progress percentage (menggunakan state untuk real-time update)
  const getProgressPercentage = () => {
    return progressPercentage;
  };

  // Get difficulty color
  const getDifficultyColor = () => {
    if (!challenge) return theme.colors.primary[500];
    
    switch (challenge.difficulty) {
      case 'easy':
        return theme.colors.success[500];
      case 'medium':
        return theme.colors.warning[500];
      case 'hard':
        return theme.colors.danger[500];
      default:
        return theme.colors.primary[500];
    }
  };

  // Get difficulty text
  const getDifficultyText = () => {
    if (!challenge) return '';

    switch (challenge.difficulty) {
      case 'easy':
        return 'Mudah';
      case 'medium':
        return 'Sedang';
      case 'hard':
        return 'Sulit';
      default:
        return '';
    }
  };

  // Check if challenge completed early
  const isCompletedEarly = () => {
    if (!challenge || challenge.status !== 'completed') return false;

    const endDate = new Date(challenge.end_date || new Date(Date.now() + challenge.duration_days * 24 * 60 * 60 * 1000));
    const completedDate = new Date(challenge.updated_at);

    return completedDate < endDate;
  };

  // Calculate days saved if completed early
  const getDaysSaved = () => {
    if (!isCompletedEarly() || !challenge) return 0;

    const endDate = new Date(challenge.end_date || new Date(Date.now() + challenge.duration_days * 24 * 60 * 60 * 1000));
    const completedDate = new Date(challenge.updated_at);

    const timeDiff = endDate.getTime() - completedDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    return daysDiff;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          <Typography variant="body2" color={theme.colors.neutral[600]} style={styles.loadingText}>
            Memuat detail tantangan...
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  if (!challenge) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={theme.colors.neutral[400]} />
          <Typography variant="h6" color={theme.colors.neutral[600]} style={styles.errorTitle}>
            Tantangan Tidak Ditemukan
          </Typography>
          <Button
            title="Kembali"
            variant="primary"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary[500]} />
        </TouchableOpacity>
        <Typography
          variant="h6"
          weight="700"
          color={theme.colors.primary[500]}
          style={[
            styles.headerTitle,
            {
              fontSize: 18,
              lineHeight: 22,
              includeFontPadding: false,
              textAlignVertical: 'center',
            }
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.8}
        >
          Detail Tantangan
        </Typography>
        {/* Delete button untuk menghapus tantangan */}
        {challenge?.user_challenge && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteChallenge}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={20} color={theme.colors.danger[600]} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadChallenge(true)}
            colors={[theme.colors.primary[500]]}
            progressBackgroundColor={theme.colors.white}
          />
        }
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Challenge Header Card */}
          <Card style={styles.headerCard}>
            <LinearGradient
              colors={[challenge.color || theme.colors.primary[500], `${challenge.color || theme.colors.primary[500]}CC`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerGradient}
            >
              <View style={styles.challengeHeader}>
                <View style={styles.iconContainer}>
                  {getIconComponent()}
                </View>
                <View style={styles.challengeInfo}>
                  <Typography variant="h5" weight="700" color={theme.colors.white}>
                    {challenge.name}
                  </Typography>
                  <Typography variant="body2" color={theme.colors.white} style={styles.challengeDescription}>
                    {challenge.description}
                  </Typography>
                  <View style={styles.difficultyBadge}>
                    <Typography variant="caption" weight="600" color={theme.colors.white}>
                      {getDifficultyText()}
                    </Typography>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </Card>

          {/* Progress Card */}
          <Card style={styles.progressCard}>
            <Typography variant="h6" weight="600" style={styles.sectionTitle}>
              Progress Tantangan
            </Typography>

            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={[challenge.color || theme.colors.primary[500], `${challenge.color || theme.colors.primary[500]}80`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${getProgressPercentage()}%` }]}
                />
              </View>
              <Typography variant="caption" color={theme.colors.neutral[600]} style={styles.progressText}>
                {getProgressPercentage().toFixed(1)}% selesai
              </Typography>
            </View>

            <View style={styles.amountContainer}>
              <View style={styles.amountItem}>
                <Typography variant="caption" color={theme.colors.neutral[600]}>
                  Saat Ini
                </Typography>
                <Typography variant="h6" weight="600" color={theme.colors.success[600]}>
                  {formatCurrency(challenge.current_amount || 0)}
                </Typography>
              </View>
              <View style={styles.amountItem}>
                <Typography variant="caption" color={theme.colors.neutral[600]}>
                  Target
                </Typography>
                <Typography variant="h6" weight="600" color={theme.colors.primary[600]}>
                  {formatCurrency(challenge.target_amount)}
                </Typography>
              </View>
            </View>

            <View style={styles.updateSection}>
              <Typography variant="body2" weight="600" style={styles.updateTitle}>
                Update Progress
              </Typography>

              {/* Quick Amount Buttons */}
              <View style={styles.quickAmountContainer}>
                <Typography variant="caption" color={theme.colors.neutral[600]} style={styles.quickAmountLabel}>
                  Tambah Cepat:
                </Typography>
                <View style={styles.quickAmountButtons}>
                  {[100000, 250000, 500000, 1000000].map((amount) => (
                    <TouchableOpacity
                      key={amount}
                      style={styles.quickAmountButton}
                      onPress={() => {
                        const newAmount = rawProgressValue + amount;
                        const formattedValue = formatInputValue(newAmount.toString());
                        setProgressInput(formattedValue);
                        setRawProgressValue(newAmount);

                        // Update progress percentage real-time
                        if (challenge) {
                          const percentage = Math.min((newAmount / challenge.target_amount) * 100, 100);
                          setProgressPercentage(percentage);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <Typography variant="caption" weight="600" color={theme.colors.primary[600]}>
                        +{formatCurrency(amount).replace('Rp ', '')}
                      </Typography>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.currencyInputContainer}>
                  <View style={styles.currencyLabelContainer}>
                    <Typography variant="body2" color={theme.colors.primary[600]} style={styles.currencySymbol}>
                      Rp
                    </Typography>
                  </View>
                  <TextInput
                    style={styles.progressInput}
                    value={progressInput}
                    onChangeText={handleProgressInputChange}
                    placeholder="0"
                    placeholderTextColor={theme.colors.neutral[400]}
                    keyboardType="numeric"
                    maxLength={15}
                    returnKeyType="done"
                    onSubmitEditing={handleUpdateProgress}
                  />
                </View>
                <TouchableOpacity
                  style={[
                    styles.updateButton,
                    {
                      backgroundColor: rawProgressValue === (challenge?.current_amount || 0)
                        ? theme.colors.neutral[300]
                        : theme.colors.primary[500],
                    }
                  ]}
                  onPress={handleUpdateProgress}
                  disabled={isUpdating || rawProgressValue === (challenge?.current_amount || 0)}
                  activeOpacity={0.8}
                >
                  {isUpdating ? (
                    <ActivityIndicator color={theme.colors.white} size="small" />
                  ) : (
                    <Typography variant="body1" weight="700" color={theme.colors.white}>
                      Update
                    </Typography>
                  )}
                </TouchableOpacity>
              </View>

              {/* Progress Info */}
              <View style={styles.progressInfo}>
                <Typography variant="caption" color={theme.colors.neutral[500]}>
                  Sisa target: {formatCurrency(Math.max((challenge?.target_amount || 0) - rawProgressValue, 0))}
                </Typography>
                {rawProgressValue > (challenge?.target_amount || 0) && (
                  <Typography variant="caption" color={theme.colors.success[600]} style={{ marginTop: 4 }}>
                    🎉 Target sudah tercapai! Kelebihan: {formatCurrency(rawProgressValue - (challenge?.target_amount || 0))}
                  </Typography>
                )}
              </View>
            </View>
          </Card>

          {/* Info Cards Grid */}
          <View style={styles.infoCardsContainer}>
            {/* Duration Card */}
            <Card style={styles.infoCard}>
              <LinearGradient
                colors={[theme.colors.primary[500], theme.colors.primary[600]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.infoCardGradient}
              >
                <View style={styles.infoCardIconContainer}>
                  <Ionicons name="calendar-outline" size={24} color={theme.colors.white} />
                </View>
                <Typography variant="caption" color={theme.colors.white} style={styles.infoCardLabel}>
                  Durasi Tantangan
                </Typography>
                <Typography variant="h6" weight="700" color={theme.colors.white}>
                  {challenge.duration_days} Hari
                </Typography>
              </LinearGradient>
            </Card>

            {/* Difficulty Card */}
            <Card style={styles.infoCard}>
              <LinearGradient
                colors={[getDifficultyColor(), `${getDifficultyColor()}DD`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.infoCardGradient}
              >
                <View style={styles.infoCardIconContainer}>
                  <Ionicons
                    name={challenge.difficulty === 'easy' ? 'leaf-outline' : challenge.difficulty === 'medium' ? 'flash-outline' : 'flame-outline'}
                    size={24}
                    color={theme.colors.white}
                  />
                </View>
                <Typography variant="caption" color={theme.colors.white} style={styles.infoCardLabel}>
                  Tingkat Kesulitan
                </Typography>
                <Typography variant="h6" weight="700" color={theme.colors.white}>
                  {getDifficultyText()}
                </Typography>
              </LinearGradient>
            </Card>
          </View>

          {/* Status Card */}
          <Card style={styles.statusCard}>
            <View style={styles.statusCardContent}>
              <View style={styles.statusIconContainer}>
                <LinearGradient
                  colors={challenge.status === 'completed'
                    ? [theme.colors.success[400], theme.colors.success[600]]
                    : challenge.status === 'active'
                    ? [theme.colors.primary[400], theme.colors.primary[600]]
                    : [theme.colors.neutral[400], theme.colors.neutral[600]]
                  }
                  style={styles.statusIconGradient}
                >
                  <Ionicons
                    name={challenge.status === 'completed' ? 'checkmark-circle' : challenge.status === 'active' ? 'play-circle' : 'pause-circle'}
                    size={28}
                    color={theme.colors.white}
                  />
                </LinearGradient>
              </View>
              <View style={styles.statusTextContainer}>
                <Typography variant="body2" weight="600" color={theme.colors.neutral[800]}>
                  Status Tantangan
                </Typography>
                <Typography variant="h6" weight="700" color={
                  challenge.status === 'completed'
                    ? theme.colors.success[600]
                    : challenge.status === 'active'
                    ? theme.colors.primary[600]
                    : theme.colors.neutral[600]
                }>
                  {challenge.status === 'completed' ? 'Selesai' : challenge.status === 'active' ? 'Sedang Berjalan' : 'Belum Dimulai'}
                </Typography>
                {challenge.status === 'completed' && (
                  <View style={styles.completedBadge}>
                    <Typography variant="caption" weight="600" color={theme.colors.success[600]}>
                      🎉 Selamat! Tantangan berhasil diselesaikan
                    </Typography>
                  </View>
                )}
              </View>
            </View>
          </Card>

          {/* Timeline Card */}
          <Card style={styles.timelineCard}>
            <Typography variant="h6" weight="600" style={styles.sectionTitle}>
              Timeline
            </Typography>

            <View style={styles.timelineContainer}>
              <View style={styles.timelineItem}>
                <View style={styles.timelineIcon}>
                  <Ionicons name="play-circle" size={16} color={theme.colors.success[500]} />
                </View>
                <View style={styles.timelineContent}>
                  <Typography variant="body2" weight="600">
                    Tantangan Dimulai
                  </Typography>
                  <Typography variant="caption" color={theme.colors.neutral[600]}>
                    {formatDate(challenge.start_date || challenge.created_at)}
                  </Typography>
                </View>
              </View>

              {/* Early Completion Timeline Item */}
              {isCompletedEarly() && (
                <View style={styles.timelineItem}>
                  <View style={styles.timelineIcon}>
                    <Ionicons name="flash" size={16} color={theme.colors.warning[500]} />
                  </View>
                  <View style={styles.timelineContent}>
                    <Typography variant="body2" weight="600" color={theme.colors.warning[600]}>
                      🚀 Selesai Lebih Cepat!
                    </Typography>
                    <Typography variant="caption" color={theme.colors.neutral[600]}>
                      {formatDate(challenge.updated_at)} • {getDaysSaved()} hari lebih cepat
                    </Typography>
                    <View style={styles.earlyCompletionBadge}>
                      <Typography variant="caption" weight="600" color={theme.colors.warning[600]}>
                        ⭐ Pencapaian Luar Biasa!
                      </Typography>
                    </View>
                  </View>
                </View>
              )}

              <View style={styles.timelineItem}>
                <View style={styles.timelineIcon}>
                  <Ionicons
                    name={challenge.status === 'completed' ? "checkmark-circle" : "flag-outline"}
                    size={16}
                    color={challenge.status === 'completed' ? theme.colors.success[500] : theme.colors.primary[500]}
                  />
                </View>
                <View style={styles.timelineContent}>
                  <Typography variant="body2" weight="600">
                    Target Selesai
                  </Typography>
                  <Typography variant="caption" color={theme.colors.neutral[600]}>
                    {formatDate(challenge.end_date || new Date(Date.now() + challenge.duration_days * 24 * 60 * 60 * 1000).toISOString())}
                  </Typography>
                  {isCompletedEarly() && (
                    <Typography variant="caption" color={theme.colors.success[600]} style={{ marginTop: 2 }}>
                      ✅ Tercapai lebih awal
                    </Typography>
                  )}
                </View>
              </View>
            </View>
          </Card>

        </Animated.View>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorTitle: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg, // Diperbesar dari md ke lg
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
    minHeight: 64, // Tambahkan minimum height
  },
  backButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.round,
    backgroundColor: 'transparent',
    marginLeft: theme.spacing.xs, // Proper spacing from left edge
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    marginHorizontal: theme.spacing.md,
    minHeight: 40, // Ensure consistent height
  },
  headerSpacer: {
    width: 40,
  },
  deleteButton: {
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.danger[50],
    borderRadius: theme.borderRadius.round,
    borderWidth: 1,
    borderColor: theme.colors.danger[200],
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  headerCard: {
    marginBottom: theme.spacing.lg,
    overflow: 'hidden',
  },
  headerGradient: {
    padding: theme.spacing.xl,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.lg,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeDescription: {
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
    opacity: 0.9,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  progressCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.xl,
  },
  sectionTitle: {
    marginBottom: theme.spacing.lg,
    color: theme.colors.neutral[800],
  },
  progressContainer: {
    marginBottom: theme.spacing.lg,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.round,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.borderRadius.round,
  },
  progressText: {
    textAlign: 'center',
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
  },
  amountItem: {
    alignItems: 'center',
  },
  updateSection: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
    paddingTop: theme.spacing.lg,
  },
  updateTitle: {
    marginBottom: theme.spacing.md,
    color: theme.colors.neutral[800],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'stretch', // Use stretch to make both elements same height
    gap: theme.spacing.md,
  },
  currencyInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary[200],
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md, // Keep original padding
    ...theme.elevation.sm,
  },
  currencyLabelContainer: {
    backgroundColor: theme.colors.primary[50],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.sm,
  },
  currencySymbol: {
    fontWeight: '700',
    fontSize: 14,
  },
  progressInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.neutral[800],
    backgroundColor: 'transparent',
    textAlign: 'left',
  },
  updateButton: {
    minWidth: 120, // Increased width for better proportion
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg, // Horizontal padding for better touch area
    paddingVertical: theme.spacing.md, // Same vertical padding as input field
    borderWidth: 2, // Add border width to match input field structure
    borderColor: 'transparent', // Transparent border to maintain same structure
    ...theme.elevation.md,
  },
  // Quick Amount Styles
  quickAmountContainer: {
    marginBottom: theme.spacing.lg,
  },
  quickAmountLabel: {
    marginBottom: theme.spacing.sm,
  },
  quickAmountButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  quickAmountButton: {
    backgroundColor: theme.colors.primary[50],
    borderWidth: 1,
    borderColor: theme.colors.primary[200],
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  progressInfo: {
    marginTop: theme.spacing.sm,
    alignItems: 'center',
  },
  // Info Cards Styles
  infoCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  infoCard: {
    flex: 1,
    overflow: 'hidden',
  },
  infoCardGradient: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  infoCardIconContainer: {
    marginBottom: theme.spacing.sm,
  },
  infoCardLabel: {
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
    opacity: 0.9,
  },
  // Status Card Styles
  statusCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.xl,
  },
  statusCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIconContainer: {
    marginRight: theme.spacing.lg,
  },
  statusIconGradient: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusTextContainer: {
    flex: 1,
  },
  completedBadge: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.success[50],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    alignSelf: 'flex-start',
  },
  timelineCard: {
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.xl,
  },
  timelineContainer: {
    paddingLeft: theme.spacing.md,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  timelineIcon: {
    marginRight: theme.spacing.md,
  },
  timelineContent: {
    flex: 1,
  },
  earlyCompletionBadge: {
    marginTop: theme.spacing.xs,
    backgroundColor: theme.colors.warning[50],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: theme.colors.warning[200],
  },
});
