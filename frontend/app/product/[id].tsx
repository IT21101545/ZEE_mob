import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useProducts, Product } from '../../context/ProductContext';
import { useCart } from '../../context/CartContext';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../../api/axios';

interface Review {
  _id: string;
  user: { name: string; _id: string };
  rating: number;
  comment: string;
  createdAt: string;
}

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { getProduct } = useProducts();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState<string>('0');
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  
  // Review form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;
      setLoading(true);
      const prod = await getProduct(id as string);
      setProduct(prod);

      try {
        const res = await api.get(`/reviews/product/${id}`);
        setReviews(res.data.reviews);
        setAvgRating(res.data.avgRating);
      } catch (error) {
        console.error('Failed to fetch reviews', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      await addToCart(product._id, 1);
      Alert.alert('Success', 'Added to cart!');
    } catch (error) {
      Alert.alert('Error', 'Could not add to cart');
    }
  };

  const submitReview = async () => {
    if (!comment) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }
    setSubmittingReview(true);
    try {
      await api.post('/reviews', { productId: id, rating, comment });
      // Refresh reviews
      const res = await api.get(`/reviews/product/${id}`);
      setReviews(res.data.reviews);
      setAvgRating(res.data.avgRating);
      setComment('');
      Alert.alert('Success', 'Review submitted!');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.center, { backgroundColor: '#f4f4f4' }]}>
        <MaterialIcons name="error-outline" size={60} color="#ff3b30" />
        <Text style={{ fontSize: 18, color: '#333', marginTop: 15, fontWeight: 'bold' }}>Product not found!</Text>
        <Text style={{ fontSize: 14, color: '#666', marginTop: 5, textAlign: 'center', paddingHorizontal: 40 }}>
          This product may have been deleted. Please go back and refresh the app.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: product.name }} />
      <ScrollView style={styles.container}>
        <Image 
          source={{ uri: imageError || !product.image ? 'https://via.placeholder.com/400' : product.image }} 
          style={styles.image} 
          onError={() => setImageError(true)}
        />
        
        <View style={styles.infoContainer}>
          <Text style={styles.name}>{product.name}</Text>
          <View style={styles.ratingRow}>
            <MaterialIcons name="star" size={20} color="#FFD700" />
            <Text style={styles.ratingText}>{avgRating} ({reviews.length} reviews)</Text>
          </View>
          <Text style={styles.price}>${product.price.toFixed(2)}</Text>
          <Text style={styles.description}>{product.description}</Text>
          
          <Text style={styles.stock}>Availability: {product.stock > 0 ? 'In Stock' : 'Out of Stock'}</Text>
        </View>

        {/* Reviews Section */}
        <View style={styles.reviewsContainer}>
          <Text style={styles.sectionTitle}>Reviews</Text>
          
          {/* Write a Review */}
          <View style={styles.writeReviewContainer}>
            <Text style={styles.writeReviewTitle}>Leave a Review</Text>
            <View style={styles.starSelectRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <MaterialIcons name={star <= rating ? 'star' : 'star-border'} size={32} color="#FFD700" />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.reviewInput}
              placeholder="Write your experience..."
              multiline
              value={comment}
              onChangeText={setComment}
            />
            <TouchableOpacity style={styles.submitReviewBtn} onPress={submitReview} disabled={submittingReview}>
              {submittingReview ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitReviewText}>Submit Review</Text>}
            </TouchableOpacity>
          </View>

          {/* List Reviews */}
          {reviews.length === 0 ? (
            <Text style={styles.noReviews}>No reviews yet. Be the first!</Text>
          ) : (
            reviews.map((rev) => (
              <View key={rev._id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>{rev.user.name}</Text>
                  <View style={{ flexDirection: 'row' }}>
                    {[...Array(5)].map((_, i) => (
                      <MaterialIcons key={i} name={i < rev.rating ? 'star' : 'star-border'} size={16} color="#FFD700" />
                    ))}
                  </View>
                </View>
                <Text style={styles.reviewDate}>{new Date(rev.createdAt).toLocaleDateString()}</Text>
                <Text style={styles.reviewComment}>{rev.comment}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        <Text style={styles.bottomPrice}>${product.price.toFixed(2)}</Text>
        <TouchableOpacity style={[styles.addToCartBtn, product.stock === 0 && { backgroundColor: '#ccc' }]} onPress={handleAddToCart} disabled={product.stock === 0}>
          <Text style={styles.addToCartText}>{product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#f4f4f4' },
  image: { width: '100%', height: 350, resizeMode: 'cover', backgroundColor: '#fff' },
  infoContainer: { padding: 20, backgroundColor: '#fff', marginBottom: 10 },
  name: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  ratingText: { marginLeft: 5, fontSize: 16, color: '#666' },
  price: { fontSize: 28, fontWeight: 'bold', color: '#007AFF', marginBottom: 15 },
  description: { fontSize: 16, color: '#444', lineHeight: 24, marginBottom: 15 },
  stock: { fontSize: 14, color: '#888', fontStyle: 'italic' },
  reviewsContainer: { padding: 20, backgroundColor: '#fff', paddingBottom: 100 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  writeReviewContainer: { marginBottom: 30, padding: 15, backgroundColor: '#f9f9f9', borderRadius: 10 },
  writeReviewTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  starSelectRow: { flexDirection: 'row', marginBottom: 15 },
  reviewInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, minHeight: 80, textAlignVertical: 'top', marginBottom: 15 },
  submitReviewBtn: { backgroundColor: '#007AFF', padding: 12, borderRadius: 8, alignItems: 'center' },
  submitReviewText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  noReviews: { fontStyle: 'italic', color: '#888' },
  reviewCard: { borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 15 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewerName: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  reviewDate: { fontSize: 12, color: '#888', marginTop: 4, marginBottom: 8 },
  reviewComment: { fontSize: 15, color: '#555', lineHeight: 22 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', flexDirection: 'row', padding: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#eee', alignItems: 'center', justifyContent: 'space-between' },
  bottomPrice: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  addToCartBtn: { backgroundColor: '#007AFF', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30 },
  addToCartText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
