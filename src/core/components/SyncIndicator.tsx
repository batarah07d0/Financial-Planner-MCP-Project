import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Typography } from './Typography';
import { theme } from '../theme';
import { useSync } from '../hooks';
import { formatDate } from '../utils';

interface SyncIndicatorProps {
  showLastSynced?: boolean;
  onPress?: () => void;
  color?: string;
}

export const SyncIndicator: React.FC<SyncIndicatorProps> = ({
  showLastSynced = true,
  onPress,
  color,
}) => {
  const { syncStatus, lastSyncedAt, isOnline, sync } = useSync();

  // Fungsi untuk menangani klik pada indikator
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (syncStatus !== 'syncing' && isOnline) {
      sync();
    }
  };

  // Render ikon berdasarkan status
  const renderIcon = () => {
    if (syncStatus === 'syncing') {
      return (
        <ActivityIndicator
          size="small"
          color={color || theme.colors.primary[500]}
        />
      );
    }

    if (!isOnline) {
      return (
        <View style={[styles.dot, styles.offlineDot, color ? { backgroundColor: color } : null]} />
      );
    }

    if (syncStatus === 'error') {
      return (
        <View style={[styles.dot, styles.errorDot]} />
      );
    }

    return (
      <View style={[styles.dot, styles.onlineDot]} />
    );
  };

  // Render teks status
  const renderStatusText = () => {
    if (!isOnline) {
      return 'Offline';
    }

    switch (syncStatus) {
      case 'syncing':
        return 'Sinkronisasi...';
      case 'success':
        return 'Tersinkronisasi';
      case 'error':
        return 'Gagal sinkronisasi';
      default:
        return 'Tersinkronisasi';
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      disabled={syncStatus === 'syncing'}
    >
      {renderIcon()}
      <View style={styles.textContainer}>
        <Typography variant="body2" color={color || theme.colors.neutral[700]}>
          {renderStatusText()}
        </Typography>
        {showLastSynced && lastSyncedAt && (
          <Typography variant="caption" color={color || theme.colors.neutral[500]}>
            Terakhir: {formatDate(lastSyncedAt, { format: 'short', includeTime: true })}
          </Typography>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: theme.spacing.sm,
  },
  onlineDot: {
    backgroundColor: theme.colors.success[500],
  },
  offlineDot: {
    backgroundColor: theme.colors.neutral[500],
  },
  errorDot: {
    backgroundColor: theme.colors.danger[500],
  },
  textContainer: {
    flexDirection: 'column',
  },
});
