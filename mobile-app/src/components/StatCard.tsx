import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function StatCard({ title, value, icon, color = 'primary-500', trend }: StatCardProps) {
  return (
    <View className="bg-surface rounded-xl p-4 border border-border flex-1">
      <View className="flex-row items-center justify-between mb-2">
        <View className={`w-10 h-10 bg-${color} rounded-lg items-center justify-center`}>
          <Ionicons name={icon} size={20} color="#ffffff" />
        </View>
        {trend && (
          <View className={`flex-row items-center ${trend.isPositive ? 'bg-accent-100' : 'bg-secondary-100'} px-2 py-1 rounded`}>
            <Ionicons
              name={trend.isPositive ? 'arrow-up' : 'arrow-down'}
              size={12}
              color={trend.isPositive ? '#16a34a' : '#dc2626'}
            />
            <Text className={`text-xs font-medium ml-1 ${trend.isPositive ? 'text-accent-600' : 'text-secondary-600'}`}>
              {Math.abs(trend.value)}%
            </Text>
          </View>
        )}
      </View>
      <Text className="text-text-secondary text-sm mb-1">{title}</Text>
      <Text className="text-text-primary text-2xl font-bold">{value}</Text>
    </View>
  );
}

