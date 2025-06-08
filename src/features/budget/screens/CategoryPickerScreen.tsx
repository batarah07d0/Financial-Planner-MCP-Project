import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../../../core/components';
import { theme } from '../../../core/theme';
import { useAppDimensions } from '../../../core/hooks/useAppDimensions';
import { getCategories } from '../../../core/services/supabase/category.service';
import { Category } from '../../../core/services/supabase/types';

export const CategoryPickerScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { selectedCategoryId } = route.params as { selectedCategoryId?: string };
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const { responsiveSpacing, responsiveFontSize, isSmallDevice } = useAppDimensions();

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoading(true);
        const expenseCategories = await getCategories({ type: 'expense' });
        
        // Sort categories: put "Lainnya" at the end
        const sortedCategories = expenseCategories.sort((a, b) => {
          if (a.name === 'Lainnya') return 1;
          if (b.name === 'Lainnya') return -1;
          return a.name.localeCompare(b.name);
        });
        
        setCategories(sortedCategories);
        setFilteredCategories(sortedCategories);
      } catch (error) {
        // Error loading categories - set empty array as fallback
        setCategories([]);
        setFilteredCategories([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadCategories();
  }, []);

  // Filter categories based on search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter(category =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  }, [searchQuery, categories]);

  const handleCategorySelect = (category: Category) => {
    // Kirim hasil kembali ke screen sebelumnya menggunakan navigation params
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigation as any).navigate({
      name: 'AddBudget',
      params: { selectedCategoryFromPicker: category.id },
      merge: true,
    });
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const renderCategoryItem = ({ item }: { item: Category }) => {
    const isSelected = selectedCategoryId === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.categoryItem,
          {
            marginHorizontal: responsiveSpacing(theme.spacing.sm),
            marginBottom: responsiveSpacing(theme.spacing.md),
            padding: responsiveSpacing(theme.spacing.lg),
            minHeight: responsiveSpacing(isSmallDevice ? 80 : 90),
          },
          isSelected && styles.selectedCategoryItem,
        ]}
        onPress={() => handleCategorySelect(item)}
        activeOpacity={0.7}
      >
        <View style={[
          styles.categoryIconContainer,
          {
            width: responsiveSpacing(isSmallDevice ? 48 : 56),
            height: responsiveSpacing(isSmallDevice ? 48 : 56),
            borderRadius: responsiveSpacing(isSmallDevice ? 24 : 28),
            backgroundColor: `${item.color}20`,
            marginBottom: responsiveSpacing(theme.spacing.sm),
          }
        ]}>
          <Ionicons
            name={item.icon as keyof typeof Ionicons.glyphMap}
            size={responsiveSpacing(isSmallDevice ? 24 : 28)}
            color={item.color}
          />
        </View>
        
        <Typography
          variant="body2"
          weight={isSelected ? "700" : "500"}
          color={isSelected ? theme.colors.primary[600] : theme.colors.neutral[800]}
          style={{
            fontSize: responsiveFontSize(isSmallDevice ? 13 : 15),
            textAlign: 'center',
            lineHeight: responsiveFontSize(isSmallDevice ? 18 : 20),
          }}
          numberOfLines={2}
        >
          {item.name}
        </Typography>
        
        {isSelected && (
          <View style={[styles.selectedIndicator, {
            top: responsiveSpacing(8),
            right: responsiveSpacing(8),
          }]}>
            <Ionicons
              name="checkmark-circle"
              size={responsiveSpacing(20)}
              color={theme.colors.primary[500]}
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[theme.colors.primary[500], theme.colors.primary[600]]}
        style={[styles.header, {
          paddingHorizontal: responsiveSpacing(theme.spacing.layout.sm),
          paddingVertical: responsiveSpacing(theme.spacing.md),
          minHeight: responsiveSpacing(isSmallDevice ? 100 : 110),
        }]}
      >
        <View style={[styles.headerTop, {
          paddingTop: responsiveSpacing(theme.spacing.md), // Tambah jarak dari status bar
          paddingHorizontal: responsiveSpacing(theme.spacing.layout.sm),
        }]}>
          <TouchableOpacity
            style={[styles.closeButton, {
              width: responsiveSpacing(isSmallDevice ? 32 : 36),
              height: responsiveSpacing(isSmallDevice ? 32 : 36),
              borderRadius: responsiveSpacing(isSmallDevice ? 16 : 18),
            }]}
            onPress={handleCancel}
            activeOpacity={0.7}
          >
            <Ionicons
              name="close"
              size={responsiveSpacing(isSmallDevice ? 20 : 24)}
              color={theme.colors.white}
            />
          </TouchableOpacity>

          <Typography
            variant="h5"
            weight="700"
            color={theme.colors.white}
            style={{
              fontSize: responsiveFontSize(isSmallDevice ? 18 : 20),
              textAlign: 'center',
              flex: 1,
              marginHorizontal: responsiveSpacing(theme.spacing.sm), // Jarak dari tombol
            }}
          >
            Pilih Kategori Pengeluaran
          </Typography>

          <TouchableOpacity
            style={[styles.searchButton, {
              width: responsiveSpacing(isSmallDevice ? 32 : 36),
              height: responsiveSpacing(isSmallDevice ? 32 : 36),
              borderRadius: responsiveSpacing(isSmallDevice ? 16 : 18),
            }]}
            activeOpacity={0.7}
          >
            <Ionicons
              name="search"
              size={responsiveSpacing(isSmallDevice ? 20 : 24)}
              color={theme.colors.white}
            />
          </TouchableOpacity>
        </View>

        <Typography
          variant="body2"
          color={theme.colors.white}
          style={{
            fontSize: responsiveFontSize(isSmallDevice ? 13 : 15),
            textAlign: 'center',
            opacity: 0.9,
            marginTop: responsiveSpacing(theme.spacing.sm), // Tambah jarak
            paddingHorizontal: responsiveSpacing(theme.spacing.layout.sm),
          }}
        >
          Kategori Pengeluaran
        </Typography>
      </LinearGradient>

      {/* Search Bar */}
      <View style={[styles.searchContainer, {
        marginHorizontal: responsiveSpacing(theme.spacing.sm), // Sejajar dengan card
        marginVertical: responsiveSpacing(theme.spacing.md),
      }]}>
        <View style={[styles.searchInputContainer, {
          paddingHorizontal: responsiveSpacing(theme.spacing.md),
          paddingVertical: responsiveSpacing(theme.spacing.sm),
          borderRadius: theme.borderRadius.lg,
        }]}>
          <Ionicons
            name="search"
            size={responsiveSpacing(20)}
            color={theme.colors.neutral[400]}
            style={{ marginRight: responsiveSpacing(theme.spacing.sm) }}
          />
          <TextInput
            style={[styles.searchInput, {
              fontSize: responsiveFontSize(isSmallDevice ? 14 : 16),
              flex: 1,
            }]}
            placeholder="Cari kategori..."
            placeholderTextColor={theme.colors.neutral[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Categories Grid */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          <Typography
            variant="body1"
            color={theme.colors.neutral[600]}
            style={{ marginTop: responsiveSpacing(theme.spacing.md) }}
          >
            Memuat kategori...
          </Typography>
        </View>
      ) : (
        <FlatList
          data={filteredCategories}
          renderItem={renderCategoryItem}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={[styles.categoriesContainer, {
            paddingHorizontal: responsiveSpacing(theme.spacing.sm),
            paddingBottom: responsiveSpacing(theme.spacing.layout.lg),
          }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="search-outline"
                size={responsiveSpacing(48)}
                color={theme.colors.neutral[400]}
              />
              <Typography
                variant="body1"
                color={theme.colors.neutral[600]}
                style={{ marginTop: responsiveSpacing(theme.spacing.md), textAlign: 'center' }}
              >
                Tidak ada kategori yang ditemukan
              </Typography>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  header: {
    ...theme.elevation.md,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    // Container for search bar
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    ...theme.elevation.sm,
  },
  searchInput: {
    color: theme.colors.neutral[800],
    fontFamily: theme.typography.fontFamily.base,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesContainer: {
    paddingTop: theme.spacing.sm,
  },
  categoryItem: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...theme.elevation.sm,
  },
  selectedCategoryItem: {
    borderWidth: 2,
    borderColor: theme.colors.primary[500],
    backgroundColor: theme.colors.primary[50],
    ...theme.elevation.md,
  },
  categoryIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicator: {
    position: 'absolute',
    backgroundColor: theme.colors.white,
    borderRadius: 10,
    ...theme.elevation.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.layout.xl,
  },
});
