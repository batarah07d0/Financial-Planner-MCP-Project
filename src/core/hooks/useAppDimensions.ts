import { useWindowDimensions } from 'react-native';
import { useMemo, useCallback } from 'react';

// Breakpoints untuk responsive design
const BREAKPOINTS = {
  xs: 0,
  sm: 375,
  md: 414,
  lg: 768,
  xl: 1024,
};

export const useAppDimensions = () => {
  const { width, height } = useWindowDimensions();
  
  // Menentukan breakpoint saat ini
  const breakpoint = useMemo(() => {
    if (width >= BREAKPOINTS.xl) return 'xl';
    if (width >= BREAKPOINTS.lg) return 'lg';
    if (width >= BREAKPOINTS.md) return 'md';
    if (width >= BREAKPOINTS.sm) return 'sm';
    return 'xs';
  }, [width]);
  
  // Menentukan apakah perangkat dalam mode landscape
  const isLandscape = useMemo(() => {
    return width > height;
  }, [width, height]);
  
  // Menghitung ukuran font yang responsif
  const responsiveFontSize = useCallback((size: number) => {
    const baseWidth = 375; // Base width (iPhone X)
    const scaleFactor = Math.min(width / baseWidth, 1.2); // Limit scaling
    return size * scaleFactor;
  }, [width]);

  // Menghitung ukuran spacing yang responsif
  const responsiveSpacing = useCallback((size: number) => {
    const baseWidth = 375; // Base width (iPhone X)
    const scaleFactor = Math.min(width / baseWidth, 1.3); // Limit scaling
    return size * scaleFactor;
  }, [width]);
  
  return {
    width,
    height,
    breakpoint,
    isLandscape,
    responsiveFontSize,
    responsiveSpacing,
    isSmallDevice: width < BREAKPOINTS.sm,
    isMediumDevice: width >= BREAKPOINTS.sm && width < BREAKPOINTS.lg,
    isLargeDevice: width >= BREAKPOINTS.lg,
  };
};
