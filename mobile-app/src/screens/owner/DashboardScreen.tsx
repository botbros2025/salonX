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
import { RootStackParamList } from '../../types';
import { apiService } from '../../services/api';
import { authService } from '../../services/auth';
import StatCard from '../../components/StatCard';
import Card from '../../components/Card';
import { formatCurrency } from '../../utils/helpers';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function OwnerDashboardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayAppointments: 0,
    pendingAppointments: 0,
    lowStockItems: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [salesRes, appointmentsRes, inventoryRes] = await Promise.all([
        apiService.getSalesOverview(),
        apiService.getAppointments({ status: 'booked' }),
        apiService.getLowStockAlerts(),
      ]);

      setStats({
        todayRevenue: salesRes.data?.overview?.daily || 0,
        todayAppointments: appointmentsRes.data?.appointments?.length || 0,
        pendingAppointments: appointmentsRes.data?.appointments?.filter(
          (apt: any) => apt.status === 'booked'
        ).length || 0,
        lowStockItems: inventoryRes.data?.items?.length || 0,
      });

      setRecentAppointments(appointmentsRes.data?.appointments?.slice(0, 5) || []);
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

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="px-4 pt-4 pb-8">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-text-primary mb-2">Dashboard</Text>
          <Text className="text-text-secondary">Welcome back! Here's your overview</Text>
        </View>

        {/* Stats Grid */}
        <View className="flex-row flex-wrap gap-4 mb-6">
          <View className="w-[48%]">
            <StatCard
              title="Today's Revenue"
              value={formatCurrency(stats.todayRevenue)}
              icon="cash"
              color="accent-500"
            />
          </View>
          <View className="w-[48%]">
            <StatCard
              title="Today's Appointments"
              value={stats.todayAppointments}
              icon="calendar"
              color="primary-500"
            />
          </View>
          <View className="w-[48%]">
            <StatCard
              title="Pending"
              value={stats.pendingAppointments}
              icon="time"
              color="warning"
            />
          </View>
          <View className="w-[48%]">
            <StatCard
              title="Low Stock"
              value={stats.lowStockItems}
              icon="alert"
              color="secondary-500"
            />
          </View>
        </View>

        {/* Quick Actions */}
        <Card className="mb-6">
          <Text className="text-lg font-bold text-text-primary mb-4">Quick Actions</Text>
          <View className="flex-row flex-wrap gap-3">
            <TouchableOpacity
              className="bg-primary-100 rounded-lg px-4 py-3 flex-1 min-w-[48%]"
              onPress={() => navigation.navigate('CreateAppointment' as any)}
            >
              <View className="flex-row items-center">
                <Ionicons name="add-circle" size={20} color="#8b5cf6" />
                <Text className="text-primary-600 font-medium ml-2">New Appointment</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-accent-100 rounded-lg px-4 py-3 flex-1 min-w-[48%]"
              onPress={() => navigation.navigate('Clients' as any)}
            >
              <View className="flex-row items-center">
                <Ionicons name="person-add" size={20} color="#22c55e" />
                <Text className="text-accent-600 font-medium ml-2">Add Client</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-warning rounded-lg px-4 py-3 flex-1 min-w-[48%]"
              onPress={() => navigation.navigate('Inventory' as any)}
            >
              <View className="flex-row items-center">
                <Ionicons name="cube" size={20} color="#ffffff" />
                <Text className="text-white font-medium ml-2">Inventory</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-info rounded-lg px-4 py-3 flex-1 min-w-[48%]"
              onPress={() => navigation.navigate('Analytics' as any)}
            >
              <View className="flex-row items-center">
                <Ionicons name="stats-chart" size={20} color="#ffffff" />
                <Text className="text-white font-medium ml-2">Analytics</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Recent Appointments */}
        <Card>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-text-primary">Recent Appointments</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Appointments' as any)}>
              <Text className="text-primary-500 font-medium">View All</Text>
            </TouchableOpacity>
          </View>
          {recentAppointments.length === 0 ? (
            <Text className="text-text-secondary text-center py-4">No appointments today</Text>
          ) : (
            <View className="gap-3">
              {recentAppointments.map((apt: any) => (
                <TouchableOpacity
                  key={apt.id}
                  className="bg-neutral-50 rounded-lg p-3 border border-border"
                  onPress={() => navigation.navigate('AppointmentDetails' as any, { appointmentId: apt.id })}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-text-primary font-semibold mb-1">
                        {apt.client?.name || 'Client'}
                      </Text>
                      <Text className="text-text-secondary text-sm">
                        {apt.service?.name} • {apt.staff?.user?.name}
                      </Text>
                    </View>
                    <View className="items-end">
                      <View className={`px-2 py-1 rounded ${apt.status === 'booked' ? 'bg-primary-100' : 'bg-accent-100'}`}>
                        <Text className={`text-xs font-medium ${apt.status === 'booked' ? 'text-primary-600' : 'text-accent-600'}`}>
                          {apt.status}
                        </Text>
                      </View>
                      <Text className="text-text-secondary text-xs mt-1">
                        {new Date(apt.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

