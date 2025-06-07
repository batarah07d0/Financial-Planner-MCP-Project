import React from 'react';
import { Switch as RNSwitch, SwitchProps as RNSwitchProps } from 'react-native';
import { theme } from '../theme';

interface SwitchProps extends RNSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const Switch: React.FC<SwitchProps> = ({
  value,
  onValueChange,
  disabled = false,
  size = 'medium',
  ...props
}) => {
  const getTrackColor = () => {
    if (disabled) {
      return {
        false: theme.colors.neutral[200],
        true: theme.colors.neutral[300],
      };
    }
    
    return {
      false: theme.colors.neutral[300],
      true: theme.colors.primary[500],
    };
  };

  const getThumbColor = () => {
    if (disabled) {
      return theme.colors.neutral[400];
    }
    
    return value ? theme.colors.white : theme.colors.neutral[100];
  };

  const getTransform = () => {
    switch (size) {
      case 'small':
        return [{ scaleX: 0.8 }, { scaleY: 0.8 }];
      case 'large':
        return [{ scaleX: 1.2 }, { scaleY: 1.2 }];
      default:
        return [{ scaleX: 1 }, { scaleY: 1 }];
    }
  };

  return (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={getTrackColor()}
      thumbColor={getThumbColor()}
      ios_backgroundColor={theme.colors.neutral[300]}
      style={{
        transform: getTransform(),
      }}
      {...props}
    />
  );
};
