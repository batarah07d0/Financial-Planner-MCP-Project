import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../../core/navigation/types';
import { Typography } from '../../../core/components';
import { theme } from '../../../core/theme';

type SavingGoalDetailScreenRouteProp = RouteProp<RootStackParamList, 'SavingGoalDetail'>;

export const SavingGoalDetailScreen = () => {
  const route = useRoute<SavingGoalDetailScreenRouteProp>();
  const { goalId } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Typography variant="h4">Saving Goal Detail</Typography>
        <Typography variant="body1">Goal ID: {goalId}</Typography>
        <Typography variant="body2" color={theme.colors.neutral[600]}>
          Screen ini akan diimplementasikan nanti
        </Typography>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});
