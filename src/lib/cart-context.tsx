
'use client';

import { useToast } from '@/hooks/use-toast';
import { Product } from '@/lib/firebase/firestore/products';
import { ArtisanItem, ArtisanPackage } from '@/lib/firebase/firestore/stores';
import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

/**
 * Cart Item using snapshot approach
 * Snapshot price and name at add-to-cart time to protect from mid-checkout edits
 */
export interface CartItem {
  refType: 'product' | 'item' | 'package'; // What type of thing this is
  refId: string; // ID of the product/item/package
  storeId: string; // Which store it came from
  titleSnapshot: string; // Name at time of add-to-cart
  priceSnapshot: number; // Price at time of add-to-cart
  quantity: number;
  photo?: string; // Photo for display
  // For packages, we don't expand to show included items in cart
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Product | ArtisanItem | ArtisanPackage, storeId: string, quantity?: number) => void;
  removeFromCart: (refId: string, refType?: 'product' | 'item' | 'package') => void;
  updateQuantity: (refId: string, quantity: number, refType?: 'product' | 'item' | 'package') => void;
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

  const addToCart = (item: Product | ArtisanItem | ArtisanPackage, storeId: string, quantity = 1) => {
    setAddingToCart(true);
    
    // Determine item type and extract data
    let refType: 'product' | 'item' | 'package';
    let refId: string;
    let title: string;
    let price: number;
    let photo: string | undefined;
    
    if ('sellerId' in item && 'stock' in item) {
      // Product
      refType = 'product';
      refId = item.id!;
      title = item.name;
      price = item.price;
      photo = item.imageUrl;
      
      // Check stock availability for products
      const currentStock = item.stock || 0;
      setCartItems(prevItems => {
        const existingItem = prevItems.find(ci => ci.refId === refId && ci.refType === 'product');
        const currentQuantity = existingItem ? existingItem.quantity : 0;
        const newQuantity = currentQuantity + quantity;

        if (newQuantity > currentStock) {
          setAddingToCart(false);
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
          const updatedItems = prevItems.map(ci =>
            ci.refId === refId && ci.refType === 'product' 
              ? { ...ci, quantity: newQuantity } 
              : ci
          );
          setTimeout(() => {
            toast({
              title: "Added to cart",
              description: `${title} has been added to your cart.`,
            });
          }, 0);
          setAddingToCart(false);
          return updatedItems;
        } else {
          const cartItem: CartItem = {
            refType: 'product',
            refId,
            storeId,
            titleSnapshot: title,
            priceSnapshot: price,
            quantity,
            photo,
          };
          const updatedItems = [...prevItems, cartItem];
          setTimeout(() => {
            toast({
              title: "Added to cart",
              description: `${title} has been added to your cart.`,
            });
          }, 0);
          setAddingToCart(false);
          return updatedItems;
        }
      });
      return;
    } else if ('itemIds' in item) {
      // ArtisanPackage
      refType = 'package';
      refId = item.id!;
      title = item.name;
      price = item.price;
      photo = item.photo;
    } else {
      // ArtisanItem
      refType = 'item';
      refId = item.id!;
      title = item.name;
      price = item.price;
      photo = item.photo;
      
      // Check availability for artisan items
      if (!item.available) {
        setAddingToCart(false);
        setTimeout(() => {
          toast({
            variant: "destructive",
            title: "Item Unavailable",
            description: `${title} is currently unavailable.`,
          });
        }, 0);
        return;
      }
    }
    
    // For artisan items and packages
    setCartItems(prevItems => {
      const existingItem = prevItems.find(ci => ci.refId === refId && ci.refType === refType);
      const currentQuantity = existingItem ? existingItem.quantity : 0;
      const newQuantity = currentQuantity + quantity;

      if (existingItem) {
        const updatedItems = prevItems.map(ci =>
          ci.refId === refId && ci.refType === refType
            ? { ...ci, quantity: newQuantity }
            : ci
        );
        setTimeout(() => {
          toast({
            title: "Added to cart",
            description: `${title} has been added to your cart.`,
          });
        }, 0);
        setAddingToCart(false);
        return updatedItems;
      } else {
        const cartItem: CartItem = {
          refType,
          refId,
          storeId,
          titleSnapshot: title,
          priceSnapshot: price,
          quantity,
          photo,
        };
        const updatedItems = [...prevItems, cartItem];
        setTimeout(() => {
          toast({
            title: "Added to cart",
            description: `${title} has been added to your cart.`,
          });
        }, 0);
        setAddingToCart(false);
        return updatedItems;
      }
    });
  };

  const removeFromCart = (refId: string, refType?: 'product' | 'item' | 'package') => {
    setCartItems(prevItems => {
      if (refType) {
        return prevItems.filter(item => !(item.refId === refId && item.refType === refType));
      }
      return prevItems.filter(item => item.refId !== refId);
    });
    // Defer toast call to avoid updating during render
    setTimeout(() => {
      toast({
        title: "Removed from cart",
        description: `The item has been removed from your cart.`,
      });
    }, 0);
  };

  const updateQuantity = (refId: string, quantity: number, refType?: 'product' | 'item' | 'package') => {
    if (quantity <= 0) {
      removeFromCart(refId, refType);
    } else {
      setCartItems(prevItems => {
        const item = prevItems.find(i => 
          i.refId === refId && (refType ? i.refType === refType : true)
        );
        // Note: Stock checking for products should be done before calling this
        // For snapshot approach, we use the snapshot price/name, not current values
        return prevItems.map(ci =>
          ci.refId === refId && (refType ? ci.refType === refType : true)
            ? { ...ci, quantity }
            : ci
        );
      });
    }
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('ikm-cart');
  };

  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  const totalPrice = cartItems.reduce((total, item) => total + item.priceSnapshot * item.quantity, 0);

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

    