/**
 * Format angka menjadi format mata uang Rupiah
 * @param amount - Jumlah yang akan diformat
 * @param options - Opsi formatting
 * @returns String dalam format mata uang Rupiah
 */
export const formatCurrency = (
  amount: number,
  options: {
    showSymbol?: boolean;
    decimalPlaces?: number;
  } = {}
): string => {
  const { showSymbol = true, decimalPlaces = 0 } = options;
  
  const formatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });
  
  let formatted = formatter.format(amount);
  
  // Jika tidak menampilkan simbol, hapus 'Rp'
  if (!showSymbol) {
    formatted = formatted.replace(/^Rp\s*/, '');
  }
  
  return formatted;
};

/**
 * Format tanggal ke format Indonesia
 * @param date - Tanggal yang akan diformat
 * @param options - Opsi formatting
 * @returns String tanggal dalam format Indonesia
 */
export const formatDate = (
  date: Date | string | number,
  options: {
    format?: 'short' | 'medium' | 'long' | 'full';
    includeTime?: boolean;
  } = {}
): string => {
  const { format = 'medium', includeTime = false } = options;
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  let dateOptions: Intl.DateTimeFormatOptions = {};
  
  switch (format) {
    case 'short':
      dateOptions = { day: 'numeric', month: 'numeric', year: 'numeric' };
      break;
    case 'medium':
      dateOptions = { day: 'numeric', month: 'long', year: 'numeric' };
      break;
    case 'long':
      dateOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
      break;
    case 'full':
      dateOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
      break;
  }
  
  if (includeTime) {
    dateOptions = {
      ...dateOptions,
      hour: '2-digit',
      minute: '2-digit',
    };
  }
  
  return new Intl.DateTimeFormat('id-ID', dateOptions).format(dateObj);
};

/**
 * Format persentase
 * @param value - Nilai yang akan diformat (0-1)
 * @param options - Opsi formatting
 * @returns String dalam format persentase
 */
export const formatPercentage = (
  value: number,
  options: {
    decimalPlaces?: number;
    showSymbol?: boolean;
  } = {}
): string => {
  const { decimalPlaces = 1, showSymbol = true } = options;
  
  // Pastikan nilai antara 0-1
  const normalizedValue = value > 1 ? value / 100 : value;
  
  // Format ke persentase
  const percentage = (normalizedValue * 100).toFixed(decimalPlaces);
  
  return showSymbol ? `${percentage}%` : percentage;
};

/**
 * Memformat angka dengan pemisah ribuan
 * @param number - Angka yang akan diformat
 * @param options - Opsi formatting
 * @returns String angka dengan pemisah ribuan
 */
export const formatNumber = (
  number: number,
  options: {
    decimalPlaces?: number;
  } = {}
): string => {
  const { decimalPlaces = 0 } = options;
  
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(number);
};
