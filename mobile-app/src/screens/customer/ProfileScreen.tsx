import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../../services/auth';
import { apiService } from '../../services/api';
import { formatCurrency, getLoyaltyTierColor } from '../../utils/helpers';
import Card from '../../components/Card';

export default function CustomerProfileScreen() {
  const [loading, setLoading] = useState(false);
  const [client, setClient] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const storedUser = await authService.getStoredUser();
      setUser(storedUser);

      // Get client data
      const clientsResponse = await apiService.getClients();
      const myClient = clientsResponse.data?.clients?.find(
        (c: any) => c.phone === storedUser?.phone
      );
      setClient(myClient);
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            await authService.logout();
            setLoading(false);
          },
        },
      ]
    );
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-4 pt-4 pb-8">
        {/* Profile Header */}
        <Card className="mb-6">
          <View className="items-center mb-4">
            <View
              className={`w-24 h-24 rounded-full items-center justify-center mb-3 ${getLoyaltyTierColor(
                client?.loyaltyTier || 'Silver'
              )}`}
            >
              <Text className="text-white text-4xl font-bold">
                {client?.name?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || 'C'}
              </Text>
            </View>
            <Text className="text-2xl font-bold text-text-primary mb-1">
              {client?.name || user?.name || 'Customer'}
            </Text>
            <View
              className={`px-4 py-2 rounded-full ${getLoyaltyTierColor(
                client?.loyaltyTier || 'Silver'
              )}`}
            >
              <Text className="text-white font-bold">
                {client?.loyaltyTier || 'Silver'} Member
              </Text>
            </View>
          </View>
        </Card>

        {/* Contact Information */}
        <Card className="mb-6">
          <Text className="text-lg font-bold text-text-primary mb-4">Contact Information</Text>
          <View className="gap-4">
            <View>
              <Text className="text-text-secondary text-sm mb-1">Phone</Text>
              <Text className="text-text-primary font-medium">{client?.phone || user?.phone}</Text>
            </View>
            {client?.email && (
              <View>
                <Text className="text-text-secondary text-sm mb-1">Email</Text>
                <Text className="text-text-primary font-medium">{client.email}</Text>
              </View>
            )}
            {client?.address && (
              <View>
                <Text className="text-text-secondary text-sm mb-1">Address</Text>
                <Text className="text-text-primary">{client.address}</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Statistics */}
        {client && (
          <Card className="mb-6">
            <Text className="text-lg font-bold text-text-primary mb-4">Your Statistics</Text>
            <View className="flex-row flex-wrap gap-4">
              <View className="flex-1 min-w-[48%]">
                <View className="bg-primary-50 rounded-lg p-4">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="calendar" size={24} color="#8b5cf6" />
                  </View>
                  <Text className="text-text-secondary text-sm mb-1">Total Visits</Text>
                  <Text className="text-2xl font-bold text-text-primary">
                    {client.totalVisits}
                  </Text>
                </View>
              </View>
              <View className="flex-1 min-w-[48%]">
                <View className="bg-accent-50 rounded-lg p-4">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="cash" size={24} color="#22c55e" />
                  </View>
                  <Text className="text-text-secondary text-sm mb-1">Total Spent</Text>
                  <Text className="text-2xl font-bold text-text-primary">
                    {formatCurrency(client.totalSpend)}
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        )}

        {/* Loyalty Benefits */}
        <Card className="mb-6">
          <Text className="text-lg font-bold text-text-primary mb-4">Loyalty Benefits</Text>
          <View className="gap-3">
            {client?.loyaltyTier === 'Platinum' && (
              <View className="flex-row items-center">
                <Ionicons name="star" size={20} color="#f59e0b" />
                <Text className="text-text-primary ml-3">20% discount on all services</Text>
              </View>
            )}
            {client?.loyaltyTier === 'Gold' && (
              <View className="flex-row items-center">
                <Ionicons name="star" size={20} color="#f59e0b" />
                <Text className="text-text-primary ml-3">15% discount on all services</Text>
              </View>
            )}
            {(!client?.loyaltyTier || client.loyaltyTier === 'Silver') && (
              <View className="flex-row items-center">
                <Ionicons name="star" size={20} color="#f59e0b" />
                <Text className="text-text-primary ml-3">10% discount on all services</Text>
              </View>
            )}
            <View className="flex-row items-center">
              <Ionicons name="gift" size={20} color="#8b5cf6" />
              <Text className="text-text-primary ml-3">Birthday special offers</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="notifications" size={20} color="#8b5cf6" />
              <Text className="text-text-primary ml-3">Priority booking</Text>
            </View>
          </View>
        </Card>

        {/* Settings */}
        <Card className="mb-6">
          <TouchableOpacity className="py-4 border-b border-border flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="settings" size={20} color="#64748b" />
              <Text className="text-text-primary font-medium ml-3">Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>
          <TouchableOpacity className="py-4 border-b border-border flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="help-circle" size={20} color="#64748b" />
              <Text className="text-text-primary font-medium ml-3">Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>
        </Card>

        {/* Logout */}
        <TouchableOpacity
          className="bg-secondary-500 rounded-lg py-4 items-center"
          onPress={handleLogout}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white font-semibold">Logout</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
