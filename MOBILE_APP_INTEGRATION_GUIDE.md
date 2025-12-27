# Mobile App Integration Guide

This guide is for mobile app developers integrating with the IK Marketplace backend via Firebase Cloud Functions.

**Base URL Pattern:** `https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net`

**Important:** Replace `YOUR_REGION` and `YOUR_PROJECT_ID` with your actual Firebase project details.

---

## Table of Contents

1. [Authentication](#authentication)
2. [API Structure](#api-structure)
3. [Northern Products (New Features)](#northern-products-new-features)
4. [Order Management](#order-management)
5. [Earnings & Payouts](#earnings--payouts)
6. [Shipping & Delivery](#shipping--delivery)
7. [Parks System](#parks-system)
8. [Order Availability System](#order-availability-system)
9. [Code Examples](#code-examples)
10. [Error Handling](#error-handling)

---

## Authentication

All endpoints (except public ones) require Firebase Authentication. Include the ID token in the Authorization header:

```
Authorization: Bearer <firebase_id_token>
```

### Getting Firebase ID Token (React Native)

```javascript
import auth from '@react-native-firebase/auth';

const getAuthToken = async () => {
  const user = auth().currentUser;
  if (user) {
    const token = await user.getIdToken();
    return token;
  }
  throw new Error('User not authenticated');
};
```

### Getting Firebase ID Token (Flutter)

```dart
import 'package:firebase_auth/firebase_auth.dart';

Future<String?> getAuthToken() async {
  final user = FirebaseAuth.instance.currentUser;
  if (user != null) {
    return await user.getIdToken();
  }
  return null;
}
```

---

## API Structure

### Request Format

All POST requests should include:
- `Content-Type: application/json`
- `Authorization: Bearer <token>` (for authenticated endpoints)

### Response Format

Success responses:
```json
{
  "success": true,
  "data": { ... }
}
```

Error responses:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

HTTP Status Codes:
- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Northern Products (New Features)

The platform now supports Northern Nigerian-specific products with category-specific fields.

### Supported Categories

1. **Fragrance** (`fragrance`)
2. **Fashion** (`fashion`)
3. **Snacks** (`snacks`)
4. **Materials** (`materials`)
5. **Skincare** (`skincare`)
6. **Haircare** (`haircare`)
7. **Islamic Products** (`islamic`)
8. **Electronics** (`electronics`)

### Create Northern Product

**URL:** `POST /createNorthernProduct`

**Authentication:** Required (Seller)

**Request Body Structure:**

All products require:
- `name` (string, required)
- `price` (number, required)
- `category` (enum, required)
- `stock` (number, required)
- `status` (enum: "active" | "draft" | "inactive")
- `description` (string, optional)
- `compareAtPrice` (number, optional)
- `imageUrls` (array of strings, optional)
- `videoUrl` (string, optional)
- `audioDescription` (string, optional)

**Delivery Settings (All Categories):**
```json
{
  "deliveryFeePaidBy": "buyer", // or "seller"
  "deliveryMethods": {
    "localDispatch": { "enabled": true },
    "waybill": { "enabled": true },
    "pickup": { 
      "enabled": true,
      "landmark": "Shop address or landmark"
    }
  }
}
```

#### Fragrance Products

```json
{
  "name": "Premium Perfume",
  "price": 15000,
  "category": "fragrance",
  "stock": 50,
  "status": "active",
  "volume": "100ml",
  "fragranceType": "Eau de Parfum",
  "container": "Glass Bottle",
  "imageUrls": ["https://..."],
  "deliveryFeePaidBy": "buyer",
  "deliveryMethods": {
    "localDispatch": { "enabled": true },
    "waybill": { "enabled": true },
    "pickup": { "enabled": true }
  }
}
```

#### Fashion Products

```json
{
  "name": "Abaya Set",
  "price": 25000,
  "category": "fashion",
  "stock": 30,
  "status": "active",
  "sizeType": "standard", // or "custom"
  "abayaLength": "ankle-length",
  "standardSize": "M",
  "setIncludes": "Abaya, Hijab, Underdress",
  "material": "Cotton",
  "imageUrls": ["https://..."]
}
```

#### Snacks Products

```json
{
  "name": "Local Snacks Pack",
  "price": 5000,
  "category": "snacks",
  "stock": 100,
  "status": "active",
  "packaging": "Plastic Container",
  "quantity": 10,
  "taste": "Sweet"
}
```

#### Materials Products

```json
{
  "name": "Premium Fabric",
  "price": 12000,
  "category": "materials",
  "stock": 50,
  "status": "active",
  "materialType": "custom", // "shadda", "atiku", "cotton", "silk", "linen", "custom"
  "customMaterialType": "Special Blend", // Required if materialType is "custom"
  "fabricLength": "6 yards",
  "quality": "Premium" // Based on yards, not stock
}
```

#### Skincare Products

```json
{
  "name": "Face Cream",
  "price": 8000,
  "category": "skincare",
  "stock": 40,
  "status": "active",
  "skincareBrand": "Brand Name",
  "skincareType": "Moisturizer",
  "skincareSize": "Large"
}
```

#### Haircare Products

**Regular Haircare:**
```json
{
  "name": "Hair Oil",
  "price": 6000,
  "category": "haircare",
  "stock": 60,
  "status": "active",
  "haircareType": "oil",
  "haircareBrand": "Brand Name",
  "haircareSize": "Large"
}
```

**Package Deal (Multiple Items):**
```json
{
  "name": "Hair Care Package",
  "price": 15000,
  "category": "haircare",
  "stock": 30,
  "status": "active",
  "haircareType": "package-deal",
  "haircareBrand": "Brand Name",
  "haircareSize": "Large",
  "haircarePackageItems": ["Oil", "Shampoo", "Conditioner", "Treatment"]
}
```

#### Islamic Products

```json
{
  "name": "Prayer Rug",
  "price": 5000,
  "category": "islamic",
  "stock": 50,
  "status": "active",
  "islamicType": "Prayer Rug",
  "islamicSize": "Standard",
  "islamicMaterial": "Wool"
}
```

#### Electronics Products

```json
{
  "name": "Smartphone",
  "price": 50000,
  "category": "electronics",
  "stock": 20,
  "status": "active",
  "brand": "Brand Name",
  "model": "Model XYZ"
}
```

**Response:**
```json
{
  "success": true,
  "productId": "product123",
  "shareLink": "https://your-app.com/product/product123"
}
```

### Update Northern Product

**URL:** `POST /updateNorthernProduct`

**Authentication:** Required (Seller/Owner)

Supports partial updates. Only include fields you want to change.

**Example:**
```json
{
  "productId": "product123",
  "price": 16000,
  "stock": 45,
  "haircarePackageItems": ["Oil", "Shampoo", "Conditioner", "Treatment", "Mask"]
}
```

---

## Order Management

### Verify Payment and Create Order

**URL:** `POST /verifyPaymentAndCreateOrder`

**Authentication:** Required (Buyer)

**Important:** This endpoint handles both paid orders and free orders (₦0 total). For free orders, use `"FREE_"` prefix in paymentReference.

**Request Body:**
```json
{
  "paymentReference": "FREE_1234567890", // For free orders, or Paystack reference for paid
  "cartItems": [
    {
      "productId": "product123",
      "quantity": 2,
      "price": 5000,
      "name": "Product Name"
    }
  ],
  "total": 10000, // Can be 0 for 100% discount
  "deliveryAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "address": "123 Main St",
    "state": "Kano",
    "city": "Kano",
    "email": "john@example.com",
    "phone": "+2341234567890"
  },
  "shippingType": "waybill", // "delivery", "pickup", "waybill", "contact"
  "shippingPrice": 1000,
  "deliveryFeePaidBy": "buyer", // or "seller"
  "discountCode": "WELCOME10", // optional
  "idempotencyKey": "unique-key-per-order-attempt"
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "order123",
  "message": "Order created successfully"
}
```

### Mark Order as Sent

**URL:** `POST /markOrderAsSent`

**Authentication:** Required (Seller/Owner)

For **waybill orders**, include park information:

```json
{
  "orderId": "order123",
  "photoUrl": "https://storage.googleapis.com/...",
  "waybillParkId": "park123", // Required for waybill orders
  "waybillParkName": "Naibawa Park" // Required for waybill orders
}
```

For **regular orders**:
```json
{
  "orderId": "order123",
  "photoUrl": "https://storage.googleapis.com/..."
}
```

### Mark Order as Received

**URL:** `POST /markOrderAsReceived`

**Authentication:** Required (Buyer/Owner)

```json
{
  "orderId": "order123"
}
```

---

## Order Availability System

For food/snacks sellers when items are not immediately available.

### Mark Order as Not Available

**URL:** `POST /markOrderAsNotAvailable`

**Authentication:** Required (Seller/Owner)

**Request Body:**
```json
{
  "orderId": "order123",
  "reason": "Item sold out locally, need to restock",
  "waitTimeDays": 3 // Optional: offer wait time in days
}
```

**Response:**
```json
{
  "success": true
}
```

If `waitTimeDays` is provided, the order status changes to `AvailabilityCheck` and the buyer can either accept the wait or cancel for a refund.

### Respond to Availability Check

**URL:** `POST /respondToAvailabilityCheck`

**Authentication:** Required (Buyer/Owner)

**Request Body:**
```json
{
  "orderId": "order123",
  "response": "accepted" // or "cancelled"
}
```

**Response (Accepted):**
```json
{
  "success": true,
  "action": "accepted"
}
```

**Response (Cancelled - Automatic Refund):**
```json
{
  "success": true,
  "action": "cancelled",
  "refundAmount": 10000
}
```

---

## Earnings & Payouts

### Calculate Seller Earnings

**URL:** `POST /calculateSellerEarnings`

**Authentication:** Required (Seller/Owner)

**Request Body:**
```json
{
  "sellerId": "seller123"
}
```

**Response:**
```json
{
  "success": true,
  "earnings": {
    "totalEarnings": 500000,
    "pendingPayout": 200000,
    "availableBalance": 300000,
    "totalCommission": 25000,
    "totalOrders": 50
  }
}
```

### Get Seller Transactions

**URL:** `GET /getSellerTransactions?sellerId=xxx&limit=50`  
**Or:** `POST /getSellerTransactions`

**Authentication:** Required (Seller/Owner)

**Query Parameters:**
- `sellerId` (required)
- `limit` (optional, default: 50)
- `startAfter` (optional, for pagination)

**Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": "txn123",
      "type": "sale", // or "refund", "payout"
      "amount": 10000,
      "orderId": "order123",
      "createdAt": { "_seconds": 1234567890, "_nanoseconds": 0 },
      "status": "completed"
    }
  ]
}
```

### Request Payout

**URL:** `POST /requestPayout`

**Authentication:** Required (Seller/Owner)

**Request Body:**
```json
{
  "sellerId": "seller123",
  "amount": 50000
}
```

**Note:** The seller must have payout details (bank account) configured first. Amount must be >= minimum payout amount.

### Cancel Payout Request

**URL:** `POST /cancelPayoutRequest`

**Authentication:** Required (Seller/Owner)

**Request Body:**
```json
{
  "payoutId": "payout123"
}
```

**Note:** Can only cancel if status is "pending".

---

## Shipping & Delivery

### Get Public Shipping Zones

**URL:** `GET /getPublicShippingZones?sellerId=xxx`  
**Or:** `POST /getPublicShippingZones`

**Authentication:** Not Required (Public)

Used for calculating shipping costs during checkout.

**Response:**
```json
{
  "success": true,
  "zones": [
    {
      "id": "zone123",
      "sellerId": "seller123",
      "name": "Lagos Delivery",
      "rate": 2000,
      "states": ["Lagos"],
      "freeThreshold": 10000
    }
  ]
}
```

### Create Shipping Zone

**URL:** `POST /createShippingZone`

**Authentication:** Required (Seller/Owner)

**Request Body:**
```json
{
  "sellerId": "seller123",
  "name": "Kano Delivery",
  "rate": 1500,
  "states": ["Kano"],
  "freeThreshold": 10000 // Optional: free shipping above this amount
}
```

### Update Shipping Zone

**URL:** `POST /updateShippingZone`

**Authentication:** Required (Seller/Owner)

**Request Body:**
```json
{
  "sellerId": "seller123",
  "zoneId": "zone123",
  "name": "Updated Zone Name",
  "rate": 1800,
  "states": ["Kano", "Kaduna"],
  "freeThreshold": 15000
}
```

### Delete Shipping Zone

**URL:** `POST /deleteShippingZone`

**Authentication:** Required (Seller/Owner)

**Request Body:**
```json
{
  "sellerId": "seller123",
  "zoneId": "zone123"
}
```

---

## Parks System

Parks are used for waybill (inter-state) deliveries. Sellers select which park they sent items from.

### Get All Parks

**URL:** `GET /getAllParks`  
**Or:** `POST /getAllParks`

**Authentication:** Not Required (Public)

**Response:**
```json
{
  "success": true,
  "parks": [
    {
      "id": "park123",
      "name": "Naibawa Park",
      "city": "Kano",
      "state": "Kano",
      "isActive": true
    }
  ]
}
```

### Get Parks by State

**URL:** `GET /getParksByState?state=Kano`  
**Or:** `POST /getParksByState`

**Authentication:** Not Required (Public)

**Request Body (POST):**
```json
{
  "state": "Kano"
}
```

**Use Case:** When marking a waybill order as sent, filter parks by the customer's delivery state.

---

## Code Examples

### React Native Example

```javascript
import axios from 'axios';

const CLOUD_FUNCTIONS_BASE = 'https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net';

// Get auth token
const getAuthToken = async () => {
  const user = auth().currentUser;
  if (!user) throw new Error('Not authenticated');
  return await user.getIdToken();
};

// Create Northern Product
const createNorthernProduct = async (productData) => {
  try {
    const token = await getAuthToken();
    const response = await axios.post(
      `${CLOUD_FUNCTIONS_BASE}/createNorthernProduct`,
      productData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating product:', error.response?.data || error.message);
    throw error;
  }
};

// Mark Order as Sent (with Park)
const markOrderAsSent = async (orderId, photoUrl, parkId, parkName) => {
  try {
    const token = await getAuthToken();
    const response = await axios.post(
      `${CLOUD_FUNCTIONS_BASE}/markOrderAsSent`,
      {
        orderId,
        photoUrl,
        waybillParkId: parkId,
        waybillParkName: parkName
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error marking order as sent:', error.response?.data || error.message);
    throw error;
  }
};

// Get Seller Earnings
const getSellerEarnings = async (sellerId) => {
  try {
    const token = await getAuthToken();
    const response = await axios.post(
      `${CLOUD_FUNCTIONS_BASE}/calculateSellerEarnings`,
      { sellerId },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data.earnings;
  } catch (error) {
    console.error('Error getting earnings:', error.response?.data || error.message);
    throw error;
  }
};

// Mark Order as Not Available
const markOrderNotAvailable = async (orderId, reason, waitTimeDays) => {
  try {
    const token = await getAuthToken();
    const response = await axios.post(
      `${CLOUD_FUNCTIONS_BASE}/markOrderAsNotAvailable`,
      {
        orderId,
        reason,
        waitTimeDays: waitTimeDays || undefined
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error marking order as not available:', error.response?.data || error.message);
    throw error;
  }
};

// Get Parks by State
const getParksByState = async (state) => {
  try {
    const response = await axios.get(
      `${CLOUD_FUNCTIONS_BASE}/getParksByState`,
      {
        params: { state },
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.parks;
  } catch (error) {
    console.error('Error getting parks:', error.response?.data || error.message);
    throw error;
  }
};
```

### Flutter Example

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:firebase_auth/firebase_auth.dart';

final String cloudFunctionsBase = 'https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net';

// Get auth token
Future<String?> getAuthToken() async {
  final user = FirebaseAuth.instance.currentUser;
  if (user != null) {
    return await user.getIdToken();
  }
  return null;
}

// Create Northern Product
Future<Map<String, dynamic>> createNorthernProduct(Map<String, dynamic> productData) async {
  final token = await getAuthToken();
  if (token == null) throw Exception('Not authenticated');

  final response = await http.post(
    Uri.parse('$cloudFunctionsBase/createNorthernProduct'),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    },
    body: jsonEncode(productData),
  );

  if (response.statusCode == 200) {
    return jsonDecode(response.body);
  } else {
    throw Exception('Failed to create product: ${response.body}');
  }
}

// Mark Order as Sent (with Park)
Future<Map<String, dynamic>> markOrderAsSent(
  String orderId,
  String photoUrl,
  String? parkId,
  String? parkName,
) async {
  final token = await getAuthToken();
  if (token == null) throw Exception('Not authenticated');

  final body = {
    'orderId': orderId,
    'photoUrl': photoUrl,
    if (parkId != null) 'waybillParkId': parkId,
    if (parkName != null) 'waybillParkName': parkName,
  };

  final response = await http.post(
    Uri.parse('$cloudFunctionsBase/markOrderAsSent'),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    },
    body: jsonEncode(body),
  );

  if (response.statusCode == 200) {
    return jsonDecode(response.body);
  } else {
    throw Exception('Failed to mark order as sent: ${response.body}');
  }
}

// Get Seller Earnings
Future<Map<String, dynamic>> getSellerEarnings(String sellerId) async {
  final token = await getAuthToken();
  if (token == null) throw Exception('Not authenticated');

  final response = await http.post(
    Uri.parse('$cloudFunctionsBase/calculateSellerEarnings'),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    },
    body: jsonEncode({'sellerId': sellerId}),
  );

  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    return data['earnings'];
  } else {
    throw Exception('Failed to get earnings: ${response.body}');
  }
}

// Get Parks by State
Future<List<dynamic>> getParksByState(String state) async {
  final response = await http.get(
    Uri.parse('$cloudFunctionsBase/getParksByState?state=$state'),
    headers: {
      'Content-Type': 'application/json',
    },
  );

  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    return data['parks'];
  } else {
    throw Exception('Failed to get parks: ${response.body}');
  }
}
```

---

## Error Handling

### Standard Error Response

```json
{
  "error": "Error message here",
  "code": "ERROR_CODE" // Optional
}
```

### Common Error Codes

- `UNAUTHORIZED` - Missing or invalid authentication token
- `FORBIDDEN` - Insufficient permissions
- `VALIDATION_ERROR` - Invalid request data
- `NOT_FOUND` - Resource not found
- `INSUFFICIENT_STOCK` - Not enough stock available
- `INVALID_PAYMENT` - Payment verification failed
- `DUPLICATE_ORDER` - Order with same idempotency key already exists

### Error Handling Example (React Native)

```javascript
const handleApiCall = async (apiFunction) => {
  try {
    const result = await apiFunction();
    return { success: true, data: result };
  } catch (error) {
    if (error.response) {
      // Server responded with error
      const errorData = error.response.data;
      return {
        success: false,
        error: errorData.error || 'An error occurred',
        code: errorData.code,
        status: error.response.status
      };
    } else if (error.request) {
      // Request made but no response
      return {
        success: false,
        error: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR'
      };
    } else {
      // Error in request setup
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR'
      };
    }
  }
};

// Usage
const result = await handleApiCall(() => createNorthernProduct(productData));
if (!result.success) {
  Alert.alert('Error', result.error);
}
```

---

## Important Notes

### 1. Free Orders (₦0 Total)

When creating an order with a 100% discount code resulting in ₦0 total:
- Use `"FREE_"` prefix in `paymentReference`: `"FREE_1234567890"`
- Set `total: 0`
- The payment gateway is automatically skipped

### 2. Delivery Fee Payment

Products can specify who pays delivery fees:
- `"buyer"` - Buyer pays delivery fee (added to checkout total)
- `"seller"` - Seller pays delivery fee (no charge to buyer)

Check `deliveryFeePaidBy` field when calculating shipping costs.

### 3. Waybill Orders with Parks

When marking a waybill order as sent:
1. Get parks for customer's state: `GET /getParksByState?state=Kano`
2. Seller selects park from list (or "None")
3. Include `waybillParkId` and `waybillParkName` when calling `markOrderAsSent`

### 4. Order Availability System

For food/snacks sellers:
- Mark order as not available if item is sold out
- Optionally offer wait time (e.g., 3 days)
- Buyer can accept wait or cancel for automatic refund
- System automatically processes refunds when buyer cancels

### 5. Category-Specific Fields

Each Northern product category has required fields. See the category examples above. Missing required fields will result in validation errors.

### 6. Idempotency Keys

Always use unique `idempotencyKey` when creating orders to prevent duplicate orders if the request is retried.

### 7. Image Upload

For product/store images, upload to Firebase Storage first, then pass the public URL in `imageUrls` array. Base64 upload is supported but not recommended for large images.

---

## Testing

### Test Endpoints

Use Firebase Console or tools like Postman to test endpoints before mobile integration.

### Test Data

Create test products with minimal required fields first, then add optional fields incrementally.

---

## Support

For issues or questions:
1. Check error messages and status codes
2. Verify authentication token is valid
3. Ensure all required fields are included
4. Check Firebase Console logs for server-side errors

---

## Changelog

### Latest Updates

- ✅ Added Northern product categories with category-specific fields
- ✅ Added delivery fee payment options (buyer/seller pays)
- ✅ Added parks system for waybill deliveries
- ✅ Added order availability system for food/snacks sellers
- ✅ Added free order support (₦0 total, skips payment)
- ✅ Enhanced order management with park selection
- ✅ Added comprehensive earnings and payout endpoints

---

**Last Updated:** January 2025

