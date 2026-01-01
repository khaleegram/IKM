
'use client';

import { Product } from '@/lib/firebase/firestore/products';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  totalPrice: number;
  isAddingToCart: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isAddingToCart, setAddingToCart] = useState(false);
  const { toast } = useToast();

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('ikm-cart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        // Validate cart items structure
        if (Array.isArray(parsed)) {
          setCartItems(parsed);
        }
      }
    } catch (error) {
      // Invalid cart data, clear it
      localStorage.removeItem('ikm-cart');
    }
  }, []);

  // Sync cart across tabs using storage event
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'ikm-cart' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setCartItems(parsed);
          }
        } catch {
          // Invalid data, ignore
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Debounce localStorage writes to avoid blocking
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem('ikm-cart', JSON.stringify(cartItems));
        // Broadcast to other tabs
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'ikm-cart',
          newValue: JSON.stringify(cartItems),
        }));
      } catch (error) {
        // localStorage might be full or unavailable
        console.warn('Failed to save cart to localStorage:', error);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [cartItems]);

  const addToCart = (product: Product, quantity = 1) => {
    setAddingToCart(true);
    if (!product.id) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Product information is missing.",
        });
        setAddingToCart(false);
        return;
    }

    // Check stock availability BEFORE updating state
    const currentStock = product.stock || 0;
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      const currentQuantity = existingItem ? existingItem.quantity : 0;
      const newQuantity = currentQuantity + quantity;

      if (newQuantity > currentStock) {
        setAddingToCart(false);
        // Defer toast call to avoid updating during render
        setTimeout(() => {
          toast({
            variant: "destructive",
            title: "Insufficient Stock",
            description: `Only ${currentStock} item(s) available in stock.`,
          });
        }, 0);
        return prevItems;
      }

      if (existingItem) {
        // Update quantity of existing item
        const updatedItems = prevItems.map(item =>
          item.id === product.id ? { ...item, quantity: newQuantity } : item
        );
        // Defer toast call to avoid updating during render
        setTimeout(() => {
          toast({
            title: "Added to cart",
            description: `${product.name} has been added to your cart.`,
          });
        }, 0);
        setAddingToCart(false);
        return updatedItems;
      } else {
        // Add new item to cart
        const updatedItems = [...prevItems, { ...product, quantity }];
        // Defer toast call to avoid updating during render
        setTimeout(() => {
          toast({
            title: "Added to cart",
            description: `${product.name} has been added to your cart.`,
          });
        }, 0);
        setAddingToCart(false);
        return updatedItems;
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
    // Defer toast call to avoid updating during render
    setTimeout(() => {
      toast({
        title: "Removed from cart",
        description: `The item has been removed from your cart.`,
      });
    }, 0);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCartItems(prevItems => {
        const item = prevItems.find(i => i.id === productId);
        if (item && item.stock && quantity > item.stock) {
          // Defer toast call to avoid updating during render
          setTimeout(() => {
            toast({
              variant: "destructive",
              title: "Insufficient Stock",
              description: `Only ${item.stock} item(s) available in stock.`,
            });
          }, 0);
          return prevItems;
        }
        return prevItems.map(item =>
          item.id === productId ? { ...item, quantity } : item
        );
      });
    }
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('ikm-cart');
  };

  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, totalPrice, isAddingToCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

    