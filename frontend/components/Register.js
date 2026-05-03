import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '../api';

export default function RegisterScreen({ navigation }) {
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);

  const validate = () => {
    if (!name.trim())   { Alert.alert('Error', 'Name is required'); return false; }
    if (!email.trim())  { Alert.alert('Error', 'Email is required'); return false; }
    if (!email.includes('@')) { Alert.alert('Error', 'Enter a valid email'); return false; }
    if (password.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters'); return false; }
    if (password !== confirm) { Alert.alert('Error', 'Passwords do not match'); return false; }
    return true;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await apiRequest('POST', '/auth/register', {
        name: name.trim(), email: email.trim(), password,
      });
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user',  JSON.stringify(data));
      navigation.replace('Home');
    } catch (err) {
      Alert.alert('Registration Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join ShopMate today</Text>

      <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#999"
        value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#999"
        keyboardType="email-address" autoCapitalize="none"
        value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#999"
        secureTextEntry value={password} onChangeText={setPassword} />
      <TextInput style={styles.input} placeholder="Confirm Password" placeholderTextColor="#999"
        secureTextEntry value={confirm} onChangeText={setConfirm} />

      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? <Text style={styles.linkBold}>Login</Text></Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:  { flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title:      { fontSize: 28, fontWeight: '700', textAlign: 'center', color: '#1a1a2e', marginBottom: 8 },
  subtitle:   { fontSize: 14, textAlign: 'center', color: '#666', marginBottom: 32 },
  input:      { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, marginBottom: 14, fontSize: 15, color: '#333' },
  button:     { backgroundColor: '#4f46e5', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link:       { textAlign: 'center', marginTop: 20, color: '#666', fontSize: 14 },
  linkBold:   { color: '#4f46e5', fontWeight: '600' },
});
