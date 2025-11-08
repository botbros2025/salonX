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
import { formatTime, formatDate, getStatusColor } from '../../utils/helpers';
import Card from '../../components/Card';
import StatCard from '../../components/StatCard';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function StaffDashboardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState({
    todayCount: 0,
    completedCount: 0,
    upcomingCount: 0,
    todayRevenue: 0,
  });
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const storedUser = await authService.getStoredUser();
      setUser(storedUser);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const response = await apiService.getAppointments({
        startDate: today.toISOString(),
        endDate: tomorrow.toISOString(),
      });

      const appointments = response.data?.appointments || [];
      const myAppointments = appointments.filter(
        (apt: Appointment) => apt.staffId === storedUser?.staff?.id
      );

      setTodayAppointments(myAppointments);

      const completed = myAppointments.filter((apt: Appointment) => apt.status === 'completed');
      const upcoming = myAppointments.filter(
        (apt: Appointment) => apt.status === 'booked' || apt.status === 'ongoing'
      );

      const revenue = completed.reduce((sum: number, apt: Appointment) => {
        return sum + (apt.service?.price || 0);
      }, 0);

      setStats({
        todayCount: myAppointments.length,
        completedCount: completed.length,
        upcomingCount: upcoming.length,
        todayRevenue: revenue,
      });
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const markAttendance = async (type: 'in' | 'out') => {
    // This would call an attendance API endpoint
    // For now, just show an alert
    alert(`Attendance marked ${type === 'in' ? 'IN' : 'OUT'}`);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  const nextAppointment = todayAppointments.find(
    (apt) => apt.status === 'booked' && new Date(apt.scheduledAt) > new Date()
  );

  return (
    <ScrollView
      className="flex-1 bg-background"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="px-4 pt-4 pb-8">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-text-primary mb-2">
            Welcome, {user?.name || 'Staff'}
          </Text>
          <Text className="text-text-secondary">{formatDate(new Date(), 'EEEE, MMMM d')}</Text>
        </View>

        {/* Attendance Quick Action */}
        <Card className="mb-6 bg-primary-50 border-primary-200">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-lg font-bold text-text-primary mb-1">Mark Attendance</Text>
              <Text className="text-text-secondary text-sm">Start or end your shift</Text>
            </View>
            <View className="flex-row gap-2">
              <TouchableOpacity
                className="bg-accent-500 px-4 py-2 rounded-lg"
                onPress={() => markAttendance('in')}
              >
                <Text className="text-white font-semibold">IN</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-secondary-500 px-4 py-2 rounded-lg"
                onPress={() => markAttendance('out')}
              >
                <Text className="text-white font-semibold">OUT</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* Stats Grid */}
        <View className="flex-row flex-wrap gap-4 mb-6">
          <View className="w-[48%]">
            <StatCard
              title="Today's Appointments"
              value={stats.todayCount}
              icon="calendar"
              color="primary-500"
            />
          </View>
          <View className="w-[48%]">
            <StatCard
              title="Completed"
              value={stats.completedCount}
              icon="checkmark-circle"
              color="accent-500"
            />
          </View>
          <View className="w-[48%]">
            <StatCard
              title="Upcoming"
              value={stats.upcomingCount}
              icon="time"
              color="warning"
            />
          </View>
          <View className="w-[48%]">
            <StatCard
              title="Today's Earnings"
              value={`₹${stats.todayRevenue}`}
              icon="cash"
              color="accent-500"
            />
          </View>
        </View>

        {/* Next Appointment */}
        {nextAppointment && (
          <Card className="mb-6 bg-accent-50 border-accent-200">
            <View className="flex-row items-center mb-3">
              <Ionicons name="alarm" size={24} color="#16a34a" />
              <Text className="text-lg font-bold text-text-primary ml-2">Next Appointment</Text>
            </View>
            <View className="bg-surface rounded-lg p-4">
              <Text className="text-xl font-bold text-text-primary mb-2">
                {nextAppointment.client?.name || 'Client'}
              </Text>
              <Text className="text-text-secondary mb-2">{nextAppointment.service?.name}</Text>
              <View className="flex-row items-center">
                <Ionicons name="time" size={16} color="#64748b" />
                <Text className="text-text-primary font-medium ml-2">
                  {formatTime(nextAppointment.scheduledAt)}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Today's Schedule */}
        <Card>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-text-primary">Today's Schedule</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Schedule' as any)}>
              <Text className="text-primary-500 font-medium">View All</Text>
            </TouchableOpacity>
          </View>
          {todayAppointments.length === 0 ? (
            <View className="items-center py-8">
              <Ionicons name="calendar-outline" size={48} color="#94a3b8" />
              <Text className="text-text-secondary mt-4 text-center">
                No appointments scheduled for today
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {todayAppointments.slice(0, 5).map((apt) => (
                <TouchableOpacity
                  key={apt.id}
                  className="bg-neutral-50 rounded-lg p-3 border border-border"
                  onPress={() =>
                    navigation.navigate('AppointmentDetails' as any, { appointmentId: apt.id })
                  }
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-text-primary font-semibold mb-1">
                        {apt.client?.name || 'Client'}
                      </Text>
                      <Text className="text-text-secondary text-sm">{apt.service?.name}</Text>
                    </View>
                    <View className="items-end">
                      <View
                        className={`px-2 py-1 rounded ${getStatusColor(apt.status)} mb-1`}
                      >
                        <Text className="text-white text-xs font-medium capitalize">
                          {apt.status}
                        </Text>
                      </View>
                      <Text className="text-text-secondary text-xs">
                        {formatTime(apt.scheduledAt)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Card>
      </View>
    </ScrollView>
  );
}
