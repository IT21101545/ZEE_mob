import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, SafeAreaView, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCart } from '../context/CartContext';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../api/axios';

type PaymentMethod = 'CreditCard' | 'Cash' | 'BankTransfer' | null;

export default function CheckoutScreen() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const router = useRouter();

  // Delivery Address
  const [street, setStreet]         = useState('');
  const [city, setCity]             = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [editingAddress, setEditingAddress] = useState(true);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);

  // Credit Card Details
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv]               = useState('');

  // Bank Transfer Receipt
  const [receiptImage, setReceiptImage] = useState<ImagePicker.ImagePickerAsset | null>(null);

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

  const pickReceipt = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setReceiptImage(result.assets[0]);
    }
  };

  const handleSaveAddress = () => {
    if (!street || !city || !postalCode) {
      Alert.alert('Error', 'Please fill in all address fields');
      return;
    }
    setEditingAddress(false);
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

    if (paymentMethod === 'BankTransfer' && !receiptImage) {
      Alert.alert('Error', 'Please upload your bank transfer receipt');
      return;
    }

    setLoading(true);
    try {
      const address = `${street}, ${city}, ${postalCode}`;

      // 1. Create Order
      const items = cartItems.map(item => ({ product: item.product._id, quantity: item.quantity }));
      const orderRes = await api.post('/orders', { items, address });
      const orderId = orderRes.data._id;

      // 2. Process Payment
      const paymentRes = await api.post('/payments', { orderId, method: paymentMethod });
      const paymentId = paymentRes.data._id;

      // 3. Upload receipt for BankTransfer
      if (paymentMethod === 'BankTransfer' && receiptImage) {
        const formData = new FormData();
        const filename = receiptImage.uri.split('/').pop() || 'receipt.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('receipt', {
          uri: receiptImage.uri,
          name: filename,
          type,
        } as any);

        await api.post(`/payments/${paymentId}/receipt`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      // 4. Clear Cart
      await clearCart();

      const successMsg =
        paymentMethod === 'BankTransfer'
          ? 'Order placed! Admin will review your payment receipt and confirm your order.'
          : paymentMethod === 'Cash'
          ? 'Order placed! Pay cash upon delivery. Admin will confirm your order.'
          : 'Order placed and payment confirmed! 🎉';

      Alert.alert('Success 🎉', successMsg, [
        { text: 'OK', onPress: () => router.replace('/(tabs)/profile') },
      ]);
    } catch (error: any) {
      Alert.alert('Checkout Failed', error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Wraps handleCheckout with a Credit Card confirm dialog
  const handlePlaceOrder = () => {
    if (paymentMethod === 'CreditCard') {
      // Validate card fields first
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
      // Show confirmation dialog
      Alert.alert(
        '💳 Confirm Payment',
        `You are about to pay $${cartTotal.toFixed(2)} using your Credit Card ending in ${cardNumber.replace(/\s/g, '').slice(-4)}.\n\nDo you want to proceed?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Yes, Pay Now', onPress: handleCheckout },
        ]
      );
    } else {
      handleCheckout();
    }
  };

  const addressSummary = street ? `${street}, ${city}, ${postalCode}` : 'No address set';


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Checkout</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>

        {/* ── Delivery Address ───────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <MaterialIcons name="location-on" size={20} color="#FF9F0A" />
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            {!editingAddress && (
              <TouchableOpacity onPress={() => setEditingAddress(true)} style={styles.editAddressBtn}>
                <Text style={styles.editAddressBtnText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          {editingAddress ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="Street Address"
                placeholderTextColor="#8E8E93"
                value={street}
                onChangeText={setStreet}
              />
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="City"
                  placeholderTextColor="#8E8E93"
                  value={city}
                  onChangeText={setCity}
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Postal Code"
                  placeholderTextColor="#8E8E93"
                  value={postalCode}
                  onChangeText={setPostalCode}
                  keyboardType="numeric"
                />
              </View>
              <TouchableOpacity style={styles.saveAddressBtn} onPress={handleSaveAddress}>
                <Text style={styles.saveAddressBtnText}>Save Address</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.addressDisplay}>
              <MaterialIcons name="home" size={18} color="#8E8E93" style={{ marginRight: 8 }} />
              <Text style={styles.addressText}>{addressSummary}</Text>
            </View>
          )}
        </View>

        {/* ── Order Summary ──────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {cartItems.map((item) => (
            <View key={item.product._id} style={styles.summaryItem}>
              <Text style={styles.summaryName} numberOfLines={1}>{item.quantity}× {item.product.name}</Text>
              <Text style={styles.summaryPrice}>${(item.product.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalText}>Total</Text>
            <Text style={styles.totalPrice}>${cartTotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* ── Payment Method ─────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Option</Text>

          {/* Credit Card */}
          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'CreditCard' && styles.paymentOptionSelected]}
            onPress={() => setPaymentMethod('CreditCard')}
          >
            <MaterialIcons name="credit-card" size={24} color={paymentMethod === 'CreditCard' ? '#FF9F0A' : '#8E8E93'} />
            <Text style={[styles.paymentText, paymentMethod === 'CreditCard' && styles.paymentTextSelected]}>Credit Card</Text>
            {paymentMethod === 'CreditCard' && <MaterialIcons name="check-circle" size={22} color="#FF9F0A" style={styles.checkIcon} />}
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
                  style={[styles.cardInput, styles.halfCardInput]}
                  placeholder="MM/YY"
                  placeholderTextColor="#8E8E93"
                  keyboardType="numeric"
                  maxLength={5}
                  value={expiryDate}
                  onChangeText={formatExpiry}
                />
                <TextInput
                  style={[styles.cardInput, styles.halfCardInput]}
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

          {/* Bank Transfer */}
          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'BankTransfer' && styles.paymentOptionSelected]}
            onPress={() => setPaymentMethod('BankTransfer')}
          >
            <MaterialIcons name="account-balance" size={24} color={paymentMethod === 'BankTransfer' ? '#FF9F0A' : '#8E8E93'} />
            <Text style={[styles.paymentText, paymentMethod === 'BankTransfer' && styles.paymentTextSelected]}>Bank Transfer</Text>
            {paymentMethod === 'BankTransfer' && <MaterialIcons name="check-circle" size={22} color="#FF9F0A" style={styles.checkIcon} />}
          </TouchableOpacity>

          {paymentMethod === 'BankTransfer' && (
            <View style={styles.bankDetailsContainer}>
              <View style={styles.bankInfoRow}>
                <MaterialIcons name="info-outline" size={18} color="#FF9F0A" style={{ marginRight: 8 }} />
                <Text style={styles.bankInfoText}>Transfer to:</Text>
              </View>
              <Text style={styles.bankDetail}>🏦  Bank: Commercial Bank of Ceylon</Text>
              <Text style={styles.bankDetail}>💳  Account: 123-456-789-0</Text>
              <Text style={styles.bankDetail}>📛  Name: ZEE Fashion Store</Text>

              <TouchableOpacity style={styles.uploadReceiptBtn} onPress={pickReceipt}>
                {receiptImage ? (
                  <View style={styles.receiptPreviewRow}>
                    <Image source={{ uri: receiptImage.uri }} style={styles.receiptThumb} />
                    <Text style={styles.uploadReceiptText}>Receipt Selected ✓ (Tap to change)</Text>
                  </View>
                ) : (
                  <View style={styles.receiptPreviewRow}>
                    <MaterialIcons name="upload-file" size={22} color="#FF9F0A" />
                    <Text style={styles.uploadReceiptText}>Upload Payment Receipt</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Cash on Delivery */}
          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'Cash' && styles.paymentOptionSelected]}
            onPress={() => setPaymentMethod('Cash')}
          >
            <MaterialIcons name="payments" size={24} color={paymentMethod === 'Cash' ? '#FF9F0A' : '#8E8E93'} />
            <Text style={[styles.paymentText, paymentMethod === 'Cash' && styles.paymentTextSelected]}>Cash on Delivery</Text>
            {paymentMethod === 'Cash' && <MaterialIcons name="check-circle" size={22} color="#FF9F0A" style={styles.checkIcon} />}
          </TouchableOpacity>

          {paymentMethod === 'Cash' && (
            <View style={styles.cashInfoContainer}>
              <MaterialIcons name="info-outline" size={18} color="#30D158" style={{ marginRight: 8 }} />
              <Text style={styles.cashInfoText}>Pay cash when your order arrives. Admin will confirm your order.</Text>
            </View>
          )}
        </View>

        {/* ── Place Order Button ─────────────────────────────────────── */}
        <TouchableOpacity style={styles.checkoutBtn} onPress={handlePlaceOrder} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.checkoutBtnText}>Place Order</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#121212' },
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20, marginTop: 10 },
  backBtn:     { marginRight: 15 },
  title:       { fontSize: 24, fontWeight: 'bold', color: '#fff' },

  section:      { backgroundColor: '#1C1C1E', padding: 20, borderRadius: 16, marginHorizontal: 20, marginBottom: 20 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginLeft: 6, flex: 1 },
  editAddressBtn: { backgroundColor: 'rgba(255,159,10,0.15)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  editAddressBtnText: { color: '#FF9F0A', fontWeight: 'bold', fontSize: 13 },

  row:      { flexDirection: 'row', justifyContent: 'space-between' },
  halfInput: { flex: 0.48, marginBottom: 15 },
  input:     { borderWidth: 1, borderColor: '#3A3A3C', borderRadius: 12, padding: 15, fontSize: 16, color: '#fff', marginBottom: 15, backgroundColor: '#2C2C2E' },

  saveAddressBtn:     { backgroundColor: '#FF9F0A', padding: 14, borderRadius: 10, alignItems: 'center' },
  saveAddressBtnText: { color: '#121212', fontWeight: 'bold', fontSize: 15 },

  addressDisplay: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2E', padding: 14, borderRadius: 12 },
  addressText:    { color: '#E5E5EA', fontSize: 15, flex: 1 },

  summaryItem:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryName:   { flex: 1, fontSize: 16, color: '#E5E5EA', marginRight: 10 },
  summaryPrice:  { fontSize: 16, color: '#fff', fontWeight: '500' },
  totalRow:      { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#3A3A3C' },
  totalText:     { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  totalPrice:    { fontSize: 20, fontWeight: 'bold', color: '#FF9F0A' },

  paymentOption:         { flexDirection: 'row', alignItems: 'center', padding: 15, borderWidth: 1, borderColor: '#3A3A3C', borderRadius: 12, marginBottom: 10, backgroundColor: '#2C2C2E' },
  paymentOptionSelected: { borderColor: '#FF9F0A', backgroundColor: 'rgba(255, 159, 10, 0.1)' },
  paymentText:           { fontSize: 16, marginLeft: 15, color: '#E5E5EA', flex: 1 },
  paymentTextSelected:   { color: '#FF9F0A', fontWeight: 'bold' },
  checkIcon:             { marginLeft: 'auto' as any },

  cardDetailsContainer: { backgroundColor: '#2C2C2E', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#3A3A3C' },
  cardInput:      { borderWidth: 1, borderColor: '#3A3A3C', borderRadius: 8, padding: 12, fontSize: 16, color: '#fff', backgroundColor: '#1C1C1E', marginBottom: 10 },
  cardRow:        { flexDirection: 'row', justifyContent: 'space-between' },
  halfCardInput:  { flex: 0.48, marginBottom: 0 },

  bankDetailsContainer: { backgroundColor: '#2C2C2E', padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#3A3A3C' },
  bankInfoRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  bankInfoText:   { color: '#FF9F0A', fontWeight: 'bold', fontSize: 14 },
  bankDetail:     { color: '#E5E5EA', fontSize: 14, marginBottom: 6, marginLeft: 4 },

  uploadReceiptBtn:   { backgroundColor: '#1C1C1E', borderWidth: 1, borderColor: '#FF9F0A', borderStyle: 'dashed', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 10 },
  receiptPreviewRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  receiptThumb:       { width: 40, height: 40, borderRadius: 6 },
  uploadReceiptText:  { color: '#FF9F0A', fontWeight: 'bold', fontSize: 14, marginLeft: 8 },

  cashInfoContainer: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: 'rgba(48,209,88,0.08)', padding: 12, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(48,209,88,0.3)' },
  cashInfoText:      { color: '#30D158', fontSize: 14, flex: 1 },

  checkoutBtn:     { backgroundColor: '#FF9F0A', padding: 18, borderRadius: 14, alignItems: 'center', marginHorizontal: 20, marginTop: 10 },
  checkoutBtnText: { color: '#121212', fontSize: 18, fontWeight: 'bold' },
});
