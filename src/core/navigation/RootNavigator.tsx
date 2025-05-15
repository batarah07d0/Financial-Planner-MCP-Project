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
  ExpenseMapScreen,
  ReceiptScannerScreen,
  BarcodeScannerScreen,
  AddProductScreen,
  BarcodeScanHistoryScreen,
} from '../../features/transactions/screens';
import {
  AddBudgetScreen,
  SavingZonesScreen,
  AddSavingZoneScreen,
  EditSavingZoneScreen,
  PriceComparisonScreen,
  ProductDetailScreen,
  AddPriceScreen,
} from '../../features/budget/screens';
import { SecuritySettingsScreen } from '../../features/settings/screens';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const { isAuthenticated, hasCompletedOnboarding } = useAuthStore();

  // Cek status autentikasi saat aplikasi dimulai
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        // Implementasi lengkap akan ditambahkan nanti
      }
    };

    checkSession();
  }, []);

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
            <Stack.Screen name="AddBudget" component={AddBudgetScreen} />
            <Stack.Screen name="SavingZones" component={SavingZonesScreen} />
            <Stack.Screen name="AddSavingZone" component={AddSavingZoneScreen} />
            <Stack.Screen name="EditSavingZone" component={EditSavingZoneScreen} />
            <Stack.Screen name="PriceComparison" component={PriceComparisonScreen} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
            <Stack.Screen name="AddPrice" component={AddPriceScreen} />
            <Stack.Screen name="BarcodeScanner" component={BarcodeScannerScreen} />
            <Stack.Screen name="BarcodeScanHistory" component={BarcodeScanHistoryScreen} />
            <Stack.Screen name="AddProduct" component={AddProductScreen} />
            <Stack.Screen name="ReceiptScanner" component={ReceiptScannerScreen} />
            <Stack.Screen name="ExpenseMap" component={ExpenseMapScreen} />
            <Stack.Screen name="SecuritySettings" component={SecuritySettingsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
