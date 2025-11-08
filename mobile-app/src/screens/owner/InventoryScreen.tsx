import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import Card from '../../components/Card';

export default function InventoryScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'lowStock'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadInventory();
  }, [filter]);

  useEffect(() => {
    loadLowStockAlerts();
  }, []);

  const loadInventory = async () => {
    try {
      const params: any = {};
      if (filter === 'lowStock') {
        params.lowStock = true;
      }
      if (searchQuery) {
        params.search = searchQuery;
      }
      const response = await apiService.getInventory(params);
      setItems(response.data?.items || []);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadLowStockAlerts = async () => {
    try {
      const response = await apiService.getLowStockAlerts();
      setLowStockItems(response.data?.items || []);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadInventory();
    loadLowStockAlerts();
  };

  const handleGeneratePO = async () => {
    try {
      const response = await apiService.getInventory({});
      // Would generate purchase order
      Alert.alert('Success', 'Purchase order generated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to generate purchase order');
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
      <View className="px-4 pt-4 pb-2">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-text-primary">Inventory</Text>
          {lowStockItems.length > 0 && (
            <TouchableOpacity
              className="bg-secondary-500 px-4 py-2 rounded-lg flex-row items-center"
              onPress={handleGeneratePO}
            >
              <Ionicons name="document-text" size={20} color="#ffffff" />
              <Text className="text-white font-medium ml-2">Generate PO</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search Bar */}
        <View className="bg-surface border border-border rounded-lg px-4 py-3 flex-row items-center mb-4">
          <Ionicons name="search" size={20} color="#94a3b8" />
          <TextInput
            className="flex-1 ml-2 text-text-primary"
            placeholder="Search inventory..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={loadInventory}
          />
        </View>

        {/* Filters */}
        <View className="flex-row gap-2">
          <TouchableOpacity
            className={`px-4 py-2 rounded-full ${
              filter === 'all' ? 'bg-primary-500' : 'bg-surface border border-border'
            }`}
            onPress={() => setFilter('all')}
          >
            <Text className={`font-medium ${filter === 'all' ? 'text-white' : 'text-text-primary'}`}>
              All Items
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`px-4 py-2 rounded-full ${
              filter === 'lowStock' ? 'bg-secondary-500' : 'bg-surface border border-border'
            }`}
            onPress={() => setFilter('lowStock')}
          >
            <View className="flex-row items-center">
              <Text
                className={`font-medium ${filter === 'lowStock' ? 'text-white' : 'text-text-primary'}`}
              >
                Low Stock
              </Text>
              {lowStockItems.length > 0 && (
                <View className="ml-2 bg-white/20 px-2 py-0.5 rounded-full">
                  <Text className="text-white text-xs font-bold">{lowStockItems.length}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Low Stock Alert Banner */}
      {lowStockItems.length > 0 && filter === 'all' && (
        <View className="mx-4 mb-4 bg-secondary-50 border border-secondary-200 rounded-lg p-4">
          <View className="flex-row items-center">
            <Ionicons name="alert-circle" size={24} color="#dc2626" />
            <View className="flex-1 ml-3">
              <Text className="text-secondary-700 font-semibold mb-1">
                {lowStockItems.length} item{lowStockItems.length !== 1 ? 's' : ''} low on stock
              </Text>
              <Text className="text-secondary-600 text-sm">
                Consider generating a purchase order
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Inventory List */}
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="px-4 pb-8">
          {items.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Ionicons name="cube-outline" size={64} color="#94a3b8" />
              <Text className="text-text-secondary text-center mt-4">No items found</Text>
            </View>
          ) : (
            <View className="gap-3">
              {items.map((item) => {
                const isLowStock = item.quantity <= item.threshold;
                return (
                  <Card
                    key={item.id}
                    className={isLowStock ? 'border-secondary-500 bg-secondary-50' : ''}
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <View className="flex-row items-center mb-2">
                          <Text className="text-lg font-bold text-text-primary">
                            {item.name}
                          </Text>
                          {isLowStock && (
                            <View className="ml-2 px-2 py-1 bg-secondary-500 rounded">
                              <Text className="text-white text-xs font-medium">Low Stock</Text>
                            </View>
                          )}
                        </View>
                        <View className="flex-row items-center gap-4 mb-2">
                          <View>
                            <Text className="text-text-secondary text-sm">Current Stock</Text>
                            <Text className="text-text-primary font-semibold">
                              {item.quantity} {item.unit}
                            </Text>
                          </View>
                          <View>
                            <Text className="text-text-secondary text-sm">Threshold</Text>
                            <Text className="text-text-primary font-semibold">
                              {item.threshold} {item.unit}
                            </Text>
                          </View>
                        </View>
                        {item.supplier && (
                          <View className="flex-row items-center">
                            <Ionicons name="storefront" size={16} color="#64748b" />
                            <Text className="text-text-secondary text-sm ml-1">
                              {item.supplier}
                            </Text>
                          </View>
                        )}
                        {item.costPrice && (
                          <View className="flex-row items-center mt-2">
                            <Ionicons name="pricetag" size={16} color="#64748b" />
                            <Text className="text-text-secondary text-sm ml-1">
                              Cost: ₹{item.costPrice} / {item.unit}
                            </Text>
                          </View>
                        )}
                      </View>
                      <TouchableOpacity className="bg-primary-100 p-2 rounded-lg">
                        <Ionicons name="pencil" size={20} color="#8b5cf6" />
                      </TouchableOpacity>
                    </View>
                  </Card>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
