# 🛍️ Seller Cloud Functions - Complete Guide

**Complete API reference for all Seller functions in your mobile app.**

## 📍 Base Information
- **Region:** `us-central1`
- **Project:** `ikm-marketplace`
- **All functions require authentication** (Firebase ID token)

---

## 🔐 Authentication

All seller functions require authentication. Include Firebase ID token in header:

```typescript
headers: {
  'Authorization': `Bearer ${firebaseIdToken}`,
  'Content-Type': 'application/json'
}
```

**How to get Firebase ID token (React Native):**
```typescript
import auth from '@react-native-firebase/auth';

const user = auth().currentUser;
const idToken = await user.getIdToken();
```

---

## 📦 PRODUCT MANAGEMENT

### 1. `getSellerProducts`
**Get paginated list of seller's products**

- **URL:** `https://getsellerproducts-q3rjv54uka-uc.a.run.app`
- **Method:** `GET` or `POST`
- **Auth:** Required (seller)

**Request:**
```json
{
  "sellerId": "optional-if-same-as-auth",
  "limit": 50,
  "startAfter": "product-id-for-pagination",
  "status": "active"
}
```

**Response:**
```json
{
  "success": true,
  "products": [
    {
      "id": "product-id",
      "name": "Product Name",
      "price": 5000,
      "stock": 10,
      "imageUrl": "https://...",
      "status": "active",
      "createdAt": "..."
    }
  ],
  "hasMore": true
}
```

**Mobile App Usage:**
```typescript
const response = await fetch('https://getsellerproducts-q3rjv54uka-uc.a.run.app', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    limit: 20,
    status: 'active'
  })
});
const data = await response.json();
console.log(data.products);
```

---

### 2. `getProduct`
**Get single product details**

- **URL:** `https://getproduct-q3rjv54uka-uc.a.run.app`
- **Method:** `GET` or `POST`
- **Auth:** Not required (public)

**Request:**
```json
{
  "productId": "product-id-123"
}
```

**Response:**
```json
{
  "success": true,
  "product": {
    "id": "product-id",
    "name": "Product Name",
    "price": 5000,
    "stock": 10,
    "imageUrl": "https://...",
    "description": "...",
    "variants": []
  }
}
```

---

### 3. `createProduct`
**Create new product with image upload**

- **URL:** `https://createproduct-q3rjv54uka-uc.a.run.app`
- **Method:** `POST`
- **Auth:** Required (seller)

**Request:**
```json
{
  "name": "Product Name",
  "description": "Product description",
  "price": 5000,
  "compareAtPrice": 6000,
  "stock": 10,
  "sku": "SKU-123",
  "category": "Electronics",
  "status": "active",
  "allowShipping": true,
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "variants": [
    {
      "name": "Size",
      "options": [
        {
          "value": "Small",
          "priceModifier": 0,
          "stock": 5,
          "sku": "SKU-S"
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
  "productId": "new-product-id",
  "product": { ... }
}
```

**Mobile App Usage (with image):**
```typescript
// Convert image to base64
const imageUri = 'file:///path/to/image.jpg';
const base64 = await convertImageToBase64(imageUri); // Your image conversion function

const response = await fetch('https://createproduct-q3rjv54uka-uc.a.run.app', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'My Product',
    price: 5000,
    stock: 10,
    imageBase64: base64
  })
});
```

---

### 4. `updateProduct`
**Update existing product**

- **URL:** `https://updateproduct-q3rjv54uka-uc.a.run.app`
- **Method:** `POST`
- **Auth:** Required (seller - owner only)

**Request:**
```json
{
  "productId": "product-id-123",
  "name": "Updated Name",
  "price": 5500,
  "stock": 15,
  "imageBase64": "data:image/jpeg;base64,..."
}
```

**Response:**
```json
{
  "success": true,
  "productId": "product-id-123",
  "message": "Product updated successfully"
}
```

---

### 5. `deleteProduct`
**Delete product**

- **URL:** `https://deleteproduct-q3rjv54uka-uc.a.run.app`
- **Method:** `POST`
- **Auth:** Required (seller - owner only)

**Request:**
```json
{
  "productId": "product-id-123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

---

## 📊 DASHBOARD & ANALYTICS

### 6. `getDashboardStats`
**Get dashboard overview statistics**

- **URL:** `https://getdashboardstats-q3rjv54uka-uc.a.run.app`
- **Method:** `GET` or `POST`
- **Auth:** Required (seller)

**Request:**
```json
{
  "sellerId": "optional-if-same-as-auth"
}
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalRevenue": 500000,
    "totalOrders": 25,
    "totalProducts": 10,
    "totalCustomers": 15,
    "averageOrderValue": 20000,
    "lowStockProducts": 2,
    "recentOrders": [
      {
        "id": "order-id",
        "total": 5000,
        "status": "Processing",
        "customerName": "John Doe",
        "createdAt": "..."
      }
    ]
  }
}
```

