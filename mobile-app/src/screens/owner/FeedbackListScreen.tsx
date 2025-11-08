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
import { Feedback } from '../../types';
import Card from '../../components/Card';

export default function FeedbackListScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [filter, setFilter] = useState<'all' | 'high' | 'low'>('all');
  const [minRating, setMinRating] = useState<number | undefined>(undefined);

  useEffect(() => {
    loadFeedbacks();
  }, [filter]);

  const loadFeedbacks = async () => {
    try {
      const params: any = {};
      if (filter === 'high') {
        params.minRating = 4;
      } else if (filter === 'low') {
        params.minRating = 1;
        // We'll filter low ratings on client side
      }
      
      const response = await apiService.getFeedback(params);
      let allFeedbacks = response.data?.feedbacks || [];
      
      if (filter === 'low') {
        allFeedbacks = allFeedbacks.filter((f: Feedback) => f.rating <= 3);
      }
      
      // Sort by date (newest first)
      allFeedbacks.sort((a: Feedback, b: Feedback) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      setFeedbacks(allFeedbacks);
    } catch (error) {
      console.error('Failed to load feedbacks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFeedbacks();
  };

  const renderStars = (rating: number) => {
    return (
      <View className="flex-row">
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={16}
            color={star <= rating ? '#f59e0b' : '#d4d4d4'}
          />
        ))}
      </View>
    );
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'bg-accent-100 text-accent-700';
    if (rating >= 3) return 'bg-warning text-warning';
    return 'bg-secondary-100 text-secondary-700';
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  const averageRating =
    feedbacks.length > 0
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
      : 0;

  return (
    <View className="flex-1 bg-background">
      {/* Header with Stats */}
      <View className="px-4 pt-4 pb-2">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-text-primary">Customer Feedback</Text>
        </View>

        {/* Overall Rating */}
        {feedbacks.length > 0 && (
          <Card className="mb-4">
            <View className="items-center">
              <Text className="text-text-secondary text-sm mb-2">Overall Rating</Text>
              <View className="flex-row items-center mb-2">
                <Text className="text-4xl font-bold text-text-primary mr-2">
                  {averageRating.toFixed(1)}
                </Text>
                <Ionicons name="star" size={32} color="#f59e0b" />
              </View>
              <Text className="text-text-secondary text-sm">
                Based on {feedbacks.length} review{feedbacks.length !== 1 ? 's' : ''}
              </Text>
              {renderStars(Math.round(averageRating))}
            </View>
          </Card>
        )}

        {/* Filters */}
        <View className="flex-row gap-2">
          <TouchableOpacity
            className={`px-4 py-2 rounded-full ${
              filter === 'all' ? 'bg-primary-500' : 'bg-surface border border-border'
            }`}
            onPress={() => setFilter('all')}
          >
            <Text className={`font-medium ${filter === 'all' ? 'text-white' : 'text-text-primary'}`}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`px-4 py-2 rounded-full ${
              filter === 'high' ? 'bg-accent-500' : 'bg-surface border border-border'
            }`}
            onPress={() => setFilter('high')}
          >
            <Text className={`font-medium ${filter === 'high' ? 'text-white' : 'text-text-primary'}`}>
              High (4+)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`px-4 py-2 rounded-full ${
              filter === 'low' ? 'bg-secondary-500' : 'bg-surface border border-border'
            }`}
            onPress={() => setFilter('low')}
          >
            <Text className={`font-medium ${filter === 'low' ? 'text-white' : 'text-text-primary'}`}>
              Low (≤3)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Feedback List */}
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="px-4 pb-8">
          {feedbacks.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Ionicons name="chatbubble-outline" size={64} color="#94a3b8" />
              <Text className="text-text-secondary text-center mt-4">
                No feedback found
              </Text>
            </View>
          ) : (
            <View className="gap-3 mt-2">
              {feedbacks.map((feedback) => (
                <Card key={feedback.id}>
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-text-primary mb-1">
                        {feedback.client?.name || 'Anonymous'}
                      </Text>
                      <View className="flex-row items-center mb-2">
                        {renderStars(feedback.rating)}
                        <View className={`ml-3 px-2 py-1 rounded ${getRatingColor(feedback.rating)}`}>
                          <Text className="text-xs font-medium">
                            {feedback.rating === 5 && 'Excellent'}
                            {feedback.rating === 4 && 'Very Good'}
                            {feedback.rating === 3 && 'Good'}
                            {feedback.rating === 2 && 'Fair'}
                            {feedback.rating === 1 && 'Poor'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Text className="text-text-secondary text-xs">
                      {new Date(feedback.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  {feedback.comment && (
                    <View className="pt-3 border-t border-border">
                      <Text className="text-text-primary">{feedback.comment}</Text>
                    </View>
                  )}
                </Card>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

