import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { AuthNavigator } from './AuthNavigator';
import { TabNavigator } from './TabNavigator';
import { useAuthStore } from '../services/store';
import { supabase } from '../../config/supabase';
import { SplashScreen } from '../components';

// Import screens
import { OnboardingScreen } from '../../features/onboarding/screens';
import {
  AddTransactionScreen,
  TransactionDetailScreen,
  EditTransactionScreen,
  ExpenseMapScreen,
} from '../../features/transactions/screens';
import {
  AddBudgetScreen,
  BudgetDetailScreen,
  BudgetAnalysisDetailScreen,
  EditBudgetScreen,
  CategoryPickerScreen,
} from '../../features/budget/screens';
import {
  SavingGoalsScreen,
  AddSavingGoalScreen,
  EditSavingGoalScreen,
  SavingGoalDetailScreen,
} from '../../features/savings/screens';
import {
  SecuritySettingsScreen,
  BackupRestoreScreen,
  SettingsScreen,
  AccountInfoScreen,
  ChangePasswordScreen,
  AboutAppScreen,
  PrivacyPolicyScreen,
  TermsConditionsScreen
} from '../../features/settings/screens';
import { ChallengesScreen, AddChallengeScreen, ChallengeDetailScreen } from '../../features/challenges/screens';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const {
    isAuthenticated,
    hasCompletedOnboarding,
    isInitialized,
    initializeOnboardingStatus,
    initializeAuth,
    setUser,
    setIsAuthenticated
  } = useAuthStore();

  // Inisialisasi aplikasi
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Jalankan inisialisasi secara paralel untuk performa yang lebih baik
        await Promise.all([
          initializeOnboardingStatus(),
          initializeAuth(),
        ]);
      } catch (error) {
        // Jika ada error, tetap lanjutkan
      }
    };

    initializeApp();
  }, [initializeOnboardingStatus, initializeAuth]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        // User signed out
        setUser(null);
        setIsAuthenticated(false);
      } else if (event === 'SIGNED_IN' && session?.user) {
        // User signed in
        const user = {
          id: session.user.id,
          email: session.user.email || null,
          name: session.user.user_metadata?.name,
        };
        setUser(user);
        setIsAuthenticated(true);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Token refreshed, update user data
        const user = {
          id: session.user.id,
          email: session.user.email || null,
          name: session.user.user_metadata?.name,
        };
        setUser(user);
        setIsAuthenticated(true);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, [setUser, setIsAuthenticated]);

  // Tampilkan splash screen hanya saat belum initialized
  if (!isInitialized) {
    return <SplashScreen isVisible={true} />;
  }

  return (
    <>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          {!hasCompletedOnboarding ? (
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          ) : !isAuthenticated ? (
            <Stack.Screen name="Auth" component={AuthNavigator} />
          ) : (
            <>
              <Stack.Screen name="Main" component={TabNavigator} />
              <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
              <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
              <Stack.Screen name="EditTransaction" component={EditTransactionScreen} />
              <Stack.Screen name="AddBudget" component={AddBudgetScreen} />
              <Stack.Screen name="BudgetDetail" component={BudgetDetailScreen} />
              <Stack.Screen name="BudgetAnalysisDetail" component={BudgetAnalysisDetailScreen} />
              <Stack.Screen name="EditBudget" component={EditBudgetScreen} />
            <Stack.Screen
              name="CategoryPicker"
              component={CategoryPickerScreen}
              options={{
                presentation: 'modal',
                headerShown: false,
              }}
            />
            <Stack.Screen name="SavingGoals" component={SavingGoalsScreen} />
            <Stack.Screen name="AddSavingGoal" component={AddSavingGoalScreen} />
            <Stack.Screen name="EditSavingGoal" component={EditSavingGoalScreen} />
            <Stack.Screen name="SavingGoalDetail" component={SavingGoalDetailScreen} />

            <Stack.Screen name="ExpenseMap" component={ExpenseMapScreen} />
            <Stack.Screen name="SecuritySettings" component={SecuritySettingsScreen} />
            <Stack.Screen name="BackupRestore" component={BackupRestoreScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Challenges" component={ChallengesScreen} />
            <Stack.Screen name="AddChallenge" component={AddChallengeScreen} />
            <Stack.Screen name="ChallengeDetail" component={ChallengeDetailScreen} />
            <Stack.Screen name="AccountInfo" component={AccountInfoScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            <Stack.Screen name="AboutApp" component={AboutAppScreen} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
            <Stack.Screen name="TermsConditions" component={TermsConditionsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
    </>
  );
};