---

### 7. `getSellerAnalytics`
**Get analytics data (charts, product performance)**

- **URL:** `https://getselleranalytics-q3rjv54uka-uc.a.run.app`
- **Method:** `GET` or `POST`
- **Auth:** Required (seller)

**Request:**
```json
{
  "sellerId": "optional-if-same-as-auth",
  "days": 30
}
```

**Response:**
```json
{
  "success": true,
  "analytics": {
    "dailyData": [
      {
        "date": "2024-01-15",
        "revenue": 50000,
        "orders": 5
      }
    ],
    "productPerformance": [
      {
        "productId": "product-id",
        "name": "Product Name",
        "sales": 10,
        "revenue": 50000
      }
    ],
    "totalRevenue": 500000,
    "totalOrders": 25
  }
}
```

---

## 📈 REPORTS

### 8. `generateSalesReport`
**Generate sales report**

- **URL:** `https://generatesalesreport-q3rjv54uka-uc.a.run.app`
- **Method:** `POST`
- **Auth:** Required (seller)

**Request:**
```json
{
  "sellerId": "optional-if-same-as-auth",
  "days": 30
}
```

**Response:**
```json
{
  "success": true,
  "report": {
    "type": "sales",
    "dateRange": 30,
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-01-31T23:59:59Z",
    "summary": {
      "totalRevenue": 500000,
      "totalOrders": 25,
      "averageOrderValue": 20000,
      "statusBreakdown": {
        "Processing": 5,
        "Sent": 10,
        "Received": 8,
        "Completed": 2
      }
    },
    "dailyBreakdown": [
      {
        "date": "2024-01-15",
        "revenue": 50000,
        "orders": 5
      }
    ]
  }
}
```

---

### 9. `generateCustomerReport`
**Generate customer report with segments**

- **URL:** `https://generatecustomerreport-q3rjv54uka-uc.a.run.app`
- **Method:** `POST`
- **Auth:** Required (seller)

**Request:**
```json
{
  "sellerId": "optional-if-same-as-auth",
  "days": 30
}
```

**Response:**
```json
{
  "success": true,
  "report": {
    "type": "customers",
    "dateRange": 30,
    "totalCustomers": 15,
    "segments": {
      "vip": 3,
      "regular": 7,
      "new": 5
    },
    "customers": [
      {
        "customerId": "customer-id",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+2348123456789",
        "totalOrders": 5,
        "totalSpent": 100000,
        "firstOrderDate": "2024-01-01T00:00:00Z",
        "lastOrderDate": "2024-01-30T00:00:00Z"
      }
    ]
  }
}
```

---

## 🎯 MARKETING - DISCOUNT CODES

### 10. `createDiscountCode`
**Create discount code**

- **URL:** `https://creatediscountcode-q3rjv54uka-uc.a.run.app`
- **Method:** `POST`
- **Auth:** Required (seller)

**Request:**
```json
{
  "code": "SAVE10",
  "type": "percentage",
  "value": 10,
  "maxUses": 100,
  "minOrderAmount": 5000,
  "validFrom": "2024-01-01T00:00:00Z",
  "validUntil": "2024-12-31T23:59:59Z",
  "sellerId": "optional-if-same-as-auth"
}
```

**Response:**
```json
{
  "success": true,
  "discountCodeId": "discount-id",
  "message": "Discount code created successfully"
}
```

---

### 11. `getDiscountCodes`
**Get all discount codes**

- **URL:** `https://getdiscountcodes-q3rjv54uka-uc.a.run.app`
- **Method:** `GET` or `POST`
- **Auth:** Required (seller)

**Request:**
```json
{
  "sellerId": "optional-if-same-as-auth"
}
```

**Response:**
```json
{
  "success": true,
  "discountCodes": [
    {
      "id": "discount-id",
      "code": "SAVE10",
      "type": "percentage",
      "value": 10,
      "uses": 5,
      "maxUses": 100,
      "status": "active",
      "createdAt": "..."
    }
  ]
}
```

---

### 12. `updateDiscountCode`
**Update discount code**

- **URL:** `https://updatediscountcode-q3rjv54uka-uc.a.run.app`
- **Method:** `POST`
- **Auth:** Required (seller)

**Request:**
```json
{
  "discountCodeId": "discount-id",
  "status": "inactive",
  "maxUses": 200,
  "validUntil": "2025-12-31T23:59:59Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Discount code updated successfully"
}
```

---

### 13. `deleteDiscountCode`
**Delete discount code**

- **URL:** `https://deletediscountcode-q3rjv54uka-uc.a.run.app`
- **Method:** `POST`
- **Auth:** Required (seller)

