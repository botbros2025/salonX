import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, Client } from '../../types';
import { apiService } from '../../services/api';
import { formatCurrency, formatDate, getLoyaltyTierColor } from '../../utils/helpers';
import Card from '../../components/Card';

type RouteProps = RouteProp<RootStackParamList, 'ClientDetails'>;

export default function ClientDetailsScreen() {
  const route = useRoute<RouteProps>();
  const { clientId } = route.params;
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    loadClient();
  }, [clientId]);

  const loadClient = async () => {
    try {
      const response = await apiService.getClient(clientId);
      setClient(response.data?.client || null);
    } catch (error) {
      console.error('Failed to load client:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  if (!client) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-text-secondary">Client not found</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-4 pt-4 pb-8">
        {/* Client Header */}
        <Card className="mb-4">
          <View className="items-center mb-4">
            <View className={`w-16 h-16 rounded-full items-center justify-center mb-3 ${getLoyaltyTierColor(client.loyaltyTier)}`}>
              <Text className="text-white text-2xl font-bold">
                {client.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text className="text-2xl font-bold text-text-primary mb-1">{client.name}</Text>
            <View className={`px-3 py-1 rounded-full ${getLoyaltyTierColor(client.loyaltyTier)}`}>
              <Text className="text-white text-sm font-medium">{client.loyaltyTier} Member</Text>
            </View>
          </View>
        </Card>

        {/* Contact Info */}
        <Card className="mb-4">
          <Text className="text-lg font-bold text-text-primary mb-4">Contact Information</Text>
          <View className="gap-3">
            <View>
              <Text className="text-text-secondary text-sm mb-1">Phone</Text>
              <Text className="text-text-primary font-medium">{client.phone}</Text>
            </View>
            {client.email && (
              <View>
                <Text className="text-text-secondary text-sm mb-1">Email</Text>
                <Text className="text-text-primary font-medium">{client.email}</Text>
              </View>
            )}
            {client.address && (
              <View>
                <Text className="text-text-secondary text-sm mb-1">Address</Text>
                <Text className="text-text-primary">{client.address}</Text>
              </View>
            )}
            {client.dateOfBirth && (
              <View>
                <Text className="text-text-secondary text-sm mb-1">Date of Birth</Text>
                <Text className="text-text-primary">{formatDate(client.dateOfBirth)}</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Statistics */}
        <Card className="mb-4">
          <Text className="text-lg font-bold text-text-primary mb-4">Statistics</Text>
          <View className="flex-row flex-wrap gap-4">
            <View className="flex-1">
              <Text className="text-text-secondary text-sm mb-1">Total Visits</Text>
              <Text className="text-2xl font-bold text-text-primary">{client.totalVisits}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-text-secondary text-sm mb-1">Total Spend</Text>
              <Text className="text-2xl font-bold text-text-primary">
                {formatCurrency(client.totalSpend)}
              </Text>
            </View>
          </View>
        </Card>

        {client.notes && (
          <Card>
            <Text className="text-lg font-bold text-text-primary mb-2">Notes</Text>
            <Text className="text-text-primary">{client.notes}</Text>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

