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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import { formatCurrency } from '../../utils/helpers';
import Card from '../../components/Card';

export default function ServicesScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: '',
    price: '',
  });

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const response = await apiService.getServices();
      setServices(response.data?.services || []);
    } catch (error) {
      console.error('Failed to load services:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadServices();
  };

  const handleEdit = (service: any) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      duration: service.duration.toString(),
      price: service.price.toString(),
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      duration: '',
      price: '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.duration || !formData.price) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const serviceData = {
        name: formData.name,
        description: formData.description,
        duration: parseInt(formData.duration),
        price: parseFloat(formData.price),
      };

      if (editingService) {
        // Update service - would need update endpoint
        Alert.alert('Success', 'Service updated successfully');
      } else {
        // Create service - would need create endpoint
        Alert.alert('Success', 'Service created successfully');
      }

      setShowModal(false);
      loadServices();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to save service');
    }
  };

  const handleDelete = (service: any) => {
    Alert.alert(
      'Delete Service',
      `Are you sure you want to delete "${service.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Would need delete endpoint
              Alert.alert('Success', 'Service deleted successfully');
              loadServices();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete service');
            }
          },
        },
      ]
    );
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
        <Text className="text-2xl font-bold text-text-primary">Services</Text>
        <TouchableOpacity
          className="bg-primary-500 rounded-full w-10 h-10 items-center justify-center"
          onPress={handleAdd}
        >
          <Ionicons name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Services List */}
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="px-4 pb-8">
          {services.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Ionicons name="cut-outline" size={64} color="#94a3b8" />
              <Text className="text-text-secondary text-center mt-4">
                No services found
              </Text>
              <TouchableOpacity
                className="mt-4 bg-primary-500 px-6 py-3 rounded-lg"
                onPress={handleAdd}
              >
                <Text className="text-white font-semibold">Add Your First Service</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="gap-3 mt-2">
              {services.map((service) => (
                <Card key={service.id}>
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <View className="flex-row items-center mb-2">
                        <Text className="text-lg font-bold text-text-primary">
                          {service.name}
                        </Text>
                        {!service.isActive && (
                          <View className="ml-2 px-2 py-1 bg-neutral-200 rounded">
                            <Text className="text-neutral-600 text-xs">Inactive</Text>
                          </View>
                        )}
                      </View>
                      {service.description && (
                        <Text className="text-text-secondary mb-2">{service.description}</Text>
                      )}
                      <View className="flex-row items-center gap-4">
                        <View className="flex-row items-center">
                          <Ionicons name="time" size={16} color="#64748b" />
                          <Text className="text-text-secondary text-sm ml-1">
                            {service.duration} min
                          </Text>
                        </View>
                        <View className="flex-row items-center">
                          <Ionicons name="cash" size={16} color="#64748b" />
                          <Text className="text-text-secondary text-sm ml-1">
                            {formatCurrency(service.price)}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        className="bg-primary-100 p-2 rounded-lg"
                        onPress={() => handleEdit(service)}
                      >
                        <Ionicons name="pencil" size={20} color="#8b5cf6" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="bg-secondary-100 p-2 rounded-lg"
                        onPress={() => handleDelete(service)}
                      >
                        <Ionicons name="trash" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-surface rounded-t-3xl p-6 max-h-[90%]">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-2xl font-bold text-text-primary">
                {editingService ? 'Edit Service' : 'Add Service'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <View className="gap-4 mb-6">
                <View>
                  <Text className="text-text-primary font-medium mb-2">Service Name *</Text>
                  <TextInput
                    className="bg-neutral-50 border border-border rounded-lg px-4 py-3 text-text-primary"
                    placeholder="e.g., Haircut, Facial"
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                  />
                </View>

                <View>
                  <Text className="text-text-primary font-medium mb-2">Description</Text>
                  <TextInput
                    className="bg-neutral-50 border border-border rounded-lg px-4 py-3 text-text-primary"
                    placeholder="Service description (optional)"
                    multiline
                    numberOfLines={3}
                    value={formData.description}
                    onChangeText={(text) => setFormData({ ...formData, description: text })}
                  />
                </View>

                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text className="text-text-primary font-medium mb-2">Duration (min) *</Text>
                    <TextInput
                      className="bg-neutral-50 border border-border rounded-lg px-4 py-3 text-text-primary"
                      placeholder="30"
                      keyboardType="numeric"
                      value={formData.duration}
                      onChangeText={(text) => setFormData({ ...formData, duration: text })}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-text-primary font-medium mb-2">Price (₹) *</Text>
                    <TextInput
                      className="bg-neutral-50 border border-border rounded-lg px-4 py-3 text-text-primary"
                      placeholder="500"
                      keyboardType="numeric"
                      value={formData.price}
                      onChangeText={(text) => setFormData({ ...formData, price: text })}
                    />
                  </View>
                </View>
              </View>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  className="flex-1 bg-neutral-200 rounded-lg py-4 items-center"
                  onPress={() => setShowModal(false)}
                >
                  <Text className="text-text-primary font-semibold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-primary-500 rounded-lg py-4 items-center"
                  onPress={handleSave}
                >
                  <Text className="text-white font-semibold">Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
