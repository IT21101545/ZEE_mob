import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { apiRequest } from '../api';

const METHODS = ['CreditCard', 'DebitCard', 'Cash', 'BankTransfer'];

export default function PaymentScreen({ route, navigation }) {
  const { order }   = route.params;
  const [method,    setMethod]  = useState('CreditCard');
  const [loading,   setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      const payment = await apiRequest('POST', '/payments', {
        orderId: order._id,
        method,
      });

      if (payment.status === 'Completed') {
        Alert.alert(
          '✅ Payment Successful',
          `Transaction ID: ${payment.transactionId.slice(0, 8).toUpperCase()}\nAmount: LKR ${payment.amount.toLocaleString()}`,
          [{ text: 'View Orders', onPress: () => navigation.navigate('Orders') }]
        );
      } else {
        Alert.alert('❌ Payment Failed', 'Your payment could not be processed. Please try again.', [
          { text: 'Retry', onPress: () => setLoading(false) },
        ]);
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <View style={styles.orderSummary}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <Text style={styles.orderId}>Order #{order._id.slice(-8).toUpperCase()}</Text>
        {order.items?.map((item, idx) => (
          <View key={idx} style={styles.itemRow}>
            <Text style={styles.itemName} numberOfLines={1}>{item.name} × {item.quantity}</Text>
            <Text style={styles.itemPrice}>LKR {(item.price * item.quantity).toLocaleString()}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.itemRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>LKR {order.totalAmount?.toLocaleString()}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Payment Method</Text>
      {METHODS.map(m => (
        <TouchableOpacity
          key={m}
          style={[styles.methodCard, method === m && styles.methodCardActive]}
          onPress={() => setMethod(m)}
        >
          <View style={[styles.radio, method === m && styles.radioActive]} />
          <Text style={[styles.methodText, method === m && styles.methodTextActive]}>{m}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.payBtn} onPress={handlePay} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.payBtnText}>Pay LKR {order.totalAmount?.toLocaleString()}</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#f5f5f5' },
  orderSummary:    { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20, elevation: 2 },
  sectionTitle:    { fontSize: 17, fontWeight: '700', color: '#1a1a2e', marginBottom: 12 },
  orderId:         { fontSize: 13, color: '#888', marginBottom: 10 },
  itemRow:         { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  itemName:        { flex: 1, fontSize: 14, color: '#555', marginRight: 8 },
  itemPrice:       { fontSize: 14, color: '#333', fontWeight: '500' },
  divider:         { height: 1, backgroundColor: '#eee', marginVertical: 10 },
  totalLabel:      { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  totalValue:      { fontSize: 16, fontWeight: '700', color: '#4f46e5' },
  methodCard:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 2, borderColor: '#eee', elevation: 1 },
  methodCardActive:{ borderColor: '#4f46e5', backgroundColor: '#f0f0ff' },
  radio:           { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#ccc', marginRight: 12 },
  radioActive:     { borderColor: '#4f46e5', backgroundColor: '#4f46e5' },
  methodText:      { fontSize: 15, color: '#555' },
  methodTextActive:{ color: '#4f46e5', fontWeight: '600' },
  payBtn:          { backgroundColor: '#4f46e5', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 10 },
  payBtnText:      { color: '#fff', fontSize: 16, fontWeight: '700' },
});
