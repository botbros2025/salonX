import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import { formatCurrency } from '../../utils/helpers';
import Card from '../../components/Card';

export default function StaffScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [staff, setStaff] = useState<any[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      const response = await apiService.getStaff();
      setStaff(response.data?.staff || []);
    } catch (error) {
      console.error('Failed to load staff:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStaff();
  };

  const loadLeaderboard = async () => {
    try {
      const response = await apiService.getStaffLeaderboard();
      const leaderboard = response.data?.staff || [];
      setStaff(leaderboard);
      setShowLeaderboard(true);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
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
      {/* Header */}
      <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-text-primary">Staff</Text>
        <View className="flex-row gap-2">
          <TouchableOpacity
            className={`px-4 py-2 rounded-lg ${
              showLeaderboard ? 'bg-primary-500' : 'bg-neutral-200'
            }`}
            onPress={() => {
              if (showLeaderboard) {
                loadStaff();
                setShowLeaderboard(false);
              } else {
                loadLeaderboard();
              }
            }}
          >
            <Text
              className={`font-medium ${showLeaderboard ? 'text-white' : 'text-text-primary'}`}
            >
              {showLeaderboard ? 'All Staff' : 'Leaderboard'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity className="bg-primary-500 rounded-full w-10 h-10 items-center justify-center">
            <Ionicons name="add" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Staff List */}
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="px-4 pb-8">
          {staff.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Ionicons name="people-outline" size={64} color="#94a3b8" />
              <Text className="text-text-secondary text-center mt-4">No staff found</Text>
            </View>
          ) : (
            <View className="gap-3 mt-2">
              {staff.map((s, index) => (
                <Card key={s.id}>
                  <View className="flex-row items-start">
                    {showLeaderboard && (
                      <View className="w-8 h-8 bg-primary-500 rounded-full items-center justify-center mr-3">
                        <Text className="text-white font-bold">#{index + 1}</Text>
                      </View>
                    )}
                    <View className="w-12 h-12 bg-primary-500 rounded-full items-center justify-center mr-3">
                      <Text className="text-white text-lg font-bold">
                        {s.user?.name?.charAt(0).toUpperCase() || 'S'}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-text-primary mb-1">
                        {s.user?.name}
                      </Text>
                      <Text className="text-text-secondary mb-2">{s.role}</Text>
                      {s.performance && (
                        <View className="flex-row items-center gap-4">
                          <View className="flex-row items-center">
                            <Ionicons name="checkmark-circle" size={16} color="#64748b" />
                            <Text className="text-text-secondary text-sm ml-1">
                              {s.performance.servicesCompleted} services
                            </Text>
                          </View>
                          <View className="flex-row items-center">
                            <Ionicons name="cash" size={16} color="#64748b" />
                            <Text className="text-text-secondary text-sm ml-1">
                              {formatCurrency(s.performance.revenueGenerated)}
                            </Text>
                          </View>
                          {s.performance.averageRating > 0 && (
                            <View className="flex-row items-center">
                              <Ionicons name="star" size={16} color="#f59e0b" />
                              <Text className="text-text-secondary text-sm ml-1">
                                {s.performance.averageRating.toFixed(1)}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                      {s.shiftStart && s.shiftEnd && (
                        <View className="flex-row items-center mt-2">
                          <Ionicons name="time" size={16} color="#64748b" />
                          <Text className="text-text-secondary text-sm ml-1">
                            {s.shiftStart} - {s.shiftEnd}
                          </Text>
                        </View>
                      )}
                    </View>
                    {!s.isActive && (
                      <View className="px-2 py-1 bg-neutral-200 rounded">
                        <Text className="text-neutral-600 text-xs">Inactive</Text>
                      </View>
                    )}
                  </View>
                </Card>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
