/**
 * Cloud Functions Client
 * Utility to call Firebase Cloud Functions from the web app
 */

import { firebaseConfig } from '@/firebase/config';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Cloud Function URLs
const FUNCTION_URLS = {
  verifyPaymentAndCreateOrder: 'https://verifypaymentandcreateorder-q3rjv54uka-uc.a.run.app',
  findRecentTransactionByEmail: 'https://findrecenttransactionbyemail-q3rjv54uka-uc.a.run.app',
  getBanksList: 'https://getbankslist-q3rjv54uka-uc.a.run.app',
  resolveAccountNumber: 'https://resolveaccountnumber-q3rjv54uka-uc.a.run.app',
  savePayoutDetails: 'https://savepayoutdetails-q3rjv54uka-uc.a.run.app',
  calculateShippingOptions: 'https://calculateshippingoptions-q3rjv54uka-uc.a.run.app',
  getOrdersByCustomer: 'https://getordersbycustomer-q3rjv54uka-uc.a.run.app',
  getOrdersBySeller: 'https://getordersbyseller-q3rjv54uka-uc.a.run.app',
  updateOrderStatus: 'https://updateorderstatus-q3rjv54uka-uc.a.run.app',
  markOrderAsSent: 'https://markorderassent-q3rjv54uka-uc.a.run.app',
  markOrderAsReceived: 'https://markorderasreceived-q3rjv54uka-uc.a.run.app',
  sendOrderMessage: 'https://sendordermessage-q3rjv54uka-uc.a.run.app',
  linkGuestOrdersToAccount: 'https://linkguestorderstoaccount-q3rjv54uka-uc.a.run.app',
  searchProducts: 'https://searchproducts-q3rjv54uka-uc.a.run.app',
};

/**
 * Get Firebase ID token for authenticated requests
 */
async function getIdToken(): Promise<string | null> {
  try {
    const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  } catch (error) {
    console.error('Error getting ID token:', error);
    return null;
  }
}

/**
 * Call a Cloud Function with optional authentication
 */
async function callFunction<T = any>(
  functionName: keyof typeof FUNCTION_URLS,
  data: any,
  requireAuth: boolean = false
): Promise<T> {
  const url = FUNCTION_URLS[functionName];
  if (!url) {
    throw new Error(`Function ${functionName} not found`);
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add authentication if required
  if (requireAuth) {
    const idToken = await getIdToken();
    if (!idToken) {
      throw new Error('Authentication required. Please log in.');
    }
    headers['Authorization'] = `Bearer ${idToken}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Function call failed: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Call a Cloud Function with GET method (for public functions)
 */
async function callFunctionGet<T = any>(functionName: keyof typeof FUNCTION_URLS): Promise<T> {
  const url = FUNCTION_URLS[functionName];
  if (!url) {
    throw new Error(`Function ${functionName} not found`);
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Function call failed: ${response.statusText}`);
  }

  return await response.json();
}

// Export specific function wrappers
export const cloudFunctions = {
  // Payment functions
  async verifyPaymentAndCreateOrder(data: {
    reference: string;
    idempotencyKey: string;
    cartItems: any[];
    total: number;
    deliveryAddress: string;
    customerInfo: any;
    discountCode?: string;
    shippingType?: 'delivery' | 'pickup';
    shippingPrice?: number;
  }) {
    return callFunction('verifyPaymentAndCreateOrder', data, false); // Guest checkout allowed
  },

  async findRecentTransactionByEmail(data: { email: string; amount: number }) {
    const result = await callFunction<{ success: boolean; found: boolean; reference?: string; status?: string; amount?: number; paidAt?: string }>('findRecentTransactionByEmail', data, false);
    if (result.found && result.reference) {
      return {
        reference: result.reference,
        status: result.status || 'success',
        amount: result.amount || 0,
        paidAt: result.paidAt,
      };
    }
    return null;
  },

  // Payout functions
  async getBanksList() {
    return callFunctionGet<{ success: boolean; banks: Array<{ code: string; name: string; id: number }> }>('getBanksList');
  },

  async resolveAccountNumber(data: { accountNumber: string; bankCode: string }) {
    return callFunction<{ success: boolean; account_name: string; account_number: string; bank_id: number }>(
      'resolveAccountNumber',
      data,
      false
    );
  },

  async savePayoutDetails(data: {
    bankCode: string;
    accountNumber: string;
    accountName: string;
  }) {
    return callFunction('savePayoutDetails', data, true);
  },

  // Shipping functions
  async calculateShippingOptions(data: {
    sellerId: string;
    state: string;
    cartItems: any[];
  }) {
    return callFunction('calculateShippingOptions', data, false);
  },

  // Order functions
  async getOrdersByCustomer() {
    return callFunction('getOrdersByCustomer', {}, true);
  },

  async getOrdersBySeller() {
    return callFunction('getOrdersBySeller', {}, true);
  },

  async updateOrderStatus(data: { orderId: string; status: string }) {
    return callFunction('updateOrderStatus', data, true);
  },

  async markOrderAsSent(data: { orderId: string; photoUrl?: string }) {
    return callFunction('markOrderAsSent', data, true);
  },

  async markOrderAsReceived(data: { orderId: string; photoUrl?: string }) {
    return callFunction('markOrderAsReceived', data, true);
  },

  // Chat functions
  async sendOrderMessage(data: {
    orderId: string;
    message?: string;
    imageUrl?: string;
  }) {
    return callFunction('sendOrderMessage', data, true);
  },

  // User functions
  async linkGuestOrdersToAccount() {
    return callFunction('linkGuestOrdersToAccount', {}, true);
  },

  // Search functions
  async searchProducts(data: { query: string; limit?: number }) {
    return callFunction('searchProducts', data, false);
  },
};

