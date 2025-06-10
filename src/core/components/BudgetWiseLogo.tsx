import React from 'react';
import { Image, StyleSheet } from 'react-native';

interface BudgetWiseLogoProps {
  size?: number;
  variant?: 'login' | 'app';
}

export const BudgetWiseLogo: React.FC<BudgetWiseLogoProps> = ({
  size = 96,
  variant = 'app'
}) => {
  // Pilih logo berdasarkan variant
  const logoSource = variant === 'login'
    ? require('../../../assets/BudgetLogoForLogin.png')
    : require('../../../assets/BudgetWiseLogo.png');

  return (
    <Image
      source={logoSource}
      style={[
        styles.logo,
        {
          width: size,
          height: size
        }
      ]}
      resizeMode="contain"
    />
  );
};

const styles = StyleSheet.create({
  logo: {
    // Styling dasar untuk logo
  },
});
