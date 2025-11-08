import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../../services/auth';
import Card from '../../components/Card';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const storedUser = await authService.getStoredUser();
    setUser(storedUser);
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
            // Navigation will be handled by App.tsx
          },
        },
      ]
    );
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-4 pt-4 pb-8">
        {/* Profile Section */}
        <Card className="mb-6">
          <View className="items-center mb-4">
            <View className="w-20 h-20 bg-primary-500 rounded-full items-center justify-center mb-3">
              <Text className="text-white text-3xl font-bold">
                {user?.name?.charAt(0).toUpperCase() || 'S'}
              </Text>
            </View>
            <Text className="text-xl font-bold text-text-primary">{user?.name || 'Staff'}</Text>
            <Text className="text-text-secondary">{user?.email}</Text>
            {user?.staff && (
              <View className="mt-2 px-3 py-1 bg-primary-100 rounded-full">
                <Text className="text-primary-600 font-medium">{user.staff.role}</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Settings Options */}
        <Card className="mb-6">
          <TouchableOpacity className="py-4 border-b border-border flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="person" size={20} color="#64748b" />
              <Text className="text-text-primary font-medium ml-3">Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>
          <TouchableOpacity className="py-4 border-b border-border flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="notifications" size={20} color="#64748b" />
              <Text className="text-text-primary font-medium ml-3">Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>
          <TouchableOpacity className="py-4 border-b border-border flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="time" size={20} color="#64748b" />
              <Text className="text-text-primary font-medium ml-3">Shift Timings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>
          <TouchableOpacity className="py-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="help-circle" size={20} color="#64748b" />
              <Text className="text-text-primary font-medium ml-3">Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>
        </Card>

        {/* About */}
        <Card className="mb-6">
          <View className="py-4">
            <Text className="text-text-secondary text-center text-sm">
              Salon360 Staff App
            </Text>
            <Text className="text-text-secondary text-center text-sm mt-1">
              Version 1.0.0
            </Text>
          </View>
        </Card>

        {/* Logout Button */}
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
