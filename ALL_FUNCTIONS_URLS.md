# 🔗 All Cloud Functions URLs - Complete Reference

**Complete list of ALL Cloud Functions with their URLs, methods, and authentication requirements.**

## 📍 Base Information
- **Region:** `us-central1`
- **Project:** `ikm-marketplace`
- **Base URL Pattern:** `https://[function-name]-q3rjv54uka-uc.a.run.app`

---

## ⚠️ IMPORTANT: Update URLs After Deployment

After deploying functions, run:
```bash
firebase functions:list
```

Then update URLs in:
1. `src/lib/cloud-functions.ts` - `FUNCTION_URLS` object
2. `FUNCTION_URLS.md` - This file
3. `SELLER_FUNCTIONS_COMPLETE.md` - Seller documentation
4. `ADMIN_FUNCTIONS_COMPLETE.md` - Admin documentation

---

## 💳 PAYMENT FUNCTIONS

| Function | URL | Method | Auth | Purpose |
|----------|-----|--------|------|---------|
| `verifyPaymentAndCreateOrder` | `https://verifypaymentandcreateorder-q3rjv54uka-uc.a.run.app` | POST | Optional | Verify Paystack payment and create order |
| `findRecentTransactionByEmail` | `https://findrecenttransactionbyemail-q3rjv54uka-uc.a.run.app` | POST | ❌ | Find Paystack transaction by email/amount |

---

## 📦 ORDER FUNCTIONS

| Function | URL | Method | Auth | Purpose |
|----------|-----|--------|------|---------|
| `updateOrderStatus` | `https://updateorderstatus-q3rjv54uka-uc.a.run.app` | POST | ✅ Seller/Admin | Update order status |
| `markOrderAsSent` | `https://markorderassent-q3rjv54uka-uc.a.run.app` | POST | ✅ Seller | Mark order as sent with photo |
| `markOrderAsReceived` | `https://markorderasreceived-q3rjv54uka-uc.a.run.app` | POST | ✅ Customer | Mark order as received with photo |
| `getOrdersByCustomer` | `https://getordersbycustomer-q3rjv54uka-uc.a.run.app` | GET/POST | ✅ Customer | Get customer orders |
| `getOrdersBySeller` | `https://getordersbyseller-q3rjv54uka-uc.a.run.app` | GET/POST | ✅ Seller | Get seller orders |

---

## 🚚 SHIPPING FUNCTIONS

| Function | URL | Method | Auth | Purpose |
|----------|-----|--------|------|---------|
| `calculateShippingOptions` | `https://calculateshippingoptions-q3rjv54uka-uc.a.run.app` | POST | ❌ | Calculate shipping options |

---

## 💰 PAYOUT FUNCTIONS

| Function | URL | Method | Auth | Purpose |
|----------|-----|--------|------|---------|
| `getBanksList` | `https://getbankslist-q3rjv54uka-uc.a.run.app` | GET | ❌ | Get Nigerian banks list |
| `resolveAccountNumber` | `https://resolveaccountnumber-q3rjv54uka-uc.a.run.app` | POST | ❌ | Resolve bank account number |
| `savePayoutDetails` | `https://savepayoutdetails-q3rjv54uka-uc.a.run.app` | POST | ✅ Seller | Save payout bank details |

---

## 💬 CHAT FUNCTIONS

| Function | URL | Method | Auth | Purpose |
|----------|-----|--------|------|---------|
| `sendOrderMessage` | `https://sendordermessage-q3rjv54uka-uc.a.run.app` | POST | ✅ Customer/Seller | Send order chat message |

---

## 👤 USER FUNCTIONS

| Function | URL | Method | Auth | Purpose |
|----------|-----|--------|------|---------|
| `linkGuestOrdersToAccount` | `https://linkguestorderstoaccount-q3rjv54uka-uc.a.run.app` | POST | ✅ User | Link guest orders to account |

---

## 🔍 SEARCH FUNCTIONS

| Function | URL | Method | Auth | Purpose |
|----------|-----|--------|------|---------|
| `searchProducts` | `https://searchproducts-q3rjv54uka-uc.a.run.app` | GET/POST | ❌ | Search products |

---

## 🛍️ SELLER FUNCTIONS - PRODUCTS

| Function | URL | Method | Auth | Purpose |
|----------|-----|--------|------|---------|
| `getSellerProducts` | `https://getsellerproducts-q3rjv54uka-uc.a.run.app` | GET/POST | ✅ Seller | List seller's products |
| `getProduct` | `https://getproduct-q3rjv54uka-uc.a.run.app` | GET/POST | ❌ | Get single product |
| `createProduct` | `https://createproduct-q3rjv54uka-uc.a.run.app` | POST | ✅ Seller | Create product with image |
| `updateProduct` | `https://updateproduct-q3rjv54uka-uc.a.run.app` | POST | ✅ Seller | Update product |
| `deleteProduct` | `https://deleteproduct-q3rjv54uka-uc.a.run.app` | POST | ✅ Seller | Delete product |

---

## 📊 SELLER FUNCTIONS - DASHBOARD & ANALYTICS

| Function | URL | Method | Auth | Purpose |
|----------|-----|--------|------|---------|
| `getDashboardStats` | `https://getdashboardstats-q3rjv54uka-uc.a.run.app` | GET/POST | ✅ Seller | Get dashboard statistics |
| `getSellerAnalytics` | `https://getselleranalytics-q3rjv54uka-uc.a.run.app` | GET/POST | ✅ Seller | Get analytics data |

---

## 📈 SELLER FUNCTIONS - REPORTS

