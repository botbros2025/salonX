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
import { formatTime, formatDate, getStatusColor, getLoyaltyTierColor } from '../../utils/helpers';
import Card from '../../components/Card';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CustomerDashboardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [client, setClient] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const storedUser = await authService.getStoredUser();
      if (!storedUser) return;

      // Get client data
      const clientsResponse = await apiService.getClients();
      const myClient = clientsResponse.data?.clients?.find(
        (c: any) => c.phone === storedUser.phone
      );
      setClient(myClient);

      // Get upcoming appointments
      const today = new Date();
      const response = await apiService.getAppointments({
        clientId: myClient?.id,
        startDate: today.toISOString(),
      });

      const appointments = response.data?.appointments || [];
      const upcoming = appointments
        .filter(
          (apt: Appointment) =>
            apt.status === 'booked' || apt.status === 'ongoing'
        )
        .sort(
          (a: Appointment, b: Appointment) =>
            new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
        )
        .slice(0, 3);

      setUpcomingAppointments(upcoming);
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
        {/* Welcome Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-text-primary mb-2">
            Welcome back{client?.name ? `, ${client.name.split(' ')[0]}` : ''}!
          </Text>
          <Text className="text-text-secondary">{formatDate(new Date(), 'EEEE, MMMM d')}</Text>
        </View>

        {/* Loyalty Card */}
        {client && (
          <Card className="mb-6 bg-gradient-to-r from-primary-500 to-primary-600">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white text-sm mb-1">Loyalty Status</Text>
                <View className={`px-3 py-1 rounded-full bg-white/20 mb-2 self-start`}>
                  <Text className="text-white font-bold">{client.loyaltyTier} Member</Text>
                </View>
                <Text className="text-white/80 text-sm">
                  {client.totalVisits} visits • {client.totalSpend > 0 ? `₹${client.totalSpend.toLocaleString()}` : 'New customer'}
                </Text>
              </View>
              <Ionicons name="trophy" size={48} color="#ffffff" opacity={0.8} />
            </View>
          </Card>
        )}

        {/* Quick Actions */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-text-primary mb-4">Quick Actions</Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 bg-primary-500 rounded-xl p-4 items-center"
              onPress={() => navigation.navigate('Bookings' as any)}
            >
              <Ionicons name="add-circle" size={32} color="#ffffff" />
              <Text className="text-white font-semibold mt-2">Book Now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-accent-500 rounded-xl p-4 items-center"
              onPress={() => navigation.navigate('History' as any)}
            >
              <Ionicons name="time" size={32} color="#ffffff" />
              <Text className="text-white font-semibold mt-2">History</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Upcoming Appointments */}
        <Card>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-text-primary">Upcoming Appointments</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Bookings' as any)}>
              <Text className="text-primary-500 font-medium">View All</Text>
            </TouchableOpacity>
          </View>
          {upcomingAppointments.length === 0 ? (
            <View className="items-center py-8">
              <Ionicons name="calendar-outline" size={48} color="#94a3b8" />
              <Text className="text-text-secondary mt-4 text-center">
                No upcoming appointments
              </Text>
              <TouchableOpacity
                className="mt-4 bg-primary-500 px-6 py-3 rounded-lg"
                onPress={() => navigation.navigate('Bookings' as any)}
              >
                <Text className="text-white font-semibold">Book Your First Appointment</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="gap-3">
              {upcomingAppointments.map((apt) => (
                <TouchableOpacity
                  key={apt.id}
                  className="bg-neutral-50 rounded-lg p-4 border border-border"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-text-primary mb-1">
                        {apt.service?.name}
                      </Text>
                      <Text className="text-text-secondary mb-2">
                        {formatDate(apt.scheduledAt, 'EEEE, MMM d')}
                      </Text>
                      <View className="flex-row items-center">
                        <Ionicons name="time" size={16} color="#64748b" />
                        <Text className="text-text-primary font-medium ml-1">
                          {formatTime(apt.scheduledAt)}
                        </Text>
                        <Text className="text-text-secondary mx-2">•</Text>
                        <Text className="text-text-secondary">
                          {apt.staff?.user?.name || 'Staff'}
                        </Text>
                      </View>
                    </View>
                    <View className={`px-3 py-1 rounded-full ${getStatusColor(apt.status)}`}>
                      <Text className="text-white text-xs font-medium capitalize">
                        {apt.status}
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
