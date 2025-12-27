# Cloud Functions API Documentation

This document lists all available Firebase Cloud Functions with their URLs, authentication requirements, request/response formats, and usage examples.



## Table of Contents

1. [Payment & Orders](#payment--orders)
2. [Products](#products)
3. [Northern Products](#northern-products)
4. [Seller Functions](#seller-functions)
5. [Admin Functions](#admin-functions)
6. [Order Management](#order-management)
7. [Shipping & Delivery](#shipping--delivery)
8. [Parks Management](#parks-management)
9. [Earnings & Payouts](#earnings--payouts)
10. [Order Availability](#order-availability)

---

## Payment & Orders

### verifyPaymentAndCreateOrder
**URL:** `POST /verifyPaymentAndCreateOrder`  
**Auth:** Required  
**Description:** Verifies Paystack payment and creates order. Handles free orders (₦0 total) by skipping payment verification.

**Request Body:**
```json
{
  "paymentReference": "FREE_1234567890", // or Paystack reference
  "cartItems": [
    {
      "productId": "product123",
      "quantity": 2,
      "price": 5000
    }
  ],
  "total": 10000,
  "deliveryAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "address": "123 Main St",
    "state": "Lagos",
    "email": "john@example.com",
    "phone": "+2341234567890"
  },
  "shippingType": "delivery",
  "shippingPrice": 1000,
  "deliveryFeePaidBy": "buyer", // or "seller"
  "discountCode": "WELCOME10",
  "idempotencyKey": "unique-key-123"
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

---

## Products

### createProduct
**URL:** `POST /createProduct`  
**Auth:** Required (Seller)  
**Description:** Create a new product with base64 image upload.

**Request Body:**
```json
{
  "name": "Product Name",
  "description": "Product description",
  "price": 5000,
  "compareAtPrice": 6000,
  "stock": 100,
  "sku": "SKU123",
  "category": "electronics",
  "status": "active",
  "allowShipping": true,
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQ...",
  "variants": [
    {
      "name": "Size",
      "options": [
        {
          "value": "Small",
          "priceModifier": 0,
          "stock": 50,
          "sku": "SKU123-S"
        }
      ]
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "productId": "product123",
  "product": { ... }
}
```

### updateProduct
**URL:** `POST /updateProduct`  
**Auth:** Required (Seller/Owner)  
**Description:** Update an existing product.

**Request Body:**
```json
{
  "productId": "product123",
  "name": "Updated Name",
  "price": 5500,
  "stock": 90,
  "imageBase64": "data:image/jpeg;base64,..."
}
```

### deleteProduct
**URL:** `POST /deleteProduct`  
**Auth:** Required (Seller/Owner)  
**Description:** Delete a product.

**Request Body:**
```json
{
  "productId": "product123"
}
```

---

## Northern Products

### createNorthernProduct
**URL:** `POST /createNorthernProduct`  
**Auth:** Required (Seller)  
**Description:** Create a Northern-specific product with category-specific fields. Supports: Fragrance, Fashion, Snacks, Materials, Skincare, Haircare, Islamic, Electronics.

**Request Body (Fragrance Example):**
```json
{
  "name": "Premium Perfume",
  "description": "Long-lasting fragrance",
  "price": 15000,
  "compareAtPrice": 18000,
  "stock": 50,
  "category": "fragrance",
  "status": "active",
  "imageUrls": ["https://..."],
  "videoUrl": "https://...",
  "audioDescription": "https://...",
  "volume": "100ml",
  "fragranceType": "Eau de Parfum",
  "container": "Glass Bottle",
  "deliveryFeePaidBy": "buyer",
  "deliveryMethods": {
    "localDispatch": { "enabled": true },
    "waybill": { "enabled": true },
    "pickup": { "enabled": true, "landmark": "Shop Address" }
  }
}
```

**Request Body (Fashion Example):**
```json
{
  "name": "Abaya Set",
  "category": "fashion",
  "sizeType": "standard",
  "abayaLength": "ankle-length",
  "standardSize": "M",
  "setIncludes": "Abaya, Hijab, Underdress",
  "material": "Cotton",
  ...
}
```

**Request Body (Haircare Package Deal Example):**
```json
{
  "name": "Hair Care Package",
  "category": "haircare",
  "haircareType": "package-deal",
  "haircareBrand": "Brand Name",
  "haircareSize": "Large",
  "haircarePackageItems": ["Oil", "Shampoo", "Conditioner"],
  ...
}
```

**Request Body (Materials with Custom Type Example):**
```json
{
  "name": "Custom Fabric",
  "category": "materials",
  "materialType": "custom",
  "customMaterialType": "Special Blend",
  "fabricLength": "6 yards",
  "quality": "Premium",
  ...
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

### updateNorthernProduct
**URL:** `POST /updateNorthernProduct`  
**Auth:** Required (Seller/Owner)  
**Description:** Update a Northern product. Supports partial updates.

**Request Body:**
```json
{
  "productId": "product123",
  "price": 16000,
  "stock": 45,
  "haircarePackageItems": ["Oil", "Shampoo", "Conditioner", "Treatment"]
}
```

---

## Seller Functions

### getDashboardStats
**URL:** `GET /getDashboardStats?sellerId=xxx` or `POST /getDashboardStats`  
**Auth:** Required (Seller/Owner)  
**Description:** Get seller dashboard statistics.

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalRevenue": 500000,
    "totalOrders": 50,
    "totalProducts": 25,
    "totalCustomers": 30,
    "averageOrderValue": 10000,
    "lowStockProducts": 3,
    "recentOrders": [...]
  }
}
```

### getSellerAnalytics
**URL:** `GET /getSellerAnalytics?sellerId=xxx&days=30` or `POST /getSellerAnalytics`  
**Auth:** Required (Seller/Owner)  
**Description:** Get analytics data for a date range.

**Response:**
```json
{
  "success": true,
  "analytics": {
    "dailyData": [
      { "date": "2025-01-01", "revenue": 50000, "orders": 5 }
    ],
    "productPerformance": [...],
    "totalRevenue": 500000,
    "totalOrders": 50
  }
}
```

### generateSalesReport
**URL:** `POST /generateSalesReport`  
**Auth:** Required (Seller/Owner)  
**Description:** Generate a sales report.

**Request Body:**
```json
{
  "sellerId": "seller123",
  "days": 30
}
```

### generateCustomerReport
**URL:** `POST /generateCustomerReport`  
**Auth:** Required (Seller/Owner)  
**Description:** Generate a customer report.

---

## Discount Codes

### createDiscountCode
**URL:** `POST /createDiscountCode`  
**Auth:** Required (Seller/Owner)  
**Description:** Create a discount code.

**Request Body:**
```json
{
  "code": "WELCOME10",
  "type": "percentage", // or "fixed"
  "value": 10, // 10% or ₦10
  "maxUses": 100,
  "minOrderAmount": 5000,
  "validFrom": "2025-01-01T00:00:00Z",
  "validUntil": "2025-12-31T23:59:59Z",
  "sellerId": "seller123"
}
```

### getDiscountCodes
**URL:** `GET /getDiscountCodes?sellerId=xxx` or `POST /getDiscountCodes`  
**Auth:** Required (Seller/Owner)

### updateDiscountCode
**URL:** `POST /updateDiscountCode`  
**Auth:** Required (Seller/Owner)

### deleteDiscountCode
**URL:** `POST /deleteDiscountCode`  
**Auth:** Required (Seller/Owner)

---

## Store Management

### getStoreSettings
**URL:** `GET /getStoreSettings?sellerId=xxx` or `POST /getStoreSettings`  
**Auth:** Required (Seller/Owner)

### updateStoreSettings
**URL:** `POST /updateStoreSettings`  
**Auth:** Required (Seller/Owner)  
**Description:** Update store settings with optional logo/banner upload.

**Request Body:**
```json
{
  "sellerId": "seller123",
  "updateData": {
    "storeName": "My Store",
    "storeDescription": "Description",
    "logoBase64": "data:image/jpeg;base64,...",
    "bannerBase64": "data:image/jpeg;base64,..."
  }
}
```

### getCustomers
**URL:** `GET /getCustomers?sellerId=xxx` or `POST /getCustomers`  
**Auth:** Required (Seller/Owner)  
**Description:** Get customer list with segmentation.

---

## Admin Functions

### getAllUsers
**URL:** `GET /getAllUsers?limit=50&role=seller&startAfter=xxx` or `POST /getAllUsers`  
**Auth:** Required (Admin)

### grantAdminRole
**URL:** `POST /grantAdminRole`  
**Auth:** Required (Admin)  
**Request Body:**
```json
{
  "userId": "user123"
}
```

### revokeAdminRole
**URL:** `POST /revokeAdminRole`  
**Auth:** Required (Admin)

### getPlatformSettings
**URL:** `GET /getPlatformSettings` or `POST /getPlatformSettings`  
**Auth:** Required (Admin)

### updatePlatformSettings
**URL:** `POST /updatePlatformSettings`  
**Auth:** Required (Admin)  
**Request Body:**
```json
{
  "settings": {
    "platformCommissionRate": 0.05,
    "minimumPayoutAmount": 5000,
    "payoutProcessingDays": 7
  }
}
```

### getAllOrders
**URL:** `GET /getAllOrders?limit=50&status=Processing&startAfter=xxx` or `POST /getAllOrders`  
**Auth:** Required (Admin)

### resolveDispute
**URL:** `POST /resolveDispute`  
**Auth:** Required (Admin)  
**Request Body:**
```json
{
  "orderId": "order123",
  "resolution": "refund", // or "release"
  "refundAmount": 10000
}
```

### getAllPayouts
**URL:** `GET /getAllPayouts?limit=50&status=pending` or `POST /getAllPayouts`  
**Auth:** Required (Admin)

### processPayout
**URL:** `POST /processPayout`  
**Auth:** Required (Admin)  
**Request Body:**
```json
{
  "payoutId": "payout123"
}
```

---

## Order Management

### markOrderAsSent
**URL:** `POST /markOrderAsSent`  
**Auth:** Required (Seller/Owner)  
**Description:** Mark order as sent. For waybill orders, include park information.

**Request Body (Regular Order):**
```json
{
  "orderId": "order123",
  "photoUrl": "https://..."
}
```

**Request Body (Waybill Order with Park):**
```json
{
  "orderId": "order123",
  "photoUrl": "https://...",
  "waybillParkId": "park123",
  "waybillParkName": "Naibawa Park"
}
```

### markOrderAsReceived
**URL:** `POST /markOrderAsReceived`  
**Auth:** Required (Customer/Owner)

### markOrderAsNotAvailable
**URL:** `POST /markOrderAsNotAvailable`  
**Auth:** Required (Seller/Owner)  
**Description:** Mark order as not available (for food/snacks sellers).

**Request Body:**
```json
{
  "orderId": "order123",
  "reason": "Item sold out locally",
  "waitTimeDays": 3 // Optional: offer wait time
}
```

### respondToAvailabilityCheck
**URL:** `POST /respondToAvailabilityCheck`  
**Auth:** Required (Customer/Owner)  
**Description:** Buyer responds to availability check (accept wait or cancel for refund).

**Request Body:**
```json
{
  "orderId": "order123",
  "response": "accepted" // or "cancelled"
}
```

---

## Shipping & Delivery

### getPublicShippingZones
**URL:** `GET /getPublicShippingZones?sellerId=xxx` or `POST /getPublicShippingZones`  
**Auth:** Not Required (Public)  
**Description:** Get shipping zones for checkout calculation.

### getShippingZones
**URL:** `GET /getShippingZones?sellerId=xxx` or `POST /getShippingZones`  
**Auth:** Required (Seller/Owner)

### createShippingZone
**URL:** `POST /createShippingZone`  
**Auth:** Required (Seller/Owner)  
**Request Body:**
```json
{
  "sellerId": "seller123",
  "name": "Lagos Delivery",
  "rate": 2000,
  "states": ["Lagos"],
  "freeThreshold": 10000
}
```

### updateShippingZone
**URL:** `POST /updateShippingZone`  
**Auth:** Required (Seller/Owner)

### deleteShippingZone
**URL:** `POST /deleteShippingZone`  
**Auth:** Required (Seller/Owner)

### getShippingSettings
**URL:** `GET /getShippingSettings?sellerId=xxx` or `POST /getShippingSettings`  
**Auth:** Required (Seller/Owner)

### updateShippingSettings
**URL:** `POST /updateShippingSettings`  
**Auth:** Required (Seller/Owner)  
**Request Body:**
```json
{
  "sellerId": "seller123",
  "defaultPackagingType": "box",
  "packagingCost": 500
}
```

---

## Parks Management

### getAllParks
**URL:** `GET /getAllParks` or `POST /getAllParks`  
**Auth:** Not Required (Public)  
**Description:** Get all waybill parks.

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

### getParksByState
**URL:** `GET /getParksByState?state=Kano` or `POST /getParksByState`  
**Auth:** Not Required (Public)  
**Description:** Get parks filtered by state.

### createPark
**URL:** `POST /createPark`  
**Auth:** Required (Admin)  
**Request Body:**
```json
{
  "name": "New Park",
  "city": "Kano",
  "state": "Kano",
  "isActive": true
}
```

### updatePark
**URL:** `POST /updatePark`  
**Auth:** Required (Admin)

### deletePark
**URL:** `POST /deletePark`  
**Auth:** Required (Admin)

### initializeParks
**URL:** `POST /initializeParks`  
**Auth:** Required (Admin)  
**Description:** One-time initialization of default Northern parks. Returns error if parks already exist.

---

## Earnings & Payouts

### calculateSellerEarnings
**URL:** `POST /calculateSellerEarnings`  
**Auth:** Required (Seller/Owner)  
**Description:** Calculate seller earnings from completed orders.

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

### getSellerTransactions
**URL:** `GET /getSellerTransactions?sellerId=xxx&limit=50` or `POST /getSellerTransactions`  
**Auth:** Required (Seller/Owner)  
**Description:** Get transaction history.

### requestPayout
**URL:** `POST /requestPayout`  
**Auth:** Required (Seller/Owner)  
**Request Body:**
```json
{
  "sellerId": "seller123",
  "amount": 50000
}
```

### cancelPayoutRequest
**URL:** `POST /cancelPayoutRequest`  
**Auth:** Required (Seller/Owner)  
**Request Body:**
```json
{
  "payoutId": "payout123"
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE" // Optional
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (validation error, missing required fields)
- `401` - Unauthorized (missing or invalid auth token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Usage Examples

### Example: Create Northern Product (Mobile App)

```javascript
// React Native / Flutter example
const createProduct = async (productData, authToken) => {
  const response = await fetch(
    'https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/createNorthernProduct',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(productData)
    }
  );
  
  const result = await response.json();
  return result;
};
```

### Example: Mark Order as Sent with Park

```javascript
const markAsSent = async (orderId, parkId, parkName, authToken) => {
  const response = await fetch(
    'https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/markOrderAsSent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        orderId,
        waybillParkId: parkId,
        waybillParkName: parkName
      })
    }
  );
  
  return await response.json();
};
```

### Example: Get Seller Earnings

```javascript
const getEarnings = async (sellerId, authToken) => {
  const response = await fetch(
    'https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/calculateSellerEarnings',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ sellerId })
    }
  );
  
  return await response.json();
};
```

---

## Notes

1. **Free Orders (₦0 Total):** The `verifyPaymentAndCreateOrder` function automatically handles free orders by skipping Paystack verification when `total <= 0`.

2. **Idempotency:** Always include a unique `idempotencyKey` when creating orders to prevent duplicates.

3. **Image Upload:** For product/store images, use base64 encoding. The functions handle upload to Firebase Storage automatically.

4. **Category-Specific Fields:** Northern products require different fields based on category. See `createNorthernProduct` examples above.

5. **Parks System:** Waybill orders can be linked to parks when marking as sent. Use `getParksByState` to get available parks for a customer's state.

6. **Availability System:** Food/snacks sellers can mark orders as "not available" and offer wait times. Buyers can accept or cancel for automatic refund.

---

## Deployment

After making changes to Cloud Functions, deploy with:

```bash
firebase deploy --only functions
```

To deploy a specific function:

```bash
firebase deploy --only functions:createNorthernProduct
```

