import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, Alert, ActivityIndicator, TextInput,
} from 'react-native';
import { apiRequest } from '../api';

export default function CartScreen({ navigation }) {
  const [cart,     setCart]     = useState(null);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [address,  setAddress]  = useState('');
  const [checking, setChecking] = useState(false);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('GET', '/cart');
      setCart(data.cart);
      setTotal(data.total);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCart(); }, []);

  const updateQty = async (productId, quantity) => {
    try {
      await apiRequest('PUT', '/cart/update', { productId, quantity });
      fetchCart();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const removeItem = async (productId) => {
    try {
      await apiRequest('DELETE', `/cart/remove/${productId}`);
      fetchCart();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const checkout = async () => {
    if (!address.trim()) { Alert.alert('Error', 'Please enter a delivery address'); return; }
    if (!cart?.items?.length) { Alert.alert('Error', 'Cart is empty'); return; }
    setChecking(true);
    try {
      const items = cart.items.map(i => ({ product: i.product._id, quantity: i.quantity }));
      const order = await apiRequest('POST', '/orders', { items, address });
      await apiRequest('DELETE', '/cart/clear');
      navigation.navigate('Payment', { order });
    } catch (err) {
      Alert.alert('Checkout Failed', err.message);
    } finally {
      setChecking(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Image source={{ uri: item.product?.image || 'https://via.placeholder.com/80' }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{item.product?.name}</Text>
        <Text style={styles.price}>LKR {item.product?.price?.toLocaleString()}</Text>
        <View style={styles.qtyRow}>
          <TouchableOpacity onPress={() => updateQty(item.product._id, item.quantity - 1)} style={styles.qtyBtn}>
            <Text style={styles.qtyBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qty}>{item.quantity}</Text>
          <TouchableOpacity onPress={() => updateQty(item.product._id, item.quantity + 1)} style={styles.qtyBtn}>
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => removeItem(item.product._id)} style={styles.removeBtn}>
            <Text style={styles.removeText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) return <ActivityIndicator size="large" color="#4f46e5" style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={cart?.items || []}
        keyExtractor={item => item.product?._id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text style={styles.empty}>Your cart is empty</Text>}
      />

      {cart?.items?.length > 0 && (
        <View style={styles.footer}>
          <TextInput
            style={styles.addressInput}
            placeholder="Delivery address"
            placeholderTextColor="#999"
            value={address}
            onChangeText={setAddress}
            multiline
          />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>LKR {total.toLocaleString()}</Text>
          </View>
          <TouchableOpacity style={styles.checkoutBtn} onPress={checkout} disabled={checking}>
            {checking ? <ActivityIndicator color="#fff" /> : <Text style={styles.checkoutText}>Proceed to Payment</Text>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f5f5f5' },
  item:         { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, overflow: 'hidden', elevation: 2 },
  image:        { width: 90, height: 90 },
  info:         { flex: 1, padding: 10, justifyContent: 'space-between' },
  name:         { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  price:        { fontSize: 14, color: '#4f46e5', fontWeight: '600' },
  qtyRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  qtyBtn:       { backgroundColor: '#f0f0f0', borderRadius: 6, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText:   { fontSize: 18, color: '#333' },
  qty:          { fontSize: 15, fontWeight: '600', minWidth: 24, textAlign: 'center' },
  removeBtn:    { marginLeft: 'auto' },
  removeText:   { color: '#ef4444', fontSize: 13, fontWeight: '500' },
  footer:       { backgroundColor: '#fff', padding: 16, elevation: 8 },
  addressInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 14, color: '#333', minHeight: 50 },
  totalRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  totalLabel:   { fontSize: 16, color: '#555' },
  totalValue:   { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  checkoutBtn:  { backgroundColor: '#4f46e5', borderRadius: 12, padding: 15, alignItems: 'center' },
  checkoutText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  empty:        { textAlign: 'center', marginTop: 60, color: '#999', fontSize: 16 },
});
