import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  Image, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { apiRequest } from '../api';

export default function ProductListScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [search,   setSearch]   = useState('');
  const [loading,  setLoading]  = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      const data  = await apiRequest('GET', `/products${query}`);
      setProducts(data);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const renderProduct = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ProductDetail', { product: item })}>
      <Image
        source={{ uri: item.image || 'https://via.placeholder.com/120' }}
        style={styles.image}
      />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.category}>{item.category}</Text>
        <Text style={styles.price}>LKR {item.price.toLocaleString()}</Text>
        <Text style={[styles.stock, item.stock === 0 && styles.outOfStock]}>
          {item.stock > 0 ? `${item.stock} in stock` : 'Out of stock'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search products..."
        placeholderTextColor="#999"
        value={search}
        onChangeText={setSearch}
        onSubmitEditing={fetchProducts}
        returnKeyType="search"
      />
      {loading ? (
        <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item._id}
          renderItem={renderProduct}
          contentContainerStyle={{ padding: 12 }}
          ListEmptyComponent={<Text style={styles.empty}>No products found</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#f5f5f5' },
  search:     { margin: 12, padding: 12, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', fontSize: 15 },
  card:       { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, overflow: 'hidden', elevation: 2 },
  image:      { width: 110, height: 110 },
  info:       { flex: 1, padding: 12, justifyContent: 'space-between' },
  name:       { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
  category:   { fontSize: 12, color: '#888', marginTop: 2 },
  price:      { fontSize: 16, fontWeight: '700', color: '#4f46e5', marginTop: 4 },
  stock:      { fontSize: 12, color: '#22c55e', marginTop: 2 },
  outOfStock: { color: '#ef4444' },
  empty:      { textAlign: 'center', marginTop: 60, color: '#999', fontSize: 16 },
});
