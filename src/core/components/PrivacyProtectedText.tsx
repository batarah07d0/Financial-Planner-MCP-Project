import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from './Typography';
import { theme } from '../theme';
import { useSecuritySettings } from '../hooks/useSecuritySettings';
import { useBiometrics } from '../hooks/useBiometrics';

interface PrivacyProtectedTextProps {
  children: React.ReactNode;
  type: 'balance' | 'transaction' | 'budget';
  fallbackText?: string;
  showToggle?: boolean;
  requireAuth?: boolean;
  style?: ViewStyle;
}

export const PrivacyProtectedText: React.FC<PrivacyProtectedTextProps> = ({
  children,
  type,
  fallbackText = '••••••',
  showToggle = true,
  requireAuth = false,
  style,
}) => {
  const [isHidden, setIsHidden] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const { shouldHideBalance, shouldHideTransactions, shouldHideBudgets } = useSecuritySettings();
  const { authenticate } = useBiometrics();

  useEffect(() => {
    const checkPrivacySettings = async () => {
      let shouldHide = false;
      
      switch (type) {
        case 'balance':
          shouldHide = await shouldHideBalance();
          break;
        case 'transaction':
          shouldHide = await shouldHideTransactions();
          break;
        case 'budget':
          shouldHide = await shouldHideBudgets();
          break;
      }
      
      setIsHidden(shouldHide);
    };

    checkPrivacySettings();
  }, [type, shouldHideBalance, shouldHideTransactions, shouldHideBudgets]);

  const handleToggleVisibility = async () => {
    if (isHidden && !isRevealed) {
      // Jika data disembunyikan dan belum diungkap, coba ungkap
      if (requireAuth) {
        const authSuccess = await authenticate({
          promptMessage: 'Autentikasi untuk melihat data sensitif',
          fallbackLabel: 'Gunakan PIN',
        });
        
        if (authSuccess) {
          setIsRevealed(true);
        }
      } else {
        setIsRevealed(true);
      }
    } else if (isRevealed) {
      // Jika sudah diungkap, sembunyikan kembali
      setIsRevealed(false);
    }
  };

  const shouldShowHidden = isHidden && !isRevealed;

  if (!isHidden) {
    // Jika tidak perlu disembunyikan, tampilkan langsung
    return <View style={style}>{children}</View>;
  }

  return (
    <View style={[styles.container, style]}>
      {shouldShowHidden ? (
        <View style={styles.hiddenContent}>
          <Typography variant="body1" color={theme.colors.neutral[500]}>
            {fallbackText}
          </Typography>
          {showToggle && (
            <TouchableOpacity 
              style={styles.toggleButton}
              onPress={handleToggleVisibility}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons 
                name="eye-outline" 
                size={16} 
                color={theme.colors.neutral[500]} 
              />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.revealedContent}>
          {children}
          {showToggle && (
            <TouchableOpacity 
              style={styles.toggleButton}
              onPress={handleToggleVisibility}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons 
                name="eye-off-outline" 
                size={16} 
                color={theme.colors.neutral[500]} 
              />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hiddenContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  revealedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  toggleButton: {
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.neutral[100],
  },
});
