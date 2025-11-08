import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types';
import { apiService } from '../../services/api';
import { authService } from '../../services/auth';
import { formatTime, formatCurrency } from '../../utils/helpers';
import Card from '../../components/Card';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CustomerBookingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'service' | 'staff' | 'date' | 'confirm'>('service');
  const [services, setServices] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [client, setClient] = useState<any>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (step === 'date' && selectedStaff && selectedBranch) {
      loadAvailableSlots();
    }
  }, [step, selectedStaff, selectedBranch, selectedDate]);

  const loadInitialData = async () => {
    try {
      const storedUser = await authService.getStoredUser();
      
      // Get client data
      const clientsResponse = await apiService.getClients();
      const myClient = clientsResponse.data?.clients?.find(
        (c: any) => c.phone === storedUser?.phone
      );
      setClient(myClient);

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

  const loadAvailableSlots = async () => {
    if (!selectedStaff || !selectedBranch) return;

    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await apiService.getAvailableSlots({
        staffId: selectedStaff.id,
        branchId: selectedBranch.id,
        date: dateStr,
      });

      setAvailableSlots(response.data?.slots || []);
    } catch (error) {
      console.error('Failed to load slots:', error);
    }
  };

  const handleServiceSelect = (service: any) => {
    setSelectedService(service);
    // Filter staff who can perform this service
    const eligibleStaff = staff.filter((s: any) => {
      // In a real app, check service-staff relationship
      return s.isActive;
    });
    setStaff(eligibleStaff);
    setStep('staff');
  };

  const handleStaffSelect = (staffMember: any) => {
    setSelectedStaff(staffMember);
    if (branches.length === 1) {
      setSelectedBranch(branches[0]);
      setStep('date');
    } else {
      setStep('date');
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    loadAvailableSlots();
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep('confirm');
  };

  const handleConfirmBooking = async () => {
    if (!selectedService || !selectedStaff || !selectedBranch || !selectedTime || !client) {
      Alert.alert('Error', 'Please complete all steps');
      return;
    }

    setLoading(true);
    try {
      await apiService.createAppointment({
        clientId: client.id,
        serviceId: selectedService.id,
        staffId: selectedStaff.id,
        branchId: selectedBranch.id,
        scheduledAt: selectedTime,
      });

      Alert.alert(
        'Success',
        'Appointment booked successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setStep('service');
              setSelectedService(null);
              setSelectedStaff(null);
              setSelectedTime('');
              navigation.navigate('Home' as any);
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  const renderServiceSelection = () => (
    <View>
      <Text className="text-2xl font-bold text-text-primary mb-2">Select Service</Text>
      <Text className="text-text-secondary mb-6">Choose the service you need</Text>
      <ScrollView className="max-h-96">
        <View className="gap-3">
          {services.map((service) => (
            <TouchableOpacity
              key={service.id}
              className={`p-4 rounded-xl border ${
                selectedService?.id === service.id
                  ? 'bg-primary-100 border-primary-500'
                  : 'bg-surface border-border'
              }`}
              onPress={() => handleServiceSelect(service)}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-lg font-bold text-text-primary mb-1">
                    {service.name}
                  </Text>
                  {service.description && (
                    <Text className="text-text-secondary text-sm mb-2">
                      {service.description}
                    </Text>
                  )}
                  <View className="flex-row items-center">
                    <Ionicons name="time" size={16} color="#64748b" />
                    <Text className="text-text-secondary text-sm ml-1">
                      {service.duration} minutes
                    </Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="text-xl font-bold text-primary-500">
                    {formatCurrency(service.price)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderStaffSelection = () => (
    <View>
      <View className="flex-row items-center mb-4">
        <TouchableOpacity onPress={() => setStep('service')} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#64748b" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-2xl font-bold text-text-primary">Select Staff</Text>
          <Text className="text-text-secondary">Choose your preferred stylist</Text>
        </View>
      </View>
      <View className="gap-3">
        {staff.map((s) => (
          <TouchableOpacity
            key={s.id}
            className={`p-4 rounded-xl border ${
              selectedStaff?.id === s.id
                ? 'bg-primary-100 border-primary-500'
                : 'bg-surface border-border'
            }`}
            onPress={() => handleStaffSelect(s)}
          >
            <View className="flex-row items-center">
              <View className="w-12 h-12 bg-primary-500 rounded-full items-center justify-center mr-3">
                <Text className="text-white text-lg font-bold">
                  {s.user?.name?.charAt(0).toUpperCase() || 'S'}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-text-primary">{s.user?.name}</Text>
                <Text className="text-text-secondary">{s.role}</Text>
                {s.performance && (
                  <View className="flex-row items-center mt-1">
                    <Ionicons name="star" size={14} color="#f59e0b" />
                    <Text className="text-text-secondary text-sm ml-1">
                      {s.performance.averageRating.toFixed(1)} ({s.performance.totalRatings} reviews)
                    </Text>
                  </View>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderDateSelection = () => {
    const today = new Date();
    const dates = [];
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }

    return (
      <View>
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => setStep('staff')} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#64748b" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-text-primary">Select Date & Time</Text>
            <Text className="text-text-secondary">Choose your preferred slot</Text>
          </View>
        </View>

        {/* Date Selection */}
        <Text className="text-lg font-bold text-text-primary mb-3">Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
          <View className="flex-row gap-3">
            {dates.map((date) => {
              const isSelected = date.toDateString() === selectedDate.toDateString();
              const isToday = date.toDateString() === today.toDateString();
              return (
                <TouchableOpacity
                  key={date.toISOString()}
                  className={`w-16 h-20 rounded-xl items-center justify-center ${
                    isSelected ? 'bg-primary-500' : 'bg-surface border border-border'
                  }`}
                  onPress={() => handleDateSelect(date)}
                >
                  <Text
                    className={`text-xs font-medium ${
                      isSelected ? 'text-white' : 'text-text-secondary'
                    }`}
                  >
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </Text>
                  <Text
                    className={`text-xl font-bold mt-1 ${
                      isSelected ? 'text-white' : 'text-text-primary'
                    }`}
                  >
                    {date.getDate()}
                  </Text>
                  {isToday && (
                    <View className="absolute -top-1 -right-1 w-2 h-2 bg-accent-500 rounded-full" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Time Slots */}
        <Text className="text-lg font-bold text-text-primary mb-3">Available Times</Text>
        {availableSlots.length === 0 ? (
          <View className="bg-neutral-50 rounded-lg p-6 items-center">
            <Ionicons name="time-outline" size={48} color="#94a3b8" />
            <Text className="text-text-secondary mt-4 text-center">
              No available slots for this date
            </Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap gap-3">
            {availableSlots.map((slot) => {
              const slotTime = new Date(slot);
              const isSelected = selectedTime === slot;
              return (
                <TouchableOpacity
                  key={slot}
                  className={`px-4 py-3 rounded-lg border ${
                    isSelected
                      ? 'bg-primary-500 border-primary-500'
                      : 'bg-surface border-border'
                  }`}
                  onPress={() => handleTimeSelect(slot)}
                >
                  <Text
                    className={`font-medium ${
                      isSelected ? 'text-white' : 'text-text-primary'
                    }`}
                  >
                    {formatTime(slotTime)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  const renderConfirmation = () => (
    <View>
      <View className="flex-row items-center mb-4">
        <TouchableOpacity onPress={() => setStep('date')} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#64748b" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-2xl font-bold text-text-primary">Confirm Booking</Text>
          <Text className="text-text-secondary">Review your appointment details</Text>
        </View>
      </View>

      <Card className="mb-6">
        <View className="gap-4">
          <View>
            <Text className="text-text-secondary text-sm mb-1">Service</Text>
            <Text className="text-lg font-bold text-text-primary">{selectedService?.name}</Text>
            <Text className="text-text-secondary">
              {selectedService?.duration} minutes • {formatCurrency(selectedService?.price)}
            </Text>
          </View>
          <View className="border-t border-border pt-4">
            <Text className="text-text-secondary text-sm mb-1">Staff</Text>
            <Text className="text-lg font-bold text-text-primary">
              {selectedStaff?.user?.name}
            </Text>
            <Text className="text-text-secondary">{selectedStaff?.role}</Text>
          </View>
          <View className="border-t border-border pt-4">
            <Text className="text-text-secondary text-sm mb-1">Date & Time</Text>
            <Text className="text-lg font-bold text-text-primary">
              {formatDate(selectedDate, 'EEEE, MMMM d')}
            </Text>
            <Text className="text-text-secondary">{formatTime(selectedTime)}</Text>
          </View>
          <View className="border-t border-border pt-4">
            <Text className="text-text-secondary text-sm mb-1">Branch</Text>
            <Text className="text-lg font-bold text-text-primary">
              {selectedBranch?.name}
            </Text>
          </View>
          <View className="border-t border-border pt-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-text-primary">Total</Text>
              <Text className="text-2xl font-bold text-primary-500">
                {formatCurrency(selectedService?.price)}
              </Text>
            </View>
          </View>
        </View>
      </Card>

      <TouchableOpacity
        className="bg-primary-500 rounded-lg py-4 items-center"
        onPress={handleConfirmBooking}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text className="text-white font-semibold text-lg">Confirm Booking</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-4 pt-4 pb-8">
        {step === 'service' && renderServiceSelection()}
        {step === 'staff' && renderStaffSelection()}
        {step === 'date' && renderDateSelection()}
        {step === 'confirm' && renderConfirmation()}
      </View>
    </ScrollView>
  );
}
