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
import { formatDateTime, getStatusColor } from '../../utils/helpers';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AppointmentsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadAppointments();
  }, [filter]);

  const loadAppointments = async () => {
    try {
      const params: any = {};
      if (filter !== 'all') {
        params.status = filter;
      }
      const response = await apiService.getAppointments(params);
      setAppointments(response.data?.appointments || []);
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

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'booked', label: 'Booked' },
    { key: 'ongoing', label: 'Ongoing' },
    { key: 'completed', label: 'Completed' },
  ];

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header with Add Button */}
      <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-text-primary">Appointments</Text>
        <View className="flex-row gap-2">
          <TouchableOpacity
            className="bg-primary-500 rounded-full w-10 h-10 items-center justify-center"
            onPress={() => navigation.navigate('CalendarView' as any)}
          >
            <Ionicons name="calendar" size={20} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-primary-500 rounded-full w-10 h-10 items-center justify-center"
            onPress={() => navigation.navigate('CreateAppointment' as any)}
          >
            <Ionicons name="add" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 mb-4"
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
            <View className="gap-3">
              {appointments.map((apt) => (
                <TouchableOpacity
                  key={apt.id}
                  className="bg-surface rounded-xl p-4 border border-border"
                  onPress={() => navigation.navigate('AppointmentDetails' as any, { appointmentId: apt.id })}
                >
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-text-primary mb-1">
                        {apt.client?.name || 'Client'}
                      </Text>
                      <Text className="text-text-secondary mb-1">
                        {apt.service?.name}
                      </Text>
                      <View className="flex-row items-center mt-2">
                        <Ionicons name="person" size={16} color="#64748b" />
                        <Text className="text-text-secondary text-sm ml-1">
                          {apt.staff?.user?.name}
                        </Text>
                      </View>
                    </View>
                    <View className={`px-3 py-1 rounded-full ${getStatusColor(apt.status)}`}>
                      <Text className="text-white text-xs font-medium capitalize">
                        {apt.status}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center justify-between pt-3 border-t border-border">
                    <View className="flex-row items-center">
                      <Ionicons name="time" size={16} color="#64748b" />
                      <Text className="text-text-secondary text-sm ml-1">
                        {formatDateTime(apt.scheduledAt)}
                      </Text>
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

