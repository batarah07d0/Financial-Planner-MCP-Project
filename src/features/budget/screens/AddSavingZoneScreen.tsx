import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../core/navigation/types';
import { Typography, TextInput, Button, LocationPicker } from '../../../core/components';
import { theme } from '../../../core/theme';
import { SavingZoneInput } from '../models/SavingZone';
import { addSavingZone } from '../services/savingZoneService';
import { useLocation } from '../../../core/hooks/useLocation';

type AddSavingZoneScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddSavingZone'>;

export const AddSavingZoneScreen = () => {
  const navigation = useNavigation<AddSavingZoneScreenNavigationProp>();
  const { getCurrentLocation } = useLocation();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [radius, setRadius] = useState('100');
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    address?: string;
  } | null>(null);
  const [type, setType] = useState<'high_expense' | 'saving_opportunity'>('high_expense');
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Fungsi untuk menangani pemilihan lokasi
  const handleLocationSelected = (selectedLocation: {
    latitude: number;
    longitude: number;
    address?: string;
  } | null) => {
    setLocation(selectedLocation);
    setIsPickingLocation(false);
  };
  
  // Fungsi untuk mendapatkan lokasi saat ini
  const handleGetCurrentLocation = async () => {
    const currentLocation = await getCurrentLocation();
    
    if (currentLocation) {
      setLocation({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      });
    }
  };
  
  // Fungsi untuk menangani simpan zona
  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Nama zona tidak boleh kosong');
      return;
    }
    
    if (!location) {
      Alert.alert('Error', 'Lokasi zona harus dipilih');
      return;
    }
    
    const radiusValue = parseInt(radius, 10);
    if (isNaN(radiusValue) || radiusValue <= 0) {
      Alert.alert('Error', 'Radius harus berupa angka positif');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const zoneInput: SavingZoneInput = {
        name: name.trim(),
        description: description.trim() || undefined,
        radius: radiusValue,
        location,
        type,
        notificationEnabled,
      };
      
      await addSavingZone(zoneInput);
      
      Alert.alert('Sukses', 'Zona hemat berhasil ditambahkan', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error saving zone:', error);
      Alert.alert('Error', 'Gagal menyimpan zona hemat');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Render pemilih lokasi
  if (isPickingLocation) {
    return (
      <SafeAreaView style={styles.container}>
        <LocationPicker
          initialLocation={location}
          onLocationSelected={handleLocationSelected}
          onCancel={() => setIsPickingLocation(false)}
        />
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Typography variant="body1" color={theme.colors.primary[500]}>
              Batal
            </Typography>
          </TouchableOpacity>
          <Typography variant="h4">Tambah Zona Hemat</Typography>
          <TouchableOpacity onPress={handleSave} disabled={isLoading}>
            <Typography
              variant="body1"
              color={isLoading ? theme.colors.neutral[400] : theme.colors.primary[500]}
            >
              Simpan
            </Typography>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <TextInput
            label="Nama Zona"
            value={name}
            onChangeText={setName}
            placeholder="Masukkan nama zona"
            maxLength={50}
            style={styles.input}
          />
          
          <TextInput
            label="Deskripsi (Opsional)"
            value={description}
            onChangeText={setDescription}
            placeholder="Masukkan deskripsi zona"
            multiline
            numberOfLines={3}
            maxLength={200}
            style={styles.input}
          />
          
          <TextInput
            label="Radius (meter)"
            value={radius}
            onChangeText={setRadius}
            placeholder="Masukkan radius zona dalam meter"
            keyboardType="number-pad"
            maxLength={5}
            style={styles.input}
          />
          
          <View style={styles.locationSection}>
            <Typography variant="body1" weight="600" style={styles.sectionTitle}>
              Lokasi
            </Typography>
            
            {location ? (
              <View style={styles.selectedLocation}>
                <Typography variant="body1">
                  {location.address || `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}
                </Typography>
                <TouchableOpacity
                  style={styles.changeLocationButton}
                  onPress={() => setIsPickingLocation(true)}
                >
                  <Typography variant="body2" color={theme.colors.primary[500]}>
                    Ubah
                  </Typography>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.locationButtons}>
                <Button
                  title="Pilih di Peta"
                  onPress={() => setIsPickingLocation(true)}
                  style={styles.locationButton}
                />
                <Button
                  title="Gunakan Lokasi Saat Ini"
                  variant="outline"
                  onPress={handleGetCurrentLocation}
                  style={styles.locationButton}
                />
              </View>
            )}
          </View>
          
          <View style={styles.typeSection}>
            <Typography variant="body1" weight="600" style={styles.sectionTitle}>
              Tipe Zona
            </Typography>
            
            <View style={styles.typeButtons}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  type === 'high_expense' && styles.typeButtonActive,
                  styles.highExpenseButton,
                ]}
                onPress={() => setType('high_expense')}
              >
                <Typography
                  variant="body1"
                  color={type === 'high_expense' ? theme.colors.white : theme.colors.danger[500]}
                >
                  Pengeluaran Tinggi
                </Typography>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  type === 'saving_opportunity' && styles.typeButtonActive,
                  styles.savingOpportunityButton,
                ]}
                onPress={() => setType('saving_opportunity')}
              >
                <Typography
                  variant="body1"
                  color={type === 'saving_opportunity' ? theme.colors.white : theme.colors.success[500]}
                >
                  Peluang Hemat
                </Typography>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.notificationSection}>
            <Typography variant="body1" weight="600" style={styles.sectionTitle}>
              Notifikasi
            </Typography>
            
            <View style={styles.notificationButtons}>
              <TouchableOpacity
                style={[
                  styles.notificationButton,
                  notificationEnabled && styles.notificationButtonActive,
                ]}
                onPress={() => setNotificationEnabled(true)}
              >
                <Typography
                  variant="body1"
                  color={notificationEnabled ? theme.colors.white : theme.colors.neutral[600]}
                >
                  Aktif
                </Typography>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.notificationButton,
                  !notificationEnabled && styles.notificationButtonActive,
                ]}
                onPress={() => setNotificationEnabled(false)}
              >
                <Typography
                  variant="body1"
                  color={!notificationEnabled ? theme.colors.white : theme.colors.neutral[600]}
                >
                  Nonaktif
                </Typography>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.layout.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.layout.md,
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    marginBottom: theme.spacing.sm,
  },
  locationSection: {
    marginBottom: theme.spacing.layout.md,
  },
  selectedLocation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.neutral[100],
    borderRadius: theme.borderRadius.md,
  },
  changeLocationButton: {
    marginLeft: theme.spacing.sm,
  },
  locationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  locationButton: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  typeSection: {
    marginBottom: theme.spacing.layout.md,
  },
  typeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    marginHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
  },
  typeButtonActive: {
    borderWidth: 0,
  },
  highExpenseButton: {
    borderColor: theme.colors.danger[500],
    backgroundColor: theme.colors.white,
  },
  savingOpportunityButton: {
    borderColor: theme.colors.success[500],
    backgroundColor: theme.colors.white,
  },
  notificationSection: {
    marginBottom: theme.spacing.layout.md,
  },
  notificationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  notificationButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    marginHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.neutral[300],
    backgroundColor: theme.colors.white,
  },
  notificationButtonActive: {
    borderWidth: 0,
    backgroundColor: theme.colors.primary[500],
  },
});
