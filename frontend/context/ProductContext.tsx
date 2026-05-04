import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image: string;
}

interface ProductContextData {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  getProduct: (id: string) => Promise<Product | null>;
  addProduct: (formData: FormData) => Promise<void>;
  updateProduct: (id: string, formData: FormData) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
}

const ProductContext = createContext<ProductContextData>({} as ProductContextData);

export const ProductProvider = ({ children }: { children: React.ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (error: any) {
      console.error('Failed to fetch products', error);
      setError(error.message || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const getProduct = async (id: string) => {
    try {
      const res = await api.get(`/products/${id}`);
      return res.data;
    } catch (error) {
      // Return null quietly if not found
      return null;
    }
  };

  const addProduct = async (formData: FormData) => {
    try {
      await api.post('/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      await fetchProducts();
    } catch (error) {
      console.error('Failed to add product', error);
      throw error;
    }
  };

  const updateProduct = async (id: string, formData: FormData) => {
    try {
      await api.put(`/products/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      await fetchProducts();
    } catch (error) {
      console.error('Failed to update product', error);
      throw error;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await api.delete(`/products/${id}`);
      await fetchProducts();
    } catch (error) {
      console.error('Failed to delete product', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <ProductContext.Provider value={{ products, isLoading, error, fetchProducts, getProduct, addProduct, updateProduct, deleteProduct }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => useContext(ProductContext);
