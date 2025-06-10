import { supabase } from '../../../config/supabase';
import { PostgrestError } from '@supabase/supabase-js';

export interface UserChallenge {
  id: string;
  user_id: string;
  name: string;
  description: string;
  target_amount: number;
  duration_days: number;
  difficulty: 'easy' | 'medium' | 'hard';
  icon: string;
  color: string;
  is_featured: boolean;
  start_date: string;
  end_date: string;
  current_amount: number;
  status: 'active' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

// Alias untuk backward compatibility
export interface Challenge extends UserChallenge {}
export interface ChallengeWithProgress extends UserChallenge {
  user_challenge?: UserChallenge;
}

/**
 * Mengambil tantangan berdasarkan ID (dari user_challenges)
 */
export const getChallengeById = async (id: string): Promise<{ data: Challenge | null; error: PostgrestError | null }> => {
  const { data, error } = await supabase
    .from('user_challenges')
    .select('*')
    .eq('id', id)
    .single();

  return { data, error };
};

/**
 * Mengambil semua tantangan pengguna
 */
export const getUserChallenges = async (userId: string): Promise<{ data: UserChallenge[] | null; error: PostgrestError | null }> => {
  const { data, error } = await supabase
    .from('user_challenges')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return { data, error };
};

/**
 * Mengambil tantangan pengguna berdasarkan status
 */
export const getUserChallengesByStatus = async (
  userId: string,
  status: 'active' | 'completed' | 'failed'
): Promise<{ data: UserChallenge[] | null; error: PostgrestError | null }> => {
  const { data, error } = await supabase
    .from('user_challenges')
    .select('*')
    .eq('user_id', userId)
    .eq('status', status)
    .order('created_at', { ascending: false });

  return { data, error };
};

/**
 * Mengambil jumlah tantangan aktif pengguna untuk badge notifikasi
 */
export const getActiveChallengesCount = async (userId: string): Promise<{ count: number; error: PostgrestError | null }> => {
  const { count, error } = await supabase
    .from('user_challenges')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'active'); // Hanya hitung tantangan yang statusnya 'active'

  return { count: count || 0, error };
};

/**
 * Mengambil semua tantangan pengguna dengan progress
 */
export const getChallengesWithUserProgress = async (
  userId: string
): Promise<{ data: ChallengeWithProgress[] | null; error: PostgrestError | null }> => {
  // Ambil semua tantangan pengguna langsung dari user_challenges
  const { data: userChallenges, error: userChallengesError } = await getUserChallenges(userId);
  if (userChallengesError) {
    return { data: null, error: userChallengesError };
  }

  // Konversi ke format ChallengeWithProgress
  const challengesWithProgress: ChallengeWithProgress[] = (userChallenges || []).map(userChallenge => ({
    ...userChallenge,
    user_challenge: userChallenge,
  }));

  return { data: challengesWithProgress, error: null };
};

/**
 * Mengambil satu tantangan dengan progress pengguna berdasarkan ID
 */
export const getChallengeWithUserProgress = async (
  userId: string,
  challengeId: string
): Promise<{ data: ChallengeWithProgress[] | null; error: PostgrestError | null }> => {
  // Ambil tantangan langsung dari user_challenges berdasarkan ID dan user_id
  const { data: userChallenge, error: userChallengeError } = await supabase
    .from('user_challenges')
    .select('*')
    .eq('id', challengeId)
    .eq('user_id', userId)
    .single();

  if (userChallengeError) {
    return { data: null, error: userChallengeError };
  }

  // Konversi ke format ChallengeWithProgress
  const challengeWithProgress: ChallengeWithProgress = {
    ...userChallenge,
    user_challenge: userChallenge,
  };

  return { data: [challengeWithProgress], error: null };
};



/**
 * Memperbarui progress tantangan pengguna
 */
export const updateChallengeProgress = async (
  userChallengeId: string,
  currentAmount: number
): Promise<{ data: UserChallenge | null; error: PostgrestError | null }> => {
  const { data, error } = await supabase
    .from('user_challenges')
    .update({ current_amount: currentAmount, updated_at: new Date().toISOString() })
    .eq('id', userChallengeId)
    .select()
    .single();

  return { data, error };
};

/**
 * Menyelesaikan tantangan pengguna
 */
export const completeChallenge = async (
  userChallengeId: string
): Promise<{ data: UserChallenge | null; error: PostgrestError | null }> => {
  const { data, error } = await supabase
    .from('user_challenges')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', userChallengeId)
    .select()
    .single();

  return { data, error };
};

/**
 * Menandai tantangan pengguna sebagai gagal
 */
export const failChallenge = async (
  userChallengeId: string
): Promise<{ data: UserChallenge | null; error: PostgrestError | null }> => {
  const { data, error } = await supabase
    .from('user_challenges')
    .update({ status: 'failed', updated_at: new Date().toISOString() })
    .eq('id', userChallengeId)
    .select()
    .single();

  return { data, error };
};

/**
 * Interface untuk input tantangan baru
 */
export interface ChallengeInput {
  name: string;
  description: string;
  target_amount: number;
  duration_days: number;
  difficulty: 'easy' | 'medium' | 'hard';
  icon: string;
  color: string;
  is_featured?: boolean;
  user_id: string; // Tambahan untuk user_id
}

/**
 * Menambahkan tantangan baru langsung ke user_challenges
 */
export const addChallenge = async (
  challenge: ChallengeInput
): Promise<{ data: Challenge | null; error: PostgrestError | null }> => {
  // Hitung tanggal akhir berdasarkan durasi tantangan
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + challenge.duration_days);

  const { data, error } = await supabase
    .from('user_challenges')
    .insert({
      user_id: challenge.user_id,
      name: challenge.name,
      description: challenge.description,
      target_amount: challenge.target_amount,
      duration_days: challenge.duration_days,
      difficulty: challenge.difficulty,
      icon: challenge.icon,
      color: challenge.color,
      is_featured: challenge.is_featured || false,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      current_amount: 0,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  return { data, error };
};

