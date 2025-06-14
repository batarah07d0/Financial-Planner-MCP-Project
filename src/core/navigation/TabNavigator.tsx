import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabParamList } from './types';
import { theme } from '../theme';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

// Import screens
import { DashboardScreen } from '../../features/dashboard/screens';
import { TransactionsScreen } from '../../features/transactions/screens';
import { BudgetScreen } from '../../features/budget/screens';
import { AnalyticsScreen } from '../../features/analytics/screens';
import { MoreScreen } from '../../features/more/screens';

const Tab = createBottomTabNavigator<TabParamList>();

export const TabNavigator = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary[500],
        tabBarInactiveTintColor: theme.colors.neutral[500],
        tabBarStyle: {
          backgroundColor: theme.colors.white,
          borderTopWidth: 1,
          borderTopColor: theme.colors.neutral[200],
          height: 75 + insets.bottom, // Tingkatkan height untuk memberikan ruang lebih
          paddingBottom: insets.bottom + 8, // Kurangi padding bottom
          paddingTop: 8, // Kurangi padding top
          elevation: 8,
          shadowColor: theme.colors.neutral[900],
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4, // Tambahkan margin top
          marginBottom: 4, // Tambahkan margin bottom untuk mencegah terpotong
          paddingBottom: 2, // Tambahkan padding bottom kecil
        },
        tabBarItemStyle: {
          paddingVertical: 4, // Tambahkan padding vertikal pada item
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Beranda',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{
          tabBarLabel: 'Transaksi',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cash-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Budget"
        component={BudgetScreen}
        options={{
          tabBarLabel: 'Anggaran',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="wallet" size={size - 2} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          tabBarLabel: 'Analisis',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{
          tabBarLabel: 'Lainnya',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ellipsis-horizontal" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
