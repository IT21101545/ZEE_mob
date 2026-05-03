import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useCart } from '../context/CartContext';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../api/axios';

export default function CheckoutScreen() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const router = useRouter();

  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CreditCard' | 'Cash' | null>(null);
  
  // Credit Card Details
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  
  const [loading, setLoading] = useState(false);

  const formatCardNumber = (text: string) => {
    const formatted = text.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim();
    setCardNumber(formatted);
  };

  const formatExpiry = (text: string) => {
    let formatted = text.replace(/\D/g, '');
    if (formatted.length >= 2) {
      formatted = formatted.substring(0, 2) + '/' + formatted.substring(2, 4);
    }
    setExpiryDate(formatted);
  };

  const handleCheckout = async () => {
    if (!address) {
      Alert.alert('Error', 'Please enter a delivery address');
      return;
    }
    if (cartItems.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }

    if (!paymentMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    if (paymentMethod === 'CreditCard') {
      if (!cardNumber || !expiryDate || !cvv) {
        Alert.alert('Error', 'Please fill in all credit card details');
        return;
      }
      if (cardNumber.replace(/\s/g, '').length < 16) {
        Alert.alert('Error', 'Please enter a valid 16-digit card number');
        return;
      }
      if (expiryDate.length < 5) {
        Alert.alert('Error', 'Please enter a valid expiry date (MM/YY)');
        return;
      }
      if (cvv.length < 3) {
        Alert.alert('Error', 'Please enter a valid CVV');
        return;
      }
    }

    setLoading(true);
    try {
      // 1. Create Order
      const items = cartItems.map(item => ({ product: item.product._id, quantity: item.quantity }));
      const orderRes = await api.post('/orders', { items, address });
      const orderId = orderRes.data._id;

      // 2. Process Payment
      await api.post('/payments', { orderId, method: paymentMethod });

      // 3. Clear Cart
      await clearCart();

      Alert.alert('Success', 'Order placed successfully!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/profile') }
      ]);
    } catch (error: any) {
      Alert.alert('Checkout Failed', error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Checkout</Text>

      {/* Order Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        {cartItems.map((item) => (
          <View key={item.product._id} style={styles.summaryItem}>
            <Text style={styles.summaryName} numberOfLines={1}>{item.quantity}x {item.product.name}</Text>
            <Text style={styles.summaryPrice}>${(item.product.price * item.quantity).toFixed(2)}</Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalText}>Total</Text>
          <Text style={styles.totalPrice}>${cartTotal.toFixed(2)}</Text>
        </View>
      </View>

      {/* Delivery Address */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        <TextInput
          style={styles.addressInput}
          placeholder="Enter full shipping address..."
          multiline
          numberOfLines={3}
          value={address}
          onChangeText={setAddress}
        />
      </View>

      {/* Payment Method */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        
        <TouchableOpacity 
          style={[styles.paymentOption, paymentMethod === 'CreditCard' && styles.paymentOptionSelected]}
          onPress={() => setPaymentMethod('CreditCard')}
        >
          <MaterialIcons name="credit-card" size={24} color={paymentMethod === 'CreditCard' ? '#007AFF' : '#666'} />
          <Text style={[styles.paymentText, paymentMethod === 'CreditCard' && styles.paymentTextSelected]}>Credit Card</Text>
          {paymentMethod === 'CreditCard' && <MaterialIcons name="check-circle" size={24} color="#007AFF" style={{ marginLeft: 'auto' }} />}
        </TouchableOpacity>

        {paymentMethod === 'CreditCard' && (
          <View style={styles.cardDetailsContainer}>
            <TextInput
              style={styles.cardInput}
              placeholder="Card Number (e.g. 1234 5678 1234 5678)"
              keyboardType="numeric"
              maxLength={19}
              value={cardNumber}
              onChangeText={formatCardNumber}
            />
            <View style={styles.cardRow}>
              <TextInput
                style={[styles.cardInput, styles.halfInput]}
                placeholder="MM/YY"
                keyboardType="numeric"
                maxLength={5}
                value={expiryDate}
                onChangeText={formatExpiry}
              />
              <TextInput
                style={[styles.cardInput, styles.halfInput]}
                placeholder="CVV"
                keyboardType="numeric"
                maxLength={4}
                value={cvv}
                onChangeText={setCvv}
                secureTextEntry
              />
            </View>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.paymentOption, paymentMethod === 'Cash' && styles.paymentOptionSelected]}
          onPress={() => setPaymentMethod('Cash')}
        >
          <MaterialIcons name="money" size={24} color={paymentMethod === 'Cash' ? '#007AFF' : '#666'} />
          <Text style={[styles.paymentText, paymentMethod === 'Cash' && styles.paymentTextSelected]}>Cash on Delivery</Text>
          {paymentMethod === 'Cash' && <MaterialIcons name="check-circle" size={24} color="#007AFF" style={{ marginLeft: 'auto' }} />}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.checkoutBtnText}>Confirm Payment & Place Order</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  section: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  summaryItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryName: { flex: 1, fontSize: 16, color: '#555', marginRight: 10 },
  summaryPrice: { fontSize: 16, color: '#333', fontWeight: '500' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#eee' },
  totalText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  totalPrice: { fontSize: 20, fontWeight: 'bold', color: '#007AFF' },
  addressInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 15, fontSize: 16, textAlignVertical: 'top', minHeight: 80, backgroundColor: '#fafafa' },
  paymentOption: { flexDirection: 'row', alignItems: 'center', padding: 15, borderWidth: 1, borderColor: '#eee', borderRadius: 8, marginBottom: 10 },
  paymentOptionSelected: { borderColor: '#007AFF', backgroundColor: '#f0f8ff' },
  paymentText: { fontSize: 16, marginLeft: 15, color: '#666' },
  paymentTextSelected: { color: '#007AFF', fontWeight: 'bold' },
  cardDetailsContainer: { backgroundColor: '#fafafa', padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  cardInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#fff', marginBottom: 10 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInput: { flex: 0.48, marginBottom: 0 },
  checkoutBtn: { backgroundColor: '#007AFF', padding: 18, borderRadius: 12, alignItems: 'center', marginBottom: 40 },
  checkoutBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
