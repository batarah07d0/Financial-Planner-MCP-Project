import { create } from 'zustand';
import { Transaction } from '../supabase/types';
import { getTransactions, createTransaction, updateTransaction, deleteTransaction } from '../supabase';

interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchTransactions: (userId: string, options?: any) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  isLoading: false,
  error: null,
  
  fetchTransactions: async (userId, options) => {
    try {
      set({ isLoading: true, error: null });
      
      const transactions = await getTransactions(userId, options);
      
      set({ 
        transactions,
        isLoading: false,
      });
    } catch (error: any) {
      set({ 
        error: error.message || 'Gagal memuat transaksi. Silakan coba lagi.',
        isLoading: false,
      });
    }
  },
  
  addTransaction: async (transaction) => {
    try {
      set({ isLoading: true, error: null });
      
      const newTransaction = await createTransaction(transaction);
      
      set(state => ({ 
        transactions: [newTransaction, ...state.transactions],
        isLoading: false,
      }));
    } catch (error: any) {
      set({ 
        error: error.message || 'Gagal menambahkan transaksi. Silakan coba lagi.',
        isLoading: false,
      });
    }
  },
  
  updateTransaction: async (id, updates) => {
    try {
      set({ isLoading: true, error: null });
      
      const updatedTransaction = await updateTransaction(id, updates);
      
      set(state => ({ 
        transactions: state.transactions.map(transaction => 
          transaction.id === id ? updatedTransaction : transaction
        ),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ 
        error: error.message || 'Gagal memperbarui transaksi. Silakan coba lagi.',
        isLoading: false,
      });
    }
  },
  
  deleteTransaction: async (id) => {
    try {
      set({ isLoading: true, error: null });
      
      await deleteTransaction(id);
      
      set(state => ({ 
        transactions: state.transactions.filter(transaction => transaction.id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ 
        error: error.message || 'Gagal menghapus transaksi. Silakan coba lagi.',
        isLoading: false,
      });
    }
  },
  
  clearError: () => {
    set({ error: null });
  },
}));
