import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from './Typography';
import { Button } from './Button';
import { theme } from '../theme';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: string;
  iconSize?: number;
  iconColor?: string;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon = 'alert-circle-outline',
  iconSize = 64,
  iconColor = theme.colors.neutral[400],
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Ionicons
        name={icon as any}
        size={iconSize}
        color={iconColor}
      />
      <Typography
        variant="h5"
        align="center"
        style={styles.title}
      >
        {title}
      </Typography>
      <Typography
        variant="body1"
        color={theme.colors.neutral[600]}
        align="center"
        style={styles.description}
      >
        {description}
      </Typography>
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          variant="primary"
          onPress={onAction}
          style={styles.button}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.layout.lg,
  },
  title: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  description: {
    marginBottom: theme.spacing.lg,
  },
  button: {
    minWidth: 150,
  },
});
