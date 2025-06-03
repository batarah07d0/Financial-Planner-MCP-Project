import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  Switch,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../core/navigation/types';
import { Typography, Input, Button, Card, SuperiorDialog } from '../../../core/components';
import { theme } from '../../../core/theme';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../../core/services/store';
import { addChallenge, ChallengeInput, startChallenge } from '../services/challengeService';
import { useSuperiorDialog } from '../../../core/hooks';
import {
  getChallengeTypes,
  getDifficultyLevels,
  getDurationOptions,
  addCustomChallengeType,
  ChallengeType,
  DifficultyLevel,
  DurationOption
} from '../services/optionsService';
import { useNotificationManager } from '../../../core/hooks/useNotificationManager';

type AddChallengeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddChallenge'>;

// Fallback data jika API gagal
const fallbackChallengeTypes: ChallengeType[] = [
  {
    id: 'saving',
    name: 'Menabung',
    description: 'Tantangan untuk menabung uang secara rutin',
    icon: 'piggy-bank',
    iconType: 'MaterialCommunityIcons',
    color: theme.colors.success[500],
    gradientColors: [theme.colors.success[400], theme.colors.success[600]],
  },
  {
    id: 'spending',
    name: 'Pengeluaran',
    description: 'Tantangan untuk mengurangi pengeluaran',
    icon: 'wallet',
    iconType: 'FontAwesome5',
    color: theme.colors.danger[500],
    gradientColors: [theme.colors.danger[400], theme.colors.danger[600]],
  },
  {
    id: 'tracking',
    name: 'Pelacakan',
    description: 'Tantangan untuk melacak keuangan secara rutin',
    icon: 'analytics-outline',
    iconType: 'Ionicons',
    color: theme.colors.primary[500],
    gradientColors: [theme.colors.primary[400], theme.colors.primary[600]],
  },
];

// Fallback data untuk tingkat kesulitan
const fallbackDifficultyLevels: DifficultyLevel[] = [
  {
    id: 'easy',
    name: 'Mudah',
    description: 'Cocok untuk pemula',
    icon: 'star-outline',
    color: theme.colors.success[500],
    gradientColors: [theme.colors.success[300], theme.colors.success[500]],
  },
  {
    id: 'medium',
    name: 'Sedang',
    description: 'Membutuhkan usaha lebih',
    icon: 'star-half-outline',
    color: theme.colors.warning[500],
    gradientColors: [theme.colors.warning[300], theme.colors.warning[500]],
  },
  {
    id: 'hard',
    name: 'Sulit',
    description: 'Tantangan untuk yang serius',
    icon: 'star',
    color: theme.colors.danger[500],
    gradientColors: [theme.colors.danger[300], theme.colors.danger[500]],
  },
];

// Fallback data untuk durasi tantangan
const fallbackDurationOptions: DurationOption[] = [
  {
    id: 7,
    days: 7,
    name: '7 hari',
    description: '1 minggu',
    icon: 'calendar-week',
    iconType: 'FontAwesome5',
    color: theme.colors.primary[500],
  },
  {
    id: 14,
    days: 14,
    name: '14 hari',
    description: '2 minggu',
    icon: 'calendar-week',
    iconType: 'FontAwesome5',
    color: theme.colors.primary[500],
  },
  {
    id: 30,
    days: 30,
    name: '30 hari',
    description: '1 bulan',
    icon: 'calendar-month',
    iconType: 'MaterialCommunityIcons',
    color: theme.colors.primary[500],
  },
  {
    id: 60,
    days: 60,
    name: '60 hari',
    description: '2 bulan',
    icon: 'calendar-month',
    iconType: 'MaterialCommunityIcons',
    color: theme.colors.primary[500],
  },
  {
    id: 90,
    days: 90,
    name: '90 hari',
    description: '3 bulan',
    icon: 'calendar-month',
    iconType: 'MaterialCommunityIcons',
    color: theme.colors.primary[500],
  },
];

