/**
 * Utility functions untuk handling waktu dan timezone
 * Memastikan konsistensi waktu di semua device dan emulator
 */

/**
 * Mendapatkan informasi waktu lokal yang akurat
 * @returns Object dengan informasi waktu lokal
 */
export const getLocalTimeInfo = () => {
  const now = new Date();
  
  // Pastikan menggunakan timezone lokal device
  const localHour = now.getHours();
  const localMinute = now.getMinutes();
  const localDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const localDate = now.getDate();
  const localMonth = now.getMonth();
  const localYear = now.getFullYear();
  
  // Buat key unik untuk tracking perubahan waktu
  const timeKey = `${localHour}:${Math.floor(localMinute / 30) * 30}`;
  const dateKey = `${localYear}-${localMonth}-${localDate}`;
  
  return {
    hour: localHour,
    minute: localMinute,
    day: localDay,
    date: localDate,
    month: localMonth,
    year: localYear,
    timeKey,
    dateKey,
    timestamp: now.getTime(),
    fullDate: now,
  };
};

/**
 * Menentukan periode waktu berdasarkan jam lokal
 * @param hour - Jam dalam format 24 jam
 * @returns Periode waktu
 */
export const getTimePeriod = (hour: number): 'morning' | 'afternoon' | 'evening' => {
  if (hour >= 5 && hour < 12) {
    return 'morning';
  } else if (hour >= 12 && hour < 18) {
    return 'afternoon';
  } else {
    return 'evening';
  }
};

/**
 * Membuat hash yang konsisten berdasarkan string
 * @param str - String untuk di-hash
 * @returns Number hash
 */
export const createConsistentHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

/**
 * Mendapatkan index message yang konsisten berdasarkan user dan waktu
 * @param userId - ID user
 * @param dateKey - Key tanggal
 * @param arrayLength - Panjang array message
 * @returns Index yang konsisten
 */
export const getConsistentMessageIndex = (
  userId: string | undefined,
  dateKey: string,
  arrayLength: number
): number => {
  if (!userId || arrayLength === 0) return 0;
  
  // Kombinasi user ID dan tanggal untuk konsistensi harian
  const combinedKey = `${userId}-${dateKey}`;
  const hash = createConsistentHash(combinedKey);
  
  return hash % arrayLength;
};

/**
 * Cek apakah waktu sudah berubah signifikan (30 menit)
 * @param lastUpdate - Timestamp update terakhir
 * @param currentTime - Timestamp saat ini
 * @returns Boolean apakah perlu update
 */
export const shouldUpdateGreeting = (
  lastUpdate: number,
  currentTime: number
): boolean => {
  const timeDiff = currentTime - lastUpdate;
  const thirtyMinutes = 30 * 60 * 1000; // 30 menit dalam milliseconds
  
  return timeDiff >= thirtyMinutes;
};

/**
 * Format waktu untuk debugging
 * @param timeInfo - Informasi waktu
 * @returns String format waktu
 */
export const formatTimeForDebug = (timeInfo: ReturnType<typeof getLocalTimeInfo>): string => {
  const { hour, minute, dateKey } = timeInfo;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} (${dateKey})`;
};

/**
 * Mendapatkan greeting type berdasarkan visit count harian dan waktu
 * @param dailyVisitCount - Jumlah kunjungan hari ini
 * @param hour - Jam saat ini
 * @returns Tipe greeting
 */
export const getGreetingType = (
  dailyVisitCount: number,
  hour: number
): 'morning' | 'afternoon' | 'evening' | 'returnVisit' => {
  // Untuk user yang sering berkunjung dalam sehari (lebih dari 5 kali)
  if (dailyVisitCount > 5) {
    return 'returnVisit';
  }

  return getTimePeriod(hour);
};

/**
 * Mendapatkan key untuk daily visit count storage
 * @param userId - ID user
 * @param dateKey - Key tanggal
 * @returns Storage key untuk daily visit count
 */
export const getDailyVisitCountKey = (userId: string, dateKey: string): string => {
  return `daily_visit_count_${userId}_${dateKey}`;
};

/**
 * Mendapatkan key untuk last visit date storage
 * @param userId - ID user
 * @returns Storage key untuk last visit date
 */
export const getLastVisitDateKey = (userId: string): string => {
  return `last_visit_date_${userId}`;
};
