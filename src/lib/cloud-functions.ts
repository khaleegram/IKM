/**
 * Cloud Functions Client
 * Utility to call Firebase Cloud Functions from the web app
 */

import { firebaseConfig } from '@/firebase/config';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Cloud Function URLs
// NOTE: URLs will be generated after deployment. Update these after first deploy.
const FUNCTION_URLS = {
  // Payment functions
  verifyPaymentAndCreateOrder: 'https://verifypaymentandcreateorder-q3rjv54uka-uc.a.run.app',
  findRecentTransactionByEmail: 'https://findrecenttransactionbyemail-q3rjv54uka-uc.a.run.app',
  
  // Payout functions
  getBanksList: 'https://getbankslist-q3rjv54uka-uc.a.run.app',
  resolveAccountNumber: 'https://resolveaccountnumber-q3rjv54uka-uc.a.run.app',
  savePayoutDetails: 'https://savepayoutdetails-q3rjv54uka-uc.a.run.app',
  
  // Shipping functions
  calculateShippingOptions: 'https://calculateshippingoptions-q3rjv54uka-uc.a.run.app',
  
  // Order functions
  getOrdersByCustomer: 'https://getordersbycustomer-q3rjv54uka-uc.a.run.app',
  getOrdersBySeller: 'https://getordersbyseller-q3rjv54uka-uc.a.run.app',
  updateOrderStatus: 'https://updateorderstatus-q3rjv54uka-uc.a.run.app',
  markOrderAsSent: 'https://markorderassent-q3rjv54uka-uc.a.run.app',
  markOrderAsReceived: 'https://markorderasreceived-q3rjv54uka-uc.a.run.app',
  
  // Chat functions
  sendOrderMessage: 'https://sendordermessage-q3rjv54uka-uc.a.run.app',
  
  // User functions
  linkGuestOrdersToAccount: 'https://linkguestorderstoaccount-q3rjv54uka-uc.a.run.app',
  
  // Search functions
  searchProducts: 'https://searchproducts-q3rjv54uka-uc.a.run.app',
  
  // Seller functions - Products
  getSellerProducts: 'https://getsellerproducts-q3rjv54uka-uc.a.run.app',
  getProduct: 'https://getproduct-q3rjv54uka-uc.a.run.app',
  createProduct: 'https://createproduct-q3rjv54uka-uc.a.run.app',
  updateProduct: 'https://updateproduct-q3rjv54uka-uc.a.run.app',
  deleteProduct: 'https://deleteproduct-q3rjv54uka-uc.a.run.app',
  
  // Seller functions - Dashboard & Analytics
  getDashboardStats: 'https://getdashboardstats-q3rjv54uka-uc.a.run.app',
  getSellerAnalytics: 'https://getselleranalytics-q3rjv54uka-uc.a.run.app',
  
  // Seller functions - Reports
  generateSalesReport: 'https://generatesalesreport-q3rjv54uka-uc.a.run.app',
  generateCustomerReport: 'https://generatecustomerreport-q3rjv54uka-uc.a.run.app',
  
  // Seller functions - Marketing
  createDiscountCode: 'https://creatediscountcode-q3rjv54uka-uc.a.run.app',
  getDiscountCodes: 'https://getdiscountcodes-q3rjv54uka-uc.a.run.app',
  updateDiscountCode: 'https://updatediscountcode-q3rjv54uka-uc.a.run.app',
  deleteDiscountCode: 'https://deletediscountcode-q3rjv54uka-uc.a.run.app',
  
  // Seller functions - Store
  getStoreSettings: 'https://getstoresettings-q3rjv54uka-uc.a.run.app',
  updateStoreSettings: 'https://updatestoresettings-q3rjv54uka-uc.a.run.app',
  
  // Seller functions - Customers
  getCustomers: 'https://getcustomers-q3rjv54uka-uc.a.run.app',
  
  // Admin functions - Users
  getAllUsers: 'https://getallusers-q3rjv54uka-uc.a.run.app',
  grantAdminRole: 'https://grantadminrole-q3rjv54uka-uc.a.run.app',
  revokeAdminRole: 'https://revokeadminrole-q3rjv54uka-uc.a.run.app',
  
  // Admin functions - Platform
  getPlatformSettings: 'https://getplatformsettings-q3rjv54uka-uc.a.run.app',
  updatePlatformSettings: 'https://updateplatformsettings-q3rjv54uka-uc.a.run.app',
  
  // Admin functions - Orders & Disputes
  getAllOrders: 'https://getallorders-q3rjv54uka-uc.a.run.app',
  resolveDispute: 'https://resolvedispute-q3rjv54uka-uc.a.run.app',
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

  // Add authentication if required OR if available (for logged-in users)
  // This ensures customerId is set correctly for logged-in users
  const idToken = await getIdToken();
  if (requireAuth) {
    if (!idToken) {
      throw new Error('Authentication required. Please log in.');
    }
    headers['Authorization'] = `Bearer ${idToken}`;
  } else if (idToken) {
    // Even if not required, send auth if available (for logged-in users)
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
    shippingType?: 'delivery' | 'pickup' | 'contact';
    shippingPrice?: number;
  }) {
    // Always try to send auth if available (for logged-in users)
    // The function will handle guest checkout if no auth is available
    return callFunction('verifyPaymentAndCreateOrder', data, true); // Try to use auth if available
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

  // ============================================================================
  // SELLER FUNCTIONS - PRODUCTS
  // ============================================================================
  
  async getSellerProducts(data?: { sellerId?: string; limit?: number; startAfter?: string; status?: string }) {
    return callFunction('getSellerProducts', data || {}, true);
  },

  async getProduct(data: { productId: string }) {
    return callFunction('getProduct', data, false);
  },

  async createProduct(data: {
    name: string;
    description?: string;
    price: number;
    compareAtPrice?: number;
    stock?: number;
    sku?: string;
    category?: string;
    status?: string;
    allowShipping?: boolean;
    imageBase64?: string;
    variants?: any[];
  }) {
    return callFunction('createProduct', data, true);
  },

  async updateProduct(data: {
    productId: string;
    name?: string;
    description?: string;
    price?: number;
    compareAtPrice?: number;
    stock?: number;
    sku?: string;
    category?: string;
    status?: string;
    allowShipping?: boolean;
    imageBase64?: string;
    variants?: any[];
  }) {
    return callFunction('updateProduct', data, true);
  },

  async deleteProduct(data: { productId: string }) {
    return callFunction('deleteProduct', data, true);
  },

  // ============================================================================
  // SELLER FUNCTIONS - DASHBOARD & ANALYTICS
  // ============================================================================

  async getDashboardStats(data?: { sellerId?: string }) {
    return callFunction('getDashboardStats', data || {}, true);
  },

  async getSellerAnalytics(data?: { sellerId?: string; days?: number }) {
    return callFunction('getSellerAnalytics', data || {}, true);
  },

  // ============================================================================
  // SELLER FUNCTIONS - REPORTS
  // ============================================================================

  async generateSalesReport(data: { sellerId?: string; days?: number }) {
    return callFunction('generateSalesReport', data, true);
  },

  async generateCustomerReport(data: { sellerId?: string; days?: number }) {
    return callFunction('generateCustomerReport', data, true);
  },

  // ============================================================================
  // SELLER FUNCTIONS - MARKETING
  // ============================================================================

  async createDiscountCode(data: {
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    maxUses?: number;
    minOrderAmount?: number;
    validFrom?: string;
    validUntil?: string;
    sellerId?: string;
  }) {
    return callFunction('createDiscountCode', data, true);
  },

  async getDiscountCodes(data?: { sellerId?: string }) {
    return callFunction('getDiscountCodes', data || {}, true);
  },

  async updateDiscountCode(data: {
    discountCodeId: string;
    status?: 'active' | 'inactive' | 'expired';
    maxUses?: number;
    validFrom?: string;
    validUntil?: string;
  }) {
    return callFunction('updateDiscountCode', data, true);
  },

  async deleteDiscountCode(data: { discountCodeId: string }) {
    return callFunction('deleteDiscountCode', data, true);
  },

  // ============================================================================
  // SELLER FUNCTIONS - STORE
  // ============================================================================

  async getStoreSettings(data?: { sellerId?: string }) {
    return callFunction('getStoreSettings', data || {}, true);
  },

  async updateStoreSettings(data: {
    sellerId?: string;
    updateData: {
      storeName?: string;
      storeDescription?: string;
      logoBase64?: string;
      bannerBase64?: string;
      [key: string]: any;
    };
  }) {
    return callFunction('updateStoreSettings', data, true);
  },

  // ============================================================================
  // SELLER FUNCTIONS - CUSTOMERS
  // ============================================================================

  async getCustomers(data?: { sellerId?: string }) {
    return callFunction('getCustomers', data || {}, true);
  },

  // ============================================================================
  // ADMIN FUNCTIONS - USERS
  // ============================================================================

  async getAllUsers(data?: { limit?: number; startAfter?: string; role?: string }) {
    return callFunction('getAllUsers', data || {}, true);
  },

  async grantAdminRole(data: { userId: string }) {
    return callFunction('grantAdminRole', data, true);
  },

  async revokeAdminRole(data: { userId: string }) {
    return callFunction('revokeAdminRole', data, true);
  },

  // ============================================================================
  // ADMIN FUNCTIONS - PLATFORM
  // ============================================================================

  async getPlatformSettings() {
    return callFunction('getPlatformSettings', {}, true);
  },

  async updatePlatformSettings(data: {
    settings: {
      platformCommissionRate?: number;
      minimumPayoutAmount?: number;
      platformFee?: number;
      currency?: string;
    };
  }) {
    return callFunction('updatePlatformSettings', data, true);
  },

  // ============================================================================
  // ADMIN FUNCTIONS - ORDERS & DISPUTES
  // ============================================================================

  async getAllOrders(data?: { limit?: number; startAfter?: string; status?: string }) {
    return callFunction('getAllOrders', data || {}, true);
  },

  async resolveDispute(data: {
    orderId: string;
    resolution: 'refund' | 'release';
    refundAmount?: number;
  }) {
    return callFunction('resolveDispute', data, true);
  },
};

