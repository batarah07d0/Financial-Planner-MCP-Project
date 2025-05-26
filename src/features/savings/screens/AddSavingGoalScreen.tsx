import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../../../core/navigation/types';
import { Typography, TextInput, Button, Card, SuperiorDialog } from '../../../core/components';
import { theme } from '../../../core/theme';
import { useAuthStore } from '../../../core/services/store';
import { createSavingGoal, CreateSavingGoalInput } from '../../../core/services/supabase/savingGoal.service';
import { useSuperiorDialog } from '../../../core/hooks';

type AddSavingGoalScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddSavingGoal'>;

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
  '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2',
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

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    if (!numericValue) return '';

    const number = parseInt(numericValue);
    return new Intl.NumberFormat('id-ID').format(number);
  };

  const parseCurrency = (value: string): number => {
    return parseInt(value.replace(/[^\d]/g, '')) || 0;
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'targetAmount' || field === 'currentAmount') {
      setFormData(prev => ({
        ...prev,
        [field]: formatCurrency(value),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleIconSelect = (iconName: string) => {
    setFormData(prev => ({ ...prev, icon: iconName }));
  };

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
      console.error('Error creating saving goal:', error);
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
            Tambah Tujuan Tabungan
          </Typography>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Card style={styles.formCard} elevation="sm">
            <Typography variant="h6" weight="600" color={theme.colors.neutral[800]} style={styles.sectionTitle}>
              Informasi Dasar
            </Typography>

            <TextInput
              label="Nama Tujuan"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              placeholder="Contoh: Liburan ke Bali"
              style={styles.input}
            />

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <TextInput
                  label="Target Jumlah"
                  value={formData.targetAmount}
                  onChangeText={(value) => handleInputChange('targetAmount', value)}
                  placeholder="0"
                  keyboardType="numeric"
                  leftIcon="wallet"
                  style={styles.input}
                />
              </View>
              <View style={styles.halfWidth}>
                <TextInput
                  label="Jumlah Saat Ini"
                  value={formData.currentAmount}
                  onChangeText={(value) => handleInputChange('currentAmount', value)}
                  placeholder="0"
                  keyboardType="numeric"
                  leftIcon="cash"
                  style={styles.input}
                />
              </View>
            </View>

            <TextInput
              label="Target Tanggal"
              value={formData.targetDate}
              onChangeText={(value) => handleInputChange('targetDate', value)}
              placeholder="YYYY-MM-DD"
              style={styles.input}
            />

            <TextInput
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
              Pilih Ikon
            </Typography>
            <View style={styles.iconGrid}>
              {GOAL_ICONS.map((item) => (
                <TouchableOpacity
                  key={item.name}
                  style={[
                    styles.iconOption,
                    formData.icon === item.name && styles.iconOptionSelected,
                  ]}
                  onPress={() => handleIconSelect(item.name)}
                >
                  <Ionicons
                    name={item.name as any}
                    size={24}
                    color={formData.icon === item.name ? theme.colors.white : theme.colors.neutral[600]}
                  />
                  <Typography
                    variant="caption"
                    color={formData.icon === item.name ? theme.colors.white : theme.colors.neutral[600]}
                    style={styles.iconLabel}
                  >
                    {item.label}
                  </Typography>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

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
            title="Simpan Tujuan Tabungan"
            onPress={handleSave}
            loading={isLoading}
            style={styles.saveButton}
          />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formCard: {
    padding: 20,
    marginBottom: 16,
    backgroundColor: theme.colors.white,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconOption: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: theme.colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconOptionSelected: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[700],
  },
  iconLabel: {
    marginTop: 4,
    textAlign: 'center',
    fontSize: 10,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: theme.colors.neutral[800],
  },
  saveButton: {
    marginTop: 20,
    marginBottom: 40,
  },
});
