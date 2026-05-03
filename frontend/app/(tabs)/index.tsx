import React from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useProducts } from '../../context/ProductContext';
import { useCart } from '../../context/CartContext';
import { MaterialIcons } from '@expo/vector-icons';

export default function ShopScreen() {
  const { products, isLoading } = useProducts();
  const { addToCart } = useCart();
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
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <ProductCard 
            item={item} 
            onPress={() => router.push(`/product/${item._id}`)} 
            onAddToCart={handleAddToCart} 
          />
        )}
        numColumns={2}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const ProductCard = ({ item, onPress, onAddToCart }: any) => {
  const [imageError, setImageError] = React.useState(false);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image 
        source={{ uri: imageError || !item.image ? 'https://via.placeholder.com/150' : item.image }} 
        style={styles.image} 
        onError={() => setImageError(true)}
      />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.price}>${item.price.toFixed(2)}</Text>
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
    backgroundColor: '#fff',
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
});
