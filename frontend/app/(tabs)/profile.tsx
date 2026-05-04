import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, SafeAreaView, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import api from '../../api/axios';

interface Order {
  _id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: Array<{ name: string; quantity: number }>;
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const [activeTab, setActiveTab] = useState<'Wishlist' | 'Settings'>('Settings');
  const [currentView, setCurrentView] = useState<'Main' | 'Orders' | 'Notifications'>('Main');

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loadingWishlist, setLoadingWishlist] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders');
        setOrders(res.data);
      } catch (error) {
        console.error('Failed to fetch orders', error);
      } finally {
        setLoadingOrders(false);
      }
    };
    
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        setNotifications(res.data);
      } catch (error) {
        console.error('Failed to fetch notifications', error);
      } finally {
        setLoadingNotifications(false);
      }
    };

    const fetchWishlist = async () => {
      setLoadingWishlist(true);
      try {
        const res = await api.get('/wishlist');
        setWishlist(res.data);
      } catch (error: any) {
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message;
        console.error(`Failed to fetch wishlist (Status: ${status}):`, message);
      } finally {
        setLoadingWishlist(false);
      }
    };

    fetchOrders();
    fetchNotifications();
    if (user) fetchWishlist();
  }, [user]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout }
    ]);
  };

  const renderHeader = (title: string) => (
    <View style={styles.subHeader}>
      <TouchableOpacity onPress={() => setCurrentView('Main')} style={styles.backBtn}>
        <MaterialIcons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.subHeaderTitle}>{title}</Text>
    </View>
  );

  const renderOrdersList = () => (
    <View style={{ flex: 1 }}>
      {renderHeader('Order History')}
      <View style={styles.section}>
        {loadingOrders ? (
          <ActivityIndicator color="#FF9F0A" style={{ marginVertical: 20 }} />
        ) : orders.length === 0 ? (
          <Text style={styles.noOrdersText}>You haven't placed any orders yet.</Text>
        ) : (
          orders.map((order) => (
            <View key={order._id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderId}>Order #{order._id.slice(-6).toUpperCase()}</Text>
                <Text style={[
                  styles.orderStatus, 
                  order.status === 'Completed' ? styles.statusCompleted : 
                  order.status === 'Cancelled' ? styles.statusCancelled : styles.statusPending
                ]}>
                  {order.status}
                </Text>
              </View>
              <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString()}</Text>
              
              <View style={styles.orderItems}>
                <Text style={styles.itemsSummary}>
                  {order.items.length} item(s) • {order.items.map(i => i.name).join(', ')}
                </Text>
              </View>
              
              <View style={styles.orderFooter}>
                <Text style={styles.orderTotal}>Total: ${order.totalAmount.toFixed(2)}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      Alert.alert('Success', 'All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  const renderNotificationsList = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={() => setCurrentView('Main')} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.subHeaderTitle}>Notifications</Text>
        <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllBtn}>
          <Text style={styles.markAllText}>Mark all read</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.section}>
        {loadingNotifications ? (
          <ActivityIndicator color="#FF9F0A" style={{ marginVertical: 20 }} />
        ) : notifications.length === 0 ? (
          <Text style={styles.noOrdersText}>You have no notifications.</Text>
        ) : (
          notifications.map((notif) => (
            <TouchableOpacity 
              key={notif._id} 
              style={[styles.notificationCard, notif.read ? styles.notificationRead : styles.notificationUnread]}
              onPress={() => !notif.read && handleMarkAsRead(notif._id)}
            >
              <View style={styles.notificationIcon}>
                <Ionicons 
                  name={notif.type.includes('payment') ? 'card' : notif.type.includes('order') ? 'cube' : 'notifications'} 
                  size={24} 
                  color={notif.read ? '#8E8E93' : '#FF9F0A'} 
                />
              </View>
              <View style={styles.notificationContent}>
                <Text style={[styles.notificationTitle, notif.read && styles.textRead]}>{notif.title}</Text>
                <Text style={[styles.notificationMessage, notif.read && styles.textRead]}>{notif.message}</Text>
                <Text style={styles.notificationDate}>{new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
              {!notif.read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          ))
        )}
      </View>
    </View>
  );

  const renderMainView = () => (
    <View style={styles.mainContainer}>
      {/* Top Navigation Header */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.iconBtn}>
          <MaterialIcons name="menu" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, !isDarkMode && { color: '#000' }]}>Settings</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setCurrentView('Notifications')}>
          <Ionicons name="notifications-outline" size={24} color="#fff" />
          {notifications.filter(n => !n.read).length > 0 && (
            <View style={{position: 'absolute', top: 5, right: 5, width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF453A'}} />
          )}
        </TouchableOpacity>
      </View>

      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarCircle}>
            <MaterialIcons name="person" size={70} color="#fff" />
          </View>
          <TouchableOpacity style={styles.cameraBtn} onPress={() => Alert.alert('Edit Avatar', 'Upload feature coming soon.')}>
            <MaterialIcons name="camera-alt" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.avatarName}>{user?.name || 'Admin Seeder'}</Text>
        <Text style={styles.avatarEmail}>{user?.email || 'admin@admin.com'}</Text>
      </View>

      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <View style={styles.statColumn}>
          <Text style={styles.statNumber}>1</Text>
          <Text style={styles.statLabel}>Favorites</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statColumn}>
          <Text style={styles.statNumber}>{orders.length > 0 ? orders.length : '12'}</Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statColumn}>
          <Text style={styles.statNumber}>5</Text>
          <Text style={styles.statLabel}>Coupons</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('Wishlist')}>
          <Text style={[styles.tabText, activeTab === 'Wishlist' && styles.activeTabText]}>Wishlist</Text>
          {activeTab === 'Wishlist' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('Settings')}>
          <Text style={[styles.tabText, activeTab === 'Settings' && styles.activeTabText]}>Settings</Text>
          {activeTab === 'Settings' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
      </View>

      {activeTab === 'Wishlist' ? (
        <View style={styles.wishlistContent}>
          {loadingWishlist ? (
            <ActivityIndicator color="#FF9F0A" style={{ marginVertical: 20 }} />
          ) : wishlist.length === 0 ? (
            <View style={styles.emptyContent}>
              <Text style={styles.emptyText}>Your wishlist is empty.</Text>
            </View>
          ) : (
            wishlist.map(item => (
              <View key={item._id} style={styles.wishlistCard}>
                <View style={styles.wishlistInfo}>
                  <Text style={styles.wishlistName}>{item.name}</Text>
                  <Text style={styles.wishlistPrice}>${item.price.toFixed(2)}</Text>
                </View>
                <TouchableOpacity onPress={async () => {
                  try {
                    await api.delete(`/wishlist/${item._id}`);
                    setWishlist(wishlist.filter(w => w._id !== item._id));
                    Alert.alert('Success', 'Removed from wishlist');
                  } catch (e) {
                    Alert.alert('Error', 'Failed to remove from wishlist');
                  }
                }} style={styles.wishlistRemoveBtn}>
                  <MaterialIcons name="delete-outline" size={24} color="#FF453A" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      ) : (
        <View style={styles.settingsContent}>
          {/* General Info */}
          <View style={styles.generalInfoCard}>
            <View style={styles.generalInfoHeader}>
              <Text style={styles.generalInfoTitle}>General Info</Text>
              <TouchableOpacity onPress={() => Alert.alert('Edit Profile', 'Edit profile feature coming soon.')}>
                <MaterialIcons name="edit" size={20} color="#FF9F0A" />
              </TouchableOpacity>
            </View>

            <View style={styles.infoField}>
              <Text style={styles.infoLabel}>FULL NAME</Text>
              <Text style={styles.infoValue}>{user?.name || 'Lakshitha'}</Text>
            </View>

            <View style={styles.infoField}>
              <Text style={styles.infoLabel}>PHONE NUMBER</Text>
              <Text style={styles.infoValue}>{user?.phone || 'Not set'}</Text>
            </View>
          </View>

          {/* List Items */}
          <TouchableOpacity style={styles.listItem} onPress={() => setCurrentView('Orders')}>
            <View style={[styles.listIconContainer, { backgroundColor: 'rgba(10, 132, 255, 0.15)' }]}>
              <Ionicons name="receipt-outline" size={20} color="#0A84FF" />
            </View>
            <Text style={styles.listItemText}>Order History</Text>
            <MaterialIcons name="chevron-right" size={24} color="#888" />
          </TouchableOpacity>

          <View style={styles.listItemDivider} />

          <TouchableOpacity style={styles.listItem} onPress={() => setCurrentView('Notifications')}>
            <View style={[styles.listIconContainer, { backgroundColor: 'rgba(255, 69, 58, 0.15)' }]}>
              <Ionicons name="notifications-outline" size={20} color="#FF453A" />
            </View>
            <Text style={styles.listItemText}>Notifications</Text>
            {notifications.filter(n => !n.read).length > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{notifications.filter(n => !n.read).length}</Text>
              </View>
            )}
            <MaterialIcons name="chevron-right" size={24} color="#888" />
          </TouchableOpacity>

          <View style={styles.listItemDivider} />

          <TouchableOpacity style={styles.listItem} onPress={toggleTheme}>
            <View style={[styles.listIconContainer, { backgroundColor: 'rgba(255, 214, 10, 0.15)' }]}>
              <Ionicons name={isDarkMode ? "sunny-outline" : "moon-outline"} size={20} color="#FFD60A" />
            </View>
            <Text style={[styles.listItemText, !isDarkMode && { color: '#000' }]}>{isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</Text>
            <MaterialIcons name="chevron-right" size={24} color="#888" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.listItem, { marginTop: 25 }]} onPress={handleLogout}>
            <View style={[styles.listIconContainer, { backgroundColor: 'rgba(255, 69, 58, 0.15)' }]}>
              <MaterialIcons name="logout" size={20} color="#FF453A" />
            </View>
            <Text style={[styles.listItemText, { color: '#FF453A', fontWeight: 'bold' }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
        {currentView === 'Main' && renderMainView()}
        {currentView === 'Orders' && renderOrdersList()}
        {currentView === 'Notifications' && renderNotificationsList()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  mainContainer: { padding: 20 },
  
  // Top Nav
  topNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  iconBtn: { backgroundColor: '#2C2C2E', padding: 10, borderRadius: 12 },
  screenTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },

  // Avatar Section
  avatarSection: { alignItems: 'center', marginBottom: 30 },
  avatarContainer: { position: 'relative', marginBottom: 15 },
  avatarCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#D28E5F', justifyContent: 'center', alignItems: 'center' },
  cameraBtn: { position: 'absolute', bottom: 5, right: 5, backgroundColor: '#3A3A3C', padding: 8, borderRadius: 15, borderWidth: 3, borderColor: '#121212' },
  avatarName: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 5 },
  avatarEmail: { fontSize: 14, color: '#8E8E93' },

  // Stats
  statsContainer: { flexDirection: 'row', backgroundColor: '#1C1C1E', borderRadius: 20, paddingVertical: 20, marginBottom: 30, alignItems: 'center' },
  statColumn: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#8E8E93' },
  statDivider: { width: 1, height: 30, backgroundColor: '#3A3A3C' },

  // Tabs
  tabRow: { flexDirection: 'row', marginBottom: 20, paddingHorizontal: 5 },
  tabItem: { marginRight: 30, alignItems: 'center' },
  tabText: { fontSize: 16, color: '#8E8E93', paddingBottom: 10 },
  activeTabText: { color: '#FF9F0A', fontWeight: 'bold' },
  activeIndicator: { height: 2, backgroundColor: '#FF9F0A', position: 'absolute', bottom: 0, left: 0, right: 0 },

  // Settings Content
  settingsContent: { flex: 1 },
  generalInfoCard: { backgroundColor: '#1C1C1E', borderRadius: 20, padding: 20, marginBottom: 30 },
  generalInfoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  generalInfoTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  infoField: { marginBottom: 15 },
  infoLabel: { fontSize: 10, color: '#8E8E93', letterSpacing: 1, marginBottom: 5, textTransform: 'uppercase' },
  infoValue: { fontSize: 16, color: '#fff', fontWeight: '500' },

  // List Items
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  listIconContainer: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  listItemText: { flex: 1, fontSize: 16, color: '#fff' },
  listItemDivider: { height: 1, backgroundColor: '#2C2C2E', marginLeft: 55, marginVertical: 5 },
  
  // Empty Content
  emptyContent: { padding: 30, alignItems: 'center', marginTop: 20 },
  emptyText: { color: '#8E8E93', fontSize: 16 },
  
  // Wishlist
  wishlistContent: { flex: 1, paddingTop: 10 },
  wishlistCard: { flexDirection: 'row', backgroundColor: '#1C1C1E', borderRadius: 12, padding: 15, marginBottom: 10, alignItems: 'center' },
  wishlistInfo: { flex: 1 },
  wishlistName: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  wishlistPrice: { fontSize: 14, color: '#0A84FF', fontWeight: 'bold' },
  wishlistRemoveBtn: { padding: 8, backgroundColor: 'rgba(255, 69, 58, 0.1)', borderRadius: 8 },

  // Orders View
  subHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingHorizontal: 20, marginTop: 20 },
  backBtn: { marginRight: 15, padding: 5, backgroundColor: '#1C1C1E', borderRadius: 8 },
  subHeaderTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  section: { backgroundColor: '#1C1C1E', paddingVertical: 20, minHeight: 400, borderRadius: 16, marginHorizontal: 20 },
  noOrdersText: { paddingHorizontal: 20, color: '#888', fontStyle: 'italic' },
  orderCard: { borderWidth: 1, borderColor: '#3A3A3C', borderRadius: 12, marginHorizontal: 20, marginBottom: 15, padding: 15, backgroundColor: '#2C2C2E' },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  orderId: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  orderStatus: { fontSize: 12, fontWeight: 'bold', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, overflow: 'hidden' },
  statusPending: { backgroundColor: 'rgba(255, 159, 10, 0.15)', color: '#FF9F0A' },
  statusCompleted: { backgroundColor: 'rgba(48, 209, 88, 0.15)', color: '#30D158' },
  statusCancelled: { backgroundColor: 'rgba(255, 69, 58, 0.15)', color: '#FF453A' },
  orderDate: { fontSize: 13, color: '#8E8E93', marginBottom: 10 },
  orderItems: { marginBottom: 10 },
  itemsSummary: { fontSize: 14, color: '#ccc' },
  orderFooter: { borderTopWidth: 1, borderTopColor: '#3A3A3C', paddingTop: 10, marginTop: 5 },
  orderTotal: { fontSize: 16, fontWeight: 'bold', color: '#FF9F0A', textAlign: 'right' },

  // Notifications View
  markAllBtn: { marginLeft: 'auto', backgroundColor: 'rgba(255, 159, 10, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  markAllText: { color: '#FF9F0A', fontSize: 12, fontWeight: 'bold' },
  notificationCard: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderBottomColor: '#3A3A3C', alignItems: 'flex-start' },
  notificationUnread: { backgroundColor: 'rgba(255, 159, 10, 0.05)' },
  notificationRead: { backgroundColor: 'transparent' },
  notificationIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2C2C2E', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  notificationContent: { flex: 1 },
  notificationTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  notificationMessage: { fontSize: 14, color: '#E5E5EA', marginBottom: 8, lineHeight: 20 },
  notificationDate: { fontSize: 12, color: '#8E8E93' },
  textRead: { color: '#8E8E93' },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF9F0A', marginLeft: 10, marginTop: 5 },
  notificationBadge: { backgroundColor: '#FF453A', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6, marginRight: 10 },
  notificationBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});
