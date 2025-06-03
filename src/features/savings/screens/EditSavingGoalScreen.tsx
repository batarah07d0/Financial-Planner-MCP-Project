import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Text,
  Platform,
  ViewStyle,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp, useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { RootStackParamList } from '../../../core/navigation/types';
import { Typography, TextInput, Button, Card, SuperiorDialog } from '../../../core/components';
import { theme } from '../../../core/theme';

import {
  getSavingGoal,
  updateSavingGoal,
  UpdateSavingGoalInput,
  SavingGoal
} from '../../../core/services/supabase/savingGoal.service';
import { useSuperiorDialog } from '../../../core/hooks';

const { width: screenWidth } = Dimensions.get('window');

type EditSavingGoalScreenRouteProp = RouteProp<RootStackParamList, 'EditSavingGoal'>;
type EditSavingGoalScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'EditSavingGoal'>;

// Responsive helper functions
const responsiveSpacing = (size: number) => Math.round(screenWidth * (size / 375));
const responsiveFontSize = (size: number) => Math.round(screenWidth * (size / 375));

// Superior Date Input Component
interface DateInputProps {
  label: string;
  value: string;
  onPress: () => void;
  placeholder: string;
  style?: ViewStyle;
}

const DateInput = React.memo<DateInputProps>(({
  label,
  value,
  onPress,
  placeholder,
  style,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const formatDisplayDate = useCallback((dateString: string): string => {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      };
      return date.toLocaleDateString('id-ID', options);
    } catch {
      return dateString;
    }
  }, []);

  const handlePress = useCallback(() => {
    setIsFocused(true);
    onPress();
    setTimeout(() => setIsFocused(false), 200);
  }, [onPress]);

  const borderStyle = useMemo(() => ({
    borderColor: isFocused ? theme.colors.primary[500] : theme.colors.neutral[200],
  }), [isFocused]);

  return (
    <View style={[dateInputStyles.container, style]}>
      <Text style={dateInputStyles.label}>{label}</Text>

      <TouchableOpacity
        style={[
          dateInputStyles.inputContainer,
          borderStyle,
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={dateInputStyles.leftIconContainer}>
          <Ionicons
            name="calendar"
            size={responsiveSpacing(20)}
            color={theme.colors.primary[500]}
          />
        </View>

        <View style={dateInputStyles.dateInputContent}>
          <Text style={[
            dateInputStyles.dateText,
            !value && dateInputStyles.placeholderText
          ]}>
            {value ? formatDisplayDate(value) : placeholder}
          </Text>
        </View>

        <View style={dateInputStyles.rightIconContainer}>
          <Ionicons
            name="chevron-down"
            size={responsiveSpacing(20)}
            color={theme.colors.neutral[400]}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
});

DateInput.displayName = 'DateInput';

// Goal icons
const GOAL_ICONS = [
  'wallet',
  'home',
  'car-sport',
  'airplane',
  'gift',
  'school',
  'medical',
  'diamond',
  'camera',
  'game-controller',
  'laptop',
  'phone-portrait',
  'bicycle',
  'boat',
  'business',
  'restaurant',
];

// Goal colors
const GOAL_COLORS = [
  theme.colors.primary[500],
  theme.colors.secondary[500],
  theme.colors.success[500],
  theme.colors.warning[500],
  theme.colors.info[500],
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#98D8C8',
  '#F7DC6F',
  '#BB8FCE',
  '#85C1E9',
  '#F8C471',
];

export const EditSavingGoalScreen = () => {
  const route = useRoute<EditSavingGoalScreenRouteProp>();
  const navigation = useNavigation<EditSavingGoalScreenNavigationProp>();
  const { goalId } = route.params;

  const { dialogState, showError, showSuccess, hideDialog } = useSuperiorDialog();

  const [goal, setGoal] = useState<SavingGoal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: '',
    description: '',
    icon: 'wallet',
    color: theme.colors.primary[500],
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const formatCurrency = useCallback((value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    if (!numericValue) return '';
    const number = parseInt(numericValue);
    return new Intl.NumberFormat('id-ID').format(number);
  }, []);

  const parseCurrency = useCallback((value: string): number => {
    return parseInt(value.replace(/[^\d]/g, '')) || 0;
  }, []);



  const loadGoalData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getSavingGoal(goalId);
      if (data) {
        setGoal(data);
        setFormData({
          name: data.name,
          targetAmount: new Intl.NumberFormat('id-ID').format(data.target_amount),
          currentAmount: new Intl.NumberFormat('id-ID').format(data.current_amount),
          targetDate: data.target_date,
          description: data.description || '',
          icon: data.icon || 'wallet',
          color: data.color || theme.colors.primary[500],
        });
      } else {
        showError('Error', 'Tujuan tabungan tidak ditemukan');
        navigation.goBack();
      }
    } catch (error) {
      // Error loading goal - silently handled
      showError('Error', 'Gagal memuat data tujuan tabungan');
    } finally {
      setIsLoading(false);
    }
  }, [goalId, showError, navigation]);

  // Date formatting functions
  const formatDateForDatabase = useCallback((date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Date picker handlers
  const handleDatePickerOpen = useCallback(() => {
    // Set initial date to current target date or tomorrow if no date is selected
    const initialDate = formData.targetDate
      ? new Date(formData.targetDate)
      : new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
    setSelectedDate(initialDate);
    setShowDatePicker(true);
  }, [formData.targetDate]);

  const handleDateChange = useCallback((_: unknown, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (date) {
      setSelectedDate(date);
      const formattedDate = formatDateForDatabase(date);
      setFormData(prev => ({ ...prev, targetDate: formattedDate }));

      if (Platform.OS === 'ios') {
        setShowDatePicker(false);
      }
    }
  }, [formatDateForDatabase]);

  const handleIconSelect = useCallback((icon: string) => {
    setFormData(prev => ({ ...prev, icon }));
  }, []);

  const handleColorSelect = (color: string) => {
    setFormData(prev => ({ ...prev, color }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      showError('Error', 'Nama tujuan tabungan harus diisi');
      return false;
    }

    if (!formData.targetAmount) {
      showError('Error', 'Target jumlah harus diisi');
      return false;
    }

    if (parseCurrency(formData.targetAmount) <= 0) {
      showError('Error', 'Target jumlah harus lebih dari 0');
      return false;
    }

    if (!formData.targetDate) {
      showError('Error', 'Target tanggal harus diisi');
      return false;
    }

    const targetDate = new Date(formData.targetDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (targetDate <= today) {
      showError('Error', 'Target tanggal harus di masa depan');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm() || !goal) return;

    try {
      setIsSaving(true);

      const updateData: UpdateSavingGoalInput = {
        name: formData.name.trim(),
        target_amount: parseCurrency(formData.targetAmount),
        current_amount: parseCurrency(formData.currentAmount),
        target_date: formData.targetDate,
        description: formData.description.trim() || undefined,
        icon: formData.icon,
        color: formData.color,
        updated_at: new Date().toISOString(),
      };

      const result = await updateSavingGoal(goalId, updateData);

      if (result) {
        showSuccess('Sukses', 'Tujuan tabungan berhasil diperbarui');
        setTimeout(() => navigation.goBack(), 2000);
      } else {
        showError('Error', 'Gagal memperbarui tujuan tabungan');
      }
    } catch (error) {
      // Error updating saving goal - silently handled
      showError('Error', 'Gagal memperbarui tujuan tabungan');
    } finally {
      setIsSaving(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadGoalData();
    }, [loadGoalData])
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.neutral[800]} />
          </TouchableOpacity>
          <Typography variant="h4" weight="600" color={theme.colors.neutral[800]}>
            Edit Tujuan Tabungan
          </Typography>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.loadingContainer}>
          <View style={styles.loadingContent}>
            <LinearGradient
              colors={[theme.colors.primary[100], theme.colors.primary[200]]}
              style={styles.loadingIconContainer}
            >
              <MaterialCommunityIcons name="piggy-bank" size={48} color={theme.colors.primary[600]} />
            </LinearGradient>
            <ActivityIndicator size="large" color={theme.colors.primary[500]} style={styles.loadingSpinner} />
            <Typography variant="h6" weight="600" color={theme.colors.neutral[800]} style={styles.loadingTitle}>
              Memuat Data Tabungan
            </Typography>
            <Typography variant="body2" color={theme.colors.neutral[600]} style={styles.loadingText}>
              Sedang mengambil informasi tujuan tabungan Anda...
            </Typography>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.neutral[800]} />
        </TouchableOpacity>
        <Typography variant="h4" weight="600" color={theme.colors.neutral[800]}>
          Edit Tujuan Tabungan
        </Typography>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Preview Card */}
        <Card style={styles.previewCard} elevation="md">
          <LinearGradient
            colors={[formData.color, formData.color + '80']}
            style={styles.previewGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.previewContent}>
              <View style={styles.previewIcon}>
                <Ionicons name={(formData.icon as keyof typeof Ionicons.glyphMap)} size={32} color={theme.colors.white} />
              </View>
              <Typography variant="h6" weight="600" color={theme.colors.white} style={styles.previewTitle}>
                {formData.name || 'Nama Tujuan Tabungan'}
              </Typography>
              <Typography variant="body2" color={theme.colors.white} style={styles.previewAmount}>
                Target: {formData.targetAmount ? `Rp ${formData.targetAmount}` : 'Rp 0'}
              </Typography>
            </View>
          </LinearGradient>
        </Card>

        {/* Form Fields */}
        <Card style={styles.formCard} elevation="sm">
          <Typography variant="h6" weight="600" color={theme.colors.neutral[800]} style={styles.sectionTitle}>
            Informasi Dasar
          </Typography>

          <View style={styles.inputGroup}>
            <Typography variant="body2" color={theme.colors.neutral[700]} style={styles.inputLabel}>
              Nama Tujuan Tabungan
            </Typography>
            <TextInput
              style={styles.textInput}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="Contoh: Liburan ke Bali"
              placeholderTextColor={theme.colors.neutral[400]}
            />
          </View>

          <View style={styles.inputGroup}>
            <Typography variant="body2" color={theme.colors.neutral[700]} style={styles.inputLabel}>
              Target Jumlah
            </Typography>
            <View style={styles.currencyInputContainer}>
              <Typography variant="h6" color={theme.colors.neutral[600]} style={styles.currencySymbol}>
                Rp
              </Typography>
              <TextInput
                style={styles.currencyInput}
                value={formData.targetAmount}
                onChangeText={(text) => setFormData(prev => ({ ...prev, targetAmount: formatCurrency(text) }))}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor={theme.colors.neutral[400]}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Typography variant="body2" color={theme.colors.neutral[700]} style={styles.inputLabel}>
              Jumlah Saat Ini
            </Typography>
            <View style={styles.currencyInputContainer}>
              <Typography variant="h6" color={theme.colors.neutral[600]} style={styles.currencySymbol}>
                Rp
              </Typography>
              <TextInput
                style={styles.currencyInput}
                value={formData.currentAmount}
                onChangeText={(text) => setFormData(prev => ({ ...prev, currentAmount: formatCurrency(text) }))}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor={theme.colors.neutral[400]}
              />
            </View>
          </View>

          <DateInput
            label="Target Tanggal"
            value={formData.targetDate}
            onPress={handleDatePickerOpen}
            placeholder="Pilih tanggal target tabungan"
            style={styles.inputGroup}
          />

          <View style={styles.inputGroup}>
            <Typography variant="body2" color={theme.colors.neutral[700]} style={styles.inputLabel}>
              Deskripsi (Opsional)
            </Typography>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Tambahkan deskripsi untuk tujuan tabungan Anda..."
              placeholderTextColor={theme.colors.neutral[400]}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </Card>

        {/* Icon Selection */}
        <Card style={styles.formCard} elevation="sm">
          <Typography variant="h6" weight="600" color={theme.colors.neutral[800]} style={styles.sectionTitle}>
            Pilih Ikon
          </Typography>
          <View style={styles.iconGrid}>
            {GOAL_ICONS.map((icon) => (
              <TouchableOpacity
                key={icon}
                style={[
                  styles.iconOption,
                  formData.icon === icon && styles.iconOptionSelected,
                ]}
                onPress={() => handleIconSelect(icon)}
              >
                <Ionicons
                  name={(icon as keyof typeof Ionicons.glyphMap)}
                  size={24}
                  color={formData.icon === icon ? theme.colors.white : theme.colors.neutral[600]}
                />
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Color Selection */}
        <Card style={styles.formCard} elevation="sm">
          <Typography variant="h6" weight="600" color={theme.colors.neutral[800]} style={styles.sectionTitle}>
            Pilih Warna
          </Typography>
          <View style={styles.colorGrid}>
            {GOAL_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  formData.color === color && styles.colorOptionSelected,
                ]}
                onPress={() => handleColorSelect(color)}
              >
                {formData.color === color && (
                  <Ionicons name="checkmark" size={20} color={theme.colors.white} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Button
          title="Simpan Perubahan"
          onPress={handleSave}
          loading={isSaving}
          style={styles.saveButton}
        />
      </ScrollView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date(Date.now() + 24 * 60 * 60 * 1000)} // Tomorrow
          maximumDate={new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000)} // 10 years from now
          locale="id-ID"
          textColor={theme.colors.neutral[800]}
          accentColor={theme.colors.primary[500]}
        />
      )}

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

