import { Platform, TextStyle } from 'react-native';

// Sistem tipografi dengan skala yang konsisten
const FONT_FAMILY_BASE = Platform.OS === 'ios' ? 'System' : 'Roboto';
const FONT_FAMILY_BOLD = Platform.OS === 'ios' ? 'System' : 'Roboto';

// Skala font menggunakan golden ratio (1.618)
const FONT_SIZE_BASE = 16;
const GOLDEN_RATIO = 1.618;

// Tipe untuk fontWeight yang valid
type FontWeight = TextStyle['fontWeight'];

export const typography = {
  // Font family
  fontFamily: {
    base: FONT_FAMILY_BASE,
    bold: FONT_FAMILY_BOLD,
  },

  // Font weight
  fontWeight: {
    thin: '100' as FontWeight,
    extraLight: '200' as FontWeight,
    light: '300' as FontWeight,
    regular: '400' as FontWeight,
    medium: '500' as FontWeight,
    semiBold: '600' as FontWeight,
    bold: '700' as FontWeight,
    extraBold: '800' as FontWeight,
    black: '900' as FontWeight,
  },

  // Font size
  fontSize: {
    xs: FONT_SIZE_BASE / Math.pow(GOLDEN_RATIO, 1), // ~10
    sm: FONT_SIZE_BASE / Math.sqrt(GOLDEN_RATIO), // ~12.5
    md: FONT_SIZE_BASE, // 16
    lg: FONT_SIZE_BASE * Math.sqrt(GOLDEN_RATIO), // ~20.5
    xl: FONT_SIZE_BASE * GOLDEN_RATIO, // ~26
    xxl: FONT_SIZE_BASE * Math.pow(GOLDEN_RATIO, 1.5), // ~33
    xxxl: FONT_SIZE_BASE * Math.pow(GOLDEN_RATIO, 2), // ~42
  },

  // Line height
  lineHeight: {
    xs: FONT_SIZE_BASE / Math.pow(GOLDEN_RATIO, 1) * 1.5, // ~15
    sm: FONT_SIZE_BASE / Math.sqrt(GOLDEN_RATIO) * 1.5, // ~19
    md: FONT_SIZE_BASE * 1.5, // 24
    lg: FONT_SIZE_BASE * Math.sqrt(GOLDEN_RATIO) * 1.5, // ~31
    xl: FONT_SIZE_BASE * GOLDEN_RATIO * 1.5, // ~39
    xxl: FONT_SIZE_BASE * Math.pow(GOLDEN_RATIO, 1.5) * 1.5, // ~49.5
    xxxl: FONT_SIZE_BASE * Math.pow(GOLDEN_RATIO, 2) * 1.5, // ~63
  },

  // Letter spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
    widest: 2,
  },

  // Styles untuk heading
  heading: {
    h1: {
      fontFamily: FONT_FAMILY_BOLD,
      fontSize: FONT_SIZE_BASE * Math.pow(GOLDEN_RATIO, 2), // ~42
      fontWeight: '700' as FontWeight,
      lineHeight: FONT_SIZE_BASE * Math.pow(GOLDEN_RATIO, 2) * 1.2, // ~50
      letterSpacing: -0.5,
    },
    h2: {
      fontFamily: FONT_FAMILY_BOLD,
      fontSize: FONT_SIZE_BASE * Math.pow(GOLDEN_RATIO, 1.5), // ~33
      fontWeight: '700' as FontWeight,
      lineHeight: FONT_SIZE_BASE * Math.pow(GOLDEN_RATIO, 1.5) * 1.2, // ~40
      letterSpacing: -0.5,
    },
    h3: {
      fontFamily: FONT_FAMILY_BOLD,
      fontSize: FONT_SIZE_BASE * GOLDEN_RATIO, // ~26
      fontWeight: '600' as FontWeight,
      lineHeight: FONT_SIZE_BASE * GOLDEN_RATIO * 1.2, // ~31
      letterSpacing: -0.3,
    },
    h4: {
      fontFamily: FONT_FAMILY_BOLD,
      fontSize: FONT_SIZE_BASE * Math.sqrt(GOLDEN_RATIO), // ~20.5
      fontWeight: '600' as FontWeight,
      lineHeight: FONT_SIZE_BASE * Math.sqrt(GOLDEN_RATIO) * 1.2, // ~25
      letterSpacing: -0.2,
    },
    h5: {
      fontFamily: FONT_FAMILY_BOLD,
      fontSize: FONT_SIZE_BASE, // 16
      fontWeight: '600' as FontWeight,
      lineHeight: FONT_SIZE_BASE * 1.2, // ~19
      letterSpacing: -0.1,
    },
    h6: {
      fontFamily: FONT_FAMILY_BOLD,
      fontSize: FONT_SIZE_BASE / Math.sqrt(GOLDEN_RATIO), // ~12.5
      fontWeight: '600' as FontWeight,
      lineHeight: FONT_SIZE_BASE / Math.sqrt(GOLDEN_RATIO) * 1.2, // ~15
      letterSpacing: 0,
    },
  },

  // Styles untuk body text
  body: {
    large: {
      fontFamily: FONT_FAMILY_BASE,
      fontSize: FONT_SIZE_BASE * Math.sqrt(GOLDEN_RATIO), // ~20.5
      fontWeight: '400' as FontWeight,
      lineHeight: FONT_SIZE_BASE * Math.sqrt(GOLDEN_RATIO) * 1.5, // ~31
      letterSpacing: 0.15,
    },
    medium: {
      fontFamily: FONT_FAMILY_BASE,
      fontSize: FONT_SIZE_BASE, // 16
      fontWeight: '400' as FontWeight,
      lineHeight: FONT_SIZE_BASE * 1.5, // 24
      letterSpacing: 0.15,
    },
    small: {
      fontFamily: FONT_FAMILY_BASE,
      fontSize: FONT_SIZE_BASE / Math.sqrt(GOLDEN_RATIO), // ~12.5
      fontWeight: '400' as FontWeight,
      lineHeight: FONT_SIZE_BASE / Math.sqrt(GOLDEN_RATIO) * 1.5, // ~19
      letterSpacing: 0.25,
    },
  },

  // Styles untuk caption
  caption: {
    fontFamily: FONT_FAMILY_BASE,
    fontSize: FONT_SIZE_BASE / Math.pow(GOLDEN_RATIO, 1), // ~10
    fontWeight: '400' as FontWeight,
    lineHeight: FONT_SIZE_BASE / Math.pow(GOLDEN_RATIO, 1) * 1.5, // ~15
    letterSpacing: 0.4,
  },

  // Styles untuk button
  button: {
    large: {
      fontFamily: FONT_FAMILY_BOLD,
      fontSize: FONT_SIZE_BASE * Math.sqrt(GOLDEN_RATIO), // ~20.5
      fontWeight: '600' as FontWeight,
      lineHeight: FONT_SIZE_BASE * Math.sqrt(GOLDEN_RATIO) * 1.2, // ~25
      letterSpacing: 0.5,
      textTransform: 'uppercase' as const,
    },
    medium: {
      fontFamily: FONT_FAMILY_BOLD,
      fontSize: FONT_SIZE_BASE, // 16
      fontWeight: '600' as FontWeight,
      lineHeight: FONT_SIZE_BASE * 1.2, // ~19
      letterSpacing: 0.5,
      textTransform: 'uppercase' as const,
    },
    small: {
      fontFamily: FONT_FAMILY_BOLD,
      fontSize: FONT_SIZE_BASE / Math.sqrt(GOLDEN_RATIO), // ~12.5
      fontWeight: '600' as FontWeight,
      lineHeight: FONT_SIZE_BASE / Math.sqrt(GOLDEN_RATIO) * 1.2, // ~15
      letterSpacing: 0.5,
      textTransform: 'uppercase' as const,
    },
  },
};
