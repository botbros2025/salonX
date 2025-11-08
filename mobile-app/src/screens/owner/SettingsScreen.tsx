import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { authService } from '../../services/auth';
import Card from '../../components/Card';

export default function SettingsScreen() {
  const navigation = useNavigation();

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
            await authService.logout();
            // Navigation will be handled by App.tsx
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-4 pb-8">
        <Card className="mb-4">
          <TouchableOpacity className="py-4 border-b border-border">
            <Text className="text-text-primary font-medium">Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity className="py-4 border-b border-border">
            <Text className="text-text-primary font-medium">Notifications</Text>
          </TouchableOpacity>
          <TouchableOpacity className="py-4 border-b border-border">
            <Text className="text-text-primary font-medium">Branches</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="py-4 border-b border-border"
            onPress={() => navigation.navigate('FeedbackList' as any)}
          >
            <Text className="text-text-primary font-medium">Customer Feedback</Text>
          </TouchableOpacity>
          <TouchableOpacity className="py-4">
            <Text className="text-text-primary font-medium">Subscription</Text>
          </TouchableOpacity>
        </Card>

        <TouchableOpacity
          className="bg-secondary-500 rounded-lg py-4 items-center"
          onPress={handleLogout}
        >
          <Text className="text-white font-semibold">Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