// DateInput Styles
const dateInputStyles = StyleSheet.create({
  container: {
    marginBottom: responsiveSpacing(theme.spacing.lg),
  },
  label: {
    ...theme.typography.body.small,
    color: theme.colors.neutral[700],
    marginBottom: responsiveSpacing(theme.spacing.xs),
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral[50],
    borderRadius: responsiveSpacing(theme.borderRadius.lg),
    minHeight: responsiveSpacing(56),
    paddingHorizontal: responsiveSpacing(theme.spacing.md),
    borderWidth: 2,
    borderColor: 'transparent',
  },
  leftIconContainer: {
    width: responsiveSpacing(32),
    height: responsiveSpacing(32),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: responsiveSpacing(theme.spacing.sm),
  },
  rightIconContainer: {
    width: responsiveSpacing(32),
    height: responsiveSpacing(32),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: responsiveSpacing(theme.spacing.sm),
  },
  dateText: {
    fontSize: responsiveFontSize(16),
    fontWeight: '500' as const,
    color: theme.colors.neutral[800],
    includeFontPadding: false,
  },
  placeholderText: {
    color: theme.colors.neutral[400],
    fontWeight: '400' as const,
  },
  dateInputContent: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: responsiveSpacing(theme.spacing.md),
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: responsiveSpacing(theme.spacing.layout.md),
    paddingVertical: responsiveSpacing(theme.spacing.md),
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[100],
  },
  backButton: {
    padding: responsiveSpacing(theme.spacing.xs),
    borderRadius: responsiveSpacing(theme.borderRadius.round),
    backgroundColor: 'transparent',
  },
  headerSpacer: {
    width: responsiveSpacing(40),
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsiveSpacing(theme.spacing.layout.lg),
  },
  loadingContent: {
    alignItems: 'center',
    maxWidth: responsiveSpacing(280),
  },
  loadingIconContainer: {
    width: responsiveSpacing(80),
    height: responsiveSpacing(80),
    borderRadius: responsiveSpacing(40),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsiveSpacing(theme.spacing.lg),
    ...theme.elevation.md,
  },
  loadingSpinner: {
    marginVertical: responsiveSpacing(theme.spacing.lg),
  },
  loadingTitle: {
    textAlign: 'center',
    marginBottom: responsiveSpacing(theme.spacing.sm),
  },
  loadingText: {
    textAlign: 'center',
    lineHeight: 20,
  },
  previewCard: {
    margin: responsiveSpacing(theme.spacing.layout.md),
    marginBottom: responsiveSpacing(theme.spacing.lg),
    borderRadius: responsiveSpacing(theme.borderRadius.xl),
    overflow: 'hidden',
  },
  previewGradient: {
    padding: responsiveSpacing(theme.spacing.layout.lg),
  },
  previewContent: {
    alignItems: 'center',
  },
  previewIcon: {
    width: responsiveSpacing(64),
    height: responsiveSpacing(64),
    borderRadius: responsiveSpacing(32),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsiveSpacing(theme.spacing.md),
    ...theme.elevation.sm,
  },
  previewTitle: {
    textAlign: 'center',
    marginBottom: responsiveSpacing(theme.spacing.xs),
  },
  previewAmount: {
    textAlign: 'center',
    opacity: 0.9,
  },
  formCard: {
    marginHorizontal: responsiveSpacing(theme.spacing.layout.md),
    marginBottom: responsiveSpacing(theme.spacing.lg),
    borderRadius: responsiveSpacing(theme.borderRadius.lg),
    backgroundColor: theme.colors.white,
    padding: responsiveSpacing(theme.spacing.layout.lg),
  },
  sectionTitle: {
    marginBottom: responsiveSpacing(theme.spacing.lg),
    color: theme.colors.neutral[800],
  },
  inputGroup: {
    marginBottom: responsiveSpacing(theme.spacing.lg),
  },
  inputLabel: {
    marginBottom: responsiveSpacing(theme.spacing.xs),
    fontWeight: '600',
    color: theme.colors.neutral[700],
  },
  textInput: {
    backgroundColor: theme.colors.neutral[50],
    borderRadius: responsiveSpacing(theme.borderRadius.lg),
    borderWidth: 2,
    borderColor: theme.colors.neutral[200],
    paddingHorizontal: responsiveSpacing(theme.spacing.md),
    paddingVertical: responsiveSpacing(theme.spacing.md),
    fontSize: responsiveFontSize(16),
    fontWeight: '500',
    color: theme.colors.neutral[800],
  },
  textArea: {
    minHeight: responsiveSpacing(80),
    textAlignVertical: 'top',
  },
  currencyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral[50],
    borderRadius: responsiveSpacing(theme.borderRadius.lg),
    borderWidth: 2,
    borderColor: theme.colors.neutral[200],
    paddingHorizontal: responsiveSpacing(theme.spacing.md),
    paddingVertical: responsiveSpacing(theme.spacing.md),
  },
  currencySymbol: {
    marginRight: responsiveSpacing(theme.spacing.sm),
    color: theme.colors.neutral[600],
  },
  currencyInput: {
    flex: 1,
    fontSize: responsiveFontSize(16),
    fontWeight: '600',
    color: theme.colors.neutral[800],
    padding: 0,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: responsiveSpacing(theme.spacing.sm),
  },
  iconOption: {
    width: responsiveSpacing(48),
    height: responsiveSpacing(48),
    borderRadius: responsiveSpacing(theme.borderRadius.lg),
    backgroundColor: theme.colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconOptionSelected: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[600],
    ...theme.elevation.sm,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: responsiveSpacing(theme.spacing.sm),
  },
  colorOption: {
    width: responsiveSpacing(48),
    height: responsiveSpacing(48),
    borderRadius: responsiveSpacing(theme.borderRadius.lg),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: theme.colors.white,
    ...theme.elevation.md,
  },
  saveButton: {
    marginHorizontal: responsiveSpacing(theme.spacing.layout.md),
    marginBottom: responsiveSpacing(theme.spacing.layout.lg),
    borderRadius: responsiveSpacing(theme.borderRadius.lg),
    paddingVertical: responsiveSpacing(theme.spacing.md),
  },
});
