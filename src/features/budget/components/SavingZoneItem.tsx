import React from 'react';
import { View, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Typography } from '../../../core/components';
import { theme } from '../../../core/theme';
import { SavingZone } from '../models/SavingZone';

interface SavingZoneItemProps {
  zone: SavingZone;
  onPress?: (zone: SavingZone) => void;
  onToggleNotification?: (zone: SavingZone, enabled: boolean) => void;
  isActive?: boolean;
  distance?: number;
}

export const SavingZoneItem: React.FC<SavingZoneItemProps> = ({
  zone,
  onPress,
  onToggleNotification,
  isActive,
  distance,
}) => {
  const handlePress = () => {
    if (onPress) {
      onPress(zone);
    }
  };
  
  const handleToggleNotification = (value: boolean) => {
    if (onToggleNotification) {
      onToggleNotification(zone, value);
    }
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        isActive && styles.activeContainer,
        zone.type === 'high_expense' ? styles.highExpenseContainer : styles.savingOpportunityContainer,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Typography variant="h5" numberOfLines={1} style={styles.name}>
            {zone.name}
          </Typography>
          <View style={styles.typeContainer}>
            <Typography
              variant="caption"
              color={zone.type === 'high_expense' ? theme.colors.white : theme.colors.white}
              style={[
                styles.typeLabel,
                zone.type === 'high_expense' ? styles.highExpenseLabel : styles.savingOpportunityLabel,
              ]}
            >
              {zone.type === 'high_expense' ? 'Pengeluaran Tinggi' : 'Peluang Hemat'}
            </Typography>
          </View>
        </View>
        
        {zone.description && (
          <Typography
            variant="body2"
            color={theme.colors.neutral[600]}
            numberOfLines={2}
            style={styles.description}
          >
            {zone.description}
          </Typography>
        )}
        
        <View style={styles.details}>
          <Typography variant="body2" color={theme.colors.neutral[600]}>
            Radius: {zone.radius} m
          </Typography>
          
          {distance !== undefined && (
            <Typography
              variant="body2"
              color={isActive ? theme.colors.success[500] : theme.colors.neutral[600]}
            >
              {isActive ? 'Di dalam zona' : `${Math.round(distance)} m`}
            </Typography>
          )}
        </View>
      </View>
      
      <View style={styles.actions}>
        <Switch
          value={zone.notificationEnabled}
          onValueChange={handleToggleNotification}
          trackColor={{
            false: theme.colors.neutral[300],
            true: theme.colors.primary[300],
          }}
          thumbColor={
            zone.notificationEnabled ? theme.colors.primary[500] : theme.colors.neutral[100]
          }
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    ...theme.elevation.sm,
    borderLeftWidth: 4,
  },
  activeContainer: {
    borderColor: theme.colors.success[500],
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  highExpenseContainer: {
    borderLeftColor: theme.colors.danger[500],
  },
  savingOpportunityContainer: {
    borderLeftColor: theme.colors.success[500],
  },
  content: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  name: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  typeContainer: {
    marginLeft: theme.spacing.xs,
  },
  typeLabel: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
  },
  highExpenseLabel: {
    backgroundColor: theme.colors.danger[500],
  },
  savingOpportunityLabel: {
    backgroundColor: theme.colors.success[500],
  },
  description: {
    marginBottom: theme.spacing.sm,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actions: {
    alignItems: 'flex-end',
  },
});