| Function | URL | Method | Auth | Purpose |
|----------|-----|--------|------|---------|
| `generateSalesReport` | `https://generatesalesreport-q3rjv54uka-uc.a.run.app` | POST | ✅ Seller | Generate sales report |
| `generateCustomerReport` | `https://generatecustomerreport-q3rjv54uka-uc.a.run.app` | POST | ✅ Seller | Generate customer report |

---

## 🎯 SELLER FUNCTIONS - MARKETING

| Function | URL | Method | Auth | Purpose |
|----------|-----|--------|------|---------|
| `createDiscountCode` | `https://creatediscountcode-q3rjv54uka-uc.a.run.app` | POST | ✅ Seller | Create discount code |
| `getDiscountCodes` | `https://getdiscountcodes-q3rjv54uka-uc.a.run.app` | GET/POST | ✅ Seller | List discount codes |
| `updateDiscountCode` | `https://updatediscountcode-q3rjv54uka-uc.a.run.app` | POST | ✅ Seller | Update discount code |
| `deleteDiscountCode` | `https://deletediscountcode-q3rjv54uka-uc.a.run.app` | POST | ✅ Seller | Delete discount code |

---

## 🏪 SELLER FUNCTIONS - STORE

| Function | URL | Method | Auth | Purpose |
|----------|-----|--------|------|---------|
| `getStoreSettings` | `https://getstoresettings-q3rjv54uka-uc.a.run.app` | GET/POST | ✅ Seller | Get store settings |
| `updateStoreSettings` | `https://updatestoresettings-q3rjv54uka-uc.a.run.app` | POST | ✅ Seller | Update store settings |

---

## 👥 SELLER FUNCTIONS - CUSTOMERS

| Function | URL | Method | Auth | Purpose |
|----------|-----|--------|------|---------|
| `getCustomers` | `https://getcustomers-q3rjv54uka-uc.a.run.app` | GET/POST | ✅ Seller | Get customer list |

---

## 👑 ADMIN FUNCTIONS - USERS

| Function | URL | Method | Auth | Purpose |
|----------|-----|--------|------|---------|
| `getAllUsers` | `https://getallusers-q3rjv54uka-uc.a.run.app` | GET/POST | ✅ Admin | List all users |
| `grantAdminRole` | `https://grantadminrole-q3rjv54uka-uc.a.run.app` | POST | ✅ Admin | Grant admin role |
| `revokeAdminRole` | `https://revokeadminrole-q3rjv54uka-uc.a.run.app` | POST | ✅ Admin | Revoke admin role |

---

## ⚙️ ADMIN FUNCTIONS - PLATFORM

| Function | URL | Method | Auth | Purpose |
|----------|-----|--------|------|---------|
| `getPlatformSettings` | `https://getplatformsettings-q3rjv54uka-uc.a.run.app` | GET/POST | ✅ Admin | Get platform settings |
| `updatePlatformSettings` | `https://updateplatformsettings-q3rjv54uka-uc.a.run.app` | POST | ✅ Admin | Update platform settings |

---

## 📦 ADMIN FUNCTIONS - ORDERS & DISPUTES

| Function | URL | Method | Auth | Purpose |
|----------|-----|--------|------|---------|
| `getAllOrders` | `https://getallorders-q3rjv54uka-uc.a.run.app` | GET/POST | ✅ Admin | List all orders |
| `resolveDispute` | `https://resolvedispute-q3rjv54uka-uc.a.run.app` | POST | ✅ Admin | Resolve order dispute |

---

## 🧪 TEST FUNCTION

| Function | URL | Method | Auth | Purpose |
|----------|-----|--------|------|---------|
| `helloWorld` | `https://helloworld-q3rjv54uka-uc.a.run.app` | GET | ❌ | Test function |

---

## 📊 Summary Statistics

- **Total Functions:** 30+
- **Seller Functions:** 16
- **Admin Functions:** 7
- **Payment Functions:** 2
- **Order Functions:** 5
- **Other Functions:** 5

---

## 🔐 Authentication Legend

- ✅ **Required** - Function requires authentication
- ✅ **Seller** - Requires seller authentication
- ✅ **Admin** - Requires admin authentication
- ✅ **Customer** - Requires customer authentication
- ❌ **Public** - No authentication required

---

## 📝 Usage Pattern

All functions follow this pattern:

```typescript
// 1. Get Firebase ID token
const idToken = await user.getIdToken();

// 2. Call function
const response = await fetch('FUNCTION_URL', {
  method: 'POST', // or GET
  headers: {
    'Authorization': `Bearer ${idToken}`, // If auth required
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    // Request data
  })
});

// 3. Handle response
if (!response.ok) {
  const error = await response.json();
  throw new Error(error.error);
}

const data = await response.json();
// Use data
```

---

## 🔄 After Deployment Checklist

1. ✅ Deploy functions: `firebase deploy --only functions`
2. ✅ Get function URLs: `firebase functions:list`
3. ✅ Update `src/lib/cloud-functions.ts` - `FUNCTION_URLS` object
4. ✅ Update `FUNCTION_URLS.md`
5. ✅ Update `SELLER_FUNCTIONS_COMPLETE.md`
6. ✅ Update `ADMIN_FUNCTIONS_COMPLETE.md`
7. ✅ Test all functions with mobile app
8. ✅ Verify authentication works correctly

---

## 📚 Documentation Files

- **Seller Functions:** See `SELLER_FUNCTIONS_COMPLETE.md`
- **Admin Functions:** See `ADMIN_FUNCTIONS_COMPLETE.md`
- **Complete Function Reference:** See `CLOUD_FUNCTIONS_FUNCTIONS.md`

---

## 🆘 Support

If a function URL doesn't work:
1. Check Firebase Console for actual URL
2. Verify function is deployed
3. Check function logs in Firebase Console
4. Verify authentication token is valid

