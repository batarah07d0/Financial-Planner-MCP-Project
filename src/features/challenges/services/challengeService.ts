import { supabase } from '../../../config/supabase';
import { PostgrestError } from '@supabase/supabase-js';

export interface Challenge {
  id: string;
  name: string;
  description: string;
  target_amount: number;
  duration_days: number;
  difficulty: 'easy' | 'medium' | 'hard';
  icon: string;
  color: string;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  start_date: string;
  end_date: string;
  current_amount: number;
  status: 'active' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  challenge?: Challenge;
}

export interface ChallengeWithProgress extends Challenge {
  user_challenge?: UserChallenge;
  current_amount?: number;
  status?: 'active' | 'completed' | 'failed';
  start_date?: string;
  end_date?: string;
}

/**
 * Mengambil semua tantangan yang tersedia
 */
export const getAllChallenges = async (): Promise<{ data: Challenge[] | null; error: PostgrestError | null }> => {
  const { data, error } = await supabase
    .from('saving_challenges')
    .select('*')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false });

  return { data, error };
};

/**
 * Mengambil tantangan berdasarkan ID
 */
export const getChallengeById = async (id: string): Promise<{ data: Challenge | null; error: PostgrestError | null }> => {
  const { data, error } = await supabase
    .from('saving_challenges')
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
    .select(`
      *,
      challenge:challenge_id(*)
    `)
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
    .select(`
      *,
      challenge:challenge_id(*)
    `)
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
 * Mengambil semua tantangan dengan progress pengguna (jika ada)
 */
export const getChallengesWithUserProgress = async (
  userId: string
): Promise<{ data: ChallengeWithProgress[] | null; error: PostgrestError | null }> => {
  // Ambil semua tantangan
  const { data: challenges, error: challengesError } = await getAllChallenges();
  if (challengesError || !challenges) {
    return { data: null, error: challengesError };
  }

  // Ambil semua tantangan pengguna
  const { data: userChallenges, error: userChallengesError } = await getUserChallenges(userId);
  if (userChallengesError) {
    return { data: null, error: userChallengesError };
  }

  // Gabungkan data tantangan dengan progress pengguna
  const challengesWithProgress: ChallengeWithProgress[] = challenges.map(challenge => {
    const userChallenge = userChallenges?.find(uc => uc.challenge_id === challenge.id);

    if (userChallenge) {
      return {
        ...challenge,
        user_challenge: userChallenge,
        current_amount: userChallenge.current_amount,
        status: userChallenge.status,
        start_date: userChallenge.start_date,
        end_date: userChallenge.end_date,
      };
    }

    return challenge;
  });

  return { data: challengesWithProgress, error: null };
};

/**
 * Mengambil satu tantangan dengan progress pengguna (jika ada)
 */
export const getChallengeWithUserProgress = async (
  userId: string,
  challengeId: string
): Promise<{ data: ChallengeWithProgress[] | null; error: PostgrestError | null }> => {
  // Ambil tantangan berdasarkan ID
  const { data: challenge, error: challengeError } = await getChallengeById(challengeId);
  if (challengeError || !challenge) {
    return { data: null, error: challengeError };
  }

  // Ambil tantangan pengguna untuk challenge ini
  const { data: userChallenge, error: userChallengeError } = await supabase
    .from('user_challenges')
    .select('*')
    .eq('user_id', userId)
    .eq('challenge_id', challengeId)
    .single();

  // Jika ada error selain 'not found', return error
  if (userChallengeError && userChallengeError.code !== 'PGRST116') {
    return { data: null, error: userChallengeError };
  }

  // Gabungkan data tantangan dengan progress pengguna
  const challengeWithProgress: ChallengeWithProgress = userChallenge ? {
    ...challenge,
    user_challenge: userChallenge,
    current_amount: userChallenge.current_amount,
    status: userChallenge.status,
    start_date: userChallenge.start_date,
    end_date: userChallenge.end_date,
  } : challenge;

  return { data: [challengeWithProgress], error: null };
};

/**
 * Memulai tantangan baru untuk pengguna
 */
export const startChallenge = async (
  userId: string,
  challengeId: string,
  startDate: Date = new Date()
): Promise<{ data: UserChallenge | null; error: PostgrestError | null }> => {
  // Ambil informasi tantangan
  const { data: challenge, error: challengeError } = await getChallengeById(challengeId);
  if (challengeError || !challenge) {
    return { data: null, error: challengeError };
  }

  // Hitung tanggal akhir berdasarkan durasi tantangan
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + challenge.duration_days);

  // Buat entri tantangan pengguna baru
  const { data, error } = await supabase
    .from('user_challenges')
    .insert({
      user_id: userId,
      challenge_id: challengeId,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      current_amount: 0,
      status: 'active',
    })
    .select()
    .single();

  return { data, error };
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
}

/**
 * Menambahkan tantangan baru
 */
export const addChallenge = async (
  challenge: ChallengeInput
): Promise<{ data: Challenge | null; error: PostgrestError | null }> => {
  const { data, error } = await supabase
    .from('saving_challenges')
    .insert({
      ...challenge,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  return { data, error };
};

