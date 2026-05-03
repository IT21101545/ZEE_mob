import React, { useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { apiRequest } from '../api';

export default function ProductDetailScreen({ route, navigation }) {
  const { product } = route.params;
  const [adding, setAdding] = useState(false);

  const addToCart = async () => {
    setAdding(true);
    try {
      await apiRequest('POST', '/cart/add', { productId: product._id, quantity: 1 });
      Alert.alert('Added!', `${product.name} added to cart`, [
        { text: 'Keep shopping' },
        { text: 'View Cart', onPress: () => navigation.navigate('Cart') },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Image
        source={{ uri: product.image || 'https://via.placeholder.com/400' }}
        style={styles.image}
      />
      <View style={styles.body}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.category}>{product.category}</Text>
        <Text style={styles.price}>LKR {product.price.toLocaleString()}</Text>
        <Text style={styles.description}>{product.description}</Text>
        <Text style={[styles.stock, product.stock === 0 && styles.outOfStock]}>
          {product.stock > 0 ? `${product.stock} units available` : 'Out of stock'}
        </Text>

        <TouchableOpacity
          style={[styles.button, product.stock === 0 && styles.buttonDisabled]}
          onPress={addToCart}
          disabled={adding || product.stock === 0}
        >
          {adding
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Add to Cart</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.reviewsBtn}
          onPress={() => navigation.navigate('Reviews', { productId: product._id, productName: product.name })}
        >
          <Text style={styles.reviewsBtnText}>View Reviews</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#fff' },
  image:        { width: '100%', height: 280 },
  body:         { padding: 20 },
  name:         { fontSize: 22, fontWeight: '700', color: '#1a1a2e' },
  category:     { fontSize: 13, color: '#888', marginTop: 4 },
  price:        { fontSize: 24, fontWeight: '700', color: '#4f46e5', marginTop: 8 },
  description:  { fontSize: 15, color: '#555', lineHeight: 22, marginTop: 12 },
  stock:        { fontSize: 14, color: '#22c55e', marginTop: 8 },
  outOfStock:   { color: '#ef4444' },
  button:       { backgroundColor: '#4f46e5', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 20 },
  buttonDisabled: { backgroundColor: '#ccc' },
  buttonText:   { color: '#fff', fontSize: 16, fontWeight: '600' },
  reviewsBtn:   { borderWidth: 1, borderColor: '#4f46e5', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 12 },
  reviewsBtnText: { color: '#4f46e5', fontSize: 15, fontWeight: '600' },
});
