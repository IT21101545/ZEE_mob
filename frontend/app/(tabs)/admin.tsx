import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, SafeAreaView, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useProducts, Product } from '../../context/ProductContext';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import api from '../../api/axios';

export default function AdminDashboard() {
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();

  // Navigation state
  const [currentView, setCurrentView] = useState<'Dashboard' | 'Products' | 'Orders' | 'Payments' | 'Reviews' | 'Users' | 'Categories' | 'Settings'>('Dashboard');

  // Product State
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | { uri: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Orders and Payments State
  const [orders, setOrders] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [replyTexts, setReplyTexts] = useState<{ [key: string]: string }>({});
  const [users, setUsers] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    if (currentView === 'Orders') fetchOrders();
    if (currentView === 'Payments') fetchPayments();
    if (currentView === 'Reviews') fetchReviews();
    if (currentView === 'Users') fetchUsers();
    if (currentView === 'Categories') fetchCategories();
  }, [currentView]);

  const fetchOrders = async () => {
    setDataLoading(true);
    try {
      const res = await api.get('/orders');
      setOrders(res.data);
    } catch (error) {
      console.error('Failed to fetch orders', error);
    } finally {
      setDataLoading(false);
    }
  };

  const fetchPayments = async () => {
    setDataLoading(true);
    try {
      const res = await api.get('/payments');
      setPayments(res.data);
    } catch (error) {
      console.error('Failed to fetch payments', error);
    } finally {
      setDataLoading(false);
    }
  };

  const fetchReviews = async () => {
    setDataLoading(true);
    try {
      const res = await api.get('/reviews');
      setReviews(res.data);
    } catch (error) {
      console.error('Failed to fetch reviews', error);
    } finally {
      setDataLoading(false);
    }
  };

  const fetchUsers = async () => {
    setDataLoading(true);
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data);
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setDataLoading(false);
    }
  };

  const fetchCategories = async () => {
    setDataLoading(true);
    try {
      const res = await api.get('/products/categories');
      setCategoriesList(res.data);
    } catch (error) {
      console.error('Failed to fetch categories', error);
    } finally {
      setDataLoading(false);
    }
  };

  // --- Product Functions ---
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProductId(product._id);
    setName(product.name);
    setDescription(product.description);
    setPrice(product.price.toString());
    setCategory(product.category);
    setStock(product.stock.toString());
    if (product.image) {
      setImage({ uri: product.image });
    } else {
      setImage(null);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this product?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteProduct(id);
            Alert.alert('Success', 'Product deleted successfully!');
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to delete product');
          }
        }
      }
    ]);
  };

  const resetForm = () => {
    setEditingProductId(null);
    setName('');
    setDescription('');
    setPrice('');
    setCategory('');
    setStock('');
    setImage(null);
  };

  const handleSubmit = async () => {
    if (!name || !description || !price || !category || !stock) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('category', category);
      formData.append('stock', stock);

      if (image && image.uri && !image.uri.startsWith('http')) {
        const filename = image.uri.split('/').pop() || 'product.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        formData.append('image', {
          uri: image.uri,
          name: filename,
          type,
        } as any);
      }

      if (editingProductId) {
        await updateProduct(editingProductId, formData);
        Alert.alert('Success', 'Product updated successfully!');
      } else {
        await addProduct(formData);
        Alert.alert('Success', 'Product created successfully!');
      }
      
      resetForm();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || `Failed to ${editingProductId ? 'update' : 'create'} product`);
    } finally {
      setLoading(false);
    }
  };

  // --- Order Functions ---
  const handleUpdateOrderStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Pending' ? 'Processing' : currentStatus === 'Processing' ? 'Shipped' : currentStatus === 'Shipped' ? 'Delivered' : 'Completed';
    if (currentStatus === 'Delivered' || currentStatus === 'Cancelled') return;
    
    Alert.alert('Update Status', `Update order status to ${nextStatus}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Update', onPress: async () => {
        try {
          await api.put(`/orders/${id}/status`, { status: nextStatus });
          fetchOrders();
          Alert.alert('Success', `Order status updated to ${nextStatus}`);
        } catch (error: any) {
          Alert.alert('Error', error.response?.data?.message || 'Failed to update order');
        }
      }}
    ]);
  };

  // --- Payment Functions ---
  const [receiptModalUri, setReceiptModalUri] = useState<string | null>(null);

  const handleConfirmPayment = async (id: string) => {
    Alert.alert('Confirm Payment', 'Confirm this payment and process the order?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: async () => {
        try {
          await api.put(`/payments/${id}/confirm`);
          fetchPayments();
          Alert.alert('Success', 'Payment confirmed & order is now Processing');
        } catch (error: any) {
          Alert.alert('Error', error.response?.data?.message || 'Failed to confirm payment');
        }
      }}
    ]);
  };

  const handleCancelPayment = async (id: string) => {
    Alert.alert('Cancel Payment', 'Cancel this payment and the associated order?', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Cancel Order', style: 'destructive', onPress: async () => {
        try {
          await api.put(`/payments/${id}/cancel`);
          fetchPayments();
          Alert.alert('Done', 'Payment and order cancelled');
        } catch (error: any) {
          Alert.alert('Error', error.response?.data?.message || 'Failed to cancel payment');
        }
      }}
    ]);
  };

  const handleRefundPayment = async (id: string, status: string) => {
    if (status !== 'Completed') {
      Alert.alert('Notice', 'Only completed payments can be refunded');
      return;
    }
    Alert.alert('Confirm Refund', 'Are you sure you want to refund this payment?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Refund', style: 'destructive', onPress: async () => {
        try {
          await api.put(`/payments/${id}/refund`);
          fetchPayments();
          Alert.alert('Success', 'Payment refunded');
        } catch (error: any) {
          Alert.alert('Error', error.response?.data?.message || 'Failed to refund payment');
        }
      }}
    ]);
  };

  const handleDeletePayment = async (id: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this payment record?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/payments/${id}`);
          fetchPayments();
          Alert.alert('Success', 'Payment deleted');
        } catch (error: any) {
          Alert.alert('Error', error.response?.data?.message || 'Failed to delete payment');
        }
      }}
    ]);
  };

  // --- Review Functions ---
  const handleReplySubmit = async (reviewId: string) => {
    const reply = replyTexts[reviewId];
    if (!reply || !reply.trim()) return;

    try {
      await api.put(`/reviews/${reviewId}/reply`, { reply });
      fetchReviews();
      setReplyTexts(prev => ({ ...prev, [reviewId]: '' }));
      Alert.alert('Success', 'Reply sent');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to send reply');
    }
  };

  const handleDeleteReview = (id: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this review?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/reviews/${id}`);
          fetchReviews();
          Alert.alert('Success', 'Review deleted');
        } catch (error: any) {
          Alert.alert('Error', error.response?.data?.message || 'Failed to delete review');
        }
      }}
    ]);
  };

  const renderHeader = (title: string) => (
    <View style={styles.subHeader}>
      <TouchableOpacity onPress={() => setCurrentView('Dashboard')} style={[styles.backBtn, { backgroundColor: colors.card }]}>
        <MaterialIcons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.subHeaderTitle, { color: colors.text }]}>{title}</Text>
    </View>
  );

  // --- Rendering Functions ---
  const renderDashboard = () => (
    <View style={styles.dashboardContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Admin Panel</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>Welcome back, Admin Seeder</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => Alert.alert('Logout', 'Logging out...')}>
          <MaterialIcons name="logout" size={24} color="#FF453A" />
        </TouchableOpacity>
      </View>

      {/* Grid */}
      <View style={styles.grid}>
        <TouchableOpacity style={[styles.card, { backgroundColor: colors.card }]} onPress={() => setCurrentView('Products')}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 159, 10, 0.15)' }]}>
            <MaterialIcons name="inventory" size={32} color="#FF9F0A" />
          </View>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Products</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>Manage Catalog</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.card, { backgroundColor: colors.card }]} onPress={() => setCurrentView('Orders')}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(10, 132, 255, 0.15)' }]}>
            <MaterialIcons name="receipt-long" size={32} color="#0A84FF" />
          </View>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Orders</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>Track Sales</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, { backgroundColor: colors.card }]} onPress={() => setCurrentView('Users')}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(48, 209, 88, 0.15)' }]}>
            <MaterialIcons name="people" size={32} color="#30D158" />
          </View>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Users</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>User Accounts</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, { backgroundColor: colors.card }]} onPress={() => setCurrentView('Reviews')}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 214, 10, 0.15)' }]}>
            <MaterialIcons name="star" size={32} color="#FFD60A" />
          </View>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Reviews</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>Customer Feedback</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, { backgroundColor: colors.card }]} onPress={() => setCurrentView('Categories')}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(191, 90, 242, 0.15)' }]}>
            <MaterialIcons name="category" size={32} color="#BF5AF2" />
          </View>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Categories</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>Manage Types</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, { backgroundColor: colors.card }]} onPress={() => setCurrentView('Settings')}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(142, 142, 147, 0.15)' }]}>
            <MaterialIcons name="settings" size={32} color="#8E8E93" />
          </View>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Settings</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>System Config</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, { backgroundColor: colors.card }]} onPress={() => setCurrentView('Payments')}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 55, 95, 0.15)' }]}>
            <MaterialIcons name="payment" size={32} color="#FF375F" />
          </View>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Payments</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>Manage Finances</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.statsTitle, { color: colors.text }]}>Quick Stats</Text>
        <View style={styles.statsRow}>
          <Text style={styles.statValue}>128</Text>
          <Text style={styles.statValue}>45</Text>
          <Text style={styles.statValue}>$12.5k</Text>
        </View>
      </View>
    </View>
  );

  const renderProductsTab = () => (
    <View style={{ flex: 1 }}>
      {renderHeader('Products')}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{editingProductId ? 'Update Product' : 'Add New Product'}</Text>
        
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image.uri }} style={styles.imagePreview} />
          ) : (
            <View style={styles.placeholder}>
              <MaterialIcons name="add-a-photo" size={40} color="#0A84FF" />
              <Text style={styles.placeholderText}>Tap to select an image</Text>
            </View>
          )}
        </TouchableOpacity>

        <TextInput style={styles.input} placeholder="Product Name" placeholderTextColor="#888" value={name} onChangeText={setName} />
        <TextInput style={[styles.input, styles.textArea]} placeholder="Description" placeholderTextColor="#888" value={description} onChangeText={setDescription} multiline />
        
        <View style={styles.row}>
          <TextInput style={[styles.input, styles.halfInput]} placeholder="Price ($)" placeholderTextColor="#888" value={price} onChangeText={setPrice} keyboardType="numeric" />
          <TextInput style={[styles.input, styles.halfInput]} placeholder="Stock Qty" placeholderTextColor="#888" value={stock} onChangeText={setStock} keyboardType="numeric" />
        </View>
        
        <TextInput style={styles.input} placeholder="Category" placeholderTextColor="#888" value={category} onChangeText={setCategory} />

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{editingProductId ? 'Update Product' : 'Create Product'}</Text>}
        </TouchableOpacity>

        {editingProductId && (
          <TouchableOpacity style={[styles.submitBtn, styles.cancelBtn]} onPress={resetForm} disabled={loading}>
            <Text style={styles.cancelBtnText}>Cancel Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Manage Products</Text>
        {products.map((item) => (
          <View key={item._id} style={styles.productItem}>
            <Image source={{ uri: item.image || 'https://via.placeholder.com/50' }} style={styles.productImage} />
            <View style={styles.productDetails}>
              <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.productPrice}>${item.price.toFixed(2)} - Stock: {item.stock}</Text>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtn}>
                <MaterialIcons name="edit" size={24} color="#0A84FF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.actionBtn}>
                <MaterialIcons name="delete" size={24} color="#FF453A" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderOrdersTab = () => (
    <View style={{ flex: 1 }}>
      {renderHeader('Orders')}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Manage Orders</Text>
        {dataLoading ? <ActivityIndicator size="large" color="#0A84FF" /> : orders.map((order) => (
          <View key={order._id} style={styles.cardItem}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardId}>ID: {order._id.substring(order._id.length - 6)}</Text>
              <Text style={[styles.statusBadge, { color: order.status === 'Delivered' ? '#30D158' : '#0A84FF' }]}>{order.status}</Text>
            </View>
            <Text style={styles.cardEmail}>{order.user?.email}</Text>
            <Text style={styles.cardAmount}>Total: ${order.totalAmount.toFixed(2)}</Text>
            
            <View style={styles.cardActions}>
              {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                <TouchableOpacity style={styles.actionBtnSecondary} onPress={() => handleUpdateOrderStatus(order._id, order.status)}>
                  <Text style={styles.actionBtnText}>Advance Status</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
        {!dataLoading && orders.length === 0 && <Text style={styles.emptyText}>No orders found.</Text>}
      </View>
    </View>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':     return '#30D158';
      case 'PendingReview': return '#FF9F0A';
      case 'Pending':       return '#FFD60A';
      case 'Cancelled':     return '#FF453A';
      case 'Refunded':      return '#BF5AF2';
      case 'Failed':        return '#FF453A';
      default:              return '#8E8E93';
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'CreditCard':   return '💳 Credit Card';
      case 'DebitCard':    return '💳 Debit Card';
      case 'Cash':         return '🏠 Cash on Delivery';
      case 'BankTransfer': return '🏦 Bank Transfer';
      default:             return method;
    }
  };

  const renderPaymentsTab = () => (
    <View style={{ flex: 1 }}>
      {renderHeader('Payments')}

      {/* Receipt full-screen modal */}
      <Modal visible={!!receiptModalUri} transparent animationType="fade" onRequestClose={() => setReceiptModalUri(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setReceiptModalUri(null)}>
          <Image source={{ uri: receiptModalUri! }} style={styles.modalImage} resizeMode="contain" />
          <Text style={styles.modalCloseHint}>Tap anywhere to close</Text>
        </TouchableOpacity>
      </Modal>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Manage Payments</Text>
        {dataLoading ? <ActivityIndicator size="large" color="#0A84FF" /> : payments.map((payment) => (
          <View key={payment._id} style={styles.cardItem}>
            {/* Header row */}
            <View style={styles.cardHeader}>
              <Text style={styles.cardId} numberOfLines={1}>
                {payment.transactionId ? `Txn: ${payment.transactionId.substring(0, 14)}…` : `ID: ${payment._id.substring(payment._id.length - 8)}`}
              </Text>
              <View style={[styles.statusPill, { backgroundColor: getStatusColor(payment.status) + '22', borderColor: getStatusColor(payment.status) }]}>
                <Text style={[styles.statusBadge, { color: getStatusColor(payment.status) }]}>{payment.status}</Text>
              </View>
            </View>

            {/* Method badge */}
            <View style={styles.methodBadge}>
              <Text style={styles.methodBadgeText}>{getMethodLabel(payment.method)}</Text>
            </View>

            <Text style={styles.cardEmail}>{payment.user?.email}</Text>
            <Text style={styles.cardAmount}>Amount: ${payment.amount.toFixed(2)}</Text>

            {/* Delivery address */}
            {payment.order?.address ? (
              <Text style={styles.cardAddress}>📍 {payment.order.address}</Text>
            ) : null}

            {/* Bank Transfer receipt */}
            {payment.method === 'BankTransfer' && (
              payment.receiptImage ? (
                <TouchableOpacity onPress={() => setReceiptModalUri(payment.receiptImage)} style={styles.receiptContainer}>
                  <Image source={{ uri: payment.receiptImage }} style={styles.receiptThumb} />
                  <View style={styles.receiptInfo}>
                    <Text style={styles.receiptLabel}>📎 Payment Receipt</Text>
                    <Text style={styles.receiptHint}>Tap to view full image</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={styles.noReceiptBanner}>
                  <MaterialIcons name="hourglass-empty" size={16} color="#FF9F0A" />
                  <Text style={styles.noReceiptText}>  Waiting for customer to upload receipt</Text>
                </View>
              )
            )}

            {/* Cash on Delivery info */}
            {payment.method === 'Cash' && payment.status === 'Pending' && (
              <View style={styles.codBanner}>
                <MaterialIcons name="local-shipping" size={16} color="#FFD60A" />
                <Text style={styles.codText}>  Cash will be collected upon delivery</Text>
              </View>
            )}

            {/* Action buttons */}
            <View style={styles.cardActions}>
              {/* Confirm — for Pending (Cash/BankTransfer) */}
              {(payment.status === 'Pending' || payment.status === 'PendingReview') && (
                <TouchableOpacity style={styles.actionBtnConfirm} onPress={() => handleConfirmPayment(payment._id)}>
                  <MaterialIcons name="check-circle" size={16} color="#30D158" />
                  <Text style={styles.actionBtnTextConfirm}> Confirm</Text>
                </TouchableOpacity>
              )}

              {/* Cancel — for Pending or PendingReview */}
              {(payment.status === 'Pending' || payment.status === 'PendingReview') && (
                <TouchableOpacity style={styles.actionBtnCancel} onPress={() => handleCancelPayment(payment._id)}>
                  <MaterialIcons name="cancel" size={16} color="#FF453A" />
                  <Text style={styles.actionBtnTextCancel}> Cancel</Text>
                </TouchableOpacity>
              )}

              {/* Refund — only for Completed */}
              {payment.status === 'Completed' && (
                <TouchableOpacity style={styles.actionBtnSecondary} onPress={() => handleRefundPayment(payment._id, payment.status)}>
                  <Text style={styles.actionBtnText}>Refund</Text>
                </TouchableOpacity>
              )}

              {/* Delete always */}
              <TouchableOpacity style={styles.actionBtnDanger} onPress={() => handleDeletePayment(payment._id)}>
                <Text style={styles.actionBtnTextDanger}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {!dataLoading && payments.length === 0 && <Text style={styles.emptyText}>No payments found.</Text>}
      </View>
    </View>
  );

  const renderReviewsTab = () => (
    <View style={{ flex: 1 }}>
      {renderHeader('Reviews')}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Manage Reviews</Text>
        {dataLoading ? <ActivityIndicator size="large" color="#0A84FF" /> : reviews.map((review) => (
          <View key={review._id} style={styles.cardItem}>
            <View style={styles.cardHeader}>
              <Text style={[styles.productName, { flex: 1 }]} numberOfLines={1}>{review.product?.name || 'Unknown Product'}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', marginRight: 10 }}>
                  {[...Array(5)].map((_, i) => (
                    <MaterialIcons key={i} name={i < review.rating ? 'star' : 'star-border'} size={16} color="#FFD700" />
                  ))}
                </View>
                <TouchableOpacity onPress={() => handleDeleteReview(review._id)}>
                  <View style={{ backgroundColor: 'rgba(255, 69, 58, 0.15)', padding: 6, borderRadius: 15 }}>
                    <MaterialIcons name="delete" size={16} color="#FF453A" />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.cardAddress}>{review.user?.name || 'Unknown User'} - {new Date(review.createdAt).toLocaleDateString()}</Text>
            <Text style={[styles.cardEmail, { marginTop: 8, marginBottom: 15 }]}>{review.comment}</Text>
            
            {review.reply ? (
              <View style={styles.replyBlock}>
                <Text style={styles.replyLabel}>Your Reply:</Text>
                <Text style={styles.replyText}>{review.reply}</Text>
              </View>
            ) : (
              <View style={styles.replyInputRow}>
                <TextInput
                  style={styles.replyInput}
                  placeholder="Write a reply..."
                  placeholderTextColor="#8E8E93"
                  value={replyTexts[review._id] || ''}
                  onChangeText={(text) => setReplyTexts(prev => ({ ...prev, [review._id]: text }))}
                />
                <TouchableOpacity style={styles.replyBtn} onPress={() => handleReplySubmit(review._id)}>
                  <Text style={styles.replyBtnText}>Reply</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
        {!dataLoading && reviews.length === 0 && <Text style={styles.emptyText}>No reviews found.</Text>}
      </View>
    </View>
  );

  const handleDeleteUser = (id: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this user?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/auth/users/${id}`);
          fetchUsers();
          Alert.alert('Success', 'User deleted');
        } catch (error: any) {
          Alert.alert('Error', error.response?.data?.message || 'Failed to delete user');
        }
      }}
    ]);
  };

  const renderUsersTab = () => (
    <View style={{ flex: 1 }}>
      {renderHeader('Users')}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Manage Users</Text>
        {dataLoading ? <ActivityIndicator size="large" color="#0A84FF" /> : users.map((u) => (
          <View key={u._id} style={styles.cardItem}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardId}>ID: {u._id.substring(u._id.length - 6)}</Text>
              <Text style={[styles.statusBadge, { color: u.role === 'admin' ? '#FF9F0A' : '#0A84FF' }]}>{u.role}</Text>
            </View>
            <Text style={styles.cardEmail}>{u.name}</Text>
            <Text style={styles.cardAddress}>{u.email}</Text>
            
            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.actionBtnDanger} onPress={() => handleDeleteUser(u._id)}>
                <Text style={styles.actionBtnTextDanger}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {!dataLoading && users.length === 0 && <Text style={styles.emptyText}>No users found.</Text>}
      </View>
    </View>
  );

  const renderCategoriesTab = () => (
    <View style={{ flex: 1 }}>
      {renderHeader('Categories')}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categories Aggregation</Text>
        {dataLoading ? <ActivityIndicator size="large" color="#0A84FF" /> : categoriesList.map((cat, index) => (
          <View key={index} style={styles.cardItem}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardId}>{cat.name || 'Uncategorized'}</Text>
              <Text style={styles.statusBadge}>{cat.count} Products</Text>
            </View>
          </View>
        ))}
        {!dataLoading && categoriesList.length === 0 && <Text style={styles.emptyText}>No categories found.</Text>}
      </View>
    </View>
  );

  const renderSettingsTab = () => (
    <View style={{ flex: 1 }}>
      {renderHeader('Settings')}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Configuration</Text>
        <View style={styles.cardItem}>
          <Text style={styles.cardEmail}>Dark Mode</Text>
          <Text style={styles.cardAddress}>Enabled by default.</Text>
        </View>
        <View style={styles.cardItem}>
          <Text style={styles.cardEmail}>Store Contact Info</Text>
          <Text style={styles.cardAddress}>support@shopmate.com</Text>
        </View>
        <View style={styles.cardItem}>
          <Text style={styles.cardEmail}>App Version</Text>
          <Text style={styles.cardAddress}>v1.0.0</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
        {currentView === 'Dashboard' && renderDashboard()}
        {currentView === 'Products' && renderProductsTab()}
        {currentView === 'Orders' && renderOrdersTab()}
        {currentView === 'Payments' && renderPaymentsTab()}
        {currentView === 'Reviews' && renderReviewsTab()}
        {currentView === 'Users' && renderUsersTab()}
        {currentView === 'Categories' && renderCategoriesTab()}
        {currentView === 'Settings' && renderSettingsTab()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  // Dashboard Styles
  dashboardContainer: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, marginTop: 10 },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: '#8E8E93' },
  logoutBtn: { backgroundColor: 'rgba(255, 69, 58, 0.15)', padding: 10, borderRadius: 12 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { backgroundColor: '#1C1C1E', borderRadius: 20, padding: 20, width: '48%', marginBottom: 15, alignItems: 'center' },
  iconContainer: { width: 60, height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  cardSubtitle: { fontSize: 12, color: '#8E8E93' },
  
  statsCard: { backgroundColor: '#1C1C1E', borderRadius: 20, padding: 20, marginTop: 10 },
  statsTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 15 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#FFD60A' },

  // Sub-views styles
  subHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingHorizontal: 20, marginTop: 20 },
  backBtn: { marginRight: 15, padding: 5, backgroundColor: '#1C1C1E', borderRadius: 8 },
  subHeaderTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  
  section: { backgroundColor: '#1C1C1E', padding: 20, borderRadius: 16, marginBottom: 20, marginHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#fff' },
  
  imagePicker: { height: 200, backgroundColor: '#2C2C2E', borderRadius: 12, borderWidth: 1, borderColor: '#3A3A3C', borderStyle: 'dashed', marginBottom: 20, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  imagePreview: { width: '100%', height: '100%' },
  placeholder: { alignItems: 'center' },
  placeholderText: { marginTop: 10, color: '#0A84FF', fontWeight: '500' },
  
  input: { backgroundColor: '#2C2C2E', borderWidth: 1, borderColor: '#3A3A3C', borderRadius: 8, padding: 15, fontSize: 16, marginBottom: 15, color: '#fff' },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInput: { flex: 0.48 },
  
  submitBtn: { backgroundColor: '#0A84FF', padding: 18, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cancelBtn: { backgroundColor: '#3A3A3C', marginTop: 10 },
  cancelBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  
  productItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2E', padding: 10, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#3A3A3C' },
  productImage: { width: 50, height: 50, borderRadius: 8, marginRight: 15 },
  productDetails: { flex: 1 },
  productName: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  productPrice: { fontSize: 14, color: '#8E8E93', marginTop: 4 },
  actionButtons: { flexDirection: 'row' },
  actionBtn: { padding: 8, marginLeft: 5, backgroundColor: '#3A3A3C', borderRadius: 8 },
  
  cardItem: { backgroundColor: '#2C2C2E', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#3A3A3C' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardId: { fontSize: 13, color: '#8E8E93', fontWeight: '500', flex: 1, marginRight: 8 },
  statusPill: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  statusBadge: { fontSize: 12, fontWeight: 'bold' },
  methodBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,159,10,0.12)', borderWidth: 1, borderColor: 'rgba(255,159,10,0.3)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8 },
  methodBadgeText: { color: '#FF9F0A', fontSize: 13, fontWeight: '600' },
  cardEmail: { fontSize: 15, color: '#fff', marginBottom: 4 },
  cardAmount: { fontSize: 15, color: '#E5E5EA', fontWeight: 'bold', marginBottom: 4 },
  cardAddress: { fontSize: 13, color: '#8E8E93', marginBottom: 10 },
  receiptContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E', borderRadius: 10, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: '#3A3A3C' },
  receiptThumb: { width: 60, height: 60, borderRadius: 8, marginRight: 12 },
  receiptInfo: { flex: 1 },
  receiptLabel: { color: '#FF9F0A', fontWeight: 'bold', fontSize: 14 },
  receiptHint: { color: '#8E8E93', fontSize: 12, marginTop: 3 },
  noReceiptBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,159,10,0.08)', padding: 10, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,159,10,0.25)' },
  noReceiptText: { color: '#FF9F0A', fontSize: 13 },
  codBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,214,10,0.08)', padding: 10, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,214,10,0.25)' },
  codText: { color: '#FFD60A', fontSize: 13 },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, flexWrap: 'wrap', gap: 8 },
  actionBtnConfirm: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(48,209,88,0.15)', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(48,209,88,0.4)' },
  actionBtnTextConfirm: { color: '#30D158', fontWeight: 'bold', fontSize: 14 },
  actionBtnCancel: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,69,58,0.12)', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,69,58,0.4)' },
  actionBtnTextCancel: { color: '#FF453A', fontWeight: 'bold', fontSize: 14 },
  actionBtnSecondary: { backgroundColor: 'rgba(10, 132, 255, 0.15)', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  actionBtnText: { color: '#0A84FF', fontWeight: 'bold' },
  actionBtnDanger: { backgroundColor: 'rgba(255, 69, 58, 0.15)', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  actionBtnTextDanger: { color: '#FF453A', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: '#8E8E93', fontStyle: 'italic', marginTop: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
  modalImage: { width: '95%', height: '75%', borderRadius: 12 },
  modalCloseHint: { color: '#8E8E93', marginTop: 16, fontSize: 14 },
  
  replyBlock: { backgroundColor: 'rgba(10, 132, 255, 0.15)', padding: 12, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#0A84FF' },
  replyLabel: { color: '#0A84FF', fontWeight: 'bold', fontSize: 13, marginBottom: 4 },
  replyText: { color: '#E5E5EA', fontSize: 14 },
  replyInputRow: { flexDirection: 'row', alignItems: 'center' },
  replyInput: { flex: 1, backgroundColor: '#1C1C1E', borderWidth: 1, borderColor: '#3A3A3C', borderRadius: 8, padding: 10, color: '#fff', marginRight: 10 },
  replyBtn: { backgroundColor: '#0A84FF', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8 },
  replyBtnText: { color: '#fff', fontWeight: 'bold' }
});

