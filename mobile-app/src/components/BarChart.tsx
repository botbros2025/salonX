import React from 'react';
import { View, Text } from 'react-native';

interface BarChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  maxValue?: number;
  height?: number;
  showValues?: boolean;
}

export default function BarChart({
  data,
  maxValue,
  height = 200,
  showValues = true,
}: BarChartProps) {
  const max = maxValue || Math.max(...data.map((d) => d.value), 1);

  return (
    <View className="flex-row items-end justify-between" style={{ height }}>
      {data.map((item, index) => {
        const barHeight = (item.value / max) * height;
        const color = item.color || '#8b5cf6';

        return (
          <View key={index} className="flex-1 items-center mx-1">
            <View className="w-full items-center justify-end" style={{ height }}>
              <View
                className="w-full rounded-t"
                style={{
                  height: barHeight,
                  backgroundColor: color,
                  minHeight: item.value > 0 ? 4 : 0,
                }}
              />
              {showValues && item.value > 0 && (
                <Text className="text-text-secondary text-xs mt-1" numberOfLines={1}>
                  {item.value > 1000 ? `${(item.value / 1000).toFixed(1)}k` : item.value}
                </Text>
              )}
            </View>
            <Text className="text-text-secondary text-xs mt-2 text-center" numberOfLines={2}>
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

