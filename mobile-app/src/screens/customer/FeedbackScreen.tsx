import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types';
import { apiService } from '../../services/api';
import Card from '../../components/Card';

type RouteProps = RouteProp<RootStackParamList, 'Feedback'>;

export default function FeedbackScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation();
  const { appointmentId, staffId, serviceName, staffName } = route.params || {};
  
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [client, setClient] = useState<any>(null);

  React.useEffect(() => {
    loadClientData();
  }, []);

  const loadClientData = async () => {
    try {
      const clientsResponse = await apiService.getClients();
      // Get current user's client record
      const myClient = clientsResponse.data?.clients?.[0]; // Simplified
      setClient(myClient);
    } catch (error) {
      console.error('Failed to load client:', error);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    if (!client || !appointmentId) {
      Alert.alert('Error', 'Missing required information');
      return;
    }

    setLoading(true);
    try {
      await apiService.createFeedback({
        clientId: client.id,
        appointmentId,
        staffId,
        rating,
        comment: comment.trim() || undefined,
      });

      Alert.alert(
        'Thank You!',
        'Your feedback has been submitted successfully.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-4 pt-4 pb-8">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-text-primary mb-2">Rate Your Experience</Text>
          <Text className="text-text-secondary">
            Help us improve by sharing your feedback
          </Text>
        </View>

        {/* Service Info */}
        {serviceName && (
          <Card className="mb-6">
            <View className="flex-row items-center mb-3">
              <Ionicons name="cut" size={24} color="#8b5cf6" />
              <View className="flex-1 ml-3">
                <Text className="text-text-secondary text-sm">Service</Text>
                <Text className="text-lg font-bold text-text-primary">{serviceName}</Text>
              </View>
            </View>
            {staffName && (
              <View className="flex-row items-center pt-3 border-t border-border">
                <Ionicons name="person" size={24} color="#8b5cf6" />
                <View className="flex-1 ml-3">
                  <Text className="text-text-secondary text-sm">Staff</Text>
                  <Text className="text-lg font-bold text-text-primary">{staffName}</Text>
                </View>
              </View>
            )}
          </Card>
        )}

        {/* Rating Selection */}
        <Card className="mb-6">
          <Text className="text-lg font-bold text-text-primary mb-4">How was your experience?</Text>
          <View className="flex-row justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                className="p-2"
              >
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={48}
                  color={star <= rating ? '#f59e0b' : '#d4d4d4'}
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text className="text-center text-text-secondary mt-2">
            {rating === 0 && 'Tap to rate'}
            {rating === 1 && 'Poor'}
            {rating === 2 && 'Fair'}
            {rating === 3 && 'Good'}
            {rating === 4 && 'Very Good'}
            {rating === 5 && 'Excellent'}
          </Text>
        </Card>

        {/* Comment Section */}
        <Card className="mb-6">
          <Text className="text-lg font-bold text-text-primary mb-4">Additional Comments</Text>
          <Text className="text-text-secondary text-sm mb-3">
            Share your thoughts (optional)
          </Text>
          <TextInput
            className="bg-neutral-50 border border-border rounded-lg px-4 py-3 text-text-primary min-h-[120px]"
            placeholder="Tell us about your experience..."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={6}
            value={comment}
            onChangeText={setComment}
            textAlignVertical="top"
          />
        </Card>

        {/* Submit Button */}
        <TouchableOpacity
          className="bg-primary-500 rounded-lg py-4 items-center"
          onPress={handleSubmit}
          disabled={loading || rating === 0}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white font-semibold text-lg">Submit Feedback</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

