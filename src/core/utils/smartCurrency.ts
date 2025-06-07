/**
 * Smart Currency Formatter
 * Mengformat angka dengan singkatan yang sesuai untuk berbagai konteks
 */

export interface SmartCurrencyOptions {
  showSymbol?: boolean;
  context?: 'card' | 'detail' | 'full';
}

/**
 * Helper function untuk mendapatkan 3 digit signifikan
 * Contoh: 162.3 -> "162.3", 1.623 -> "1.623", 16.23 -> "16.23"
 */
const getThreeSignificantDigits = (value: number): string => {
  // Bulatkan ke 3 digit signifikan
  const factor = Math.pow(10, 2 - Math.floor(Math.log10(Math.abs(value))));
  const rounded = Math.round(value * factor) / factor;

  // Format berdasarkan besaran
  if (rounded >= 100) {
    // 100-999: tampilkan 1 desimal jika bukan integer
    return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(1);
  } else if (rounded >= 10) {
    // 10-99: tampilkan 2 desimal jika bukan integer atau 1 desimal
    const oneDecimal = Math.round(rounded * 10) / 10;
    return oneDecimal % 1 === 0 ? oneDecimal.toString() :
           rounded % 0.1 === 0 ? rounded.toFixed(1) : rounded.toFixed(2);
  } else {
    // 1-9: tampilkan hingga 3 desimal
    const threeDecimal = Math.round(rounded * 1000) / 1000;
    return threeDecimal % 1 === 0 ? threeDecimal.toString() :
           threeDecimal % 0.1 === 0 ? threeDecimal.toFixed(1) :
           threeDecimal % 0.01 === 0 ? threeDecimal.toFixed(2) : threeDecimal.toFixed(3);
  }
};

/**
 * Format currency dengan singkatan cerdas
 */
export const formatSmartCurrency = (
  amount: number,
  options: SmartCurrencyOptions = {}
): string => {
  const {
    showSymbol = true,
    context = 'card'
  } = options;

  const symbol = showSymbol ? 'Rp ' : '';
  
  // Untuk context full, selalu tampilkan angka lengkap
  if (context === 'full') {
    return `${symbol}${amount.toLocaleString('id-ID')}`;
  }

  // Untuk angka negatif
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  // Logika singkatan berdasarkan besaran angka dengan presisi 3 digit
  if (absAmount >= 1_000_000_000) {
    // Miliaran - ambil 3 digit signifikan
    const billions = absAmount / 1_000_000_000;
    const formatted = getThreeSignificantDigits(billions);
    return `${isNegative ? '-' : ''}${symbol}${formatted}M`;
  } else if (absAmount >= 1_000_000) {
    // Jutaan - ambil 3 digit signifikan
    const millions = absAmount / 1_000_000;
    const formatted = getThreeSignificantDigits(millions);
    return `${isNegative ? '-' : ''}${symbol}${formatted}jt`;
  } else if (absAmount >= 1_000) {
    // Ribuan - ambil 3 digit signifikan
    const thousands = absAmount / 1_000;
    const formatted = getThreeSignificantDigits(thousands);
    return `${isNegative ? '-' : ''}${symbol}${formatted}k`;
  } else {
    // Kurang dari 1000, tampilkan angka penuh
    return `${isNegative ? '-' : ''}${symbol}${absAmount.toLocaleString('id-ID')}`;
  }
};

/**
 * Format currency untuk card (singkat)
 */
export const formatCardCurrency = (amount: number): string => {
  return formatSmartCurrency(amount, { context: 'card' });
};

/**
 * Format currency untuk detail (lebih lengkap)
 */
export const formatDetailCurrency = (amount: number): string => {
  return formatSmartCurrency(amount, { context: 'detail' });
};

/**
 * Format currency lengkap (tanpa singkatan)
 */
export const formatFullCurrency = (amount: number): string => {
  return formatSmartCurrency(amount, { context: 'full' });
};

/**
 * Get explanation text untuk dialog
 */
export const getCurrencyExplanation = (amount: number): string => {
  const formatted = formatFullCurrency(amount);
  const smart = formatCardCurrency(amount);
  
  if (formatted === smart) {
    return formatted;
  }
  
  return `${smart}\n(${formatted})`;
};

/**
 * Check if amount needs explanation (too long for card display)
 */
export const needsExplanation = (amount: number): boolean => {
  const full = formatFullCurrency(amount);
  const smart = formatCardCurrency(amount);
  return full !== smart;
};
