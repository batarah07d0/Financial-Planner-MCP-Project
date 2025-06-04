import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import { theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helper,
  containerStyle,
  inputStyle,
  labelStyle,
  leftIcon,
  rightIcon,
  onRightIconPress,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  // Menentukan apakah input adalah password
  const isPasswordInput = rest.secureTextEntry !== undefined;

  const handleFocus = (e: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
    setIsFocused(true);
    rest.onFocus?.(e);
  };

  const handleBlur = (e: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
    setIsFocused(false);
    rest.onBlur?.(e);
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  // Jika input adalah password, override secureTextEntry berdasarkan state passwordVisible
  const inputProps = {
    ...rest,
    secureTextEntry: isPasswordInput ? !passwordVisible : rest.secureTextEntry,
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, labelStyle]}>
          {label}
        </Text>
      )}

      <View style={[
        styles.inputContainer,
        isFocused && styles.focused,
        error ? styles.error : null,
      ]}>
        {leftIcon && (
          <View style={styles.leftIcon}>
            {leftIcon}
          </View>
        )}

        <TextInput
          style={[
            styles.input,
            leftIcon ? styles.inputWithLeftIcon : null,
            (rightIcon || isPasswordInput) ? styles.inputWithRightIcon : null,
            inputStyle,
          ]}
          placeholderTextColor={theme.colors.neutral[400]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...inputProps}
        />

        {isPasswordInput && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={togglePasswordVisibility}
            activeOpacity={0.7}
          >
            <Ionicons
              name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={theme.colors.neutral[500]}
            />
          </TouchableOpacity>
        )}

        {rightIcon && !isPasswordInput && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>

      {(error || helper) && (
        <Text style={[
          styles.helper,
          error ? styles.errorText : null,
        ]}>
          {error || helper}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    ...theme.typography.body.small,
    color: theme.colors.neutral[700],
    marginBottom: theme.spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.neutral[300],
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.white,
  },
  input: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    ...theme.typography.body.medium,
    color: theme.colors.neutral[900],
  },
  inputWithLeftIcon: {
    paddingLeft: theme.spacing.xs as number,
  },
  inputWithRightIcon: {
    paddingRight: theme.spacing.xs as number,
  },
  leftIcon: {
    paddingLeft: theme.spacing.md,
    paddingRight: theme.spacing.md,
  },
  rightIcon: {
    paddingRight: theme.spacing.md,
    paddingLeft: theme.spacing.md,
  },
  focused: {
    borderColor: theme.colors.primary[500],
    borderWidth: 2,
  },
  error: {
    borderColor: theme.colors.danger[500],
  },
  helper: {
    ...theme.typography.caption,
    color: theme.colors.neutral[600],
    marginTop: theme.spacing.xs,
  },
  errorText: {
    color: theme.colors.danger[500],
  },
});
