import React from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useCart, CartItem } from '../../context/CartContext';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';

export default function CartScreen() {
  const { cartItems, cartTotal, isLoading, updateCartItem, removeFromCart } = useCart();
  const router = useRouter();
  const { colors } = useTheme();

  if (isLoading && cartItems.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (cartItems.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <MaterialIcons name="remove-shopping-cart" size={80} color={colors.textMuted} />
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>Your cart is empty</Text>
        <TouchableOpacity style={styles.shopButton} onPress={() => router.push('/(tabs)')}>
          <Text style={styles.shopButtonText}>Start Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={[styles.cartItem, { backgroundColor: colors.card }]}>
      <Image source={{ uri: item.product.image || 'https://via.placeholder.com/100' }} style={styles.image} />
      <View style={styles.itemInfo}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{item.product.name}</Text>
        <Text style={[styles.price, { color: colors.primary }]}>${item.product.price.toFixed(2)}</Text>
        
        <View style={styles.quantityContainer}>
          <TouchableOpacity onPress={() => updateCartItem(item.product._id, item.quantity - 1)}>
            <MaterialIcons name="remove-circle-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.quantity, { color: colors.text }]}>{item.quantity}</Text>
          <TouchableOpacity onPress={() => updateCartItem(item.product._id, item.quantity + 1)}>
            <MaterialIcons name="add-circle-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity style={styles.removeButton} onPress={() => removeFromCart(item.product._id)}>
        <MaterialIcons name="delete-outline" size={28} color="#ff3b30" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.product._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <View style={styles.totalContainer}>
          <Text style={[styles.totalLabel, { color: colors.text }]}>Total:</Text>
          <Text style={[styles.totalValue, { color: colors.primary }]}>${cartTotal.toFixed(2)}</Text>
        </View>
        <TouchableOpacity style={styles.checkoutButton} onPress={() => router.push('/checkout')}>
          <Text style={styles.checkoutText}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 20, color: '#888', marginTop: 15, marginBottom: 25 },
  shopButton: { backgroundColor: '#007AFF', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 8 },
  shopButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  list: { padding: 10 },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  image: { width: 80, height: 80, borderRadius: 8 },
  itemInfo: { flex: 1, marginLeft: 15 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  price: { fontSize: 14, color: '#007AFF', marginTop: 5, marginBottom: 10 },
  quantityContainer: { flexDirection: 'row', alignItems: 'center' },
  quantity: { fontSize: 16, fontWeight: 'bold', marginHorizontal: 15 },
  removeButton: { padding: 10 },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  totalValue: { fontSize: 22, fontWeight: 'bold', color: '#007AFF' },
  checkoutButton: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center' },
  checkoutText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
