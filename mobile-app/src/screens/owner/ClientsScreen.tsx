import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, Client } from '../../types';
import { apiService } from '../../services/api';
import { formatCurrency, getLoyaltyTierColor } from '../../utils/helpers';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ClientsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadClients();
  }, [searchQuery]);

  const loadClients = async () => {
    try {
      const params: any = {};
      if (searchQuery) {
        params.search = searchQuery;
      }
      const response = await apiService.getClients(params);
      setClients(response.data?.clients || []);
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadClients();
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
      {/* Search Bar */}
      <View className="px-4 pt-4 pb-2">
        <View className="bg-surface border border-border rounded-lg px-4 py-3 flex-row items-center">
          <Ionicons name="search" size={20} color="#94a3b8" />
          <TextInput
            className="flex-1 ml-2 text-text-primary"
            placeholder="Search clients..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Clients List */}
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="px-4 pb-8">
          {clients.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Ionicons name="people-outline" size={64} color="#94a3b8" />
              <Text className="text-text-secondary text-center mt-4">
                No clients found
              </Text>
            </View>
          ) : (
            <View className="gap-3 mt-2">
              {clients.map((client) => (
                <TouchableOpacity
                  key={client.id}
                  className="bg-surface rounded-xl p-4 border border-border"
                  onPress={() => navigation.navigate('ClientDetails' as any, { clientId: client.id })}
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <View className="flex-row items-center mb-2">
                        <Text className="text-lg font-bold text-text-primary">
                          {client.name}
                        </Text>
                        <View className={`ml-2 px-2 py-1 rounded ${getLoyaltyTierColor(client.loyaltyTier)}`}>
                          <Text className="text-white text-xs font-medium">
                            {client.loyaltyTier}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-text-secondary mb-1">{client.phone}</Text>
                      {client.email && (
                        <Text className="text-text-secondary text-sm">{client.email}</Text>
                      )}
                      <View className="flex-row items-center mt-3 gap-4">
                        <View className="flex-row items-center">
                          <Ionicons name="calendar" size={16} color="#64748b" />
                          <Text className="text-text-secondary text-sm ml-1">
                            {client.totalVisits} visits
                          </Text>
                        </View>
                        <View className="flex-row items-center">
                          <Ionicons name="cash" size={16} color="#64748b" />
                          <Text className="text-text-secondary text-sm ml-1">
                            {formatCurrency(client.totalSpend)}
                          </Text>
                        </View>
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

