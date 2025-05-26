import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import { Typography } from './Typography';
import { Button } from './Button';
import { theme } from '../theme';
import { useBiometrics } from '../hooks';
import { Ionicons } from '@expo/vector-icons';

interface BiometricAuthProps {
  visible: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  promptMessage?: string;
  fallbackLabel?: string;
  cancelLabel?: string;
}

export const BiometricAuth: React.FC<BiometricAuthProps> = ({
  visible,
  onSuccess,
  onCancel,
  promptMessage = 'Autentikasi untuk melanjutkan',
  fallbackLabel = 'Gunakan PIN',
  cancelLabel = 'Batal',
}) => {
  const [animatedValue] = useState(new Animated.Value(0));
  const { authenticate, isAvailable, isLoading, error } = useBiometrics();

  // Animasi untuk modal
  useEffect(() => {
    if (visible) {
      // Reset animasi
      animatedValue.setValue(0);

      // Mulai animasi
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      // Lakukan autentikasi otomatis
      handleAuthenticate();
    }
  }, [visible]);

  // Animasi untuk scale dan opacity
  const scale = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 1.1, 1],
  });

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // Fungsi untuk melakukan autentikasi
  const handleAuthenticate = async () => {
    if (!isAvailable) {
      onCancel();
      return;
    }

    const success = await authenticate({
      promptMessage,
      fallbackLabel,
      cancelLabel,
    });

    if (success) {
      onSuccess();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalContainer}>
        <Animated.View
          style={[
            styles.authContainer,
            {
              transform: [{ scale }],
              opacity,
            },
          ]}
        >
          <View style={styles.header}>
            <Typography variant="h5" align="center" color={theme.colors.white}>
              Autentikasi Biometrik
            </Typography>
          </View>

          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="finger-print-outline"
                size={64}
                color={theme.colors.primary[500]}
              />
            </View>

            <Typography variant="body1" align="center" style={styles.message}>
              {promptMessage}
            </Typography>

            {error && (
              <Typography
                variant="body2"
                align="center"
                color={theme.colors.danger[500]}
                style={styles.error}
              >
                {error}
              </Typography>
            )}
          </View>

          <View style={styles.footer}>
            <Button
              title="Coba Lagi"
              onPress={handleAuthenticate}
              loading={isLoading}
              style={styles.button}
            />
            <Button
              title="Batal"
              variant="outline"
              onPress={onCancel}
              disabled={isLoading}
              style={styles.button}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: theme.spacing.layout.md,
  },
  authContainer: {
    width: '100%',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.elevation.md,
  },
  header: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primary[500],
  },
  content: {
    padding: theme.spacing.layout.md,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  message: {
    marginBottom: theme.spacing.md,
  },
  error: {
    marginTop: theme.spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
  },
  button: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
});
