import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { authService } from '../../services/auth';
import { SignupData } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Signup'>;

export default function SignupScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<SignupData>({
    email: '',
    password: '',
    name: '',
    phone: '',
    businessName: '',
    branchName: '',
  });

  const handleSignup = async () => {
    if (!formData.email || !formData.password || !formData.name || !formData.phone || !formData.businessName) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await authService.signup(formData);
      // Navigation will be handled by App.tsx
    } catch (error: any) {
      Alert.alert('Signup Failed', error.response?.data?.error || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="flex-1 px-6 pt-12 pb-8">
        {/* Header */}
        <View className="mb-8">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mb-4">
            <Text className="text-primary-500 text-lg">← Back</Text>
          </TouchableOpacity>
          <Text className="text-3xl font-bold text-text-primary mb-2">Create Account</Text>
          <Text className="text-text-secondary">
            Set up your salon management system
          </Text>
        </View>

        {/* Signup Form */}
        <View className="mb-6">
          <View className="mb-4">
            <Text className="text-text-primary font-medium mb-2">Business Name *</Text>
            <TextInput
              className="bg-surface border border-border rounded-lg px-4 py-3 text-text-primary"
              placeholder="Your Salon Name"
              placeholderTextColor="#94a3b8"
              value={formData.businessName}
              onChangeText={(text) => setFormData({ ...formData, businessName: text })}
            />
          </View>

          <View className="mb-4">
            <Text className="text-text-primary font-medium mb-2">Branch Name</Text>
            <TextInput
              className="bg-surface border border-border rounded-lg px-4 py-3 text-text-primary"
              placeholder="Main Branch (optional)"
              placeholderTextColor="#94a3b8"
              value={formData.branchName}
              onChangeText={(text) => setFormData({ ...formData, branchName: text })}
            />
          </View>

          <View className="mb-4">
            <Text className="text-text-primary font-medium mb-2">Your Name *</Text>
            <TextInput
              className="bg-surface border border-border rounded-lg px-4 py-3 text-text-primary"
              placeholder="Owner Name"
              placeholderTextColor="#94a3b8"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
          </View>

          <View className="mb-4">
            <Text className="text-text-primary font-medium mb-2">Email *</Text>
            <TextInput
              className="bg-surface border border-border rounded-lg px-4 py-3 text-text-primary"
              placeholder="your@email.com"
              placeholderTextColor="#94a3b8"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View className="mb-4">
            <Text className="text-text-primary font-medium mb-2">Phone *</Text>
            <TextInput
              className="bg-surface border border-border rounded-lg px-4 py-3 text-text-primary"
              placeholder="+91 1234567890"
              placeholderTextColor="#94a3b8"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
            />
          </View>

          <View className="mb-6">
            <Text className="text-text-primary font-medium mb-2">Password *</Text>
            <TextInput
              className="bg-surface border border-border rounded-lg px-4 py-3 text-text-primary"
              placeholder="Minimum 6 characters"
              placeholderTextColor="#94a3b8"
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            className="bg-primary-500 rounded-lg py-4 items-center mb-4"
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white font-semibold text-lg">Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Login Link */}
        <View className="flex-row justify-center items-center">
          <Text className="text-text-secondary">Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text className="text-primary-500 font-semibold">Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

