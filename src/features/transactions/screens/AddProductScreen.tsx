import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../core/navigation/types';
import { Typography, TextInput, Button } from '../../../core/components';
import { theme } from '../../../core/theme';
import { Ionicons } from '@expo/vector-icons';
import { BarcodeDataInput } from '../models/Barcode';
import { addCommunityBarcodeData } from '../services/barcodeService';
import { useAuthStore } from '../../../core/services/store';
import * as ImagePicker from 'expo-image-picker';
import { BASIC_PRODUCT_CATEGORIES } from '../../budget/models/Product';

type AddProductScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddProduct'>;
type AddProductScreenRouteProp = RouteProp<RootStackParamList, 'AddProduct'>;

export const AddProductScreen = () => {
  const navigation = useNavigation<AddProductScreenNavigationProp>();
  const route = useRoute<AddProductScreenRouteProp>();
  const { barcode } = route.params || {};

  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCategoryPickerVisible, setIsCategoryPickerVisible] = useState(false);

  const { user } = useAuthStore();

  // Fungsi untuk menangani perubahan harga
  const handlePriceChange = (text: string) => {
    // Hapus semua karakter non-digit
    const numericValue = text.replace(/[^0-9]/g, '');
    setPrice(numericValue);
  };

  // Fungsi untuk memilih gambar dari galeri
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Gagal memilih gambar');
    }
  };

  // Fungsi untuk mengambil gambar dengan kamera
  const takePhoto = async () => {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();

      if (cameraPermission.status !== 'granted') {
        Alert.alert('Izin Diperlukan', 'Izin kamera diperlukan untuk mengambil foto');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Gagal mengambil foto');
    }
  };

  // Fungsi untuk menangani simpan produk
  const handleSaveProduct = async () => {
    if (!user) {
      Alert.alert('Error', 'Anda harus login untuk menambahkan produk');
      return;
    }

    if (!barcode) {
      Alert.alert('Error', 'Barcode tidak valid');
      return;
    }

    if (!productName.trim()) {
      Alert.alert('Error', 'Nama produk tidak boleh kosong');
      return;
    }

    if (!category) {
      Alert.alert('Error', 'Kategori harus dipilih');
      return;
    }

    setIsSubmitting(true);

    try {
      const priceValue = parseInt(price, 10);

      const productInput: BarcodeDataInput = {
        barcode,
        productName: productName.trim(),
        category,
        defaultPrice: !isNaN(priceValue) && priceValue > 0 ? priceValue : undefined,
        description: description.trim() || undefined,
        imageUrl: imageUri !== null ? imageUri : undefined, // Dalam implementasi sebenarnya, upload gambar ke server
      };

      await addCommunityBarcodeData(productInput, user.id);

      Alert.alert(
        'Sukses',
        'Produk berhasil ditambahkan ke database komunitas',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving product:', error);
      Alert.alert('Error', 'Gagal menyimpan produk');
    } finally {
      setIsSubmitting(false);
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
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Typography variant="body1" color={theme.colors.primary[500]}>
              Batal
            </Typography>
          </TouchableOpacity>
          <Typography variant="h4">Tambah Produk</Typography>
          <TouchableOpacity onPress={handleSaveProduct} disabled={isSubmitting}>
            <Typography
              variant="body1"
              color={isSubmitting ? theme.colors.neutral[400] : theme.colors.primary[500]}
            >
              Simpan
            </Typography>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.barcodeContainer}>
            <Typography variant="body1" weight="600">
              Barcode:
            </Typography>
            <Typography variant="body1">{barcode}</Typography>
          </View>

          <TextInput
            label="Nama Produk"
            value={productName}
            onChangeText={setProductName}
            placeholder="Masukkan nama produk"
            maxLength={100}
            style={styles.input}
          />

          <TouchableOpacity
            style={styles.categoryInput}
            onPress={() => setIsCategoryPickerVisible(!isCategoryPickerVisible)}
          >
            <Typography variant="body2" color={theme.colors.neutral[600]} style={styles.inputLabel}>
              Kategori
            </Typography>
            <View style={styles.categoryValueContainer}>
              <Typography
                variant="body1"
                color={category ? theme.colors.neutral[900] : theme.colors.neutral[400]}
              >
                {category || 'Pilih kategori'}
              </Typography>
              <Ionicons
                name={isCategoryPickerVisible ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={theme.colors.neutral[500]}
              />
            </View>
          </TouchableOpacity>

          {isCategoryPickerVisible && (
            <View style={styles.categoryPickerContainer}>
              {BASIC_PRODUCT_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryItem,
                    category === cat && styles.selectedCategoryItem,
                  ]}
                  onPress={() => {
                    setCategory(cat);
                    setIsCategoryPickerVisible(false);
                  }}
                >
                  <Typography
                    variant="body1"
                    color={category === cat ? theme.colors.primary[500] : theme.colors.neutral[700]}
                  >
                    {cat}
                  </Typography>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TextInput
            label="Harga (Opsional)"
            value={price}
            onChangeText={handlePriceChange}
            placeholder="Masukkan harga"
            keyboardType="number-pad"
            style={styles.input}
          />

          <TextInput
            label="Deskripsi (Opsional)"
            value={description}
            onChangeText={setDescription}
            placeholder="Masukkan deskripsi produk"
            multiline
            numberOfLines={4}
            style={styles.input}
          />

          <Typography variant="body1" weight="600" style={styles.imageLabel}>
            Gambar Produk (Opsional)
          </Typography>

          <View style={styles.imageContainer}>
            {imageUri ? (
              <View style={styles.selectedImageContainer}>
                <Image source={{ uri: imageUri }} style={styles.selectedImage} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setImageUri(null)}
                >
                  <Ionicons name="close-circle" size={24} color={theme.colors.white} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.imageButtons}>
                <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                  <Ionicons name="images-outline" size={24} color={theme.colors.primary[500]} />
                  <Typography variant="body2" color={theme.colors.primary[500]}>
                    Galeri
                  </Typography>
                </TouchableOpacity>

                <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
                  <Ionicons name="camera-outline" size={24} color={theme.colors.primary[500]} />
                  <Typography variant="body2" color={theme.colors.primary[500]}>
                    Kamera
                  </Typography>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.infoContainer}>
            <Ionicons name="information-circle-outline" size={20} color={theme.colors.info[500]} />
            <Typography variant="body2" color={theme.colors.info[500]} style={styles.infoText}>
              Produk yang Anda tambahkan akan tersedia untuk semua pengguna BudgetWise. Pastikan informasi yang Anda berikan akurat.
            </Typography>
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
  barcodeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.neutral[100],
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  categoryInput: {
    borderWidth: 1,
    borderColor: theme.colors.neutral[300],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    marginBottom: theme.spacing.xs,
  },
  categoryValueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryPickerContainer: {
    marginTop: -theme.spacing.sm,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.neutral[300],
    borderRadius: theme.borderRadius.md,
    maxHeight: 200,
  },
  categoryItem: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  selectedCategoryItem: {
    backgroundColor: theme.colors.neutral[100],
  },
  imageLabel: {
    marginBottom: theme.spacing.sm,
  },
  imageContainer: {
    marginBottom: theme.spacing.md,
  },
  imageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.md,
  },
  imageButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 100,
    borderWidth: 1,
    borderColor: theme.colors.primary[300],
    borderRadius: theme.borderRadius.md,
    borderStyle: 'dashed',
  },
  selectedImageContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  selectedImage: {
    width: 200,
    height: 200,
    borderRadius: theme.borderRadius.md,
  },
  removeImageButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: theme.colors.danger[500],
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.info[50],
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
  },
  infoText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
});
