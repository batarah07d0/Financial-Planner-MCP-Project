// Tipe untuk user
export interface User {
  id: string;
  email: string;
  name?: string;
  created_at: string;
  updated_at: string;
}

// Tipe untuk transaksi
export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'income' | 'expense';
  category_id: string;
  description?: string;
  date: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  created_at: string;
  updated_at: string;
}

// Tipe untuk kategori
export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  type: 'income' | 'expense';
  user_id?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// Tipe untuk anggaran
export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

// Tipe untuk tujuan keuangan
export interface FinancialGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  category_id?: string;
  created_at: string;
  updated_at: string;
}

// Tipe untuk pengingat
export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  date: string;
  is_recurring: boolean;
  recurrence_pattern?: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

// Tipe untuk laporan
export interface Report {
  id: string;
  user_id: string;
  type: 'income' | 'expense' | 'budget' | 'goal';
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date: string;
  data: any;
  created_at: string;
  updated_at: string;
}

// Tipe untuk pengaturan
export interface Settings {
  id: string;
  user_id: string;
  currency: string;
  notification_enabled: boolean;
  created_at: string;
  updated_at: string;
}
