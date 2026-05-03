import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { apiRequest } from '../api';

const STATUS_COLORS = {
  Pending:    '#f59e0b',
  Processing: '#3b82f6',
  Shipped:    '#8b5cf6',
  Delivered:  '#22c55e',
  Cancelled:  '#ef4444',
};

export default function OrdersScreen({ navigation }) {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('GET', '/orders');
      setOrders(data);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const cancelOrder = async (orderId) => {
    Alert.alert('Cancel Order', 'Are you sure?', [
      { text: 'No' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiRequest('PUT', `/orders/${orderId}/cancel`);
            fetchOrders();
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  const renderOrder = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.orderId}>#{item._id.slice(-8).toUpperCase()}</Text>
        <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] + '22' }]}>
          <Text style={[styles.badgeText, { color: STATUS_COLORS[item.status] }]}>{item.status}</Text>
        </View>
      </View>

      <Text style={styles.meta}>{item.items.length} item(s)  ·  LKR {item.totalAmount.toLocaleString()}</Text>
      <Text style={styles.address} numberOfLines={1}>📍 {item.address}</Text>
      <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>

      {item.status === 'Pending' && (
        <TouchableOpacity style={styles.cancelBtn} onPress={() => cancelOrder(item._id)}>
          <Text style={styles.cancelText}>Cancel Order</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item._id}
          renderItem={renderOrder}
          contentContainerStyle={{ padding: 16 }}
          onRefresh={fetchOrders}
          refreshing={loading}
          ListEmptyComponent={<Text style={styles.empty}>No orders yet</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#f5f5f5' },
  card:       { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderId:    { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  badge:      { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText:  { fontSize: 12, fontWeight: '600' },
  meta:       { fontSize: 14, color: '#555' },
  address:    { fontSize: 13, color: '#888', marginTop: 4 },
  date:       { fontSize: 12, color: '#aaa', marginTop: 4 },
  cancelBtn:  { marginTop: 10, borderWidth: 1, borderColor: '#ef4444', borderRadius: 8, padding: 8, alignItems: 'center' },
  cancelText: { color: '#ef4444', fontWeight: '600' },
  empty:      { textAlign: 'center', marginTop: 60, color: '#999', fontSize: 16 },
});