const AddChallengeScreenComponent = () => {
  const navigation = useNavigation<AddChallengeScreenNavigationProp>();
  const { user } = useAuthStore();
  const { setupChallengeReminders } = useNotificationManager();
  const { dialogState, showError, showWarning, showSuccess, hideDialog } = useSuperiorDialog();

  // State untuk form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>('saving'); // Default ke menabung
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // State untuk data dari Supabase
  const [challengeTypes, setChallengeTypes] = useState<ChallengeType[]>(fallbackChallengeTypes);
  const [difficultyOptions, setDifficultyOptions] = useState<DifficultyLevel[]>(fallbackDifficultyLevels);
  const [durationOptions, setDurationOptions] = useState<DurationOption[]>(fallbackDurationOptions);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  // State untuk modal tambah jenis tantangan kustom
  const [isAddingCustomType, setIsAddingCustomType] = useState(false);
  const [customTypeName, setCustomTypeName] = useState('');
  const [customTypeDescription, setCustomTypeDescription] = useState('');
  const [customTypeIcon, setCustomTypeIcon] = useState('');

  // Animasi
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // Efek untuk animasi saat komponen dimount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, scaleAnim]);

  // Efek untuk memuat data dari Supabase
  useEffect(() => {
    const loadOptions = async () => {
      if (!user) return;

      setIsLoadingOptions(true);
      try {
        // Memuat jenis tantangan
        const types = await getChallengeTypes(user.id);
        if (types.length > 0) {
          setChallengeTypes(types);
        }

        // Memuat tingkat kesulitan
        const levels = await getDifficultyLevels(user.id);
        if (levels.length > 0) {
          setDifficultyOptions(levels);
        }

        // Memuat opsi durasi
        const durations = await getDurationOptions(user.id);
        if (durations.length > 0) {
          setDurationOptions(durations);
        }
      } catch (error) {
        // Error loading options - silently handled
        // Fallback ke data hardcoded sudah diatur di useState
      } finally {
        setIsLoadingOptions(false);
      }
    };

    loadOptions();
  }, [user]);

  // Fungsi untuk menambahkan jenis tantangan kustom
  const handleAddCustomType = async () => {
    if (!user) {
      showError('Error', 'Anda harus login untuk membuat jenis tantangan kustom');
      return;
    }

    if (!customTypeName || !customTypeDescription || !customTypeIcon) {
      showError('Error', 'Semua field harus diisi');
      return;
    }

    setIsLoading(true);
    try {
      const newType = await addCustomChallengeType(user.id, {
        name: customTypeName,
        description: customTypeDescription,
        icon: customTypeIcon,
        iconType: 'MaterialCommunityIcons',
        color: theme.colors.primary[500],
        gradientColors: [theme.colors.primary[400], theme.colors.primary[600]],
      });

      if (newType) {
        setChallengeTypes([...challengeTypes, newType]);
        setIsAddingCustomType(false);
        setCustomTypeName('');
        setCustomTypeDescription('');
        setCustomTypeIcon('');
        showSuccess('Sukses', 'Jenis tantangan kustom berhasil ditambahkan');
      } else {
        showError('Error', 'Gagal menambahkan jenis tantangan kustom');
      }
    } catch (error) {
      // Error adding custom challenge type - silently handled
      showError('Error', 'Terjadi kesalahan saat menambahkan jenis tantangan kustom');
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi untuk kembali ke halaman sebelumnya
  const handleGoBack = () => {
    navigation.goBack();
  };

  // Fungsi untuk validasi form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Nama tantangan harus diisi';
    } else if (name.trim().length < 3) {
      newErrors.name = 'Nama tantangan minimal 3 karakter';
    }

    if (!description.trim()) {
      newErrors.description = 'Deskripsi tantangan harus diisi';
    } else if (description.trim().length < 10) {
      newErrors.description = 'Deskripsi tantangan minimal 10 karakter';
    }

    if (!targetAmount || isNaN(Number(targetAmount)) || Number(targetAmount) <= 0) {
      newErrors.targetAmount = 'Target harus berupa angka positif';
    } else if (Number(targetAmount) < 10000) {
      newErrors.targetAmount = 'Target minimal Rp 10.000';
    }

    if (!selectedType) {
      newErrors.type = 'Jenis tantangan harus dipilih';
    }

    if (!selectedDifficulty) {
      newErrors.difficulty = 'Tingkat kesulitan harus dipilih';
    }

    if (!selectedDuration) {
      newErrors.duration = 'Durasi tantangan harus dipilih';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Fungsi untuk menyimpan tantangan
  const handleSave = async () => {
    if (!validateForm()) {
      // Scroll ke error pertama
      return;
    }

    if (!user) {
      showError('Error', 'Anda harus login untuk membuat tantangan');
      return;
    }

    try {
      setIsLoading(true);

      const selectedTypeObj = challengeTypes.find(type => type.id === selectedType);

      if (!selectedTypeObj) {
        showError('Error', 'Jenis tantangan tidak valid');
        setIsLoading(false);
        return;
      }

      // Format nama dan deskripsi dengan proper case
      const formattedName = name.trim().charAt(0).toUpperCase() + name.trim().slice(1);

      const challengeInput: ChallengeInput = {
        name: formattedName,
        description: description.trim(),
        target_amount: Number(targetAmount),
        duration_days: selectedDuration || 30,
        difficulty: (selectedDifficulty as 'easy' | 'medium' | 'hard') || 'medium',
        icon: selectedTypeObj.icon,
        color: selectedTypeObj.color,
        is_featured: isFeatured,
      };

      // Tambahkan tantangan baru
      const { data: newChallenge, error } = await addChallenge(challengeInput);

      if (error || !newChallenge) {
        // Error adding challenge - silently handled
        showError('Error', 'Gagal menambahkan tantangan');
        setIsLoading(false);
        return;
      }

      // Mulai tantangan untuk pengguna
      const { error: startError } = await startChallenge(user.id, newChallenge.id);

      if (startError) {
        // Error starting challenge - silently handled
        showWarning(
          'Peringatan',
          'Tantangan berhasil dibuat tetapi gagal dimulai. Anda dapat memulainya nanti dari halaman Tantangan.'
        );
        setTimeout(() => navigation.goBack(), 2000);
      } else {
        // Setup reminder notifikasi untuk tantangan
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + (selectedDuration || 30));
        await setupChallengeReminders(formattedName, endDate.toISOString());

        showSuccess(
          'Sukses',
          'Tantangan menabung berhasil dibuat dan dimulai! Semoga berhasil mencapai target tabungan Anda.'
        );
        setTimeout(() => navigation.goBack(), 2000);
      }
    } catch (error) {
      // Error saving challenge - silently handled
      showError('Error', 'Terjadi kesalahan saat menyimpan tantangan');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color={theme.colors.primary[500]} />
          </TouchableOpacity>

          <Typography variant="h5" style={styles.headerTitle}>
            Tambah Tantangan
          </Typography>

          {/* Placeholder kosong untuk menjaga layout */}
          <View style={{ width: 24 }} />
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ],
            }}
          >
            {/* Form untuk menambahkan tantangan */}
            <Card style={styles.formCard}>
              <View style={styles.formHeader}>
                <MaterialCommunityIcons name="piggy-bank" size={28} color={theme.colors.success[500]} />
                <Typography variant="h6" style={styles.formHeaderTitle}>
                  Detail Tantangan Menabung
                </Typography>
              </View>

              <Input
                label="Nama Tantangan"
                placeholder="Masukkan nama tantangan"
                value={name}
                onChangeText={setName}
                error={errors.name}
                leftIcon={<Ionicons name="trophy-outline" size={24} color={theme.colors.primary[500]} />}
                containerStyle={styles.inputContainer}
              />

              <Input
                label="Deskripsi"
                placeholder="Masukkan deskripsi tantangan"
                value={description}
                onChangeText={setDescription}
                error={errors.description}
                leftIcon={<Ionicons name="document-text-outline" size={24} color={theme.colors.primary[500]} />}
                containerStyle={styles.inputContainer}
                multiline
                numberOfLines={3}
              />

              <Input
                label="Target Tabungan"
                placeholder="Masukkan jumlah target tabungan"
                value={targetAmount ? targetAmount.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''}
                onChangeText={(text) => {
                  // Hapus semua karakter non-numerik (termasuk titik sebagai pemisah ribuan)
                  const numericValue = text.replace(/[^0-9]/g, '');
                  setTargetAmount(numericValue);
                }}
                error={errors.targetAmount}
                leftIcon={
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="cash-outline" size={24} color={theme.colors.success[500]} />
                    <Typography variant="body2" color={theme.colors.neutral[600]} style={{ marginLeft: theme.spacing.sm, fontWeight: '600' }}>Rp</Typography>
                  </View>
                }
                containerStyle={styles.inputContainer}
                keyboardType="numeric"
              />
            </Card>

            {/* Pilih Jenis Tantangan */}
            <Card style={styles.sectionCard}>
              <View style={styles.sectionHeaderContainer}>
                <Typography variant="h6" style={styles.sectionTitle}>
                  Jenis Tantangan
                </Typography>
                <TouchableOpacity
                  style={styles.addCustomButton}
                  onPress={() => setIsAddingCustomType(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary[500]} />
                  <Typography variant="caption" color={theme.colors.primary[500]} style={styles.addCustomButtonText}>
                    Tambah Kustom
                  </Typography>
                </TouchableOpacity>
              </View>

              {errors.type && (
                <Typography variant="caption" color={theme.colors.danger[500]} style={styles.errorText}>
                  {errors.type}
                </Typography>
              )}

              {isLoadingOptions ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.colors.primary[500]} />
                </View>
              ) : (
                <View style={styles.optionsContainer}>
                  {challengeTypes.map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.optionCard,
                        selectedType === type.id && styles.selectedOptionCard,
                        selectedType === type.id && { borderColor: type.color },
                        !type.isDefault && styles.customOptionCard,
                      ]}
                      onPress={() => setSelectedType(type.id)}
                      activeOpacity={0.7}
                    >
                      <LinearGradient
                        colors={type.gradientColors as [string, string]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.optionIconContainer}
                      >
                        {type.iconType === 'MaterialCommunityIcons' && (
                          <MaterialCommunityIcons name={type.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={24} color={theme.colors.white} />
                        )}
                        {type.iconType === 'FontAwesome5' && (
                          <FontAwesome5 name={type.icon as keyof typeof FontAwesome5.glyphMap} size={22} color={theme.colors.white} />
                        )}
                        {type.iconType === 'Ionicons' && (
                          <Ionicons name={type.icon as keyof typeof Ionicons.glyphMap} size={24} color={theme.colors.white} />
                        )}
                      </LinearGradient>
                      <View style={styles.optionTextContainer}>
                        <Typography variant="body1" weight="600">
                          {type.name}
                        </Typography>
                        <Typography variant="caption" color={theme.colors.neutral[600]}>
                          {type.description}
                        </Typography>
                        {!type.isDefault && (
                          <View style={styles.customBadge}>
                            <Typography variant="caption" color={theme.colors.primary[500]} style={styles.customBadgeText}>
                              Kustom
                            </Typography>
                          </View>
                        )}
                      </View>
                      {selectedType === type.id && (
                        <View style={styles.selectedIndicator}>
                          <Ionicons name="checkmark-circle" size={24} color={type.color} />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </Card>

            {/* Pilih Tingkat Kesulitan */}
            <Card style={styles.sectionCard}>
              <Typography variant="h6" style={styles.sectionTitle}>
                Tingkat Kesulitan
              </Typography>
              {errors.difficulty && (
                <Typography variant="caption" color={theme.colors.danger[500]} style={styles.errorText}>
                  {errors.difficulty}
                </Typography>
              )}
              <View style={styles.difficultyContainer}>
                {difficultyOptions.map((difficulty) => (
                  <TouchableOpacity
                    key={difficulty.id}
                    style={[
                      styles.difficultyCard,
                      selectedDifficulty === difficulty.id && styles.selectedDifficultyCard,
                      selectedDifficulty === difficulty.id && { borderColor: difficulty.color },
                    ]}
                    onPress={() => setSelectedDifficulty(difficulty.id)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={difficulty.gradientColors as [string, string]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.difficultyIconContainer}
                    >
                      <Ionicons name={difficulty.icon as keyof typeof Ionicons.glyphMap} size={30} color={theme.colors.white} />
                    </LinearGradient>
                    <Typography variant="body2" weight="600" style={styles.difficultyName}>
                      {difficulty.name}
                    </Typography>
                    <Typography variant="caption" color={theme.colors.neutral[600]} style={styles.difficultyDesc}>
                      {difficulty.description}
                    </Typography>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>

            {/* Pilih Durasi */}
            <Card style={styles.sectionCard}>
              <Typography variant="h6" style={styles.sectionTitle}>
                Durasi Tantangan
              </Typography>
              {errors.duration && (
                <Typography variant="caption" color={theme.colors.danger[500]} style={styles.errorText}>
                  {errors.duration}
                </Typography>
              )}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.durationScrollContent}
              >
                {durationOptions.map((duration) => (
                  <TouchableOpacity
                    key={duration.id}
                    style={[
                      styles.durationCard,
                      selectedDuration === duration.id && styles.selectedDurationCard,
                    ]}
                    onPress={() => setSelectedDuration(Number(duration.id))}
                    activeOpacity={0.7}
                  >
                    <View style={styles.durationIconContainer}>
                      {duration.iconType === 'MaterialCommunityIcons' && (
                        <MaterialCommunityIcons
                          name={duration.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                          size={24}
                          color={selectedDuration === duration.id ? theme.colors.primary[500] : theme.colors.neutral[500]}
                        />
                      )}
                      {duration.iconType === 'FontAwesome5' && (
                        <FontAwesome5
                          name={duration.icon as keyof typeof FontAwesome5.glyphMap}
                          size={20}
                          color={selectedDuration === duration.id ? theme.colors.primary[500] : theme.colors.neutral[500]}
                        />
                      )}
                    </View>
                    <Typography
                      variant="body1"
                      weight="600"
                      color={selectedDuration === duration.id ? theme.colors.primary[500] : theme.colors.neutral[800]}
                    >
                      {duration.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      color={selectedDuration === duration.id ? theme.colors.primary[400] : theme.colors.neutral[600]}
                    >
                      {duration.description}
                    </Typography>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Card>

            {/* Opsi Tambahan */}
            <Card style={styles.optionsCard}>
              <View style={styles.optionsHeader}>
                <Ionicons name="options-outline" size={22} color={theme.colors.primary[500]} />
                <Typography variant="body1" weight="600" style={styles.optionsHeaderTitle}>
                  Pengaturan Tambahan
                </Typography>
              </View>

              <View style={styles.switchContainer}>
                <View style={styles.switchTextContainer}>
                  <Typography variant="body1" weight="600">
                    Jadikan Unggulan
                  </Typography>
                  <Typography variant="caption" color={theme.colors.neutral[600]}>
                    Tantangan akan ditampilkan di bagian atas
                  </Typography>
                </View>
                <Switch
                  value={isFeatured}
                  onValueChange={setIsFeatured}
                  trackColor={{
                    false: theme.colors.neutral[300],
                    true: theme.colors.primary[300],
                  }}
                  thumbColor={isFeatured ? theme.colors.primary[500] : theme.colors.white}
                />
              </View>
            </Card>

            {/* Tombol Simpan */}
            <View style={styles.saveButtonContainer}>
              <Button
                title="Simpan"
                variant="primary"
                loading={isLoading}
                onPress={handleSave}
                style={styles.saveButtonLarge}
                textStyle={styles.saveButtonText}
                leftIcon={<MaterialCommunityIcons name="piggy-bank" size={22} color={theme.colors.white} />}
                fullWidth
              />
            </View>
          </Animated.View>
        </ScrollView>

        {/* Modal untuk menambah jenis tantangan kustom */}
        <Modal
          visible={isAddingCustomType}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsAddingCustomType(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Typography variant="h6" style={styles.modalTitle}>
                  Tambah Jenis Tantangan Kustom
                </Typography>
                <TouchableOpacity
                  onPress={() => setIsAddingCustomType(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color={theme.colors.neutral[700]} />
                </TouchableOpacity>
              </View>

              <Input
                label="Nama"
                placeholder="Masukkan nama jenis tantangan"
                value={customTypeName}
                onChangeText={setCustomTypeName}
                containerStyle={styles.modalInput}
                leftIcon={<Ionicons name="text" size={20} color={theme.colors.primary[500]} />}
              />

              <Input
                label="Deskripsi"
                placeholder="Masukkan deskripsi"
                value={customTypeDescription}
                onChangeText={setCustomTypeDescription}
                containerStyle={styles.modalInput}
                multiline
                numberOfLines={2}
                leftIcon={<Ionicons name="document-text-outline" size={20} color={theme.colors.primary[500]} />}
              />

              <Input
                label="Ikon"
                placeholder="Nama ikon (contoh: star, trophy)"
                value={customTypeIcon}
                onChangeText={setCustomTypeIcon}
                containerStyle={styles.modalInput}
                leftIcon={<Ionicons name="star-outline" size={20} color={theme.colors.primary[500]} />}
              />

              <View style={styles.modalButtons}>
                <Button
                  title="Batal"
                  variant="outline"
                  onPress={() => setIsAddingCustomType(false)}
                  style={styles.modalButton}
                />
                <Button
                  title="Simpan"
                  variant="primary"
                  onPress={handleAddCustomType}
                  style={styles.modalButton}
                  loading={isLoading}
                />
              </View>
            </View>
          </View>
        </Modal>

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
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

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
    paddingHorizontal: theme.spacing.layout.sm,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
    ...theme.elevation.md,
  },
  loadingContainer: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  addCustomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary[50],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  addCustomButtonText: {
    marginLeft: 4,
  },
  customOptionCard: {
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary[500],
  },
  customBadge: {
    backgroundColor: theme.colors.primary[50],
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'flex-start',
    marginTop: theme.spacing.xs,
  },
  customBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.layout.md,
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    width: '100%',
    padding: theme.spacing.layout.md,
    ...theme.elevation.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  modalTitle: {
    color: theme.colors.primary[500],
  },
  modalCloseButton: {
    padding: theme.spacing.xs,
  },
  modalInput: {
    marginBottom: theme.spacing.md,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.md,
  },
  modalButton: {
    minWidth: 100,
    marginLeft: theme.spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    // Menghapus borderRadius, backgroundColor, dan elevation
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: theme.colors.neutral[800],
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: theme.spacing.layout.sm,
    paddingBottom: theme.spacing.layout.xl,
  },
  formCard: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    ...theme.elevation.md,
    padding: theme.spacing.lg, // Increased padding from md to lg
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  formHeaderTitle: {
    marginLeft: theme.spacing.sm,
    color: theme.colors.success[500],
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: theme.spacing.lg, // Increased margin from md to lg
  },
  sectionCard: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    ...theme.elevation.md,
    padding: theme.spacing.lg, // Increased padding from md to lg
  },
  sectionTitle: {
    marginBottom: theme.spacing.sm,
    color: theme.colors.neutral[800],
    fontWeight: '600',
  },
  errorText: {
    marginBottom: theme.spacing.xs,
  },
  optionsContainer: {
    marginBottom: theme.spacing.sm,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.elevation.sm,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
  },
  selectedOptionCard: {
    borderWidth: 2,
    backgroundColor: theme.colors.primary[50],
    ...theme.elevation.md,
  },
  optionIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    ...theme.elevation.sm,
  },
  optionTextContainer: {
    flex: 1,
  },
  selectedIndicator: {
    marginLeft: theme.spacing.sm,
  },
  difficultyContainer: {
    flexDirection: 'row',
    justifyContent: 'center', // Changed from space-between to center
    marginBottom: theme.spacing.lg, // Increased bottom margin
    marginTop: theme.spacing.md, // Increased top margin
    marginHorizontal: theme.spacing.md, // Changed from negative to positive margin
  },
  difficultyCard: {
    width: (width - theme.spacing.layout.sm * 2 - theme.spacing.lg * 2 - theme.spacing.md * 4) / 3, // Adjusted width calculation for new container padding and margins
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.lg, // Increased vertical padding
    paddingHorizontal: theme.spacing.md, // Increased horizontal padding
    alignItems: 'center',
    ...theme.elevation.sm,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    marginHorizontal: theme.spacing.md, // Increased horizontal margin between cards
  },
  selectedDifficultyCard: {
    borderWidth: 2,
    backgroundColor: theme.colors.primary[50],
    ...theme.elevation.md,
  },
  difficultyIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md, // Increased bottom margin
    marginTop: theme.spacing.sm, // Increased top margin
    ...theme.elevation.sm,
  },
  difficultyName: {
    marginTop: theme.spacing.md, // Increased top margin
    textAlign: 'center',
    fontWeight: '600',
    paddingHorizontal: theme.spacing.sm, // Increased horizontal padding
    fontSize: 16, // Added explicit font size
  },
  difficultyDesc: {
    marginTop: theme.spacing.sm, // Increased top margin
    textAlign: 'center',
    paddingHorizontal: theme.spacing.sm, // Increased horizontal padding
    marginBottom: theme.spacing.md, // Increased bottom margin
    fontSize: 12, // Added explicit font size
  },
  durationScrollContent: {
    paddingBottom: theme.spacing.sm,
    paddingTop: theme.spacing.xs,
  },
  durationCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginRight: theme.spacing.md,
    minWidth: 130,
    alignItems: 'center',
    ...theme.elevation.sm,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
  },
  durationIconContainer: {
    marginBottom: theme.spacing.sm,
  },
  selectedDurationCard: {
    borderColor: theme.colors.primary[500],
    borderWidth: 2,
    backgroundColor: theme.colors.primary[50],
    ...theme.elevation.md,
  },
  optionsCard: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    ...theme.elevation.md,
    padding: theme.spacing.lg, // Increased padding from md to lg to match other cards
  },
  optionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  optionsHeaderTitle: {
    marginLeft: theme.spacing.sm,
    color: theme.colors.primary[500],
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchTextContainer: {
    flex: 1,
  },
  saveButtonContainer: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    paddingHorizontal: 0, // Menghapus padding horizontal agar sejajar dengan card-card
    marginHorizontal: theme.spacing.layout.sm, // Menggunakan margin yang sama dengan scrollViewContent
  },
  saveButtonLarge: {
    paddingVertical: theme.spacing.sm,
    height: 48, // Ukuran standar tombol untuk mobile (48dp)
    backgroundColor: theme.colors.success[500],
    borderColor: theme.colors.success[600],
    ...theme.elevation.md,
  },
  saveButtonText: {
    fontSize: 16, // Ukuran font standar untuk tombol
    fontWeight: '600',
  },
});

// Set display name untuk komponen
AddChallengeScreenComponent.displayName = 'AddChallengeScreen';

// Export komponen dengan display name
export const AddChallengeScreen = AddChallengeScreenComponent;
