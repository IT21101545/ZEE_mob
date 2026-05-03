import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '../api';

export default function LoginScreen({ navigation }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  const validate = () => {
    if (!email.trim())    { Alert.alert('Error', 'Email is required'); return false; }
    if (!email.includes('@')) { Alert.alert('Error', 'Enter a valid email'); return false; }
    if (!password)        { Alert.alert('Error', 'Password is required'); return false; }
    if (password.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters'); return false; }
    return true;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await apiRequest('POST', '/auth/login', { email: email.trim(), password });
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user',  JSON.stringify(data));
      navigation.replace('Home');
    } catch (err) {
      Alert.alert('Login Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.title}>ShopMate</Text>
      <Text style={styles.subtitle}>Sign in to your account</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#999"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Don't have an account? <Text style={styles.linkBold}>Register</Text></Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title:       { fontSize: 32, fontWeight: '700', textAlign: 'center', color: '#1a1a2e', marginBottom: 8 },
  subtitle:    { fontSize: 14, textAlign: 'center', color: '#666', marginBottom: 32 },
  input:       { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, marginBottom: 14, fontSize: 15, color: '#333' },
  button:      { backgroundColor: '#4f46e5', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 8 },
  buttonText:  { color: '#fff', fontSize: 16, fontWeight: '600' },
  link:        { textAlign: 'center', marginTop: 20, color: '#666', fontSize: 14 },
  linkBold:    { color: '#4f46e5', fontWeight: '600' },
});
