import React from 'react';
import { 
  View, 
  StyleSheet, 
  ViewStyle, 
  ViewProps,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { theme } from '../theme';

interface CardProps extends ViewProps {
  style?: ViewStyle;
  elevation?: keyof typeof theme.elevation;
  children: React.ReactNode;
}

interface TouchableCardProps extends TouchableOpacityProps {
  style?: ViewStyle;
  elevation?: keyof typeof theme.elevation;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  style,
  elevation = 'sm',
  children,
  ...rest
}) => {
  return (
    <View
      style={[
        styles.card,
        theme.elevation[elevation],
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
};

export const TouchableCard: React.FC<TouchableCardProps> = ({
  style,
  elevation = 'sm',
  children,
  ...rest
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        theme.elevation[elevation],
        style,
      ]}
      {...rest}
    >
      {children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginVertical: theme.spacing.sm,
  },
});
