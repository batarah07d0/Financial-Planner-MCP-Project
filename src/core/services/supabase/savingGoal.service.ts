import { supabase } from '../../../config/supabase';

export interface SavingGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  description?: string;
  icon?: string;
  color?: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSavingGoalInput {
  name: string;
  target_amount: number;
  current_amount?: number;
  target_date: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface UpdateSavingGoalInput {
  name?: string;
  target_amount?: number;
  current_amount?: number;
  target_date?: string;
  description?: string;
  icon?: string;
  color?: string;
  is_completed?: boolean;
  updated_at?: string;
}

// Get all saving goals for a user
export const getSavingGoals = async (userId: string): Promise<SavingGoal[] | null> => {
  try {
    const { data, error } = await supabase
      .from('saving_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return null;
    }

    return data as SavingGoal[];
  } catch (error) {
    return null;
  }
};

// Get a specific saving goal
export const getSavingGoal = async (goalId: string): Promise<SavingGoal | null> => {
  try {
    const { data, error } = await supabase
      .from('saving_goals')
      .select('*')
      .eq('id', goalId)
      .single();

    if (error) {
      return null;
    }

    return data as SavingGoal;
  } catch (error) {
    return null;
  }
};

// Create a new saving goal
export const createSavingGoal = async (
  userId: string,
  goalData: CreateSavingGoalInput
): Promise<SavingGoal | null> => {
  try {
    const { data, error } = await supabase
      .from('saving_goals')
      .insert({
        user_id: userId,
        ...goalData,
        current_amount: goalData.current_amount || 0,
        is_completed: false,
      })
      .select()
      .single();

    if (error) {
      return null;
    }

    return data as SavingGoal;
  } catch (error) {
    return null;
  }
};

// Update a saving goal
export const updateSavingGoal = async (
  goalId: string,
  updates: UpdateSavingGoalInput
): Promise<SavingGoal | null> => {
  try {
    const { data, error } = await supabase
      .from('saving_goals')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', goalId)
      .select()
      .single();

    if (error) {
      return null;
    }

    return data as SavingGoal;
  } catch (error) {
    return null;
  }
};

// Delete a saving goal
export const deleteSavingGoal = async (goalId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('saving_goals')
      .delete()
      .eq('id', goalId);

    if (error) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};

// Add amount to saving goal
export const addToSavingGoal = async (
  goalId: string,
  amount: number
): Promise<SavingGoal | null> => {
  try {
    // First get current amount
    const currentGoal = await getSavingGoal(goalId);
    if (!currentGoal) {
      return null;
    }

    const newAmount = currentGoal.current_amount + amount;
    const isCompleted = newAmount >= currentGoal.target_amount;

    return await updateSavingGoal(goalId, {
      current_amount: newAmount,
      is_completed: isCompleted,
    });
  } catch (error) {
    return null;
  }
};

// Get saving goals summary for a user
export const getSavingGoalsSummary = async (userId: string): Promise<{
  totalGoals: number;
  completedGoals: number;
  totalTargetAmount: number;
  totalCurrentAmount: number;
  overallProgress: number;
} | null> => {
  try {
    const goals = await getSavingGoals(userId);
    if (!goals) {
      return null;
    }

    const totalGoals = goals.length;
    const completedGoals = goals.filter(goal => goal.is_completed).length;
    const totalTargetAmount = goals.reduce((sum, goal) => sum + goal.target_amount, 0);
    const totalCurrentAmount = goals.reduce((sum, goal) => sum + goal.current_amount, 0);
    const overallProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;

    return {
      totalGoals,
      completedGoals,
      totalTargetAmount,
      totalCurrentAmount,
      overallProgress,
    };
  } catch (error) {
    return null;
  }
};

// Get active (not completed) saving goals
export const getActiveSavingGoals = async (userId: string): Promise<SavingGoal[] | null> => {
  try {
    const { data, error } = await supabase
      .from('saving_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_completed', false)
      .order('created_at', { ascending: false });

    if (error) {
      return null;
    }

    return data as SavingGoal[];
  } catch (error) {
    return null;
  }
};

// Get completed saving goals
export const getCompletedSavingGoals = async (userId: string): Promise<SavingGoal[] | null> => {
  try {
    const { data, error } = await supabase
      .from('saving_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_completed', true)
      .order('updated_at', { ascending: false });

    if (error) {
      return null;
    }

    return data as SavingGoal[];
  } catch (error) {
    return null;
  }
};
