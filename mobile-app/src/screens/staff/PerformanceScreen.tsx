import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../../services/auth';
import { apiService } from '../../services/api';
import { formatCurrency } from '../../utils/helpers';
import Card from '../../components/Card';
import StatCard from '../../components/StatCard';

export default function StaffPerformanceScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [performance, setPerformance] = useState<any>(null);
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('month');

  useEffect(() => {
    loadPerformanceData();
  }, [period]);

  const loadPerformanceData = async () => {
    try {
      const storedUser = await authService.getStoredUser();
      if (!storedUser?.staff?.id) return;

      // Get staff details with performance
      const staffResponse = await apiService.getStaff();
      const myStaff = staffResponse.data?.staff?.find(
        (s: any) => s.id === storedUser.staff.id
      );

      if (myStaff) {
        setPerformance(myStaff.performance || {
          servicesCompleted: 0,
          revenueGenerated: 0,
          averageRating: 0,
          totalRatings: 0,
          attendanceRate: 0,
        });
      }

      // Get recent appointments
      const params: any = {
        staffId: storedUser.staff.id,
        status: 'completed',
      };

      if (period === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        params.startDate = weekAgo.toISOString();
      } else if (period === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        params.startDate = monthAgo.toISOString();
      }

      const appointmentsResponse = await apiService.getAppointments(params);
      setRecentAppointments(appointmentsResponse.data?.appointments?.slice(0, 10) || []);
    } catch (error) {
      console.error('Failed to load performance:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPerformanceData();
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
          <Text className="text-3xl font-bold text-text-primary mb-2">My Performance</Text>
          <Text className="text-text-secondary">Track your progress and achievements</Text>
        </View>

        {/* Period Selector */}
        <View className="flex-row gap-2 mb-6">
          {(['week', 'month', 'all'] as const).map((p) => (
            <View
              key={p}
              className={`flex-1 px-4 py-2 rounded-lg ${
                period === p ? 'bg-primary-500' : 'bg-surface border border-border'
              }`}
            >
              <Text
                className={`text-center font-medium ${
                  period === p ? 'text-white' : 'text-text-primary'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </View>
          ))}
        </View>

        {/* Performance Stats */}
        <View className="flex-row flex-wrap gap-4 mb-6">
          <View className="w-[48%]">
            <StatCard
              title="Services Completed"
              value={performance?.servicesCompleted || 0}
              icon="checkmark-circle"
              color="accent-500"
            />
          </View>
          <View className="w-[48%]">
            <StatCard
              title="Revenue Generated"
              value={formatCurrency(performance?.revenueGenerated || 0)}
              icon="cash"
              color="primary-500"
            />
          </View>
          <View className="w-[48%]">
            <StatCard
              title="Average Rating"
              value={performance?.averageRating?.toFixed(1) || '0.0'}
              icon="star"
              color="warning"
            />
          </View>
          <View className="w-[48%]">
            <StatCard
              title="Total Ratings"
              value={performance?.totalRatings || 0}
              icon="people"
              color="info"
            />
          </View>
        </View>

        {/* Rating Display */}
        {performance?.averageRating > 0 && (
          <Card className="mb-6">
            <Text className="text-lg font-bold text-text-primary mb-4">Customer Rating</Text>
            <View className="items-center">
              <View className="flex-row items-center mb-2">
                <Text className="text-4xl font-bold text-text-primary mr-2">
                  {performance.averageRating.toFixed(1)}
                </Text>
                <Ionicons name="star" size={32} color="#f59e0b" />
              </View>
              <Text className="text-text-secondary">
                Based on {performance.totalRatings} review{performance.totalRatings !== 1 ? 's' : ''}
              </Text>
              {/* Star Rating Visual */}
              <View className="flex-row mt-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= Math.round(performance.averageRating) ? 'star' : 'star-outline'}
                    size={24}
                    color={star <= Math.round(performance.averageRating) ? '#f59e0b' : '#d4d4d4'}
                  />
                ))}
              </View>
            </View>
          </Card>
        )}

        {/* Recent Completed Appointments */}
        <Card>
          <Text className="text-lg font-bold text-text-primary mb-4">Recent Services</Text>
          {recentAppointments.length === 0 ? (
            <View className="items-center py-8">
              <Ionicons name="checkmark-circle-outline" size={48} color="#94a3b8" />
              <Text className="text-text-secondary mt-4 text-center">
                No completed services yet
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {recentAppointments.map((apt: any) => (
                <View
                  key={apt.id}
                  className="bg-neutral-50 rounded-lg p-3 border border-border"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-text-primary font-semibold mb-1">
                        {apt.client?.name || 'Client'}
                      </Text>
                      <Text className="text-text-secondary text-sm">{apt.service?.name}</Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-text-primary font-semibold">
                        {formatCurrency(apt.service?.price || 0)}
                      </Text>
                      <Text className="text-text-secondary text-xs mt-1">
                        {new Date(apt.completedAt || apt.scheduledAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Card>
      </View>
    </ScrollView>
  );
}
