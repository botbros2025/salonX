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
import { formatCurrency } from '../../utils/helpers';
import Card from '../../components/Card';
import StatCard from '../../components/StatCard';
import BarChart from '../../components/BarChart';
import PieChart from '../../components/PieChart';

export default function AnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'all'>('month');
  const [salesOverview, setSalesOverview] = useState<any>(null);
  const [servicePopularity, setServicePopularity] = useState<any[]>([]);
  const [staffLeaderboard, setStaffLeaderboard] = useState<any[]>([]);
  const [customerInsights, setCustomerInsights] = useState<any>(null);
  const [inventoryInsights, setInventoryInsights] = useState<any>(null);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      const endDate = new Date().toISOString();
      let startDate: string | undefined;

      switch (period) {
        case 'day':
          startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          break;
        case 'week':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          break;
        case 'month':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
          break;
        default:
          startDate = undefined;
      }

      const [salesRes, servicesRes, staffRes, customersRes, inventoryRes] = await Promise.all([
        apiService.getSalesOverview(startDate, endDate),
        apiService.getServicePopularity(startDate, endDate),
        apiService.getStaffLeaderboard(period === 'all' ? undefined : period),
        apiService.getCustomerInsights(startDate, endDate),
        apiService.getCustomerInsights(startDate, endDate), // Using same for inventory
      ]);

      setSalesOverview(salesRes.data?.overview);
      setServicePopularity(servicesRes.data?.popularity || []);
      setStaffLeaderboard(staffRes.data?.leaderboard || []);
      setCustomerInsights(customersRes.data);
      
      // Load inventory insights
      try {
        const invRes = await apiService.getInventory();
        setInventoryInsights({
          lowStockCount: invRes.data?.items?.filter((i: any) => i.quantity <= i.threshold).length || 0,
        });
      } catch (error) {
        console.error('Failed to load inventory:', error);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
  };

  // Prepare chart data
  const revenueChartData = salesOverview
    ? [
        { label: 'Daily', value: salesOverview.daily, color: '#8b5cf6' },
        { label: 'Weekly', value: salesOverview.weekly, color: '#a78bfa' },
        { label: 'Monthly', value: salesOverview.monthly, color: '#c4b5fd' },
        { label: 'Total', value: salesOverview.total, color: '#ddd6fe' },
      ]
    : [];

  const topServicesData = servicePopularity.slice(0, 5).map((service, index) => ({
    label: service.serviceName.length > 8 ? service.serviceName.substring(0, 8) : service.serviceName,
    value: service.bookings,
    color: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'][index] || '#8b5cf6',
  }));

  const serviceRevenueData = servicePopularity.slice(0, 5).map((service, index) => ({
    label: service.serviceName.length > 8 ? service.serviceName.substring(0, 8) : service.serviceName,
    value: service.revenue,
    color: ['#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7'][index] || '#22c55e',
  }));

  const customerDistributionData = customerInsights
    ? [
        {
          label: 'New',
          value: customerInsights.newClients || 0,
          color: '#8b5cf6',
        },
        {
          label: 'Repeat',
          value: customerInsights.repeatClients || 0,
          color: '#22c55e',
        },
      ]
    : [];

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="px-4 pt-4 pb-8">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-text-primary mb-2">Analytics</Text>
          <Text className="text-text-secondary">Business insights and performance metrics</Text>
        </View>

        {/* Period Selector */}
        <View className="flex-row gap-2 mb-6">
          {(['day', 'week', 'month', 'all'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              className={`flex-1 px-4 py-2 rounded-lg ${
                period === p ? 'bg-primary-500' : 'bg-surface border border-border'
              }`}
              onPress={() => setPeriod(p)}
            >
              <Text
                className={`text-center font-medium ${
                  period === p ? 'text-white' : 'text-text-primary'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sales Overview */}
        {salesOverview && (
          <Card className="mb-6">
            <Text className="text-lg font-bold text-text-primary mb-4">Sales Overview</Text>
            <View className="flex-row flex-wrap gap-4 mb-6">
              <View className="w-[48%]">
                <StatCard
                  title="Daily Revenue"
                  value={formatCurrency(salesOverview.daily)}
                  icon="cash"
                  color="primary-500"
                />
              </View>
              <View className="w-[48%]">
                <StatCard
                  title="Weekly Revenue"
                  value={formatCurrency(salesOverview.weekly)}
                  icon="trending-up"
                  color="accent-500"
                />
              </View>
              <View className="w-[48%]">
                <StatCard
                  title="Monthly Revenue"
                  value={formatCurrency(salesOverview.monthly)}
                  icon="calendar"
                  color="info"
                />
              </View>
              <View className="w-[48%]">
                <StatCard
                  title="Total Revenue"
                  value={formatCurrency(salesOverview.total)}
                  icon="trophy"
                  color="warning"
                />
              </View>
            </View>
            <View className="mt-4">
              <Text className="text-text-secondary text-sm mb-3">Revenue Breakdown</Text>
              <BarChart data={revenueChartData} height={150} />
            </View>
          </Card>
        )}

        {/* Service Popularity */}
        {servicePopularity.length > 0 && (
          <Card className="mb-6">
            <Text className="text-lg font-bold text-text-primary mb-4">Top Services</Text>
            <View className="mb-4">
              <Text className="text-text-secondary text-sm mb-3">Bookings</Text>
              <BarChart data={topServicesData} height={150} />
            </View>
            <View className="mt-4">
              <Text className="text-text-secondary text-sm mb-3">Revenue</Text>
              <BarChart data={serviceRevenueData} height={150} />
            </View>
            <View className="mt-4 gap-2">
              {servicePopularity.slice(0, 5).map((service, index) => (
                <View
                  key={service.serviceId}
                  className="flex-row items-center justify-between p-3 bg-neutral-50 rounded-lg"
                >
                  <View className="flex-row items-center flex-1">
                    <View className="w-8 h-8 bg-primary-500 rounded-full items-center justify-center mr-3">
                      <Text className="text-white font-bold text-xs">#{index + 1}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-text-primary font-semibold">{service.serviceName}</Text>
                      <Text className="text-text-secondary text-sm">
                        {service.bookings} bookings
                      </Text>
                    </View>
                  </View>
                  <Text className="text-primary-500 font-bold">
                    {formatCurrency(service.revenue)}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Staff Leaderboard */}
        {staffLeaderboard.length > 0 && (
          <Card className="mb-6">
            <Text className="text-lg font-bold text-text-primary mb-4">Staff Performance</Text>
            <View className="gap-3">
              {staffLeaderboard.slice(0, 5).map((staff, index) => (
                <View
                  key={staff.staffId}
                  className="flex-row items-center p-3 bg-neutral-50 rounded-lg"
                >
                  <View className="w-10 h-10 bg-primary-500 rounded-full items-center justify-center mr-3">
                    <Text className="text-white font-bold">#{index + 1}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-text-primary font-semibold">{staff.staffName}</Text>
                    <View className="flex-row items-center gap-3 mt-1">
                      <Text className="text-text-secondary text-sm">
                        {staff.clientsServed} clients
                      </Text>
                      {staff.averageRating > 0 && (
                        <View className="flex-row items-center">
                          <Ionicons name="star" size={14} color="#f59e0b" />
                          <Text className="text-text-secondary text-sm ml-1">
                            {staff.averageRating.toFixed(1)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="text-accent-500 font-bold">
                      {formatCurrency(staff.revenue)}
                    </Text>
                    <Text className="text-text-secondary text-xs">Revenue</Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Customer Insights */}
        {customerInsights && (
          <Card className="mb-6">
            <Text className="text-lg font-bold text-text-primary mb-4">Customer Insights</Text>
            <View className="flex-row flex-wrap gap-4 mb-4">
              <View className="w-[48%]">
                <View className="bg-primary-50 rounded-lg p-4">
                  <Text className="text-text-secondary text-sm mb-1">New Clients</Text>
                  <Text className="text-2xl font-bold text-text-primary">
                    {customerInsights.newClients || 0}
                  </Text>
                </View>
              </View>
              <View className="w-[48%]">
                <View className="bg-accent-50 rounded-lg p-4">
                  <Text className="text-text-secondary text-sm mb-1">Repeat Clients</Text>
                  <Text className="text-2xl font-bold text-text-primary">
                    {customerInsights.repeatClients || 0}
                  </Text>
                </View>
              </View>
            </View>
            <View className="mb-4">
              <View className="bg-neutral-50 rounded-lg p-4">
                <Text className="text-text-secondary text-sm mb-1">Retention Rate</Text>
                <Text className="text-2xl font-bold text-text-primary">
                  {customerInsights.retentionRate?.toFixed(1) || 0}%
                </Text>
              </View>
            </View>
            {customerDistributionData.length > 0 && (
              <View>
                <Text className="text-text-secondary text-sm mb-3">Client Distribution</Text>
                <PieChart data={customerDistributionData} size={180} />
              </View>
            )}
          </Card>
        )}

        {/* Inventory Insights */}
        {inventoryInsights && (
          <Card>
            <Text className="text-lg font-bold text-text-primary mb-4">Inventory Status</Text>
            <View className="bg-secondary-50 rounded-lg p-4 border border-secondary-200">
              <View className="flex-row items-center">
                <Ionicons name="alert-circle" size={24} color="#dc2626" />
                <View className="flex-1 ml-3">
                  <Text className="text-secondary-700 font-semibold mb-1">
                    Low Stock Items
                  </Text>
                  <Text className="text-secondary-600">
                    {inventoryInsights.lowStockCount || 0} item
                    {inventoryInsights.lowStockCount !== 1 ? 's' : ''} need restocking
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}
