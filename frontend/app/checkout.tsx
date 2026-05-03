import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useCart } from '../context/CartContext';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../api/axios';

export default function CheckoutScreen() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const router = useRouter();

  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');

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
    if (!street || !city || !postalCode) {
      Alert.alert('Error', 'Please enter your full delivery address');
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
      const address = `${street}, ${city}, ${postalCode}`;
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Checkout</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
        
        {/* Delivery Address */}
        <View style={styles.section}>
          <TextInput
            style={styles.input}
            placeholder="Street Address"
            placeholderTextColor="#8E8E93"
            value={street}
            onChangeText={setStreet}
          />
          <TextInput
            style={styles.input}
            placeholder="City"
            placeholderTextColor="#8E8E93"
            value={city}
            onChangeText={setCity}
          />
          <TextInput
            style={[styles.input, { marginBottom: 0 }]}
            placeholder="Postal Code"
            placeholderTextColor="#8E8E93"
            value={postalCode}
            onChangeText={setPostalCode}
            keyboardType="numeric"
          />
        </View>

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

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          
          <TouchableOpacity 
            style={[styles.paymentOption, paymentMethod === 'CreditCard' && styles.paymentOptionSelected]}
            onPress={() => setPaymentMethod('CreditCard')}
          >
            <MaterialIcons name="credit-card" size={24} color={paymentMethod === 'CreditCard' ? '#FF9F0A' : '#8E8E93'} />
            <Text style={[styles.paymentText, paymentMethod === 'CreditCard' && styles.paymentTextSelected]}>Credit Card</Text>
            {paymentMethod === 'CreditCard' && <MaterialIcons name="check-circle" size={24} color="#FF9F0A" style={{ marginLeft: 'auto' }} />}
          </TouchableOpacity>

          {paymentMethod === 'CreditCard' && (
            <View style={styles.cardDetailsContainer}>
              <TextInput
                style={styles.cardInput}
                placeholder="Card Number (e.g. 1234 5678 1234 5678)"
                placeholderTextColor="#8E8E93"
                keyboardType="numeric"
                maxLength={19}
                value={cardNumber}
                onChangeText={formatCardNumber}
              />
              <View style={styles.cardRow}>
                <TextInput
                  style={[styles.cardInput, styles.halfInput]}
                  placeholder="MM/YY"
                  placeholderTextColor="#8E8E93"
                  keyboardType="numeric"
                  maxLength={5}
                  value={expiryDate}
                  onChangeText={formatExpiry}
                />
                <TextInput
                  style={[styles.cardInput, styles.halfInput]}
                  placeholder="CVV"
                  placeholderTextColor="#8E8E93"
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
            <MaterialIcons name="money" size={24} color={paymentMethod === 'Cash' ? '#FF9F0A' : '#8E8E93'} />
            <Text style={[styles.paymentText, paymentMethod === 'Cash' && styles.paymentTextSelected]}>Cash on Delivery</Text>
            {paymentMethod === 'Cash' && <MaterialIcons name="check-circle" size={24} color="#FF9F0A" style={{ marginLeft: 'auto' }} />}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.checkoutBtnText}>Confirm Payment & Place Order</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20, marginTop: 10 },
  backBtn: { marginRight: 15 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  
  section: { backgroundColor: '#1C1C1E', padding: 20, borderRadius: 16, marginHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#fff' },
  
  input: { borderWidth: 1, borderColor: '#3A3A3C', borderRadius: 12, padding: 15, fontSize: 16, color: '#fff', marginBottom: 15, backgroundColor: '#1C1C1E' },
  
  summaryItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryName: { flex: 1, fontSize: 16, color: '#E5E5EA', marginRight: 10 },
  summaryPrice: { fontSize: 16, color: '#fff', fontWeight: '500' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#3A3A3C' },
  totalText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  totalPrice: { fontSize: 20, fontWeight: 'bold', color: '#FF9F0A' },
  
  paymentOption: { flexDirection: 'row', alignItems: 'center', padding: 15, borderWidth: 1, borderColor: '#3A3A3C', borderRadius: 12, marginBottom: 10, backgroundColor: '#2C2C2E' },
  paymentOptionSelected: { borderColor: '#FF9F0A', backgroundColor: 'rgba(255, 159, 10, 0.1)' },
  paymentText: { fontSize: 16, marginLeft: 15, color: '#E5E5EA' },
  paymentTextSelected: { color: '#FF9F0A', fontWeight: 'bold' },
  
  cardDetailsContainer: { backgroundColor: '#2C2C2E', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#3A3A3C' },
  cardInput: { borderWidth: 1, borderColor: '#3A3A3C', borderRadius: 8, padding: 12, fontSize: 16, color: '#fff', backgroundColor: '#1C1C1E', marginBottom: 10 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInput: { flex: 0.48, marginBottom: 0 },
  
  checkoutBtn: { backgroundColor: '#FF9F0A', padding: 18, borderRadius: 12, alignItems: 'center', marginHorizontal: 20, marginTop: 10 },
  checkoutBtnText: { color: '#121212', fontSize: 18, fontWeight: 'bold' }
});
