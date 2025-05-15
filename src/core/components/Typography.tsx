import React from 'react';
import { Text, TextProps, StyleSheet, TextStyle } from 'react-native';
import { theme } from '../theme';

type FontWeight = TextStyle['fontWeight'];

interface TypographyProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body1' | 'body2' | 'caption';
  color?: string;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  weight?: FontWeight;
  children: React.ReactNode;
}

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body1',
  color,
  align,
  weight,
  style,
  children,
  ...rest
}) => {
  const getTypographyStyle = () => {
    switch (variant) {
      case 'h1':
        return theme.typography.heading.h1;
      case 'h2':
        return theme.typography.heading.h2;
      case 'h3':
        return theme.typography.heading.h3;
      case 'h4':
        return theme.typography.heading.h4;
      case 'h5':
        return theme.typography.heading.h5;
      case 'h6':
        return theme.typography.heading.h6;
      case 'body1':
        return theme.typography.body.medium;
      case 'body2':
        return theme.typography.body.small;
      case 'caption':
        return theme.typography.caption;
      default:
        return theme.typography.body.medium;
    }
  };

  return (
    <Text
      style={[
        getTypographyStyle(),
        color && { color },
        align && { textAlign: align },
        weight && { fontWeight: weight },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
};

// Komponen khusus untuk heading
export const Heading: React.FC<Omit<TypographyProps, 'variant'> & { level: 1 | 2 | 3 | 4 | 5 | 6 }> = ({
  level,
  ...rest
}) => {
  const variant = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  return <Typography variant={variant} {...rest} />;
};

// Komponen untuk body text
export const BodyText: React.FC<Omit<TypographyProps, 'variant'> & { size?: 'small' | 'medium' | 'large' }> = ({
  size = 'medium',
  ...rest
}) => {
  let variant: 'body1' | 'body2' | 'h4';

  switch (size) {
    case 'small':
      variant = 'body2';
      break;
    case 'large':
      variant = 'h4';
      break;
    default:
      variant = 'body1';
  }

  return <Typography variant={variant} {...rest} />;
};

// Komponen untuk caption
export const Caption: React.FC<Omit<TypographyProps, 'variant'>> = (props) => {
  return <Typography variant="caption" {...props} />;
};
