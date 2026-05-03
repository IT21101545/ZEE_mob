import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen       from './screens/LoginScreen';
import RegisterScreen    from './screens/RegisterScreen';
import ProductListScreen from './screens/ProductListScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';
import CartScreen        from './screens/CartScreen';
import OrdersScreen      from './screens/OrdersScreen';
import PaymentScreen     from './screens/PaymentScreen';
import ReviewsScreen     from './screens/ReviewsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle:     { backgroundColor: '#4f46e5' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        <Stack.Screen name="Login"         component={LoginScreen}         options={{ headerShown: false }} />
        <Stack.Screen name="Register"      component={RegisterScreen}      options={{ headerShown: false }} />
        <Stack.Screen name="Home"          component={ProductListScreen}   options={{ title: 'ShopMate 🛍️' }} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Product Details' }} />
        <Stack.Screen name="Cart"          component={CartScreen}          options={{ title: 'My Cart 🛒' }} />
        <Stack.Screen name="Orders"        component={OrdersScreen}        options={{ title: 'My Orders' }} />
        <Stack.Screen name="Payment"       component={PaymentScreen}       options={{ title: 'Payment' }} />
        <Stack.Screen name="Reviews"       component={ReviewsScreen}       options={{ title: 'Reviews' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
