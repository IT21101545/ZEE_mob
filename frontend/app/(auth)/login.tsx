import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      // Let the _layout handle redirecting to (tabs)
    } catch (error: any) {
      Alert.alert('Login Failed', error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>ZEE FASHION</Text>
        <Text style={styles.logoSubText}>S T O R E</Text>
      </View>
      <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
      
      <TextInput
        style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor={colors.textMuted}
      />
      
      <TextInput
        style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor={colors.textMuted}
      />
      
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Log In</Text>}
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} style={styles.forgotPasswordContainer}>
        <Text style={[styles.forgotPasswordText, { color: colors.textMuted }]}>Forgot Password?</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.linkContainer}>
        <Text style={[styles.linkText, { color: colors.primary }]}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: 200,
    height: 160,
    alignSelf: 'center',
    marginBottom: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: '#6B3A2A',
    borderRadius: 100,
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignSelf: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6B3A2A',
    letterSpacing: 2,
  },
  logoSubText: {
    fontSize: 11,
    color: '#6B3A2A',
    letterSpacing: 4,
    marginTop: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 16,
  },
  forgotPasswordContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#666',
    fontSize: 14,
  },
});