**Request:**
```json
{
  "discountCodeId": "discount-id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Discount code deleted successfully"
}
```

---

## 🏪 STORE MANAGEMENT

### 14. `getStoreSettings`
**Get store settings**

- **URL:** `https://getstoresettings-q3rjv54uka-uc.a.run.app`
- **Method:** `GET` or `POST`
- **Auth:** Required (seller)

**Request:**
```json
{
  "sellerId": "optional-if-same-as-auth"
}
```

**Response:**
```json
{
  "success": true,
  "store": {
    "id": "store-id",
    "storeName": "My Store",
    "storeDescription": "...",
    "storeLogo": "https://...",
    "storeBanner": "https://...",
    "phone": "+2348123456789",
    "email": "store@example.com"
  }
}
```

---

### 15. `updateStoreSettings`
**Update store settings (with logo/banner upload)**

- **URL:** `https://updatestoresettings-q3rjv54uka-uc.a.run.app`
- **Method:** `POST`
- **Auth:** Required (seller)

**Request:**
```json
{
  "sellerId": "optional-if-same-as-auth",
  "updateData": {
    "storeName": "Updated Store Name",
    "storeDescription": "New description",
    "logoBase64": "data:image/jpeg;base64,...",
    "bannerBase64": "data:image/jpeg;base64,...",
    "phone": "+2348123456789",
    "email": "newemail@example.com"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Store settings updated successfully"
}
```

---

## 👥 CUSTOMERS

### 16. `getCustomers`
**Get customer list with segments**

- **URL:** `https://getcustomers-q3rjv54uka-uc.a.run.app`
- **Method:** `GET` or `POST`
- **Auth:** Required (seller)

**Request:**
```json
{
  "sellerId": "optional-if-same-as-auth"
}
```

**Response:**
```json
{
  "success": true,
  "customers": [
    {
      "customerId": "customer-id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+2348123456789",
      "totalOrders": 5,
      "totalSpent": 100000,
      "firstOrderDate": "2024-01-01T00:00:00Z",
      "lastOrderDate": "2024-01-30T00:00:00Z"
    }
  ],
  "segments": {
    "vip": 3,
    "regular": 7,
    "new": 5
  }
}
```

---

## 📝 Error Handling

All functions return errors in this format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (not authorized for this action)
- `404` - Not Found
- `500` - Internal Server Error

---

## 🚀 Quick Start Example (React Native)

```typescript
import auth from '@react-native-firebase/auth';

// Get auth token
const user = auth().currentUser;
if (!user) throw new Error('Not authenticated');
const idToken = await user.getIdToken();

// Call function
const response = await fetch('https://getdashboardstats-q3rjv54uka-uc.a.run.app', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({})
});

if (!response.ok) {
  const error = await response.json();
  throw new Error(error.error || 'Request failed');
}

const data = await response.json();
console.log('Dashboard stats:', data.stats);
```

---

## 📋 Function Summary

| Function | Purpose | Auth Required |
|----------|---------|---------------|
| `getSellerProducts` | List products | ✅ Seller |
| `getProduct` | Get single product | ❌ Public |
| `createProduct` | Create product | ✅ Seller |
| `updateProduct` | Update product | ✅ Seller |
| `deleteProduct` | Delete product | ✅ Seller |
| `getDashboardStats` | Dashboard overview | ✅ Seller |
| `getSellerAnalytics` | Analytics data | ✅ Seller |
| `generateSalesReport` | Sales report | ✅ Seller |
| `generateCustomerReport` | Customer report | ✅ Seller |
| `createDiscountCode` | Create discount | ✅ Seller |
| `getDiscountCodes` | List discounts | ✅ Seller |
| `updateDiscountCode` | Update discount | ✅ Seller |
| `deleteDiscountCode` | Delete discount | ✅ Seller |
| `getStoreSettings` | Get store info | ✅ Seller |
| `updateStoreSettings` | Update store | ✅ Seller |
| `getCustomers` | Get customers | ✅ Seller |

---

## ⚠️ Important Notes

1. **Image Uploads**: All image uploads use base64 format. Convert images to base64 before sending.
2. **Pagination**: Use `startAfter` parameter for pagination (pass last item ID).
3. **Seller ID**: If not provided, uses authenticated user's ID automatically.
4. **Error Handling**: Always check `response.ok` and handle errors gracefully.
5. **Rate Limiting**: Be mindful of API rate limits in production.

---

## 🔄 After Deployment

**IMPORTANT:** After deploying functions, update URLs in:
1. `src/lib/cloud-functions.ts` - Update `FUNCTION_URLS` object
2. This documentation - Update all URLs

To get function URLs after deployment:
```bash
firebase functions:list
```

Or check Firebase Console:
https://console.firebase.google.com/project/ikm-marketplace/functions

