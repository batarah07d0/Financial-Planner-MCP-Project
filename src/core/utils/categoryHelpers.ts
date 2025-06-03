/**
 * Utility functions untuk kategori budget dan transaksi
 * Menyediakan mapping ikon dan warna yang konsisten
 */

// Mapping ikon kategori yang komprehensif
export const CATEGORY_ICON_MAP: { [key: string]: string } = {
  // Makanan & Minuman
  'makanan': 'restaurant-outline',
  'makanan & minuman': 'restaurant-outline',
  'makan': 'restaurant-outline',
  'food': 'restaurant-outline',
  'restoran': 'restaurant-outline',
  'cafe': 'cafe-outline',
  'minuman': 'wine-outline',
  
  // Transportasi
  'transportasi': 'car-outline',
  'transport': 'car-outline',
  'kendaraan': 'car-outline',
  'bensin': 'car-outline',
  'fuel': 'car-outline',
  'parkir': 'car-outline',
  'ojek': 'bicycle-outline',
  'taxi': 'car-outline',
  'bus': 'bus-outline',
  'kereta': 'train-outline',
  'pesawat': 'airplane-outline',
  
  // Belanja
  'belanja': 'bag-outline',
  'shopping': 'bag-outline',
  'supermarket': 'storefront-outline',
  'pasar': 'storefront-outline',
  'groceries': 'basket-outline',
  
  // Hiburan
  'hiburan': 'game-controller-outline',
  'entertainment': 'game-controller-outline',
  'film': 'film-outline',
  'bioskop': 'film-outline',
  'musik': 'musical-notes-outline',
  'konser': 'musical-notes-outline',
  'game': 'game-controller-outline',
  'rekreasi': 'happy-outline',
  
  // Tagihan
  'tagihan': 'receipt-outline',
  'bill': 'receipt-outline',
  'listrik': 'flash-outline',
  'air': 'water-outline',
  'internet': 'wifi-outline',
  'telepon': 'call-outline',
  'tv': 'tv-outline',
  'streaming': 'play-outline',
  
  // Kesehatan
  'kesehatan': 'medical-outline',
  'health': 'medical-outline',
  'obat': 'medical-outline',
  'dokter': 'person-outline',
  'rumah sakit': 'medical-outline',
  'apotek': 'medical-outline',
  'vitamin': 'fitness-outline',
  
  // Pendidikan
  'pendidikan': 'school-outline',
  'education': 'school-outline',
  'buku': 'book-outline',
  'kursus': 'library-outline',
  'sekolah': 'school-outline',
  'universitas': 'school-outline',
  
  // Fashion & Kecantikan
  'pakaian': 'shirt-outline',
  'fashion': 'shirt-outline',
  'sepatu': 'footsteps-outline',
  'tas': 'bag-outline',
  'kecantikan': 'flower-outline',
  'beauty': 'flower-outline',
  'salon': 'cut-outline',
  'spa': 'flower-outline',
  
  // Olahraga & Fitness
  'olahraga': 'fitness-outline',
  'sport': 'fitness-outline',
  'gym': 'barbell-outline',
  'fitness': 'fitness-outline',
  'yoga': 'body-outline',
  
  // Rumah & Furniture
  'rumah': 'home-outline',
  'home': 'home-outline',
  'furniture': 'bed-outline',
  'dekorasi': 'color-palette-outline',
  'renovasi': 'construct-outline',
  'sewa': 'home-outline',
  
  // Teknologi & Elektronik
  'elektronik': 'phone-portrait-outline',
  'gadget': 'phone-portrait-outline',
  'teknologi': 'laptop-outline',
  'komputer': 'laptop-outline',
  'handphone': 'phone-portrait-outline',
  'laptop': 'laptop-outline',
  
  // Travel & Liburan
  'travel': 'airplane-outline',
  'liburan': 'airplane-outline',
  'hotel': 'bed-outline',
  'wisata': 'camera-outline',
  'vacation': 'airplane-outline',
  
  // Sosial & Gift
  'gift': 'gift-outline',
  'hadiah': 'gift-outline',
  'donasi': 'heart-outline',
  'charity': 'heart-outline',
  'sosial': 'people-outline',
  
  // Keuangan
  'investasi': 'trending-up-outline',
  'investment': 'trending-up-outline',
  'tabungan': 'wallet-outline',
  'saving': 'wallet-outline',
  'asuransi': 'shield-outline',
  'pajak': 'document-text-outline',
  
  // Lainnya
  'lainnya': 'ellipsis-horizontal-outline',
  'other': 'ellipsis-horizontal-outline',
  'miscellaneous': 'ellipsis-horizontal-outline',
};

