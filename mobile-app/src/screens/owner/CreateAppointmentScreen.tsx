import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types';
import { apiService } from '../../services/api';
import { formatDateTime } from '../../utils/helpers';
import CustomDateTimePicker from '../../components/DateTimePicker';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CreateAppointmentScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    serviceId: '',
    staffId: '',
    branchId: '',
    scheduledAt: new Date().toISOString(),
    notes: '',
  });
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [selectedBranch, setSelectedBranch] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [servicesRes, staffRes, branchesRes] = await Promise.all([
        apiService.getServices(),
        apiService.getStaff(),
        apiService.getBranches(),
      ]);
      setServices(servicesRes.data?.services || []);
      setStaff(staffRes.data?.staff || []);
      setBranches(branchesRes.data?.branches || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleCreate = async () => {
    if (!formData.clientName || !formData.clientPhone || !formData.serviceId || !formData.staffId || !formData.branchId) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await apiService.createAppointment(formData);
      Alert.alert('Success', 'Appointment created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to create appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-4 pt-4 pb-8">
        {/* Client Info */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-text-primary mb-4">Client Information</Text>
          <View className="mb-4">
            <Text className="text-text-primary font-medium mb-2">Client Name *</Text>
            <TextInput
              className="bg-surface border border-border rounded-lg px-4 py-3 text-text-primary"
              placeholder="Enter client name"
              value={formData.clientName}
              onChangeText={(text) => setFormData({ ...formData, clientName: text })}
            />
          </View>
          <View className="mb-4">
            <Text className="text-text-primary font-medium mb-2">Phone Number *</Text>
            <TextInput
              className="bg-surface border border-border rounded-lg px-4 py-3 text-text-primary"
              placeholder="+91 1234567890"
              keyboardType="phone-pad"
              value={formData.clientPhone}
              onChangeText={(text) => setFormData({ ...formData, clientPhone: text })}
            />
          </View>
        </View>

        {/* Service Selection */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-text-primary mb-4">Service</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            <View className="flex-row gap-3">
              {services.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  className={`px-4 py-3 rounded-lg border ${
                    formData.serviceId === service.id
                      ? 'bg-primary-500 border-primary-500'
                      : 'bg-surface border-border'
                  }`}
                  onPress={() => {
                    setFormData({ ...formData, serviceId: service.id });
                    setSelectedService(service);
                  }}
                >
                  <Text
                    className={`font-medium ${
                      formData.serviceId === service.id ? 'text-white' : 'text-text-primary'
                    }`}
                  >
                    {service.name}
                  </Text>
                  <Text
                    className={`text-sm ${
                      formData.serviceId === service.id ? 'text-white' : 'text-text-secondary'
                    }`}
                  >
                    ₹{service.price} • {service.duration} min
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Staff Selection */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-text-primary mb-4">Staff</Text>
          <View className="gap-2">
            {staff.map((s) => (
              <TouchableOpacity
                key={s.id}
                className={`p-4 rounded-lg border ${
                  formData.staffId === s.id
                    ? 'bg-primary-100 border-primary-500'
                    : 'bg-surface border-border'
                }`}
                onPress={() => {
                  setFormData({ ...formData, staffId: s.id });
                  setSelectedStaff(s);
                }}
              >
                <Text className="text-text-primary font-medium">{s.user?.name}</Text>
                <Text className="text-text-secondary text-sm">{s.role}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Branch Selection */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-text-primary mb-4">Branch</Text>
          <View className="gap-2">
            {branches.map((branch) => (
              <TouchableOpacity
                key={branch.id}
                className={`p-4 rounded-lg border ${
                  formData.branchId === branch.id
                    ? 'bg-primary-100 border-primary-500'
                    : 'bg-surface border-border'
                }`}
                onPress={() => {
                  setFormData({ ...formData, branchId: branch.id });
                  setSelectedBranch(branch);
                }}
              >
                <Text className="text-text-primary font-medium">{branch.name}</Text>
                {branch.address && (
                  <Text className="text-text-secondary text-sm">{branch.address}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date & Time Selection */}
        <View className="mb-6">
          <CustomDateTimePicker
            value={new Date(formData.scheduledAt)}
            onChange={(date) => setFormData({ ...formData, scheduledAt: date.toISOString() })}
            mode="datetime"
            minimumDate={new Date()}
            label="Date & Time *"
          />
        </View>

        {/* Notes */}
        <View className="mb-6">
          <Text className="text-text-primary font-medium mb-2">Notes (Optional)</Text>
          <TextInput
            className="bg-surface border border-border rounded-lg px-4 py-3 text-text-primary"
            placeholder="Add any special notes..."
            multiline
            numberOfLines={4}
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
          />
        </View>

        {/* Create Button */}
        <TouchableOpacity
          className="bg-primary-500 rounded-lg py-4 items-center"
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white font-semibold text-lg">Create Appointment</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

