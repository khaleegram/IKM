# Cloud Functions - Complete Function Reference

This document lists **all available Cloud Functions** that you can call from your mobile app or web app.

---

## 📋 Table of Contents

1. [Payment Functions](#payment-functions)
2. [Order Functions](#order-functions)
3. [Product Functions](#product-functions)
4. [User Functions](#user-functions)
5. [Shipping Functions](#shipping-functions)
6. [Payout Functions](#payout-functions)
7. [Review Functions](#review-functions)
8. [Chat Functions](#chat-functions)
9. [Search Functions](#search-functions)

---

## 🔐 Authentication

**IMPORTANT:** All functions require authentication except where noted.

When calling from mobile app, include the Firebase ID token in the `Authorization` header:

```
Authorization: Bearer YOUR_FIREBASE_ID_TOKEN
```

**How to get Firebase ID Token:**
```javascript
// In your mobile app
const user = firebase.auth().currentUser;
const token = await user.getIdToken();
```

---

## 💳 Payment Functions

### 1. `verifyPaymentAndCreateOrder`

**Purpose:** Verifies payment with Paystack and creates an order.

**HTTP Method:** `POST`

**URL:** `https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/verifyPaymentAndCreateOrder`

**Authentication:** Required (or guest with email)

**Request Body:**
```json
{
  "reference": "IKM_1234567890_abc123",
  "idempotencyKey": "unique-key-12345",
  "cartItems": [
    {
      "id": "product-id-123",
      "name": "Product Name",
      "price": 50000,
      "quantity": 2,
      "imageUrl": "https://..."
    }
  ],
  "total": 100000,
  "deliveryAddress": "123 Main St, Lagos",
  "customerInfo": {
    "email": "buyer@example.com",
    "name": "John Doe",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+2348123456789"
  },
  "discountCode": "SAVE10",  // Optional
  "shippingType": "delivery",  // "delivery" or "pickup"
  "shippingPrice": 2500  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "order-id-12345",
  "message": "Order created successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Payment verification failed"
}
```

---

### 2. `findRecentTransactionByEmail`

**Purpose:** Finds a recent Paystack transaction by email and amount (fallback for payment verification).

**HTTP Method:** `POST`

**URL:** `https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/findRecentTransactionByEmail`

**Authentication:** Required

**Request Body:**
```json
{
  "email": "buyer@example.com",
  "amount": 100000
}
```

**Response:**
```json
{
  "success": true,
  "reference": "IKM_1234567890_abc123",
  "transaction": {
    "reference": "IKM_1234567890_abc123",
    "status": "success",
    "amount": 100000,
    "paidAt": "2025-01-15T10:30:00Z"
  }
}
```

---

## 📦 Order Functions

### 3. `updateOrderStatus`

**Purpose:** Updates the status of an order (Processing → Sent → Received → Completed).

**HTTP Method:** `POST`

**URL:** `https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/updateOrderStatus`

**Authentication:** Required (Seller or Admin)

**Request Body:**
```json
{
  "orderId": "order-id-12345",
  "newStatus": "Sent"  // "Processing", "Sent", "Received", "Completed", "Cancelled", "Disputed"
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "order-id-12345",
  "newStatus": "Sent"
}
```

**Valid Status Transitions:**
- `Processing` → `Sent`, `Cancelled`
- `Sent` → `Received`, `Cancelled`, `Disputed`
- `Received` → `Completed`
- `Completed` → (final state)
- `Cancelled` → (final state)
- `Disputed` → `Completed`, `Cancelled`

---

### 4. `markOrderAsSent`

**Purpose:** Marks an order as sent (with optional photo).

**HTTP Method:** `POST`

**URL:** `https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/markOrderAsSent`

**Authentication:** Required (Seller only)

**Request Body:**
```json
{
  "orderId": "order-id-12345",
  "photoUrl": "https://storage.googleapis.com/..."  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "autoReleaseDate": "2025-01-22T10:30:00Z"
}
```

---

### 5. `markOrderAsReceived`

**Purpose:** Marks an order as received by customer (with optional photo). Releases escrow funds to seller.

**HTTP Method:** `POST`

**URL:** `https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/markOrderAsReceived`

**Authentication:** Required (Customer only)

**Request Body:**
```json
{
  "orderId": "order-id-12345",
  "photoUrl": "https://storage.googleapis.com/..."  // Optional
}
```

**Response:**
```json
{
  "success": true
}
```

---

### 6. `getOrdersByCustomer`

**Purpose:** Gets all orders for the authenticated customer.

**HTTP Method:** `GET`

**URL:** `https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/getOrdersByCustomer`

**Authentication:** Required (Customer)

**Query Parameters:**
- `status` (optional): Filter by status (e.g., `?status=Completed`)
- `limit` (optional): Number of orders to return (default: 50)
- `startAfter` (optional): Order ID to start after (for pagination)

**Response:**
```json
{
  "success": true,
  "orders": [
    {
      "id": "order-id-12345",
      "sellerId": "seller-id-123",
      "sellerName": "Seller Store",
      "items": [...],
      "total": 100000,
      "status": "Processing",
      "createdAt": "2025-01-15T10:30:00Z",
      ...
    }
  ]
}
```

---

### 7. `getOrdersBySeller`

**Purpose:** Gets all orders for the authenticated seller.

**HTTP Method:** `GET`

**URL:** `https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/getOrdersBySeller`

**Authentication:** Required (Seller)

**Query Parameters:** Same as `getOrdersByCustomer`

---

## 🛍️ Product Functions

### 8. `createProduct`

**Purpose:** Creates a new product.

**HTTP Method:** `POST`

**URL:** `https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/createProduct`

**Authentication:** Required (Seller)

**Request Body:**
```json
{
  "name": "Product Name",
  "description": "Product description (min 10 characters)",
  "price": 50000,
  "compareAtPrice": 60000,  // Optional
  "stock": 100,
  "category": "Electronics",
  "images": ["https://..."],
  "allowShipping": true,  // Optional, default: true
  "status": "active"  // "active" or "draft"
}
```

**Response:**
```json
{
  "success": true,
  "productId": "product-id-12345"
}
```

---

### 9. `updateProduct`

**Purpose:** Updates an existing product.

**HTTP Method:** `POST`

**URL:** `https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/updateProduct`

**Authentication:** Required (Product Owner)

**Request Body:**
```json
{
  "productId": "product-id-12345",
  "name": "Updated Name",  // All fields optional
  "price": 45000,
  "stock": 50,
  ...
}
```

**Response:**
```json
{
  "success": true,
  "productId": "product-id-12345"
}
```

---

### 10. `deleteProduct`

**Purpose:** Deletes a product.

**HTTP Method:** `POST`

**URL:** `https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/deleteProduct`

**Authentication:** Required (Product Owner or Admin)

**Request Body:**
```json
{
  "productId": "product-id-12345"
}
```

**Response:**
```json
{
  "success": true
}
```

---

## 👤 User Functions

### 11. `updateUserProfile`

**Purpose:** Updates user profile information.

**HTTP Method:** `POST`

**URL:** `https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/updateUserProfile`

**Authentication:** Required

**Request Body:**
```json
{
  "displayName": "John Doe",  // Optional
  "whatsappNumber": "+2348123456789",  // Optional
  "phone": "+2348123456789"  // Optional
}
```

**Response:**
```json
{
  "success": true
}
```

---

### 12. `linkGuestOrdersToAccount`

**Purpose:** Links guest orders to a user account (called after signup/login).

**HTTP Method:** `POST`

**URL:** `https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/linkGuestOrdersToAccount`

**Authentication:** Required

**Request Body:** (empty)

**Response:**
```json
{
  "success": true,
  "linkedCount": 3
}
```

---

## 🚚 Shipping Functions

### 13. `calculateShippingOptions`

**Purpose:** Calculates shipping options for a cart (public, no auth required).

**HTTP Method:** `POST`

**URL:** `https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/calculateShippingOptions`

**Authentication:** Not required

**Request Body:**
```json
{
  "sellerId": "seller-id-123",
  "state": "Lagos",
  "city": "Ikeja",
  "cartItems": [
    {
      "id": "product-id-123",
      "allowShipping": true
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "options": [
    {
      "type": "delivery",
      "name": "Standard delivery to Lagos",
      "price": 2500,
      "estimatedDays": 3
    },
    {
      "type": "pickup",
      "name": "Pickup from store",
      "price": 0,
      "estimatedDays": 0
    }
  ]
}
```

---

## 💰 Payout Functions

### 14. `getBanksList`

**Purpose:** Gets list of all Nigerian banks (public, no auth required).

**HTTP Method:** `GET`

**URL:** `https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/getBanksList`

**Authentication:** Not required

**Response:**
```json
{
  "success": true,
  "banks": [
    {
      "code": "044",
      "name": "Access Bank",
      "id": 9
    },
    ...
  ]
}
```

---

### 15. `resolveAccountNumber`

**Purpose:** Resolves account number to get account name.

**HTTP Method:** `POST`

**URL:** `https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/resolveAccountNumber`

**Authentication:** Not required (but recommended for rate limiting)

**Request Body:**
```json
{
  "accountNumber": "0123456789",
  "bankCode": "044"
}
```

**Response:**
```json
{
  "success": true,
  "accountName": "JOHN DOE",
  "accountNumber": "0123456789",
  "bankId": 9
}
```

---

### 16. `savePayoutDetails`

**Purpose:** Saves bank account details for payouts.

**HTTP Method:** `POST`

**URL:** `https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/savePayoutDetails`

**Authentication:** Required (Seller or Admin)

**Request Body:**
```json
{
  "bankCode": "044",
  "bankName": "Access Bank",
  "accountNumber": "0123456789",
  "accountName": "JOHN DOE"
}
```

**Response:**
```json
{
  "success": true
}
```

---

## ⭐ Review Functions

### 17. `createReview`

**Purpose:** Creates a product review.

**HTTP Method:** `POST`

**URL:** `https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/createReview`

**Authentication:** Required (Customer)

**Request Body:**
```json
{
  "productId": "product-id-12345",
  "orderId": "order-id-12345",  // Optional but recommended
  "rating": 5,  // 1-5
  "comment": "Great product! Highly recommend."
}
```

**Response:**
```json
{
  "success": true,
  "reviewId": "review-id-12345"
}
```

---

## 💬 Chat Functions

### 18. `sendOrderMessage`

**Purpose:** Sends a message in order chat.

**HTTP Method:** `POST`

**URL:** `https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/sendOrderMessage`

**Authentication:** Required (Order participant)

**Request Body:**
```json
{
  "orderId": "order-id-12345",
  "message": "Hello, when will this ship?"  // Optional if imageUrl provided
  // OR
  "imageUrl": "https://storage.googleapis.com/..."  // Optional if message provided
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "message-id-12345"
}
```

---

## 🔍 Search Functions

### 19. `searchProducts`

**Purpose:** Searches products (public, no auth required).

**HTTP Method:** `POST`

**URL:** `https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/searchProducts`

**Authentication:** Not required

**Request Body:**
```json
{
  "query": "laptop",
  "category": "Electronics",  // Optional
  "minPrice": 10000,  // Optional
  "maxPrice": 500000,  // Optional
  "limit": 20  // Optional, default: 20
}
```

**Response:**
```json
{
  "success": true,
  "products": [...],
  "total": 45
}
```

---

## ❌ Error Handling

All functions return errors in this format:

```json
{
  "success": false,
  "error": "Error message here",
  "code": "ERROR_CODE"  // Optional
}
```

**Common Error Codes:**
- `UNAUTHENTICATED` - User not logged in
- `UNAUTHORIZED` - User doesn't have permission
- `VALIDATION_ERROR` - Invalid input data
- `NOT_FOUND` - Resource not found
- `ALREADY_EXISTS` - Resource already exists
- `INTERNAL_ERROR` - Server error

---

## 📝 Notes

1. **Rate Limiting:** Functions may have rate limits to prevent abuse
2. **Timeout:** Functions timeout after 60 seconds
3. **CORS:** Functions accept requests from any origin (configure if needed)
4. **Idempotency:** Payment functions use idempotency keys to prevent duplicates
5. **Guest Orders:** Payment functions support guest checkout with email

---

**Next:** See [MOBILE_APP_INTEGRATION.md](./MOBILE_APP_INTEGRATION.md) for complete mobile app integration guide with code examples!

