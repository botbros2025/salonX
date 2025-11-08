import React from 'react';
import { View, Text } from 'react-native';

interface PieChartProps {
  data: Array<{ label: string; value: number; color: string }>;
  size?: number;
}

export default function PieChart({ data, size = 200 }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) {
    return (
      <View className="items-center justify-center" style={{ width: size, height: size }}>
        <Text className="text-text-secondary">No data</Text>
      </View>
    );
  }

  let currentAngle = -90; // Start from top

  return (
    <View className="items-center">
      <View style={{ width: size, height: size, position: 'relative' }}>
        {data.map((item, index) => {
          const percentage = (item.value / total) * 100;
          const angle = (percentage / 100) * 360;
          const startAngle = currentAngle;
          currentAngle += angle;

          // Simple representation using a colored segment
          return (
            <View
              key={index}
              className="absolute"
              style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: item.value > 0 ? item.color : 'transparent',
                opacity: percentage / 100,
              }}
            />
          );
        })}
        {/* Center circle for donut effect */}
        <View
          className="absolute bg-background rounded-full items-center justify-center"
          style={{
            width: size * 0.6,
            height: size * 0.6,
            left: size * 0.2,
            top: size * 0.2,
          }}
        >
          <Text className="text-text-primary font-bold text-lg">{total}</Text>
          <Text className="text-text-secondary text-xs">Total</Text>
        </View>
      </View>
      {/* Legend */}
      <View className="mt-4 w-full">
        {data.map((item, index) => (
          <View key={index} className="flex-row items-center mb-2">
            <View
              className="w-4 h-4 rounded mr-2"
              style={{ backgroundColor: item.color }}
            />
            <View className="flex-1 flex-row items-center justify-between">
              <Text className="text-text-primary text-sm">{item.label}</Text>
              <Text className="text-text-secondary text-sm">
                {item.value} ({((item.value / total) * 100).toFixed(1)}%)
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

