import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, Appointment } from '../../types';
import { apiService } from '../../services/api';
import { authService } from '../../services/auth';
import { formatTime, formatDate, getStatusColor, getRelativeDate } from '../../utils/helpers';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function StaffScheduleScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'completed'>('all');
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    loadAppointments();
  }, [filter, selectedDate]);

  const loadAppointments = async () => {
    try {
      const storedUser = await authService.getStoredUser();
      if (!storedUser) return;

      const params: any = {
        staffId: storedUser.staff?.id,
      };

      if (filter === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        params.startDate = today.toISOString();
        params.endDate = tomorrow.toISOString();
      } else if (filter === 'upcoming') {
        params.startDate = new Date().toISOString();
        params.status = 'booked';
      } else if (filter === 'completed') {
        params.status = 'completed';
      }

      const response = await apiService.getAppointments(params);
      let allAppointments = response.data?.appointments || [];

      // Filter by staff if needed
      if (storedUser.staff?.id) {
        allAppointments = allAppointments.filter(
          (apt: Appointment) => apt.staffId === storedUser.staff.id
        );
      }

      // Sort by scheduled time
      allAppointments.sort((a: Appointment, b: Appointment) => {
        return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
      });

      setAppointments(allAppointments);
    } catch (error) {
      console.error('Failed to load appointments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAppointments();
  };

  const handleStatusUpdate = async (appointmentId: string, status: string) => {
    try {
      await apiService.updateAppointmentStatus(appointmentId, status);
      loadAppointments();
    } catch (error: any) {
      console.error('Failed to update status:', error);
    }
  };

  const filters = [
    { key: 'all' as const, label: 'All' },
    { key: 'today' as const, label: 'Today' },
    { key: 'upcoming' as const, label: 'Upcoming' },
    { key: 'completed' as const, label: 'Completed' },
  ];

  // Group appointments by date
  const groupedAppointments = appointments.reduce((acc: any, apt: Appointment) => {
    const date = new Date(apt.scheduledAt).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(apt);
    return acc;
  }, {});

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Filters */}
      <View className="px-4 pt-4 pb-2">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
        >
          <View className="flex-row gap-2">
            {filters.map((f) => (
              <TouchableOpacity
                key={f.key}
                className={`px-4 py-2 rounded-full ${
                  filter === f.key ? 'bg-primary-500' : 'bg-surface border border-border'
                }`}
                onPress={() => setFilter(f.key)}
              >
                <Text
                  className={`font-medium ${
                    filter === f.key ? 'text-white' : 'text-text-primary'
                  }`}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Appointments List */}
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="px-4 pb-8">
          {appointments.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Ionicons name="calendar-outline" size={64} color="#94a3b8" />
              <Text className="text-text-secondary text-center mt-4">
                No appointments found
              </Text>
            </View>
          ) : (
            Object.entries(groupedAppointments).map(([date, apts]: [string, any]) => (
              <View key={date} className="mb-6">
                <Text className="text-lg font-bold text-text-primary mb-3">
                  {getRelativeDate(new Date(date))}
                </Text>
                <View className="gap-3">
                  {apts.map((apt: Appointment) => (
                    <TouchableOpacity
                      key={apt.id}
                      className="bg-surface rounded-xl p-4 border border-border"
                      onPress={() =>
                        navigation.navigate('AppointmentDetails' as any, {
                          appointmentId: apt.id,
                        })
                      }
                    >
                      <View className="flex-row items-start justify-between mb-3">
                        <View className="flex-1">
                          <Text className="text-lg font-bold text-text-primary mb-1">
                            {apt.client?.name || 'Client'}
                          </Text>
                          <Text className="text-text-secondary mb-1">{apt.service?.name}</Text>
                          <View className="flex-row items-center mt-2">
                            <Ionicons name="time" size={16} color="#64748b" />
                            <Text className="text-text-secondary text-sm ml-1">
                              {formatTime(apt.scheduledAt)}
                            </Text>
                            <Text className="text-text-secondary text-sm mx-2">•</Text>
                            <Text className="text-text-secondary text-sm">
                              {apt.service?.duration} min
                            </Text>
                          </View>
                        </View>
                        <View className={`px-3 py-1 rounded-full ${getStatusColor(apt.status)}`}>
                          <Text className="text-white text-xs font-medium capitalize">
                            {apt.status}
                          </Text>
                        </View>
                      </View>

                      {/* Quick Actions */}
                      {apt.status === 'booked' && (
                        <View className="flex-row gap-2 pt-3 border-t border-border">
                          <TouchableOpacity
                            className="flex-1 bg-primary-100 rounded-lg py-2 items-center"
                            onPress={() => handleStatusUpdate(apt.id, 'ongoing')}
                          >
                            <Text className="text-primary-600 font-medium text-sm">Start</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            className="flex-1 bg-secondary-100 rounded-lg py-2 items-center"
                            onPress={() => handleStatusUpdate(apt.id, 'cancelled')}
                          >
                            <Text className="text-secondary-600 font-medium text-sm">Cancel</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {apt.status === 'ongoing' && (
                        <TouchableOpacity
                          className="bg-accent-500 rounded-lg py-2 items-center mt-3"
                          onPress={() => handleStatusUpdate(apt.id, 'completed')}
                        >
                          <Text className="text-white font-semibold">Mark as Completed</Text>
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
