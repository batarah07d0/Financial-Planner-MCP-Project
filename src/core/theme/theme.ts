import { colors } from './colors';
import { spacing } from './spacing';
import { typography } from './typography';

// Radius untuk komponen
const BORDER_RADIUS_BASE = 4;
const GOLDEN_RATIO = 1.618;

// Shadows untuk komponen
const createElevation = (elevation: number) => {
  return {
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: elevation,
    },
    shadowOpacity: 0.1 + (elevation / 20),
    shadowRadius: 1.5 * elevation,
    elevation: elevation,
  };
};

export const theme = {
  colors,
  spacing,
  typography,
  
  // Border radius
  borderRadius: {
    xs: BORDER_RADIUS_BASE / Math.sqrt(GOLDEN_RATIO), // ~3
    sm: BORDER_RADIUS_BASE, // 4
    md: BORDER_RADIUS_BASE * Math.sqrt(GOLDEN_RATIO), // ~5
    lg: BORDER_RADIUS_BASE * GOLDEN_RATIO, // ~6.5
    xl: BORDER_RADIUS_BASE * Math.pow(GOLDEN_RATIO, 1.5), // ~8.2
    xxl: BORDER_RADIUS_BASE * Math.pow(GOLDEN_RATIO, 2), // ~10.5
    round: 9999,
  },
  
  // Elevations (shadows)
  elevation: {
    none: createElevation(0),
    xs: createElevation(1),
    sm: createElevation(2),
    md: createElevation(4),
    lg: createElevation(8),
    xl: createElevation(16),
    xxl: createElevation(24),
  },
  
  // Opacity
  opacity: {
    none: 0,
    low: 0.2,
    medium: 0.5,
    high: 0.8,
    full: 1,
  },
  
  // Durations untuk animasi
  duration: {
    fast: 150,
    normal: 300,
    slow: 450,
    verySlow: 600,
  },
  
  // Timing functions untuk animasi
  timingFunction: {
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  },
};
