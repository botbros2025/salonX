import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, Appointment } from '../../types';
import { apiService } from '../../services/api';
import { formatTime, getStatusColor } from '../../utils/helpers';
import Card from '../../components/Card';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CalendarViewScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const response = await apiService.getAppointments();
      setAppointments(response.data?.appointments || []);
    } catch (error) {
      console.error('Failed to load appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark dates with appointments
  const markedDates: any = {};
  appointments.forEach((apt) => {
    const date = new Date(apt.scheduledAt).toISOString().split('T')[0];
    if (!markedDates[date]) {
      markedDates[date] = {
        marked: true,
        dotColor: apt.status === 'completed' ? '#22c55e' : apt.status === 'booked' ? '#8b5cf6' : '#ef4444',
      };
    }
  });

  // Mark selected date
  if (selectedDate) {
    markedDates[selectedDate] = {
      ...markedDates[selectedDate],
      selected: true,
      selectedColor: '#8b5cf6',
    };
  }

  // Get appointments for selected date
  const dayAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.scheduledAt).toISOString().split('T')[0];
    return aptDate === selectedDate;
  });

  const onDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* View Mode Toggle */}
      <View className="px-4 pt-4 pb-2 flex-row gap-2">
        <TouchableOpacity
          className={`flex-1 px-4 py-2 rounded-lg ${
            viewMode === 'month' ? 'bg-primary-500' : 'bg-surface border border-border'
          }`}
          onPress={() => setViewMode('month')}
        >
          <Text className={`text-center font-medium ${viewMode === 'month' ? 'text-white' : 'text-text-primary'}`}>
            Month
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 px-4 py-2 rounded-lg ${
            viewMode === 'week' ? 'bg-primary-500' : 'bg-surface border border-border'
          }`}
          onPress={() => setViewMode('week')}
        >
          <Text className={`text-center font-medium ${viewMode === 'week' ? 'text-white' : 'text-text-primary'}`}>
            Week
          </Text>
        </TouchableOpacity>
      </View>

      {/* Calendar */}
      <View className="px-4 pt-4">
        <Calendar
          current={selectedDate}
          onDayPress={onDayPress}
          markedDates={markedDates}
          theme={{
            backgroundColor: '#ffffff',
            calendarBackground: '#ffffff',
            textSectionTitleColor: '#64748b',
            selectedDayBackgroundColor: '#8b5cf6',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#8b5cf6',
            dayTextColor: '#1e293b',
            textDisabledColor: '#d4d4d4',
            dotColor: '#8b5cf6',
            selectedDotColor: '#ffffff',
            arrowColor: '#8b5cf6',
            monthTextColor: '#1e293b',
            textDayFontWeight: '400',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '600',
            textDayFontSize: 16,
            textMonthFontSize: 18,
            textDayHeaderFontSize: 14,
          }}
        />
      </View>

      {/* Appointments for Selected Date */}
      <ScrollView className="flex-1">
        <View className="px-4 pt-4 pb-8">
          <Text className="text-lg font-bold text-text-primary mb-4">
            Appointments - {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
          {dayAppointments.length === 0 ? (
            <Card>
              <View className="items-center py-8">
                <Ionicons name="calendar-outline" size={48} color="#94a3b8" />
                <Text className="text-text-secondary mt-4 text-center">
                  No appointments scheduled for this date
                </Text>
              </View>
            </Card>
          ) : (
            <View className="gap-3">
              {dayAppointments
                .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                .map((apt) => (
                  <TouchableOpacity
                    key={apt.id}
                    className="bg-surface rounded-xl p-4 border border-border"
                    onPress={() =>
                      navigation.navigate('AppointmentDetails' as any, { appointmentId: apt.id })
                    }
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <View className="flex-row items-center mb-2">
                          <Text className="text-lg font-bold text-text-primary mr-2">
                            {apt.client?.name || 'Client'}
                          </Text>
                          <View className={`px-2 py-1 rounded ${getStatusColor(apt.status)}`}>
                            <Text className="text-white text-xs font-medium capitalize">
                              {apt.status}
                            </Text>
                          </View>
                        </View>
                        <Text className="text-text-secondary mb-1">{apt.service?.name}</Text>
                        <View className="flex-row items-center">
                          <Ionicons name="time" size={16} color="#64748b" />
                          <Text className="text-text-secondary text-sm ml-1">
                            {formatTime(apt.scheduledAt)}
                          </Text>
                          <Text className="text-text-secondary text-sm mx-2">•</Text>
                          <Text className="text-text-secondary text-sm">
                            {apt.staff?.user?.name || 'Staff'}
                          </Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                    </View>
                  </TouchableOpacity>
                ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

