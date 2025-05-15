/**
 * Validasi email
 * @param email - Email yang akan divalidasi
 * @returns Boolean yang menunjukkan apakah email valid
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  return emailRegex.test(email);
};

/**
 * Validasi password
 * @param password - Password yang akan divalidasi
 * @returns Object yang berisi hasil validasi
 */
export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password harus minimal 8 karakter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password harus mengandung minimal 1 huruf kapital');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password harus mengandung minimal 1 huruf kecil');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password harus mengandung minimal 1 angka');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password harus mengandung minimal 1 karakter khusus');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validasi nomor telepon Indonesia
 * @param phoneNumber - Nomor telepon yang akan divalidasi
 * @returns Boolean yang menunjukkan apakah nomor telepon valid
 */
export const isValidIndonesianPhoneNumber = (phoneNumber: string): boolean => {
  // Format: +62 atau 0 diikuti dengan 8-12 digit
  const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{7,10}$/;
  return phoneRegex.test(phoneNumber);
};

/**
 * Validasi jumlah uang (tidak negatif dan valid)
 * @param amount - Jumlah yang akan divalidasi
 * @returns Boolean yang menunjukkan apakah jumlah valid
 */
export const isValidAmount = (amount: number | string): boolean => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return !isNaN(numAmount) && numAmount >= 0;
};

/**
 * Validasi tanggal (tidak di masa lalu)
 * @param date - Tanggal yang akan divalidasi
 * @param allowPast - Apakah tanggal di masa lalu diperbolehkan
 * @returns Boolean yang menunjukkan apakah tanggal valid
 */
export const isValidDate = (date: Date, allowPast: boolean = true): boolean => {
  const now = new Date();
  
  // Pastikan tanggal valid
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return false;
  }
  
  // Jika tanggal di masa lalu tidak diperbolehkan
  if (!allowPast && date < now) {
    return false;
  }
  
  return true;
};
