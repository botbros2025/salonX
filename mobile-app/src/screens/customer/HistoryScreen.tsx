import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import { authService } from '../../services/auth';
import { formatDate, formatTime, formatCurrency, getStatusColor } from '../../utils/helpers';
import Card from '../../components/Card';

export default function CustomerHistoryScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [client, setClient] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'appointments' | 'invoices'>('all');

  useEffect(() => {
    loadHistory();
  }, [filter]);

  const loadHistory = async () => {
    try {
      const storedUser = await authService.getStoredUser();
      if (!storedUser) return;

      // Get client data
      const clientsResponse = await apiService.getClients();
      const myClient = clientsResponse.data?.clients?.find(
        (c: any) => c.phone === storedUser.phone
      );
      setClient(myClient);

      if (!myClient) return;

      if (filter === 'all' || filter === 'appointments') {
        const appointmentsResponse = await apiService.getAppointments({
          clientId: myClient.id,
        });
        setAppointments(appointmentsResponse.data?.appointments || []);
      }

      if (filter === 'all' || filter === 'invoices') {
        const invoicesResponse = await apiService.getInvoices({
          clientId: myClient.id,
        });
        setInvoices(invoicesResponse.data?.invoices || []);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  const filters = [
    { key: 'all' as const, label: 'All' },
    { key: 'appointments' as const, label: 'Appointments' },
    { key: 'invoices' as const, label: 'Invoices' },
  ];

  return (
    <View className="flex-1 bg-background">
      {/* Filters */}
      <View className="px-4 pt-4 pb-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <View className="flex-row gap-2">
            {filters.map((f) => (
              <TouchableOpacity
                key={f.key}
                className={`px-4 py-2 rounded-full ${
                  filter === f.key ? 'bg-primary-500' : 'bg-surface border border-border'
                }`}
                onPress={() => setFilter(f.key)}
              >
                <Text
                  className={`font-medium ${filter === f.key ? 'text-white' : 'text-text-primary'}`}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* History List */}
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="px-4 pb-8">
          {/* Appointments */}
          {(filter === 'all' || filter === 'appointments') && appointments.length > 0 && (
            <View className="mb-6">
              <Text className="text-lg font-bold text-text-primary mb-3">Appointments</Text>
              <View className="gap-3">
                {appointments.map((apt) => (
                  <Card key={apt.id}>
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-1">
                        <Text className="text-lg font-bold text-text-primary mb-1">
                          {apt.service?.name}
                        </Text>
                        <Text className="text-text-secondary mb-2">
                          {formatDate(apt.scheduledAt, 'MMM d, yyyy')} • {formatTime(apt.scheduledAt)}
                        </Text>
                        <View className="flex-row items-center">
                          <Ionicons name="person" size={16} color="#64748b" />
                          <Text className="text-text-secondary text-sm ml-1">
                            {apt.staff?.user?.name || 'Staff'}
                          </Text>
                        </View>
                      </View>
                      <View className={`px-3 py-1 rounded-full ${getStatusColor(apt.status)}`}>
                        <Text className="text-white text-xs font-medium capitalize">
                          {apt.status}
                        </Text>
                      </View>
                    </View>
                    {apt.status === 'completed' && (
                      <View className="border-t border-border pt-3">
                        <Text className="text-text-secondary text-sm mb-1">Amount Paid</Text>
                        <Text className="text-lg font-bold text-text-primary">
                          {formatCurrency(apt.service?.price || 0)}
                        </Text>
                      </View>
                    )}
                  </Card>
                ))}
              </View>
            </View>
          )}

          {/* Invoices */}
          {(filter === 'all' || filter === 'invoices') && invoices.length > 0 && (
            <View>
              <Text className="text-lg font-bold text-text-primary mb-3">Invoices</Text>
              <View className="gap-3">
                {invoices.map((invoice) => (
                  <Card key={invoice.id}>
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-1">
                        <Text className="text-lg font-bold text-text-primary mb-1">
                          Invoice #{invoice.invoiceNumber}
                        </Text>
                        <Text className="text-text-secondary mb-2">
                          {formatDate(invoice.createdAt, 'MMM d, yyyy')}
                        </Text>
                        {invoice.appointment?.service && (
                          <Text className="text-text-secondary text-sm">
                            {invoice.appointment.service.name}
                          </Text>
                        )}
                      </View>
                      <View className="items-end">
                        <Text className="text-xl font-bold text-primary-500">
                          {formatCurrency(invoice.total)}
                        </Text>
                        <View
                          className={`px-2 py-1 rounded mt-2 ${
                            invoice.paymentStatus === 'paid'
                              ? 'bg-accent-100'
                              : 'bg-warning'
                          }`}
                        >
                          <Text
                            className={`text-xs font-medium ${
                              invoice.paymentStatus === 'paid'
                                ? 'text-accent-600'
                                : 'text-warning'
                            }`}
                          >
                            {invoice.paymentStatus}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Card>
                ))}
              </View>
            </View>
          )}

          {/* Empty State */}
          {((filter === 'all' && appointments.length === 0 && invoices.length === 0) ||
            (filter === 'appointments' && appointments.length === 0) ||
            (filter === 'invoices' && invoices.length === 0)) && (
            <View className="items-center justify-center py-12">
              <Ionicons name="document-outline" size={64} color="#94a3b8" />
              <Text className="text-text-secondary text-center mt-4">
                No {filter === 'all' ? 'history' : filter} found
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
