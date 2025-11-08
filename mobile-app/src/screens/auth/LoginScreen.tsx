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
import { LoginData } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<LoginData>({
    email: '',
    password: '',
  });

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await authService.login(formData);
      // Navigation will be handled by App.tsx based on user role
    } catch (error: any) {
      Alert.alert('Login Failed', error.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="flex-1 px-6 pt-20 pb-8">
        {/* Logo/Header */}
        <View className="items-center mb-12">
          <View className="w-20 h-20 bg-primary-500 rounded-full items-center justify-center mb-4">
            <Text className="text-white text-3xl font-bold">S</Text>
          </View>
          <Text className="text-3xl font-bold text-text-primary mb-2">Salon360</Text>
          <Text className="text-text-secondary text-center">
            Professional Salon Management
          </Text>
        </View>

        {/* Login Form */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-text-primary mb-2">Welcome Back</Text>
          <Text className="text-text-secondary mb-6">
            Sign in to manage your salon
          </Text>

          <View className="mb-4">
            <Text className="text-text-primary font-medium mb-2">Email</Text>
            <TextInput
              className="bg-surface border border-border rounded-lg px-4 py-3 text-text-primary"
              placeholder="Enter your email"
              placeholderTextColor="#94a3b8"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View className="mb-6">
            <Text className="text-text-primary font-medium mb-2">Password</Text>
            <TextInput
              className="bg-surface border border-border rounded-lg px-4 py-3 text-text-primary"
              placeholder="Enter your password"
              placeholderTextColor="#94a3b8"
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            className="bg-primary-500 rounded-lg py-4 items-center mb-4"
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white font-semibold text-lg">Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Sign Up Link */}
        <View className="flex-row justify-center items-center">
          <Text className="text-text-secondary">Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text className="text-primary-500 font-semibold">Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

