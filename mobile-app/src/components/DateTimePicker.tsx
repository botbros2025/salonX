import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { formatDate, formatTime } from '../utils/helpers';

interface DateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  mode?: 'date' | 'time' | 'datetime';
  minimumDate?: Date;
  maximumDate?: Date;
  label?: string;
}

export default function CustomDateTimePicker({
  value,
  onChange,
  mode = 'datetime',
  minimumDate,
  maximumDate,
  label,
}: DateTimePickerProps) {
  const [show, setShow] = useState(false);
  const [currentMode, setCurrentMode] = useState<'date' | 'time'>('date');

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }

    if (selectedDate) {
      if (mode === 'datetime' && currentMode === 'date') {
        // After selecting date, show time picker
        setCurrentMode('time');
        setShow(true);
        onChange(selectedDate);
      } else {
        onChange(selectedDate);
        if (Platform.OS === 'ios' || mode !== 'datetime' || currentMode === 'time') {
          setShow(false);
        }
      }
    }
  };

  const displayValue = () => {
    if (mode === 'date') {
      return formatDate(value, 'MMM d, yyyy');
    }
    if (mode === 'time') {
      return formatTime(value);
    }
    return `${formatDate(value, 'MMM d, yyyy')} at ${formatTime(value)}`;
  };

  return (
    <View>
      {label && (
        <Text className="text-text-primary font-medium mb-2">{label}</Text>
      )}
      <TouchableOpacity
        className="bg-surface border border-border rounded-lg px-4 py-3 flex-row items-center justify-between"
        onPress={() => {
          setCurrentMode('date');
          setShow(true);
        }}
      >
        <View className="flex-row items-center">
          <Ionicons
            name={mode === 'date' ? 'calendar' : mode === 'time' ? 'time' : 'calendar-outline'}
            size={20}
            color="#64748b"
          />
          <Text className="text-text-primary ml-2">{displayValue()}</Text>
        </View>
        <Ionicons name="chevron-down" size={20} color="#94a3b8" />
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={value}
          mode={currentMode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}
    </View>
  );
}

