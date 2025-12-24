'use server';

import { getAdminFirestore } from './firebase/admin';
import { requireOwnerOrAdmin } from './auth-utils';
import type { Order } from './firebase/firestore/orders';
import type { Product } from './firebase/firestore/products';

export interface ReportData {
  type: 'sales' | 'revenue' | 'customers' | 'products' | 'inventory';
  dateRange: number; // days
  startDate: Date;
  endDate: Date;
  data: any;
}

/**
 * Generate sales report
 */
export async function generateSalesReport(sellerId: string, days: number) {
  const auth = await requireOwnerOrAdmin(sellerId);
  
  if (auth.uid !== sellerId && !auth.isAdmin) {
    throw new Error('Unauthorized');
  }

  const firestore = getAdminFirestore();
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get orders in date range
  const ordersSnapshot = await firestore
    .collection('orders')
    .where('sellerId', '==', sellerId)
    .get();

  const orders = ordersSnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as Order))
    .filter(order => {
      if (!order.createdAt) return false;
      const orderDate = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      return orderDate >= startDate && orderDate <= endDate;
    });

  const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Group by status
  const statusBreakdown = orders.reduce((acc, order) => {
    const status = order.status || 'Unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Daily breakdown
  const dailyBreakdown: Record<string, { revenue: number; orders: number }> = {};
  orders.forEach(order => {
    if (!order.createdAt) return;
    const orderDate = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
    const dateKey = orderDate.toISOString().split('T')[0];
    if (!dailyBreakdown[dateKey]) {
      dailyBreakdown[dateKey] = { revenue: 0, orders: 0 };
    }
    dailyBreakdown[dateKey].revenue += order.total || 0;
    dailyBreakdown[dateKey].orders += 1;
  });

  return {
    type: 'sales' as const,
    dateRange: days,
    startDate,
    endDate,
    summary: {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      statusBreakdown,
    },
    dailyBreakdown: Object.entries(dailyBreakdown).map(([date, data]) => ({
      date,
      ...data,
    })),
    orders: orders.map(order => ({
      id: order.id,
      date: order.createdAt?.toDate ? order.createdAt.toDate().toISOString() : '',
      customer: order.customerInfo?.name || 'Unknown',
      total: order.total || 0,
      status: order.status,
      items: order.items?.length || 0,
    })),
  };
}

/**
 * Generate customer report
 */
export async function generateCustomerReport(sellerId: string, days: number) {
  const auth = await requireOwnerOrAdmin(sellerId);
  
  if (auth.uid !== sellerId && !auth.isAdmin) {
    throw new Error('Unauthorized');
  }

  const firestore = getAdminFirestore();
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get orders in date range
  const ordersSnapshot = await firestore
    .collection('orders')
    .where('sellerId', '==', sellerId)
    .get();

  const orders = ordersSnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as Order))
    .filter(order => {
      if (!order.createdAt) return false;
      const orderDate = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      return orderDate >= startDate && orderDate <= endDate;
    });

  // Process customers
  const customerMap = new Map<string, {
    customerId: string;
    name: string;
    email: string;
    phone: string;
    totalOrders: number;
    totalSpent: number;
    firstOrderDate: Date;
    lastOrderDate: Date;
  }>();

  orders.forEach(order => {
    const customerId = order.customerId;
    if (!customerId) return;

    const existing = customerMap.get(customerId);
    const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt || Date.now());

    if (existing) {
      existing.totalOrders += 1;
      existing.totalSpent += order.total || 0;
      if (orderDate > existing.lastOrderDate) {
        existing.lastOrderDate = orderDate;
      }
      if (orderDate < existing.firstOrderDate) {
        existing.firstOrderDate = orderDate;
      }
    } else {
      customerMap.set(customerId, {
        customerId,
        name: order.customerInfo?.name || 'Unknown',
        email: order.customerInfo?.email || '',
        phone: order.customerInfo?.phone || '',
        totalOrders: 1,
        totalSpent: order.total || 0,
        firstOrderDate: orderDate,
        lastOrderDate: orderDate,
      });
    }
  });

  const customers = Array.from(customerMap.values())
    .sort((a, b) => b.totalSpent - a.totalSpent);

  // Segment analysis
  const segments = {
    VIP: customers.filter(c => c.totalSpent >= 50000 || c.totalOrders >= 10).length,
    Regular: customers.filter(c => c.totalSpent < 50000 && c.totalOrders >= 2).length,
    New: customers.filter(c => c.totalOrders === 1).length,
  };

  return {
    type: 'customers' as const,
    dateRange: days,
    startDate,
    endDate,
    summary: {
      totalCustomers: customers.length,
      segments,
      averageOrderValue: customers.length > 0 
        ? customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length 
        : 0,
    },
    customers: customers.map(c => ({
      ...c,
      firstOrderDate: c.firstOrderDate.toISOString(),
      lastOrderDate: c.lastOrderDate.toISOString(),
    })),
  };
}

/**
 * Generate product performance report
 */
export async function generateProductReport(sellerId: string, days: number) {
  const auth = await requireOwnerOrAdmin(sellerId);
  
  if (auth.uid !== sellerId && !auth.isAdmin) {
    throw new Error('Unauthorized');
  }

  const firestore = getAdminFirestore();
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get products
  const productsSnapshot = await firestore
    .collection('products')
    .where('sellerId', '==', sellerId)
    .get();

  const products = productsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as Product));

  // Get orders in date range
  const ordersSnapshot = await firestore
    .collection('orders')
    .where('sellerId', '==', sellerId)
    .get();

  const orders = ordersSnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as Order))
    .filter(order => {
      if (!order.createdAt) return false;
      const orderDate = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      return orderDate >= startDate && orderDate <= endDate;
    });

  // Calculate product performance
  const productPerformance = new Map<string, {
    productId: string;
    name: string;
    sales: number;
    revenue: number;
    orders: number;
  }>();

  orders.forEach(order => {
    order.items?.forEach(item => {
      const productId = item.productId || item.id || '';
      const existing = productPerformance.get(productId);
      
      if (existing) {
        existing.sales += item.quantity || 0;
        existing.revenue += (item.price || 0) * (item.quantity || 0);
        existing.orders += 1;
      } else {
        productPerformance.set(productId, {
          productId,
          name: item.name || 'Unknown',
          sales: item.quantity || 0,
          revenue: (item.price || 0) * (item.quantity || 0),
          orders: 1,
        });
      }
    });
  });

  const performance = Array.from(productPerformance.values())
    .sort((a, b) => b.revenue - a.revenue);

  return {
    type: 'products' as const,
    dateRange: days,
    startDate,
    endDate,
    summary: {
      totalProducts: products.length,
      productsSold: performance.length,
      totalSales: performance.reduce((sum, p) => sum + p.sales, 0),
      totalRevenue: performance.reduce((sum, p) => sum + p.revenue, 0),
    },
    products: performance,
  };
}

