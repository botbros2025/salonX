import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import OwnerDashboardScreen from '../screens/owner/DashboardScreen';
import AppointmentsScreen from '../screens/owner/AppointmentsScreen';
import ClientsScreen from '../screens/owner/ClientsScreen';
import ServicesScreen from '../screens/owner/ServicesScreen';
import StaffScreen from '../screens/owner/StaffScreen';
import InventoryScreen from '../screens/owner/InventoryScreen';
import AnalyticsScreen from '../screens/owner/AnalyticsScreen';
import SettingsScreen from '../screens/owner/SettingsScreen';
import AppointmentDetailsScreen from '../screens/owner/AppointmentDetailsScreen';
import CreateAppointmentScreen from '../screens/owner/CreateAppointmentScreen';
import ClientDetailsScreen from '../screens/owner/ClientDetailsScreen';
import FeedbackListScreen from '../screens/owner/FeedbackListScreen';
import InvoiceScreen from '../screens/owner/InvoiceScreen';
import CalendarViewScreen from '../screens/owner/CalendarViewScreen';
import { RootStackParamList } from '../types';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

function OwnerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#8b5cf6',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={OwnerDashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Appointments"
        component={AppointmentsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Clients"
        component={ClientsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="More"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="menu" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function OwnerNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#8b5cf6',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="OwnerDashboard"
        component={OwnerTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AppointmentDetails"
        component={AppointmentDetailsScreen}
        options={{ title: 'Appointment Details' }}
      />
      <Stack.Screen
        name="CreateAppointment"
        component={CreateAppointmentScreen}
        options={{ title: 'New Appointment' }}
      />
      <Stack.Screen
        name="ClientDetails"
        component={ClientDetailsScreen}
        options={{ title: 'Client Details' }}
      />
      <Stack.Screen
        name="Services"
        component={ServicesScreen}
        options={{ title: 'Services' }}
      />
      <Stack.Screen
        name="Staff"
        component={StaffScreen}
        options={{ title: 'Staff' }}
      />
      <Stack.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{ title: 'Inventory' }}
      />
      <Stack.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{ title: 'Analytics' }}
      />
      <Stack.Screen
        name="FeedbackList"
        component={FeedbackListScreen}
        options={{ title: 'Customer Feedback' }}
      />
      <Stack.Screen
        name="Invoice"
        component={InvoiceScreen}
        options={{ title: 'Invoice' }}
      />
      <Stack.Screen
        name="CalendarView"
        component={CalendarViewScreen}
        options={{ title: 'Calendar' }}
      />
    </Stack.Navigator>
  );
}

