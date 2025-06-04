import { supabase } from '../../../config/supabase';

export interface UserStats {
  transactionCount: number;
  challengeCount: number;
  completedChallenges: number;
  savingZones: number;
  totalSavings: number;
}

export const getUserStats = async (userId: string): Promise<UserStats> => {
  try {
    // Mendapatkan jumlah transaksi
    const { count: transactionCount, error: transactionError } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (transactionError) {
      // Error handling tanpa console.error
    }

    // Mendapatkan jumlah tantangan
    const { count: challengeCount, error: challengeError } = await supabase
      .from('user_challenges')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (challengeError) {
      // Error handling tanpa console.error
    }

    // Mendapatkan jumlah tantangan yang selesai
    const { count: completedChallenges, error: completedError } = await supabase
      .from('user_challenges')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed');

    if (completedError) {
      // Error handling tanpa console.error
    }

    // Mendapatkan jumlah saving zones
    const { count: savingZones, error: savingZonesError } = await supabase
      .from('saving_zones')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (savingZonesError) {
      // Error handling tanpa console.error
    }

    // Mendapatkan total tabungan dari user_challenges
    const { data: savingData, error: savingError } = await supabase
      .from('user_challenges')
      .select('current_amount')
      .eq('user_id', userId);

    if (savingError) {
      // Error handling tanpa console.error
    }

    const totalSavings = savingData
      ? savingData.reduce((sum, item) => sum + (Number(item.current_amount) || 0), 0)
      : 0;

    return {
      transactionCount: transactionCount || 0,
      challengeCount: challengeCount || 0,
      completedChallenges: completedChallenges || 0,
      savingZones: savingZones || 0,
      totalSavings,
    };
  } catch (error) {
    return {
      transactionCount: 0,
      challengeCount: 0,
      completedChallenges: 0,
      savingZones: 0,
      totalSavings: 0,
    };
  }
};
