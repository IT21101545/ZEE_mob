import React from 'react';
import { View, StyleSheet } from 'react-native';
import ReviewManagement from '../../components/admin/ReviewManagement';

export default function ReviewsScreen() {
  return (
    <View style={styles.container}>
      <ReviewManagement />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4', padding: 10 }
});
