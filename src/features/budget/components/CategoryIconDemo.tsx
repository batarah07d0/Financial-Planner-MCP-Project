import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../../../core/components';
import { theme } from '../../../core/theme';

interface CategoryDemoProps {
  categories: Array<{
    id: string;
    name: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
  }>;
}

export const CategoryIconDemo: React.FC<CategoryDemoProps> = ({ categories }) => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Typography variant="h4" weight="700" color={theme.colors.neutral[800]}>
          Kategori Budget dengan Ikon
        </Typography>
        <Typography variant="body2" color={theme.colors.neutral[600]} style={styles.subtitle}>
          Setiap kategori kini memiliki ikon yang sesuai untuk memudahkan identifikasi
        </Typography>
      </View>

      <View style={styles.grid}>
        {categories.map((category) => (
          <View key={category.id} style={styles.categoryCard}>
            <LinearGradient
              colors={[category.color, `${category.color}CC`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconContainer}
            >
              <Ionicons
                name={category.icon}
                size={28}
                color={theme.colors.white}
              />
            </LinearGradient>
            
            <Typography
              variant="body2"
              weight="600"
              color={theme.colors.neutral[800]}
              style={styles.categoryName}
              numberOfLines={2}
            >
              {category.name}
            </Typography>
            
            <View style={[styles.colorIndicator, { backgroundColor: category.color }]} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  header: {
    padding: theme.spacing.layout.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  subtitle: {
    marginTop: theme.spacing.sm,
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: theme.spacing.layout.sm,
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
    ...theme.elevation.sm,
    shadowColor: theme.colors.neutral[900],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    shadowColor: theme.colors.neutral[900],
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  categoryName: {
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
    minHeight: 40,
  },
  colorIndicator: {
    width: 24,
    height: 4,
    borderRadius: 2,
  },
});
