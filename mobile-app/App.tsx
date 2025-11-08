import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { authService } from './src/services/auth';
import { User } from './src/types';
import AuthNavigator from './src/navigation/AuthNavigator';
import OwnerNavigator from './src/navigation/OwnerNavigator';
import StaffNavigator from './src/navigation/StaffNavigator';
import CustomerNavigator from './src/navigation/CustomerNavigator';
import { RootStackParamList } from './src/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      if (isAuthenticated) {
        const storedUser = await authService.getStoredUser();
        setUser(storedUser);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  const getNavigator = () => {
    if (!user) {
      return <AuthNavigator />;
    }

    switch (user.role) {
      case 'owner':
      case 'admin':
      case 'receptionist':
        return <OwnerNavigator />;
      case 'staff':
        return <StaffNavigator />;
      case 'customer':
        return <CustomerNavigator />;
      default:
        return <AuthNavigator />;
    }
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {getNavigator()}
      </NavigationContainer>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}

