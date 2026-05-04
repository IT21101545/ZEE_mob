import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Modal,
} from 'react-native';
import { apiRequest } from '../api';

const StarRow = ({ rating, onSelect }) => (
  <View style={{ flexDirection: 'row', marginVertical: 8 }}>
    {[1, 2, 3, 4, 5].map(s => (
      <TouchableOpacity key={s} onPress={() => onSelect && onSelect(s)}>
        <Text style={{ fontSize: 28, color: s <= rating ? '#f59e0b' : '#ddd' }}>★</Text>
      </TouchableOpacity>
    ))}
  </View>
);

export default function ReviewsScreen({ route }) {
  const { productId, productName } = route.params;
  const [reviews,   setReviews]   = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [loading,   setLoading]   = useState(false);
  const [modalVisible, setModal]  = useState(false);
  const [rating,    setRating]    = useState(5);
  const [comment,   setComment]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('GET', `/reviews/product/${productId}`);
      setReviews(data.reviews);
      setAvgRating(data.avgRating);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  const submitReview = async () => {
    if (!comment.trim()) { Alert.alert('Error', 'Comment is required'); return; }
    setSubmitting(true);
    try {
      await apiRequest('POST', '/reviews', { productId, rating, comment: comment.trim() });
      setModal(false);
      setComment('');
      setRating(5);
      fetchReviews();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteReview = async (id) => {
    Alert.alert('Delete Review', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await apiRequest('DELETE', `/reviews/${id}`);
            fetchReviews();
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  const renderReview = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.reviewer}>{item.user?.name || 'User'}</Text>
        <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
      <StarRow rating={item.rating} />
      <Text style={styles.comment}>{item.comment}</Text>
      <TouchableOpacity onPress={() => deleteReview(item._id)}>
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.productName} numberOfLines={1}>{productName}</Text>
        <View style={styles.avgRow}>
          <Text style={styles.avgRating}>{avgRating}</Text>
          <Text style={styles.avgStar}>★</Text>
          <Text style={styles.totalCount}>({reviews.length} reviews)</Text>
        </View>
        <TouchableOpacity style={styles.writeBtn} onPress={() => setModal(true)}>
          <Text style={styles.writeBtnText}>Write a Review</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={item => item._id}
          renderItem={renderReview}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={styles.empty}>No reviews yet. Be the first!</Text>}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Write a Review</Text>
            <StarRow rating={rating} onSelect={setRating} />
            <TextInput
              style={styles.commentInput}
              placeholder="Share your experience..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              value={comment}
              onChangeText={setComment}
            />
            <TouchableOpacity style={styles.submitBtn} onPress={submitReview} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Review</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModal(false)} style={{ marginTop: 12 }}>
              <Text style={{ textAlign: 'center', color: '#888' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f5f5f5' },
  header:       { backgroundColor: '#fff', padding: 16, elevation: 2 },
  productName:  { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  avgRow:       { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  avgRating:    { fontSize: 28, fontWeight: '700', color: '#f59e0b' },
  avgStar:      { fontSize: 22, color: '#f59e0b', marginHorizontal: 4 },
  totalCount:   { fontSize: 14, color: '#888' },
  writeBtn:     { marginTop: 12, backgroundColor: '#4f46e5', borderRadius: 10, padding: 12, alignItems: 'center' },
  writeBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  card:         { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, elevation: 2 },
  cardHeader:   { flexDirection: 'row', justifyContent: 'space-between' },
  reviewer:     { fontWeight: '600', fontSize: 14, color: '#1a1a2e' },
  date:         { fontSize: 12, color: '#aaa' },
  comment:      { fontSize: 14, color: '#555', lineHeight: 20, marginTop: 4 },
  deleteText:   { color: '#ef4444', fontSize: 13, marginTop: 8 },
  empty:        { textAlign: 'center', marginTop: 60, color: '#999', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox:     { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle:   { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  commentInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, marginTop: 8, fontSize: 14, color: '#333', minHeight: 100, textAlignVertical: 'top' },
  submitBtn:    { backgroundColor: '#4f46e5', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 12 },
  submitText:   { color: '#fff', fontSize: 15, fontWeight: '600' },
});
