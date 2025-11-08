import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, Appointment } from '../../types';
import { apiService } from '../../services/api';
import { formatDateTime, formatCurrency, getStatusColor } from '../../utils/helpers';
import Card from '../../components/Card';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, 'AppointmentDetails'>;

export default function AppointmentDetailsScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { appointmentId } = route.params;
  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    loadAppointment();
  }, [appointmentId]);

  const loadAppointment = async () => {
    try {
      const response = await apiService.getAppointments();
      const apt = response.data?.appointments?.find((a: Appointment) => a.id === appointmentId);
      setAppointment(apt || null);
    } catch (error) {
      console.error('Failed to load appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status: string) => {
    try {
      await apiService.updateAppointmentStatus(appointmentId, status);
      Alert.alert('Success', 'Appointment status updated');
      loadAppointment();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update status');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  if (!appointment) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-text-secondary">Appointment not found</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-4 pt-4 pb-8">
        {/* Status Badge */}
        <View className="items-center mb-6">
          <View className={`px-4 py-2 rounded-full ${getStatusColor(appointment.status)}`}>
            <Text className="text-white font-semibold capitalize">{appointment.status}</Text>
          </View>
        </View>

        {/* Client Info */}
        <Card className="mb-4">
          <Text className="text-lg font-bold text-text-primary mb-4">Client Information</Text>
          <View className="gap-3">
            <View>
              <Text className="text-text-secondary text-sm mb-1">Name</Text>
              <Text className="text-text-primary font-medium">{appointment.client?.name}</Text>
            </View>
            <View>
              <Text className="text-text-secondary text-sm mb-1">Phone</Text>
              <Text className="text-text-primary font-medium">{appointment.client?.phone}</Text>
            </View>
            {appointment.client?.email && (
              <View>
                <Text className="text-text-secondary text-sm mb-1">Email</Text>
                <Text className="text-text-primary font-medium">{appointment.client.email}</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Service Info */}
        <Card className="mb-4">
          <Text className="text-lg font-bold text-text-primary mb-4">Service Details</Text>
          <View className="gap-3">
            <View>
              <Text className="text-text-secondary text-sm mb-1">Service</Text>
              <Text className="text-text-primary font-medium">{appointment.service?.name}</Text>
            </View>
            <View>
              <Text className="text-text-secondary text-sm mb-1">Price</Text>
              <Text className="text-text-primary font-medium">
                {formatCurrency(appointment.service?.price || 0)}
              </Text>
            </View>
            <View>
              <Text className="text-text-secondary text-sm mb-1">Duration</Text>
              <Text className="text-text-primary font-medium">
                {appointment.service?.duration} minutes
              </Text>
            </View>
          </View>
        </Card>

        {/* Appointment Info */}
        <Card className="mb-4">
          <Text className="text-lg font-bold text-text-primary mb-4">Appointment Details</Text>
          <View className="gap-3">
            <View>
              <Text className="text-text-secondary text-sm mb-1">Scheduled Time</Text>
              <Text className="text-text-primary font-medium">
                {formatDateTime(appointment.scheduledAt)}
              </Text>
            </View>
            <View>
              <Text className="text-text-secondary text-sm mb-1">Staff</Text>
              <Text className="text-text-primary font-medium">
                {appointment.staff?.user?.name}
              </Text>
            </View>
            <View>
              <Text className="text-text-secondary text-sm mb-1">Branch</Text>
              <Text className="text-text-primary font-medium">
                {appointment.branch?.name}
              </Text>
            </View>
            {appointment.notes && (
              <View>
                <Text className="text-text-secondary text-sm mb-1">Notes</Text>
                <Text className="text-text-primary">{appointment.notes}</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Actions */}
        {appointment.status === 'booked' && (
          <View className="gap-3">
            <TouchableOpacity
              className="bg-accent-500 rounded-lg py-4 items-center"
              onPress={() => handleStatusUpdate('ongoing')}
            >
              <Text className="text-white font-semibold">Mark as Ongoing</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-secondary-500 rounded-lg py-4 items-center"
              onPress={() => handleStatusUpdate('cancelled')}
            >
              <Text className="text-white font-semibold">Cancel Appointment</Text>
            </TouchableOpacity>
          </View>
        )}

        {appointment.status === 'ongoing' && (
          <TouchableOpacity
            className="bg-accent-500 rounded-lg py-4 items-center"
            onPress={() => handleStatusUpdate('completed')}
          >
            <Text className="text-white font-semibold">Mark as Completed</Text>
          </TouchableOpacity>
        )}

        {appointment.status === 'completed' && (
          <View className="gap-3">
            <View className="bg-accent-50 rounded-lg p-4 border border-accent-200">
              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
                <Text className="text-accent-600 font-medium ml-2">
                  Appointment completed successfully
                </Text>
              </View>
            </View>
            <TouchableOpacity
              className="bg-primary-500 rounded-lg py-4 items-center"
              onPress={() =>
                navigation.navigate('Invoice' as any, { appointmentId: appointment.id })
              }
            >
              <View className="flex-row items-center">
                <Ionicons name="receipt" size={20} color="#ffffff" />
                <Text className="text-white font-semibold text-lg ml-2">
                  {appointment.invoice ? 'View Invoice' : 'Create Invoice'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

