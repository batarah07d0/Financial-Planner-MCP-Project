import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  TextInput as RNTextInput,
  Text,
  ViewStyle,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { RootStackParamList } from '../../../core/navigation/types';
import { Typography, Button, Card, SuperiorDialog } from '../../../core/components';
import { theme } from '../../../core/theme';
import { useAuthStore } from '../../../core/services/store';
import { createSavingGoal, CreateSavingGoalInput } from '../../../core/services/supabase/savingGoal.service';
import { useSuperiorDialog } from '../../../core/hooks';

const { width: screenWidth } = Dimensions.get('window');

type AddSavingGoalScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddSavingGoal'>;

// Responsive helper functions
const responsiveSpacing = (size: number) => Math.round(screenWidth * (size / 375));
const responsiveFontSize = (size: number) => Math.round(screenWidth * (size / 375));

// Optimized TextInput Component with Performance Enhancements
interface OptimizedTextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  leftIcon?: React.ReactNode;
  multiline?: boolean;
  numberOfLines?: number;
  style?: ViewStyle;
}

const OptimizedTextInput = React.memo<OptimizedTextInputProps>(({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  leftIcon,
  multiline = false,
  numberOfLines = 1,
  style,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<RNTextInput>(null);

  // Handle focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  // Handle blur
  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  // Direct text change handler without debouncing to prevent glitches
  const handleTextChange = useCallback((text: string) => {
    onChangeText(text);
  }, [onChangeText]);

  // Dynamic border style based on focus state - using stable border width
  const borderStyle = useMemo(() => ({
    borderColor: isFocused ? theme.colors.primary[500] : theme.colors.neutral[200],
  }), [isFocused]);

  return (
    <View style={[optimizedInputStyles.container, style]}>
      <Text style={optimizedInputStyles.label}>{label}</Text>

      <View
        style={[
          optimizedInputStyles.inputContainer,
          borderStyle,
        ]}
      >
        {leftIcon && (
          <View style={optimizedInputStyles.leftIconContainer}>
            {leftIcon}
          </View>
        )}

        <RNTextInput
          ref={inputRef}
          style={[
            optimizedInputStyles.input,
            leftIcon ? optimizedInputStyles.inputWithLeftIcon : undefined,
            multiline ? optimizedInputStyles.multilineInput : undefined,
          ]}
          value={value}
          onChangeText={handleTextChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.neutral[400]}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={multiline ? 'top' : 'center'}
          autoCorrect={false}
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
          spellCheck={false}
          // Performance optimizations
          keyboardAppearance="light"
          returnKeyType="done"
          // Remove problematic props that can cause glitches
          selectTextOnFocus={false}
          clearButtonMode="never"
        />
      </View>
    </View>
  );
});

// Set display name untuk OptimizedTextInput
OptimizedTextInput.displayName = 'OptimizedTextInput';

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
    <View style={[optimizedInputStyles.container, style]}>
      <Text style={optimizedInputStyles.label}>{label}</Text>

      <TouchableOpacity
        style={[
          optimizedInputStyles.inputContainer,
          borderStyle,
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={optimizedInputStyles.leftIconContainer}>
          <Ionicons
            name="calendar"
            size={responsiveSpacing(20)}
            color={theme.colors.primary[500]}
          />
        </View>

        <View style={optimizedInputStyles.dateInputContent}>
          <Text style={[
            optimizedInputStyles.dateText,
            !value && optimizedInputStyles.placeholderText
          ]}>
            {value ? formatDisplayDate(value) : placeholder}
          </Text>
        </View>

        <View style={optimizedInputStyles.rightIconContainer}>
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

// Set display name untuk DateInput
DateInput.displayName = 'DateInput';

const GOAL_ICONS = [
  { name: 'home', label: 'Rumah' },
  { name: 'car', label: 'Mobil' },
  { name: 'airplane', label: 'Liburan' },
  { name: 'laptop', label: 'Laptop' },
  { name: 'phone-portrait', label: 'HP' },
  { name: 'school', label: 'Pendidikan' },
  { name: 'medical', label: 'Kesehatan' },
  { name: 'shield-checkmark', label: 'Dana Darurat' },
  { name: 'gift', label: 'Hadiah' },
  { name: 'diamond', label: 'Perhiasan' },
  { name: 'fitness', label: 'Fitness' },
  { name: 'camera', label: 'Kamera' },
];

const GOAL_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#AED6F1', '#D7BDE2',
];

export const AddSavingGoalScreen = () => {
  const navigation = useNavigation<AddSavingGoalScreenNavigationProp>();
  const { user } = useAuthStore();
  const { dialogState, showError, showSuccess, hideDialog } = useSuperiorDialog();

  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: '',
    description: '',
    icon: 'wallet',
    color: theme.colors.primary[500],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Stable currency formatter to prevent recreation on every render
  const formatCurrency = useCallback((value: string) => {
    // Remove all non-digit characters
    const numericValue = value.replace(/[^\d]/g, '');
    if (!numericValue) return '';

    // Parse and format with thousand separators
    const number = parseInt(numericValue, 10);
    if (isNaN(number)) return '';

    return new Intl.NumberFormat('id-ID').format(number);
  }, []);

  // Stable currency parser
  const parseCurrency = useCallback((value: string): number => {
    const numericValue = value.replace(/[^\d]/g, '');
    return parseInt(numericValue, 10) || 0;
  }, []);

  // Optimized input change handler with immediate state update
  const handleInputChange = useCallback((field: string, value: string) => {
    if (field === 'targetAmount' || field === 'currentAmount') {
      // Format currency immediately to prevent glitches
      const formattedValue = formatCurrency(value);
      setFormData(prev => ({
        ...prev,
        [field]: formattedValue,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  }, [formatCurrency]);

  // Date formatting functions
  const formatDateForDatabase = useCallback((date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Date picker handlers
  const handleDatePickerOpen = useCallback(() => {
    // Set initial date to tomorrow if no date is selected
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

  // Memoized icon and color handlers
  const handleIconSelect = useCallback((iconName: string) => {
    setFormData(prev => ({ ...prev, icon: iconName }));
  }, []);

  const handleColorSelect = useCallback((color: string) => {
    setFormData(prev => ({ ...prev, color }));
  }, []);

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      showError('Error', 'Nama tujuan tabungan harus diisi');
      return false;
    }

    if (!formData.targetAmount) {
      showError('Error', 'Target jumlah harus diisi');
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
    if (!user || !validateForm()) return;

    try {
      setIsLoading(true);

      const goalData: CreateSavingGoalInput = {
        name: formData.name.trim(),
        target_amount: parseCurrency(formData.targetAmount),
        current_amount: parseCurrency(formData.currentAmount),
        target_date: formData.targetDate,
        description: formData.description.trim() || undefined,
        icon: formData.icon,
        color: formData.color,
      };

      const result = await createSavingGoal(user.id, goalData);

      if (result) {
        showSuccess('Sukses', 'Tujuan tabungan berhasil dibuat');
        setTimeout(() => navigation.goBack(), 2000);
      } else {
        showError('Error', 'Gagal membuat tujuan tabungan');
      }
    } catch (error) {
      // Error creating saving goal - silently handled
      showError('Error', 'Gagal membuat tujuan tabungan');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.neutral[800]} />
          </TouchableOpacity>
          <Typography variant="h4" weight="600" color={theme.colors.neutral[800]}>
            {'Tambah Tujuan Tabungan'}
          </Typography>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={false}
        >
          {/* Preview Card */}
          <Card style={styles.previewCard} elevation="lg">
            <LinearGradient
              colors={[formData.color, formData.color + '80']}
              style={styles.previewGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.previewContent}>
                <View style={styles.previewIcon}>
                  <Ionicons name={formData.icon as keyof typeof Ionicons.glyphMap} size={32} color={theme.colors.white} />
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

          <Card style={styles.formCard} elevation="sm">
            <Typography variant="h6" weight="600" color={theme.colors.neutral[800]} style={styles.sectionTitle}>
              {'Informasi Dasar'}
            </Typography>

            <OptimizedTextInput
              label="Nama Tujuan"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              placeholder="Contoh: Liburan ke Bali"
              style={styles.input}
            />

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <OptimizedTextInput
                  label="Target Jumlah"
                  value={formData.targetAmount}
                  onChangeText={(value) => handleInputChange('targetAmount', value)}
                  placeholder="0"
                  keyboardType="numeric"
                  leftIcon={
                    <View style={styles.currencyIconContainer}>
                      <Ionicons name="wallet" size={responsiveSpacing(20)} color={theme.colors.primary[500]} />
                    </View>
                  }
                  style={styles.input}
                />
              </View>
              <View style={styles.halfWidth}>
                <OptimizedTextInput
                  label="Jumlah Saat Ini"
                  value={formData.currentAmount}
                  onChangeText={(value) => handleInputChange('currentAmount', value)}
                  placeholder="0"
                  keyboardType="numeric"
                  leftIcon={
                    <View style={styles.currencyIconContainer}>
                      <Ionicons name="cash" size={responsiveSpacing(20)} color={theme.colors.success[500]} />
                    </View>
                  }
                  style={styles.input}
                />
              </View>
            </View>

            <DateInput
              label="Target Tanggal"
              value={formData.targetDate}
              onPress={handleDatePickerOpen}
              placeholder="Pilih tanggal target tabungan"
              style={styles.input}
            />

            <OptimizedTextInput
              label="Deskripsi (Opsional)"
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              placeholder="Tambahkan deskripsi untuk tujuan tabungan Anda"
              multiline
              numberOfLines={3}
              style={styles.input}
            />
          </Card>

          <Card style={styles.formCard} elevation="sm">
            <Typography variant="h6" weight="600" color={theme.colors.neutral[800]} style={styles.sectionTitle}>
              {'Pilih Ikon'}
            </Typography>
            <View style={styles.iconGrid}>
              {GOAL_ICONS.map((item) => {
                const isSelected = formData.icon === item.name;
                return (
                  <TouchableOpacity
                    key={item.name}
                    style={[
                      styles.iconOption,
                      isSelected && styles.iconOptionSelected,
                    ]}
                    onPress={() => handleIconSelect(item.name)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.iconContent}>
                      <Ionicons
                        name={item.name as keyof typeof Ionicons.glyphMap}
                        size={responsiveSpacing(24)}
                        color={isSelected ? theme.colors.white : theme.colors.neutral[600]}
                      />
                      <Typography
                        variant="caption"
                        color={isSelected ? theme.colors.white : theme.colors.neutral[600]}
                        style={styles.iconLabel}
                      >
                        {item.label}
                      </Typography>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>

          <Card style={styles.formCard} elevation="sm">
            <Typography variant="h6" weight="600" color={theme.colors.neutral[800]} style={styles.sectionTitle}>
              {'Pilih Warna'}
            </Typography>
            <View style={styles.colorGrid}>
              {GOAL_COLORS.map((color, index) => {
                const isSelected = formData.color === color;
                return (
                  <TouchableOpacity
                    key={`${color}-${index}`}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      isSelected && styles.colorOptionSelected,
                    ]}
                    onPress={() => handleColorSelect(color)}
                    activeOpacity={0.8}
                  >
                    {isSelected && (
                      <Ionicons
                        name="checkmark"
                        size={responsiveSpacing(20)}
                        color={theme.colors.white}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>

          <Button
            title={'Simpan Tujuan Tabungan'}
            onPress={handleSave}
            loading={isLoading}
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Optimized TextInput Styles
const optimizedInputStyles = StyleSheet.create({
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
    // Stable border properties to prevent layout shifts
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
  input: {
    flex: 1,
    fontSize: responsiveFontSize(16),
    fontWeight: '500' as const,
    color: theme.colors.neutral[800],
    paddingVertical: responsiveSpacing(theme.spacing.md),
    paddingHorizontal: 0,
    textAlignVertical: 'center' as const,
    // Prevent text jumping
    includeFontPadding: false,
    textAlign: 'left' as const,
  },
  inputWithLeftIcon: {
    paddingLeft: 0,
  },
  multilineInput: {
    minHeight: responsiveSpacing(80),
    paddingTop: responsiveSpacing(theme.spacing.md),
    textAlignVertical: 'top' as const,
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
  keyboardAvoidingView: {
    flex: 1,
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
    ...theme.elevation.xs,
  },
  backButton: {
    padding: responsiveSpacing(theme.spacing.xs),
    borderRadius: responsiveSpacing(theme.borderRadius.round),
    backgroundColor: 'transparent',
  },
  headerSpacer: {
    width: responsiveSpacing(40),
  },
  content: {
    flex: 1,
    paddingHorizontal: responsiveSpacing(theme.spacing.layout.md),
  },
  previewCard: {
    marginVertical: responsiveSpacing(theme.spacing.lg),
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
    textAlign: 'center' as const,
    marginBottom: responsiveSpacing(theme.spacing.xs),
  },
  previewAmount: {
    textAlign: 'center' as const,
    opacity: 0.9,
  },
  formCard: {
    padding: responsiveSpacing(theme.spacing.layout.lg),
    marginBottom: responsiveSpacing(theme.spacing.lg),
    backgroundColor: theme.colors.white,
    borderRadius: responsiveSpacing(theme.borderRadius.lg),
  },
  sectionTitle: {
    marginBottom: responsiveSpacing(theme.spacing.lg),
  },
  input: {
    marginBottom: 0,
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -responsiveSpacing(theme.spacing.md / 2),
  },
  halfWidth: {
    flex: 1,
    paddingHorizontal: responsiveSpacing(theme.spacing.md / 2),
  },
  currencyIconContainer: {
    width: responsiveSpacing(32),
    height: responsiveSpacing(32),
    borderRadius: responsiveSpacing(16),
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.elevation.xs,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -responsiveSpacing(theme.spacing.sm / 2),
  },
  iconOption: {
    width: responsiveSpacing(80),
    height: responsiveSpacing(80),
    borderRadius: responsiveSpacing(theme.borderRadius.lg),
    backgroundColor: theme.colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    marginHorizontal: responsiveSpacing(theme.spacing.sm / 2),
    marginBottom: responsiveSpacing(theme.spacing.sm),
    ...theme.elevation.xs,
  },
  iconOptionSelected: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[600],
    ...theme.elevation.sm,
  },
  iconContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLabel: {
    marginTop: responsiveSpacing(4),
    textAlign: 'center' as const,
    fontSize: responsiveFontSize(10),
    fontWeight: '500' as const,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -responsiveSpacing(theme.spacing.sm / 2),
  },
  colorOption: {
    width: responsiveSpacing(48),
    height: responsiveSpacing(48),
    borderRadius: responsiveSpacing(24),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
    marginHorizontal: responsiveSpacing(theme.spacing.sm / 2),
    marginBottom: responsiveSpacing(theme.spacing.sm),
    ...theme.elevation.sm,
  },
  colorOptionSelected: {
    borderColor: theme.colors.white,
    ...theme.elevation.md,
  },
  saveButton: {
    marginTop: responsiveSpacing(theme.spacing.xl),
    marginBottom: responsiveSpacing(theme.spacing.layout.lg),
    borderRadius: responsiveSpacing(theme.borderRadius.lg),
    paddingVertical: responsiveSpacing(theme.spacing.md),
  },
});
