// Sistem spacing matematika menggunakan formula matematika (bukan nilai arbitrer)
// Menggunakan golden ratio (1:1.618) untuk spacing

const BASE_SPACING = 4;
const GOLDEN_RATIO = 1.618;

export const spacing = {
  // Spacing dasar
  xxs: BASE_SPACING / 2, // 2
  xs: BASE_SPACING, // 4
  sm: BASE_SPACING * Math.sqrt(GOLDEN_RATIO), // ~5
  md: BASE_SPACING * GOLDEN_RATIO, // ~6.5
  lg: BASE_SPACING * GOLDEN_RATIO * Math.sqrt(GOLDEN_RATIO), // ~8.2
  xl: BASE_SPACING * Math.pow(GOLDEN_RATIO, 2), // ~10.5
  xxl: BASE_SPACING * Math.pow(GOLDEN_RATIO, 2) * Math.sqrt(GOLDEN_RATIO), // ~13.4
  
  // Spacing untuk layout
  layout: {
    xs: BASE_SPACING * Math.pow(GOLDEN_RATIO, 3), // ~17
    sm: BASE_SPACING * Math.pow(GOLDEN_RATIO, 3) * Math.sqrt(GOLDEN_RATIO), // ~22
    md: BASE_SPACING * Math.pow(GOLDEN_RATIO, 4), // ~28
    lg: BASE_SPACING * Math.pow(GOLDEN_RATIO, 4) * Math.sqrt(GOLDEN_RATIO), // ~35
    xl: BASE_SPACING * Math.pow(GOLDEN_RATIO, 5), // ~45
    xxl: BASE_SPACING * Math.pow(GOLDEN_RATIO, 5) * Math.sqrt(GOLDEN_RATIO), // ~57
  },
  
  // Fungsi untuk mendapatkan spacing kustom berdasarkan faktor
  getCustomSpacing: (factor: number) => BASE_SPACING * factor,
};
