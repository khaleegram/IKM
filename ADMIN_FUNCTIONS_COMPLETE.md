# 👑 Admin Cloud Functions - Complete Guide

**Complete API reference for all Admin functions in your mobile app.**

## 📍 Base Information
- **Region:** `us-central1`
- **Project:** `ikm-marketplace`
- **All functions require ADMIN authentication**

---

## 🔐 Authentication

**CRITICAL:** All admin functions require admin authentication. User must have `isAdmin: true` in their Firebase token.

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

// Verify user is admin (check custom claims)
const decodedToken = await auth().verifyIdToken(idToken);
if (!decodedToken.isAdmin) {
  throw new Error('Admin access required');
}
```

---

## 👥 USER MANAGEMENT

### 1. `getAllUsers`
**Get paginated list of all users**

- **URL:** `https://getallusers-q3rjv54uka-uc.a.run.app`
- **Method:** `GET` or `POST`
- **Auth:** Required (admin only)

**Request:**
```json
{
  "limit": 50,
  "startAfter": "user-id-for-pagination",
  "role": "seller"
}
```

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "id": "user-id",
      "email": "user@example.com",
      "displayName": "User Name",
      "role": "seller",
      "isAdmin": false,
      "createdAt": "..."
    }
  ],
  "hasMore": true
}
```

**Mobile App Usage:**
```typescript
const response = await fetch('https://getallusers-q3rjv54uka-uc.a.run.app', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    limit: 20,
    role: 'seller'
  })
});
const data = await response.json();
console.log(data.users);
```

---

### 2. `grantAdminRole`
**Grant admin role to user**

- **URL:** `https://grantadminrole-q3rjv54uka-uc.a.run.app`
- **Method:** `POST`
- **Auth:** Required (admin only)

**Request:**
```json
{
  "userId": "user-id-to-promote"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin role granted successfully"
}
```

**Mobile App Usage:**
```typescript
const response = await fetch('https://grantadminrole-q3rjv54uka-uc.a.run.app', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userId: 'user-id-123'
  })
});
```

---

### 3. `revokeAdminRole`
**Revoke admin role from user**

- **URL:** `https://revokeadminrole-q3rjv54uka-uc.a.run.app`
- **Method:** `POST`
- **Auth:** Required (admin only)

**Request:**
```json
{
  "userId": "user-id-to-demote"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin role revoked successfully"
}
```

**Note:** Cannot revoke your own admin role.

---

## ⚙️ PLATFORM SETTINGS

### 4. `getPlatformSettings`
**Get platform-wide settings**

- **URL:** `https://getplatformsettings-q3rjv54uka-uc.a.run.app`
- **Method:** `GET` or `POST`
- **Auth:** Required (admin only)

**Request:**
```json
{}
```

**Response:**
```json
{
  "success": true,
  "settings": {
    "platformCommissionRate": 0.05,
    "minimumPayoutAmount": 5000,
    "platformFee": 0,
    "currency": "NGN",
    "updatedAt": "...",
    "updatedBy": "admin-user-id"
  }
}
```

---

### 5. `updatePlatformSettings`
**Update platform settings**

- **URL:** `https://updateplatformsettings-q3rjv54uka-uc.a.run.app`
- **Method:** `POST`
- **Auth:** Required (admin only)

**Request:**
```json
{
  "settings": {
    "platformCommissionRate": 0.06,
    "minimumPayoutAmount": 10000,
    "platformFee": 100,
    "currency": "NGN"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Platform settings updated successfully"
}
```

**Mobile App Usage:**
```typescript
const response = await fetch('https://updateplatformsettings-q3rjv54uka-uc.a.run.app', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    settings: {
      platformCommissionRate: 0.06,
      minimumPayoutAmount: 10000
    }
  })
});
```

---

## 📦 ORDERS & DISPUTES

### 6. `getAllOrders`
**Get all orders across platform**

- **URL:** `https://getallorders-q3rjv54uka-uc.a.run.app`
- **Method:** `GET` or `POST`
- **Auth:** Required (admin only)

**Request:**
```json
{
  "limit": 50,
  "startAfter": "order-id-for-pagination",
  "status": "Processing"
}
```

**Response:**
```json
{
  "success": true,
  "orders": [
    {
      "id": "order-id",
      "customerId": "customer-id",
      "sellerId": "seller-id",
      "total": 5000,
      "status": "Processing",
      "items": [...],
      "createdAt": "..."
    }
  ],
  "hasMore": true
}
```

---

### 7. `resolveDispute`
**Resolve order dispute**

- **URL:** `https://resolvedispute-q3rjv54uka-uc.a.run.app`
- **Method:** `POST`
- **Auth:** Required (admin only)

**Request:**
```json
{
  "orderId": "order-id",
  "resolution": "refund",
  "refundAmount": 5000
}
```

**Resolution Options:**
- `"refund"` - Refund customer, cancel order
- `"release"` - Release escrow to seller, continue order

**Response:**
```json
{
  "success": true,
  "message": "Dispute resolved successfully"
}
```

**Mobile App Usage:**
```typescript
const response = await fetch('https://resolvedispute-q3rjv54uka-uc.a.run.app', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    orderId: 'order-id-123',
    resolution: 'refund',
    refundAmount: 5000
  })
});
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
- `403` - Forbidden (not admin)
- `404` - Not Found
- `500` - Internal Server Error

---

## 🚀 Quick Start Example (React Native)

```typescript
import auth from '@react-native-firebase/auth';

// Verify admin access
const user = auth().currentUser;
if (!user) throw new Error('Not authenticated');

const idToken = await user.getIdToken();
const decodedToken = await auth().verifyIdToken(idToken);

if (!decodedToken.isAdmin) {
  throw new Error('Admin access required');
}

// Call admin function
const response = await fetch('https://getallusers-q3rjv54uka-uc.a.run.app', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    limit: 20
  })
});

if (!response.ok) {
  const error = await response.json();
  throw new Error(error.error || 'Request failed');
}

const data = await response.json();
console.log('All users:', data.users);
```

---

## 📋 Function Summary

| Function | Purpose | Auth Required |
|----------|---------|---------------|
| `getAllUsers` | List all users | ✅ Admin |
| `grantAdminRole` | Grant admin access | ✅ Admin |
| `revokeAdminRole` | Revoke admin access | ✅ Admin |
| `getPlatformSettings` | Get platform settings | ✅ Admin |
| `updatePlatformSettings` | Update platform settings | ✅ Admin |
| `getAllOrders` | List all orders | ✅ Admin |
| `resolveDispute` | Resolve disputes | ✅ Admin |

---

## ⚠️ Important Notes

1. **Admin Only**: All functions require `isAdmin: true` in Firebase token
2. **Self-Protection**: Cannot revoke your own admin role
3. **Pagination**: Use `startAfter` for pagination
4. **Error Handling**: Always check `response.ok` and handle errors
5. **Security**: Admin functions are highly sensitive - ensure proper authentication

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

