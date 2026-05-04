import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useProducts, Product } from '../../context/ProductContext';
import { useAuth } from '../../context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
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
  const { user } = useAuth();
  const { colors } = useTheme();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState<string>('0');
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  
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
        
        // Check if in wishlist
        if (user) {
          const wishRes = await api.get('/wishlist');
          const isWishlisted = wishRes.data.some((item: any) => item._id === id);
          setInWishlist(isWishlisted);
        }
      } catch (error) {
        console.error('Failed to fetch details', error);
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

  const toggleWishlist = async () => {
    if (!user) {
      Alert.alert('Please Login', 'You must be logged in to manage your wishlist.');
      return;
    }
    try {
      if (inWishlist) {
        await api.delete(`/wishlist/${id}`);
        setInWishlist(false);
        Alert.alert('Wishlist', 'Removed from wishlist!');
      } else {
        await api.post('/wishlist', { productId: id });
        setInWishlist(true);
        Alert.alert('Wishlist', 'Added to wishlist!');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update wishlist');
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

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await api.delete(`/reviews/${reviewId}`);
      setReviews(reviews.filter(r => r._id !== reviewId));
      Alert.alert('Success', 'Review deleted');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete review');
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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ title: product.name }} />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <Image 
          source={{ uri: imageError || !product.image ? 'https://via.placeholder.com/400' : product.image }} 
          style={styles.image} 
          onError={() => setImageError(true)}
        />
        
        <View style={[styles.infoContainer, { backgroundColor: colors.card }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[styles.name, { flex: 1, marginRight: 10, marginBottom: 0, color: colors.text }]}>{product.name}</Text>
            <TouchableOpacity onPress={toggleWishlist}>
              <MaterialIcons name={inWishlist ? "favorite" : "favorite-border"} size={28} color="#FF3B30" />
            </TouchableOpacity>
          </View>
          <View style={[styles.ratingRow, { marginTop: 10 }]}>
            <MaterialIcons name="star" size={20} color="#FFD700" />
            <Text style={styles.ratingText}>{avgRating} ({reviews.length} reviews)</Text>
          </View>
          <Text style={[styles.price, { color: colors.primary }]}>${product.price.toFixed(2)}</Text>
          <Text style={[styles.description, { color: colors.text }]}>{product.description}</Text>
          
          <Text style={styles.stock}>Availability: {product.stock > 0 ? 'In Stock' : 'Out of Stock'}</Text>
        </View>

        {/* Reviews Section */}
        <View style={[styles.reviewsContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Reviews</Text>
          
          {/* Write a Review */}
          <View style={[styles.writeReviewContainer, { backgroundColor: colors.inputBackground }]}>
            <Text style={[styles.writeReviewTitle, { color: colors.text }]}>Leave a Review</Text>
            <View style={styles.starSelectRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <MaterialIcons name={star <= rating ? 'star' : 'star-border'} size={32} color="#FFD700" />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[styles.reviewInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="Write your experience..."
              placeholderTextColor={colors.textMuted}
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
              <View key={rev._id} style={[styles.reviewCard, { borderBottomColor: colors.border }]}>
                <View style={styles.reviewHeader}>
                  <Text style={[styles.reviewerName, { color: colors.text }]}>{rev.user.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', marginRight: 10 }}>
                      {[...Array(5)].map((_, i) => (
                        <MaterialIcons key={i} name={i < rev.rating ? 'star' : 'star-border'} size={16} color="#FFD700" />
                      ))}
                    </View>
                    {(user?._id === rev.user._id || user?.role === 'admin') && (
                      <TouchableOpacity onPress={() => handleDeleteReview(rev._id)}>
                        <MaterialIcons name="delete-outline" size={20} color="#FF3B30" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                <Text style={styles.reviewDate}>{new Date(rev.createdAt).toLocaleDateString()}</Text>
                <Text style={[styles.reviewComment, { color: colors.text }]}>{rev.comment}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <Text style={[styles.bottomPrice, { color: colors.text }]}>${product.price.toFixed(2)}</Text>
        <TouchableOpacity style={[styles.addToCartBtn, product.stock === 0 && { backgroundColor: colors.border }]} onPress={handleAddToCart} disabled={product.stock === 0}>
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
