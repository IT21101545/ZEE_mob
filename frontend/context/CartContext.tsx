import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

export interface CartItem {
  product: {
    _id: string;
    name: string;
    price: number;
    image: string;
    stock: number;
  };
  quantity: number;
}

interface CartContextData {
  cartItems: CartItem[];
  cartTotal: number;
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateCartItem: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const fetchCart = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await api.get('/cart');
      setCartItems(res.data.cart.items);
      setCartTotal(res.data.total);
    } catch (error) {
      console.error('Failed to fetch cart', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setCartItems([]);
      setCartTotal(0);
    }
  }, [user]);

  const addToCart = async (productId: string, quantity = 1) => {
    try {
      const res = await api.post('/cart/add', { productId, quantity });
      fetchCart(); // Refresh cart to get populated data and new total
    } catch (error) {
      throw error;
    }
  };

  const updateCartItem = async (productId: string, quantity: number) => {
    try {
      await api.put('/cart/update', { productId, quantity });
      fetchCart();
    } catch (error) {
      throw error;
    }
  };

  const removeFromCart = async (productId: string) => {
    try {
      await api.delete(`/cart/remove/${productId}`);
      fetchCart();
    } catch (error) {
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart/clear');
      fetchCart();
    } catch (error) {
      throw error;
    }
  };

  return (
    <CartContext.Provider value={{ cartItems, cartTotal, isLoading, fetchCart, addToCart, updateCartItem, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
