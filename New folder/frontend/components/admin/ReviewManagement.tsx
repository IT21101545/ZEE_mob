import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, TextInput, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../../api/axios';

interface Review {
  _id: string;
  user: { name: string; email: string };
  product: { name: string; image: string };
  rating: number;
  comment: string;
  image?: string;
  adminReply?: string;
  createdAt: string;
}

export default function ReviewManagement() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [submittingReply, setSubmittingReply] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      const res = await api.get('/reviews/all');
      setReviews(res.data);
      // Mark all as read since the admin is now viewing the list
      api.put('/reviews/mark-read').catch(err => console.error('Failed to mark reviews as read', err));
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleReply = async (reviewId: string) => {
    const reply = replyText[reviewId];
    if (!reply) {
      Alert.alert('Error', 'Reply cannot be empty');
      return;
    }

    setSubmittingReply(reviewId);
    try {
      await api.put(`/reviews/${reviewId}/reply`, { reply });
      Alert.alert('Success', 'Reply added');
      fetchReviews();
      setReplyText({ ...replyText, [reviewId]: '' });
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add reply');
    } finally {
      setSubmittingReply(null);
    }
  };

  const handleDelete = (reviewId: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this review?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/reviews/${reviewId}`);
            Alert.alert('Success', 'Review deleted');
            fetchReviews();
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to delete review');
          }
        }
      }
    ]);
  };

  if (loading) return <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 50 }} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={reviews}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.productName}>{item.product?.name || 'Unknown Product'}</Text>
              <View style={styles.ratingRow}>
                {[...Array(5)].map((_, i) => (
                  <MaterialIcons key={i} name={i < item.rating ? 'star' : 'star-border'} size={16} color="#FFD700" />
                ))}
              </View>
            </View>
            
            <Text style={styles.userName}>{item.user?.name || 'Unknown'} - {new Date(item.createdAt).toLocaleDateString()}</Text>
            <Text style={styles.comment}>{item.comment}</Text>
            
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.reviewImage} />
            ) : null}

            {item.adminReply ? (
              <View style={styles.existingReplyBox}>
                <Text style={styles.replyTitle}>Your Reply:</Text>
                <Text style={styles.replyText}>{item.adminReply}</Text>
              </View>
            ) : (
              <View style={styles.replyForm}>
                <TextInput
                  style={styles.replyInput}
                  placeholder="Write a reply..."
                  placeholderTextColor="#999"
                  value={replyText[item._id] || ''}
                  onChangeText={(text) => setReplyText({ ...replyText, [item._id]: text })}
                  multiline
                />
                <TouchableOpacity 
                  style={styles.replyBtn} 
                  onPress={() => handleReply(item._id)}
                  disabled={submittingReply === item._id}
                >
                  {submittingReply === item._id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.replyBtnText}>Reply</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item._id)}>
              <MaterialIcons name="delete" size={20} color="#ff3b30" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No reviews found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingBottom: 20 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, marginHorizontal: 5 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  productName: { fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1 },
  ratingRow: { flexDirection: 'row' },
  userName: { fontSize: 13, color: '#888', marginBottom: 10 },
  comment: { fontSize: 15, color: '#444', lineHeight: 22, marginBottom: 10 },
  reviewImage: { width: 100, height: 100, borderRadius: 8, marginBottom: 10 },
  existingReplyBox: { backgroundColor: '#e6f2ff', padding: 10, borderRadius: 8, marginTop: 5, borderLeftWidth: 3, borderLeftColor: '#007AFF' },
  replyTitle: { fontWeight: 'bold', color: '#007AFF', fontSize: 13, marginBottom: 4 },
  replyText: { color: '#333', fontSize: 14 },
  replyForm: { flexDirection: 'row', marginTop: 10 },
  replyInput: { flex: 1, borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 10, backgroundColor: '#fafafa', color: '#000', marginRight: 10, maxHeight: 80 },
  replyBtn: { backgroundColor: '#007AFF', paddingHorizontal: 15, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  replyBtnText: { color: '#fff', fontWeight: 'bold' },
  deleteBtn: { position: 'absolute', top: 15, right: 15, backgroundColor: '#ffe5e5', padding: 5, borderRadius: 20 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#888', fontStyle: 'italic' }
});