// Mapping warna kategori yang harmonis
export const CATEGORY_COLOR_MAP: { [key: string]: string } = {
  'makanan': '#FF6B6B',
  'makanan & minuman': '#FF6B6B',
  'transportasi': '#4ECDC4',
  'belanja': '#FFD166',
  'hiburan': '#F72585',
  'tagihan': '#3A86FF',
  'kesehatan': '#06D6A0',
  'pendidikan': '#118AB2',
  'pakaian': '#9B59B6',
  'olahraga': '#E67E22',
  'rumah': '#2ECC71',
  'elektronik': '#34495E',
  'travel': '#1ABC9C',
  'gift': '#E91E63',
  'investasi': '#27AE60',
  'lainnya': '#8A8A8A',
};

/**
 * Mendapatkan ikon kategori berdasarkan nama
 * @param categoryName - Nama kategori
 * @param existingIcon - Ikon yang sudah ada (opsional)
 * @returns Nama ikon Ionicons
 */
export const getCategoryIcon = (categoryName: string, existingIcon?: string): string => {
  // Jika sudah ada ikon, gunakan ikon tersebut
  if (existingIcon && existingIcon.trim() !== '') {
    return existingIcon;
  }
  
  const normalizedName = categoryName.toLowerCase().trim();
  
  // Cari exact match terlebih dahulu
  if (CATEGORY_ICON_MAP[normalizedName]) {
    return CATEGORY_ICON_MAP[normalizedName];
  }
  
  // Cari partial match
  for (const [key, icon] of Object.entries(CATEGORY_ICON_MAP)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return icon;
    }
  }
  
  // Default fallback
  return 'wallet-outline';
};

/**
 * Mendapatkan warna kategori berdasarkan nama
 * @param categoryName - Nama kategori
 * @param existingColor - Warna yang sudah ada (opsional)
 * @returns Kode warna hex
 */
export const getCategoryColor = (categoryName: string, existingColor?: string): string => {
  // Jika sudah ada warna, gunakan warna tersebut
  if (existingColor && existingColor.trim() !== '') {
    return existingColor;
  }
  
  const normalizedName = categoryName.toLowerCase().trim();
  
  // Cari exact match terlebih dahulu
  if (CATEGORY_COLOR_MAP[normalizedName]) {
    return CATEGORY_COLOR_MAP[normalizedName];
  }
  
  // Cari partial match
  for (const [key, color] of Object.entries(CATEGORY_COLOR_MAP)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return color;
    }
  }
  
  // Default fallback
  return '#6B7280';
};

/**
 * Mendapatkan data kategori yang lengkap (ikon + warna)
 * @param categoryName - Nama kategori
 * @param existingIcon - Ikon yang sudah ada (opsional)
 * @param existingColor - Warna yang sudah ada (opsional)
 * @returns Object dengan ikon dan warna
 */
export const getCategoryData = (
  categoryName: string, 
  existingIcon?: string, 
  existingColor?: string
) => {
  return {
    icon: getCategoryIcon(categoryName, existingIcon),
    color: getCategoryColor(categoryName, existingColor),
  };
};

/**
 * Validasi apakah ikon adalah ikon Ionicons yang valid
 * @param iconName - Nama ikon
 * @returns Boolean
 */
export const isValidIoniconName = (iconName: string): boolean => {
  // Daftar ikon Ionicons yang umum digunakan
  const validIcons = [
    'wallet-outline', 'restaurant-outline', 'car-outline', 'bag-outline',
    'game-controller-outline', 'receipt-outline', 'medical-outline', 
    'school-outline', 'shirt-outline', 'fitness-outline', 'home-outline',
    'phone-portrait-outline', 'airplane-outline', 'gift-outline',
    'trending-up-outline', 'ellipsis-horizontal-outline'
  ];
  
  return validIcons.includes(iconName) || iconName.endsWith('-outline');
};
