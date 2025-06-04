import { getUserSettings } from '../../features/settings/services';
import { notificationService } from './notificationService';
import { getSavingGoals, updateSavingGoal, SavingGoal } from './supabase/savingGoal.service';

export interface SavingGoalProgress {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  progressPercentage: number;
  milestoneReached: number; // 25, 50, 75, 100
  shouldNotify: boolean;
}

export class SavingGoalTrackerService {
  private static instance: SavingGoalTrackerService;
  private notifiedMilestones: Map<string, Set<number>> = new Map();

  private constructor() {}

  public static getInstance(): SavingGoalTrackerService {
    if (!SavingGoalTrackerService.instance) {
      SavingGoalTrackerService.instance = new SavingGoalTrackerService();
    }
    return SavingGoalTrackerService.instance;
  }

  // Track progress untuk semua saving goals user
  public async trackAllGoalsProgress(userId: string): Promise<SavingGoalProgress[]> {
    try {
      const userSettings = await getUserSettings(userId);
      if (!userSettings?.notification_enabled) {
        return [];
      }

      const savingGoals = await getSavingGoals(userId);
      if (!savingGoals || savingGoals.length === 0) {
        return [];
      }

      const progressList: SavingGoalProgress[] = [];

      for (const goal of savingGoals) {
        const progress = this.calculateProgress(goal);
        
        // Check milestone dan kirim notifikasi jika perlu
        const shouldNotify = await this.checkMilestoneAndNotify(userId, goal, progress);
        
        progressList.push({
          ...progress,
          shouldNotify,
        });
      }

      return progressList;
    } catch (error) {
      return [];
    }
  }

  // Calculate progress untuk single goal
  private calculateProgress(goal: SavingGoal): SavingGoalProgress {
    const progressPercentage = goal.target_amount > 0 
      ? (goal.current_amount / goal.target_amount) * 100 
      : 0;

    let milestoneReached = 0;
    if (progressPercentage >= 100) milestoneReached = 100;
    else if (progressPercentage >= 75) milestoneReached = 75;
    else if (progressPercentage >= 50) milestoneReached = 50;
    else if (progressPercentage >= 25) milestoneReached = 25;

    return {
      id: goal.id,
      name: goal.name,
      targetAmount: goal.target_amount,
      currentAmount: goal.current_amount,
      progressPercentage,
      milestoneReached,
      shouldNotify: false, // Will be set by checkMilestoneAndNotify
    };
  }

