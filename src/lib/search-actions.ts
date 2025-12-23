import { getAdminFirestore } from './firebase/admin';
import type { Product } from './firebase/firestore/products';
import type { Order } from './firebase/firestore/orders';

/**
 * Full-text search for products
 * In production, consider using Algolia, Elasticsearch, or Firebase Extensions
 */
export async function searchProducts(query: string, sellerId?: string, limit: number = 50): Promise<Product[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const firestore = getAdminFirestore();
  const productsRef = firestore.collection('products');
  
  let queryRef: FirebaseFirestore.Query = productsRef;
  
  if (sellerId) {
    queryRef = queryRef.where('sellerId', '==', sellerId);
  }

  const snapshot = await queryRef.get();
  const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);

  const products = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as Product))
    .filter(product => {
      const searchableText = [
        product.name,
        product.description,
        product.category,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      // Check if all search terms are found
      return searchTerms.every(term => searchableText.includes(term));
    })
    .slice(0, limit);

  return products;
}

/**
 * Search orders by customer name, order ID, or product name
 */
export async function searchOrders(query: string, sellerId?: string, limit: number = 50): Promise<Order[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const firestore = getAdminFirestore();
  let queryRef: FirebaseFirestore.Query = firestore.collection('orders');
  
  if (sellerId) {
    queryRef = queryRef.where('sellerId', '==', sellerId);
  }

  const snapshot = await queryRef.get();
  const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);

  const orders = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as Order))
    .filter(order => {
      const searchableText = [
        order.id,
        order.customerInfo?.name,
        order.customerInfo?.email,
        order.customerInfo?.phone,
        order.deliveryAddress,
        ...(order.items?.map(item => item.name) || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchTerms.every(term => searchableText.includes(term));
    })
    .slice(0, limit);

  return orders;
}

/**
 * Search customers by name, email, or phone
 */
export async function searchCustomers(query: string, sellerId: string, limit: number = 50) {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const firestore = getAdminFirestore();
  
  // Get all orders for this seller
  const ordersSnapshot = await firestore
    .collection('orders')
    .where('sellerId', '==', sellerId)
    .get();

  const customerMap = new Map<string, {
    customerId: string;
    name: string;
    email: string;
    phone: string;
    totalOrders: number;
    totalSpent: number;
  }>();

  ordersSnapshot.forEach(doc => {
    const order = doc.data();
    const customerId = order.customerId;
    if (!customerId) return;

    const existing = customerMap.get(customerId) || {
      customerId,
      name: order.customerInfo?.name || '',
      email: order.customerInfo?.email || '',
      phone: order.customerInfo?.phone || '',
      totalOrders: 0,
      totalSpent: 0,
    };

    existing.totalOrders += 1;
    existing.totalSpent += order.total || 0;
    customerMap.set(customerId, existing);
  });

  const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);
  
  const customers = Array.from(customerMap.values())
    .filter(customer => {
      const searchableText = [
        customer.name,
        customer.email,
        customer.phone,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchTerms.every(term => searchableText.includes(term));
    })
    .slice(0, limit);

  return customers;
}

/**
 * Global search across products, orders, and customers
 */
export async function globalSearch(query: string, sellerId?: string) {
  const [products, orders, customers] = await Promise.all([
    searchProducts(query, sellerId, 10),
    sellerId ? searchOrders(query, sellerId, 10) : Promise.resolve([]),
    sellerId ? searchCustomers(query, sellerId, 10) : Promise.resolve([]),
  ]);

  return {
    products,
    orders,
    customers,
    totalResults: products.length + orders.length + customers.length,
  };
}

