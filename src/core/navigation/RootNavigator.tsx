import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { AuthNavigator } from './AuthNavigator';
import { TabNavigator } from './TabNavigator';
import { useAuthStore } from '../services/store';
import { supabase } from '../../config/supabase';

// Import screens
import { OnboardingScreen } from '../../features/onboarding/screens';
import {
  AddTransactionScreen,
  TransactionDetailScreen,
  EditTransactionScreen,
  ExpenseMapScreen,
  ReceiptScannerScreen,
  BarcodeScannerScreen,
  AddProductScreen,
  BarcodeScanHistoryScreen,
} from '../../features/transactions/screens';
import {
  AddBudgetScreen,
  BudgetDetailScreen,
  EditBudgetScreen,
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
import { ChallengesScreen, AddChallengeScreen } from '../../features/challenges/screens';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const { isAuthenticated, hasCompletedOnboarding, initializeOnboardingStatus } = useAuthStore();

  // Cek status autentikasi dan onboarding saat aplikasi dimulai
  useEffect(() => {
    const initializeApp = async () => {
     
      // await initializeOnboardingStatus();

      // Cek session autentikasi
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        // Implementasi lengkap akan ditambahkan nanti
      }
    };

    initializeApp();
  }, [initializeOnboardingStatus]);

  return (
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
            <Stack.Screen name="EditBudget" component={EditBudgetScreen} />
            <Stack.Screen name="SavingGoals" component={SavingGoalsScreen} />
            <Stack.Screen name="AddSavingGoal" component={AddSavingGoalScreen} />
            <Stack.Screen name="EditSavingGoal" component={EditSavingGoalScreen} />
            <Stack.Screen name="SavingGoalDetail" component={SavingGoalDetailScreen} />
            <Stack.Screen name="BarcodeScanner" component={BarcodeScannerScreen} />
            <Stack.Screen name="BarcodeScanHistory" component={BarcodeScanHistoryScreen} />
            <Stack.Screen name="AddProduct" component={AddProductScreen} />
            <Stack.Screen name="ReceiptScanner" component={ReceiptScannerScreen} />
            <Stack.Screen name="ExpenseMap" component={ExpenseMapScreen} />
            <Stack.Screen name="SecuritySettings" component={SecuritySettingsScreen} />
            <Stack.Screen name="BackupRestore" component={BackupRestoreScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Challenges" component={ChallengesScreen} />
            <Stack.Screen name="AddChallenge" component={AddChallengeScreen} />
            <Stack.Screen name="AccountInfo" component={AccountInfoScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            <Stack.Screen name="AboutApp" component={AboutAppScreen} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
            <Stack.Screen name="TermsConditions" component={TermsConditionsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
