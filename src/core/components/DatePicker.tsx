import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import { Typography } from './Typography';
import { theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { formatDate } from '../utils';

interface DatePickerProps {
  selectedDate: Date;
  onDateSelected: (date: Date) => void;
  onCancel?: () => void;
  minDate?: Date;
  maxDate?: Date;
  title?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  selectedDate,
  onDateSelected,
  onCancel,
  minDate,
  maxDate = new Date(), // Default max date adalah hari ini
  title = 'Pilih Tanggal',
}) => {
  const [currentDate, setCurrentDate] = useState(selectedDate);
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Animasi masuk
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: theme.duration.normal,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: theme.duration.normal,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Fungsi untuk mendapatkan nama bulan
  const getMonthName = (month: number): string => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return months[month];
  };



  // Fungsi untuk mendapatkan tanggal dalam bulan
  const getDaysInMonth = (month: number, year: number): Date[] => {
    const firstDay = new Date(year, month, 1);
    new Date(year, month + 1, 0); // lastDay - calculated but not used
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: Date[] = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  // Fungsi untuk mengubah bulan
  const changeMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  // Fungsi untuk memilih tanggal
  const selectDate = (date: Date) => {
    // Cek apakah tanggal valid
    if (minDate && date < minDate) return;
    if (maxDate && date > maxDate) return;

    setCurrentDate(date);
  };

  // Fungsi untuk konfirmasi
  const handleConfirm = () => {
    onDateSelected(currentDate);
  };

  // Fungsi untuk quick select
  const quickSelect = (type: 'today' | 'yesterday' | 'week_ago') => {
    const today = new Date();
    let targetDate = new Date();

    switch (type) {
      case 'today':
        targetDate = today;
        break;
      case 'yesterday':
        targetDate.setDate(today.getDate() - 1);
        break;
      case 'week_ago':
        targetDate.setDate(today.getDate() - 7);
        break;
    }

    setCurrentDate(targetDate);
    setCurrentMonth(targetDate.getMonth());
    setCurrentYear(targetDate.getFullYear());
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const today = new Date();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header dengan Gradient */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={[theme.colors.primary[500], theme.colors.primary[600]]}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={theme.colors.white} />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Typography
                variant="h3"
                color={theme.colors.white}
                weight="600"
              >
                {title}
              </Typography>
              <Typography
                variant="body2"
                color={theme.colors.white}
                style={{ opacity: 0.9 }}
              >
                {formatDate(currentDate, { format: 'full' })}
              </Typography>
            </View>

            <TouchableOpacity
              style={styles.todayButton}
              onPress={() => quickSelect('today')}
              activeOpacity={0.7}
            >
              <Ionicons name="today" size={24} color={theme.colors.white} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Quick Select Buttons */}
      <Animated.View
        style={[
          styles.quickSelectContainer,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity
          style={styles.quickSelectButton}
          onPress={() => quickSelect('yesterday')}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={16} color={theme.colors.primary[500]} />
          <Typography variant="body2" color={theme.colors.primary[500]} weight="500">
            Kemarin
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickSelectButton, styles.todayQuickButton]}
          onPress={() => quickSelect('today')}
          activeOpacity={0.8}
        >
          <Ionicons name="today" size={16} color={theme.colors.white} />
          <Typography variant="body2" color={theme.colors.white} weight="500">
            Hari Ini
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickSelectButton}
          onPress={() => quickSelect('week_ago')}
          activeOpacity={0.8}
        >
          <Ionicons name="calendar" size={16} color={theme.colors.primary[500]} />
          <Typography variant="body2" color={theme.colors.primary[500]} weight="500">
            7 Hari Lalu
          </Typography>
        </TouchableOpacity>
      </Animated.View>

      {/* Calendar */}
      <Animated.View
        style={[
          styles.calendarContainer,
          { opacity: fadeAnim }
        ]}
      >
        {/* Month Navigation */}
        <View style={styles.monthNavigation}>
          <TouchableOpacity
            style={styles.monthButton}
            onPress={() => changeMonth('prev')}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color={theme.colors.primary[500]} />
          </TouchableOpacity>

          <View style={styles.monthYearContainer}>
            <Typography variant="h4" weight="600" color={theme.colors.neutral[800]}>
              {getMonthName(currentMonth)} {currentYear}
            </Typography>
          </View>

          <TouchableOpacity
            style={styles.monthButton}
            onPress={() => changeMonth('next')}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-forward" size={24} color={theme.colors.primary[500]} />
          </TouchableOpacity>
        </View>

        {/* Day Headers */}
        <View style={styles.dayHeaders}>
          {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day) => (
            <View key={day} style={styles.dayHeader}>
              <Typography variant="body2" color={theme.colors.neutral[500]} weight="500">
                {day}
              </Typography>
            </View>
          ))}
        </View>

        {/* Calendar Grid */}
        <ScrollView style={styles.calendarGrid} showsVerticalScrollIndicator={false}>
          <View style={styles.weeksContainer}>
            {Array.from({ length: 6 }, (_, weekIndex) => (
              <View key={weekIndex} style={styles.week}>
                {daysInMonth.slice(weekIndex * 7, (weekIndex + 1) * 7).map((date, dayIndex) => {
                  const isCurrentMonth = date.getMonth() === currentMonth;
                  const isSelected = date.toDateString() === currentDate.toDateString();
                  const isToday = date.toDateString() === today.toDateString();
                  const isDisabled = (minDate && date < minDate) || (maxDate && date > maxDate);

                  return (
                    <TouchableOpacity
                      key={dayIndex}
                      style={[
                        styles.dayButton,
                        isSelected && styles.selectedDay,
                        isToday && !isSelected && styles.todayDay,
                        !isCurrentMonth && styles.otherMonthDay,
                        isDisabled && styles.disabledDay,
                      ]}
                      onPress={() => selectDate(date)}
                      disabled={isDisabled}
                      activeOpacity={0.7}
                    >
                      {isSelected && (
                        <LinearGradient
                          colors={[theme.colors.primary[500], theme.colors.primary[600]]}
                          style={styles.selectedDayGradient}
                        />
                      )}
                      <Typography
                        variant="body1"
                        weight={isSelected || isToday ? "600" : "400"}
                        color={
                          isSelected
                            ? theme.colors.white
                            : isToday
                            ? theme.colors.primary[500]
                            : !isCurrentMonth || isDisabled
                            ? theme.colors.neutral[300]
                            : theme.colors.neutral[800]
                        }
                      >
                        {date.getDate()}
                      </Typography>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </Animated.View>

      {/* Action Buttons */}
      <Animated.View
        style={[
          styles.actionContainer,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity
          style={[styles.actionButton, styles.cancelButton]}
          onPress={onCancel}
          activeOpacity={0.8}
        >
          <Ionicons
            name="close-outline"
            size={20}
            color={theme.colors.neutral[600]}
          />
          <Typography
            variant="body1"
            weight="500"
            color={theme.colors.neutral[600]}
            style={styles.buttonText}
          >
            Batal
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.confirmButton]}
          onPress={handleConfirm}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[theme.colors.primary[500], theme.colors.primary[600]]}
            style={styles.confirmGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons
              name="checkmark-outline"
              size={20}
              color={theme.colors.white}
            />
            <Typography
              variant="body1"
              weight="600"
              color={theme.colors.white}
              style={styles.buttonText}
            >
              Konfirmasi
            </Typography>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },

  // Header Styles
  header: {
    zIndex: 1000,
  },
  headerGradient: {
    paddingTop: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: theme.spacing.md,
  },
  todayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Quick Select Styles
  quickSelectContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  quickSelectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.xs,
    backgroundColor: theme.colors.neutral[100],
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
  },
  todayQuickButton: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[500],
  },

  // Calendar Styles
  calendarContainer: {
    flex: 1,
    backgroundColor: theme.colors.white,
    margin: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    ...theme.elevation.md,
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.sm,
  },
  monthButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthYearContainer: {
    flex: 1,
    alignItems: 'center',
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  calendarGrid: {
    flex: 1,
  },
  weeksContainer: {
    gap: theme.spacing.xs,
  },
  week: {
    flexDirection: 'row',
  },
  dayButton: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    margin: 1,
    position: 'relative',
  },
  selectedDay: {
    ...theme.elevation.sm,
  },
  selectedDayGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: theme.borderRadius.md,
  },
  todayDay: {
    backgroundColor: theme.colors.primary[50],
    borderWidth: 2,
    borderColor: theme.colors.primary[500],
  },
  otherMonthDay: {
    opacity: 0.3,
  },
  disabledDay: {
    opacity: 0.2,
  },

  // Action Button Styles
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.xs,
    minHeight: 50,
  },
  cancelButton: {
    backgroundColor: theme.colors.neutral[100],
    borderWidth: 1,
    borderColor: theme.colors.neutral[300],
  },
  confirmButton: {
    flex: 1.5, // Slightly larger than cancel button
  },
  confirmGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    minHeight: 50,
  },
  buttonText: {
    marginLeft: theme.spacing.xs,
  },
});
