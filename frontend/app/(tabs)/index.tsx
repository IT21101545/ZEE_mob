import React from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useProducts } from '../../context/ProductContext';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';

export default function ShopScreen() {
  const { products, isLoading, error, fetchProducts } = useProducts();
  const { addToCart } = useCart();
  const { colors } = useTheme();
  const router = useRouter();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const handleAddToCart = async (item: any) => {
    try {
      await addToCart(item._id, 1);
      Alert.alert('Success', 'Added to cart!');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Could not add to cart. Please refresh the app.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <ProductCard 
            item={item} 
            onPress={() => router.push(`/product/${item._id}`)} 
            onAddToCart={handleAddToCart} 
            colors={colors}
          />
        )}
        numColumns={2}
        contentContainerStyle={[styles.list, products?.length === 0 && { flex: 1 }]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{error ? `Error: ${error}` : 'No products available.'}</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={fetchProducts}>
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const ProductCard = ({ item, onPress, onAddToCart, colors }: any) => {
  const [imageError, React_useState] = React.useState(false);

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={onPress}>
      <Image 
        source={{ uri: imageError || !item.image ? 'https://via.placeholder.com/150' : item.image }} 
        style={styles.image} 
        onError={() => React_useState(true)}
      />
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[styles.price, { color: colors.primary }]}>${item.price.toFixed(2)}</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => onAddToCart(item)}>
          <Text style={styles.addButtonText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 10 },
  card: {
    flex: 1,
    borderWidth: 1,
    margin: 5,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: { width: '100%', height: 150, resizeMode: 'cover' },
  info: { padding: 10 },
  name: { fontSize: 16, fontWeight: 'bold', marginBottom: 5, color: '#333' },
  price: { fontSize: 14, color: '#007AFF', marginBottom: 10 },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  addButtonText: { color: '#fff', fontWeight: 'bold' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 18, color: '#666', marginBottom: 20 },
  refreshButton: { backgroundColor: '#007AFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  refreshButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
