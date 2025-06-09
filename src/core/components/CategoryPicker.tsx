import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  TextInput,
} from 'react-native';
import { Typography } from './Typography';
import { theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
}

interface CategoryPickerProps {
  categories: Category[];
  selectedCategoryId?: string;
  transactionType: 'income' | 'expense';
  onCategorySelected: (categoryId: string) => void;
  onCancel?: () => void;
  title?: string;
  isLoading?: boolean;
}

export const CategoryPicker: React.FC<CategoryPickerProps> = ({
  categories,
  selectedCategoryId,
  transactionType,
  onCategorySelected,
  onCancel,
  title = 'Pilih Kategori',
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(selectedCategoryId);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Filter kategori berdasarkan tipe transaksi dan pencarian, dengan "Lainnya" di akhir
  const filteredCategories = categories
    .filter(category => {
      const matchesType = category.type === transactionType;
      const matchesSearch = category.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    })
    .sort((a, b) => {
      // Pindahkan "Lainnya" ke akhir
      if (a.name.toLowerCase() === 'lainnya') return 1;
      if (b.name.toLowerCase() === 'lainnya') return -1;
      return a.name.localeCompare(b.name);
    });

  // Animasi masuk
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: theme.duration.normal,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: theme.duration.normal,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Fungsi untuk memilih kategori
  const selectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  // Fungsi untuk konfirmasi
  const handleConfirm = () => {
    if (selectedCategory) {
      onCategorySelected(selectedCategory);
    }
  };

  // Fungsi untuk mendapatkan ikon kategori
  const getCategoryIcon = (category: Category): string => {
    if (category.icon) return category.icon;

    // Default icons berdasarkan nama kategori
    const iconMap: Record<string, string> = {
      'makanan': 'restaurant',
      'minuman': 'cafe',
      'transportasi': 'car',
      'belanja': 'bag',
      'hiburan': 'game-controller',
      'kesehatan': 'medical',
      'pendidikan': 'school',
      'tagihan': 'receipt',
      'lainnya': 'ellipsis-horizontal',
      'gaji': 'card',
      'bonus': 'gift',
      'investasi': 'trending-up',
      'bisnis': 'briefcase',
    };

    const categoryName = category.name.toLowerCase();
    for (const [key, icon] of Object.entries(iconMap)) {
      if (categoryName.includes(key)) {
        return icon;
      }
    }

    return transactionType === 'expense' ? 'remove-circle' : 'add-circle';
  };

  // Fungsi untuk mendapatkan warna kategori
  const getCategoryColor = (category: Category): string => {
    if (category.color) return category.color;

    // Default colors berdasarkan tipe
    return transactionType === 'expense'
      ? theme.colors.danger[500]
      : theme.colors.success[500];
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header dengan Gradient */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={[theme.colors.primary[500], theme.colors.primary[700]]}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={theme.colors.white} />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Typography
                variant="h5"
                color={theme.colors.white}
                weight="600"
              >
                {title}
              </Typography>
              <Typography
                variant="body2"
                color={theme.colors.white}
                style={{ opacity: 0.9, textAlign: 'center' }}
              >
                {transactionType === 'expense' ? 'Kategori Pengeluaran' : 'Kategori Pemasukan'}
              </Typography>
            </View>

            <TouchableOpacity
              style={styles.searchButton}
              onPress={() => {/* Toggle search focus */ }}
              activeOpacity={0.7}
            >
              <Ionicons name="search" size={24} color={theme.colors.white} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Search Bar */}
      <Animated.View
        style={[
          styles.searchContainer,
          { opacity: fadeAnim }
        ]}
      >
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search"
            size={20}
            color={theme.colors.neutral[400]}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari kategori..."
            placeholderTextColor={theme.colors.neutral[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={theme.colors.neutral[400]}
              />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* Categories Grid */}
      <Animated.View
        style={[
          styles.categoriesContainer,
          { opacity: fadeAnim }
        ]}
      >
        <ScrollView
          style={styles.categoriesScroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <View style={styles.loadingCard}>
                <Ionicons
                  name="hourglass"
                  size={48}
                  color={theme.colors.primary[500]}
                />
                <Typography
                  variant="h4"
                  color={theme.colors.neutral[700]}
                  weight="500"
                  style={styles.loadingTitle}
                >
                  Memuat Kategori
                </Typography>
                <Typography
                  variant="body2"
                  color={theme.colors.neutral[500]}
                  style={styles.loadingSubtitle}
                >
                  Mohon tunggu sebentar...
                </Typography>
              </View>
            </View>
          ) : filteredCategories.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyCard}>
                <Ionicons
                  name="folder-open-outline"
                  size={48}
                  color={theme.colors.neutral[400]}
                />
                <Typography
                  variant="h4"
                  color={theme.colors.neutral[600]}
                  weight="500"
                  style={styles.emptyTitle}
                >
                  {searchQuery ? 'Kategori Tidak Ditemukan' : 'Belum Ada Kategori'}
                </Typography>
                <Typography
                  variant="body2"
                  color={theme.colors.neutral[500]}
                  style={styles.emptySubtitle}
                >
                  {searchQuery
                    ? `Tidak ada kategori yang cocok dengan "${searchQuery}"`
                    : `Belum ada kategori untuk ${transactionType === 'expense' ? 'pengeluaran' : 'pemasukan'}`
                  }
                </Typography>
              </View>
            </View>
          ) : (
            <View style={styles.categoriesGrid}>
              {filteredCategories.map((category) => {
                const isSelected = selectedCategory === category.id;
                const categoryIcon = getCategoryIcon(category);
                const categoryColor = getCategoryColor(category);

                return (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryCard,
                      isSelected && styles.selectedCategoryCard,
                    ]}
                    onPress={() => selectCategory(category.id)}
                    activeOpacity={0.8}
                  >
                    {isSelected && (
                      <LinearGradient
                        colors={[theme.colors.primary[500], theme.colors.primary[700]]}
                        style={styles.selectedCategoryGradient}
                      />
                    )}

                    <View style={[
                      styles.categoryIconContainer,
                      { backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : `${categoryColor}20` }
                    ]}>
                      <Ionicons
                        name={categoryIcon as keyof typeof Ionicons.glyphMap}
                        size={24}
                        color={isSelected ? theme.colors.white : categoryColor}
                      />
                    </View>

                    <Typography
                      variant="body1"
                      weight={isSelected ? "600" : "500"}
                      color={isSelected ? theme.colors.white : theme.colors.neutral[800]}
                      style={styles.categoryName}
                    >
                      {category.name}
                    </Typography>

                    {isSelected && (
                      <View style={styles.selectedIndicator}>
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={theme.colors.white}
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      </Animated.View>

      {/* Action Buttons */}
      <Animated.View
        style={[
          styles.actionContainer,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity
          style={[styles.actionButton, styles.cancelButton]}
          onPress={onCancel}
          activeOpacity={0.8}
        >
          <Ionicons
            name="close-outline"
            size={20}
            color={theme.colors.neutral[600]}
          />
          <Typography
            variant="body1"
            weight="500"
            color={theme.colors.neutral[600]}
            style={styles.buttonText}
          >
            Batal
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.confirmButton,
            !selectedCategory && styles.disabledButton
          ]}
          onPress={handleConfirm}
          disabled={!selectedCategory}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={
              selectedCategory
                ? [theme.colors.primary[500], theme.colors.primary[700]]
                : [theme.colors.neutral[300], theme.colors.neutral[400]]
            }
            style={styles.confirmGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons
              name="checkmark-outline"
              size={20}
              color={theme.colors.white}
            />
            <Typography
              variant="body1"
              weight="600"
              color={theme.colors.white}
              style={styles.buttonText}
            >
              Pilih Kategori
            </Typography>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  header: {
    zIndex: 1000,
  },
  headerGradient: {
    paddingTop: theme.spacing.sm, // Tambah padding top agar tidak terlalu dekat dengan status bar
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg, // Perbesar padding vertical
    position: 'relative',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: theme.spacing.lg,
    zIndex: 1,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 60, // Space for buttons on both sides
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: theme.spacing.lg,
    zIndex: 1,
  },

  // Search Styles
  searchContainer: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg, // Perbesar padding vertical
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
    ...theme.elevation.xs,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral[100],
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md, // Perbesar padding untuk field yang lebih besar
    marginHorizontal: 0, // Pastikan sejajar dengan card di bawah
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.neutral[800],
    paddingVertical: theme.spacing.xs,
  },
  clearButton: {
    padding: theme.spacing.xs,
  },

  // Categories Styles
  categoriesContainer: {
    flex: 1,
  },
  categoriesScroll: {
    flex: 1,
  },
  categoriesContent: {
    paddingHorizontal: theme.spacing.lg, // Sejajar dengan search container
    paddingVertical: theme.spacing.lg,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: (width - theme.spacing.lg * 3) / 2, // Sejajar dengan search field
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
    position: 'relative',
    ...theme.elevation.sm,
  },
  selectedCategoryCard: {
    ...theme.elevation.md,
  },
  selectedCategoryGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: theme.borderRadius.xl,
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  categoryName: {
    textAlign: 'center',
    lineHeight: 20,
  },
  selectedIndicator: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
  },

  // Loading & Empty Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  loadingCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xxl,
    alignItems: 'center',
    ...theme.elevation.sm,
  },
  loadingTitle: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  loadingSubtitle: {
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xxl,
    alignItems: 'center',
    ...theme.elevation.sm,
  },
  emptyTitle: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    textAlign: 'center',
    lineHeight: 20,
  },

  // Action Button Styles
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.xs,
    height: 50, // Fixed height instead of minHeight
  },
  cancelButton: {
    backgroundColor: theme.colors.neutral[100],
    borderWidth: 1,
    borderColor: theme.colors.neutral[300],
  },
  confirmButton: {
    flex: 1.5, // Slightly larger than cancel button
  },
  confirmGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    height: 50, // Fixed height instead of minHeight
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    marginLeft: theme.spacing.xs,
  },
});
