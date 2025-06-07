import { create } from 'zustand';
import { Budget, PaginationParams } from '../supabase/types';
import { getBudgets, createBudget, updateBudget, deleteBudget } from '../supabase';

interface BudgetState {
  budgets: Budget[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchBudgets: (userId: string, options?: PaginationParams) => Promise<void>;
  addBudget: (budget: Omit<Budget, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateBudget: (id: string, updates: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  clearBudgets: () => void;
  clearError: () => void;
}

export const useBudgetStore = create<BudgetState>((set) => ({
  budgets: [],
  isLoading: false,
  error: null,
  
  fetchBudgets: async (userId, options) => {
    try {
      set({ isLoading: true, error: null });

      const budgets = await getBudgets(userId, options);

      set({
        budgets,
        isLoading: false,
        error: null,
      });
    } catch (error: unknown) {
      const errorObj = error as Error;
      set({
        error: errorObj.message || 'Gagal memuat anggaran. Silakan coba lagi.',
        isLoading: false,
        budgets: [], // Clear budgets on error
      });
    }
  },

  addBudget: async (budget) => {
    try {
      set({ isLoading: true, error: null });

      const newBudget = await createBudget(budget);

      set(state => ({
        budgets: [newBudget, ...state.budgets],
        isLoading: false,
      }));
    } catch (error: unknown) {
      const errorObj = error as Error;
      set({
        error: errorObj.message || 'Gagal menambahkan anggaran. Silakan coba lagi.',
        isLoading: false,
      });
    }
  },

  updateBudget: async (id, updates) => {
    try {
      set({ isLoading: true, error: null });

      const updatedBudget = await updateBudget(id, updates);

      set(state => ({
        budgets: state.budgets.map(budget =>
          budget.id === id ? updatedBudget : budget
        ),
        isLoading: false,
      }));
    } catch (error: unknown) {
      const errorObj = error as Error;
      set({
        error: errorObj.message || 'Gagal memperbarui anggaran. Silakan coba lagi.',
        isLoading: false,
      });
    }
  },

  deleteBudget: async (id) => {
    try {
      set({ isLoading: true, error: null });

      // Hapus dari database
      await deleteBudget(id);

      // Update store dengan filter yang lebih robust
      set(state => ({
        budgets: state.budgets.filter(budget => budget.id !== id),
        isLoading: false,
        error: null,
      }));
    } catch (error: unknown) {
      const errorObj = error as Error;
      set({
        error: errorObj.message || 'Gagal menghapus anggaran. Silakan coba lagi.',
        isLoading: false,
      });
      throw error; // Re-throw untuk handling di component
    }
  },
  
  clearBudgets: () => {
    set({ budgets: [], error: null });
  },

  clearError: () => {
    set({ error: null });
  },
}));