  // Check milestone dan kirim notifikasi jika belum pernah
  private async checkMilestoneAndNotify(
    userId: string,
    goal: SavingGoal,
    progress: SavingGoalProgress
  ): Promise<boolean> {
    try {
      const goalId = goal.id;
      const milestone = progress.milestoneReached;

      // Skip jika belum mencapai milestone
      if (milestone === 0) return false;

      // Get notified milestones untuk goal ini
      if (!this.notifiedMilestones.has(goalId)) {
        this.notifiedMilestones.set(goalId, new Set());
      }

      const notifiedSet = this.notifiedMilestones.get(goalId)!;

      // Skip jika milestone sudah pernah dinotifikasi
      if (notifiedSet.has(milestone)) return false;

      // Kirim notifikasi
      const success = await notificationService.sendSavingGoalProgress(
        userId,
        progress.name,
        progress.progressPercentage,
        progress.currentAmount,
        progress.targetAmount
      );

      if (success) {
        // Mark milestone sebagai sudah dinotifikasi
        notifiedSet.add(milestone);
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  // Update progress saving goal dan cek milestone
  public async updateGoalProgress(
    userId: string,
    goalId: string,
    newAmount: number
  ): Promise<SavingGoalProgress | null> {
    try {
      // Update di database
      const updatedGoal = await updateSavingGoal(goalId, {
        current_amount: newAmount,
        updated_at: new Date().toISOString(),
      });

      if (!updatedGoal) {
        return null;
      }

      // Calculate progress
      const progress = this.calculateProgress(updatedGoal);

      // Check milestone dan kirim notifikasi
      const shouldNotify = await this.checkMilestoneAndNotify(userId, updatedGoal, progress);

      return {
        ...progress,
        shouldNotify,
      };
    } catch (error) {
      return null;
    }
  }

  // Send completion celebration
  public async sendCompletionCelebration(
    userId: string,
    goalName: string,
    targetAmount: number
  ): Promise<boolean> {
    try {
      const userSettings = await getUserSettings(userId);
      if (!userSettings?.notification_enabled) {
        return false;
      }

      return await notificationService.sendLocalNotification({
        title: '🎉🎊 SELAMAT! Target Tercapai! 🎊🎉',
        body: `Luar biasa! Anda berhasil mencapai target "${goalName}" sebesar Rp ${targetAmount.toLocaleString('id-ID')}. Saatnya merayakan pencapaian ini!`,
        data: { 
          type: 'saving_goal_completed', 
          goalName, 
          targetAmount 
        },
      });
    } catch (error) {
      return false;
    }
  }

  // Send motivation untuk goal yang stagnan
  public async sendMotivationReminder(
    userId: string,
    goalName: string,
    daysWithoutProgress: number
  ): Promise<boolean> {
    try {
      const userSettings = await getUserSettings(userId);
      if (!userSettings?.notification_enabled) {
        return false;
      }

      let title = '';
      let body = '';

      if (daysWithoutProgress >= 30) {
        title = '💪 Jangan Menyerah!';
        body = `"${goalName}" belum ada progress selama ${daysWithoutProgress} hari. Mulai lagi dengan langkah kecil!`;
      } else if (daysWithoutProgress >= 14) {
        title = '🎯 Ingat Target Anda';
        body = `"${goalName}" menunggu kontribusi Anda. Sudah ${daysWithoutProgress} hari tidak ada progress.`;
      } else if (daysWithoutProgress >= 7) {
        title = '📈 Waktunya Menabung';
        body = `Seminggu berlalu tanpa progress untuk "${goalName}". Yuk lanjutkan perjalanan menabung!`;
      }

      if (title && body) {
        return await notificationService.sendLocalNotification({
          title,
          body,
          data: { 
            type: 'saving_goal_motivation', 
            goalName, 
            daysWithoutProgress 
          },
        });
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  // Reset milestone notifications (untuk testing atau reset goal)
  public resetMilestoneNotifications(goalId: string): void {
    this.notifiedMilestones.delete(goalId);
  }

  // Get progress summary untuk dashboard
  public async getProgressSummary(userId: string): Promise<{
    totalGoals: number;
    completedGoals: number;
    totalTargetAmount: number;
    totalCurrentAmount: number;
    overallProgress: number;
  }> {
    try {
      const savingGoals = await getSavingGoals(userId);
      if (!savingGoals || savingGoals.length === 0) {
        return {
          totalGoals: 0,
          completedGoals: 0,
          totalTargetAmount: 0,
          totalCurrentAmount: 0,
          overallProgress: 0,
        };
      }

      const totalGoals = savingGoals.length;
      const completedGoals = savingGoals.filter(goal => 
        goal.current_amount >= goal.target_amount
      ).length;
      
      const totalTargetAmount = savingGoals.reduce((sum, goal) => 
        sum + goal.target_amount, 0
      );
      
      const totalCurrentAmount = savingGoals.reduce((sum, goal) => 
        sum + goal.current_amount, 0
      );
      
      const overallProgress = totalTargetAmount > 0 
        ? (totalCurrentAmount / totalTargetAmount) * 100 
        : 0;

      return {
        totalGoals,
        completedGoals,
        totalTargetAmount,
        totalCurrentAmount,
        overallProgress,
      };
    } catch (error) {
      return {
        totalGoals: 0,
        completedGoals: 0,
        totalTargetAmount: 0,
        totalCurrentAmount: 0,
        overallProgress: 0,
      };
    }
  }
}

// Export singleton instance
export const savingGoalTrackerService = SavingGoalTrackerService.getInstance();
