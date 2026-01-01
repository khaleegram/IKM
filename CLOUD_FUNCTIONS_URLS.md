# All Cloud Functions URLs

## Base URL Format


## Complete List of All Cloud Functions (69 Total)

### Payment & Orders (2)
1. `POST https://{region}-{project-id}.cloudfunctions.net/verifyPaymentAndCreateOrder`
2. `POST https://{region}-{project-id}.cloudfunctions.net/findRecentTransactionByEmail`

### Order Management (7)
3. `POST https://{region}-{project-id}.cloudfunctions.net/updateOrderStatus`
4. `POST https://{region}-{project-id}.cloudfunctions.net/markOrderAsSent`
5. `POST https://{region}-{project-id}.cloudfunctions.net/markOrderAsReceived`
6. `GET/POST https://{region}-{project-id}.cloudfunctions.net/getOrdersByCustomer`
7. `GET/POST https://{region}-{project-id}.cloudfunctions.net/getOrdersBySeller`
8. `POST https://{region}-{project-id}.cloudfunctions.net/sendOrderMessage`
9. `POST https://{region}-{project-id}.cloudfunctions.net/linkGuestOrdersToAccount`

### Shipping & Delivery (2)
10. `POST https://{region}-{project-id}.cloudfunctions.net/calculateShippingOptions`
11. `GET/POST https://{region}-{project-id}.cloudfunctions.net/getPublicShippingZones`  
    **Deployed:** `https://getpublicshippingzones-q3rjv54uka-uc.a.run.app`

### Payment Processing (2)
12. `GET/POST https://{region}-{project-id}.cloudfunctions.net/getBanksList`
13. `POST https://{region}-{project-id}.cloudfunctions.net/resolveAccountNumber`

### Payouts (3)
14. `POST https://{region}-{project-id}.cloudfunctions.net/savePayoutDetails`
15. `POST https://{region}-{project-id}.cloudfunctions.net/requestPayout`  
    **Deployed:** `https://requestpayout-q3rjv54uka-uc.a.run.app`
16. `POST https://{region}-{project-id}.cloudfunctions.net/cancelPayoutRequest`  
    **Deployed:** `https://cancelpayoutrequest-q3rjv54uka-uc.a.run.app`

### Products (5)
17. `POST https://{region}-{project-id}.cloudfunctions.net/searchProducts`
18. `GET/POST https://{region}-{project-id}.cloudfunctions.net/getSellerProducts`
19. `GET/POST https://{region}-{project-id}.cloudfunctions.net/getProduct`
20. `POST https://{region}-{project-id}.cloudfunctions.net/createProduct`
21. `POST https://{region}-{project-id}.cloudfunctions.net/updateProduct`
22. `POST https://{region}-{project-id}.cloudfunctions.net/deleteProduct`

### Northern Products (2)
23. `POST https://{region}-{project-id}.cloudfunctions.net/createNorthernProduct`
24. `POST https://{region}-{project-id}.cloudfunctions.net/updateNorthernProduct`

### Seller Dashboard & Analytics (3)
25. `GET/POST https://{region}-{project-id}.cloudfunctions.net/getDashboardStats`
26. `GET/POST https://{region}-{project-id}.cloudfunctions.net/getSellerAnalytics`
27. `POST https://{region}-{project-id}.cloudfunctions.net/generateSalesReport`
28. `POST https://{region}-{project-id}.cloudfunctions.net/generateCustomerReport`

### Discount Codes (4)
29. `POST https://{region}-{project-id}.cloudfunctions.net/createDiscountCode`
30. `GET/POST https://{region}-{project-id}.cloudfunctions.net/getDiscountCodes`
31. `POST https://{region}-{project-id}.cloudfunctions.net/updateDiscountCode`
32. `POST https://{region}-{project-id}.cloudfunctions.net/deleteDiscountCode`

### Store Management (3)
33. `GET/POST https://{region}-{project-id}.cloudfunctions.net/getStoreSettings`
34. `POST https://{region}-{project-id}.cloudfunctions.net/updateStoreSettings`
35. `GET/POST https://{region}-{project-id}.cloudfunctions.net/getCustomers`

### Admin Functions - Users (2)
36. `GET/POST https://{region}-{project-id}.cloudfunctions.net/getAllUsers`
37. `POST https://{region}-{project-id}.cloudfunctions.net/grantAdminRole`
38. `POST https://{region}-{project-id}.cloudfunctions.net/revokeAdminRole`

### Admin Functions - Platform Settings (2)
39. `GET/POST https://{region}-{project-id}.cloudfunctions.net/getPlatformSettings`
40. `POST https://{region}-{project-id}.cloudfunctions.net/updatePlatformSettings`

### Admin Functions - Orders (1)
41. `GET/POST https://{region}-{project-id}.cloudfunctions.net/getAllOrders`

### Admin Functions - Disputes (1)
42. `POST https://{region}-{project-id}.cloudfunctions.net/resolveDispute`

### Admin Functions - Payouts (1)
43. `GET/POST https://{region}-{project-id}.cloudfunctions.net/getAllPayouts`  
    **Deployed:** `https://getallpayouts-q3rjv54uka-uc.a.run.app`

### Shipping Zones Management (7)
44. `GET/POST https://{region}-{project-id}.cloudfunctions.net/getPublicShippingZones`  
    **Deployed:** `https://getpublicshippingzones-q3rjv54uka-uc.a.run.app`
45. `GET/POST https://{region}-{project-id}.cloudfunctions.net/getShippingZones`  
    **Deployed:** `https://getshippingzones-q3rjv54uka-uc.a.run.app`
46. `POST https://{region}-{project-id}.cloudfunctions.net/createShippingZone`  
    **Deployed:** `https://createshippingzone-q3rjv54uka-uc.a.run.app`
47. `POST https://{region}-{project-id}.cloudfunctions.net/updateShippingZone`  
    **Deployed:** `https://updateshippingzone-q3rjv54uka-uc.a.run.app`
48. `POST https://{region}-{project-id}.cloudfunctions.net/deleteShippingZone`  
    **Deployed:** `https://deleteshippingzone-q3rjv54uka-uc.a.run.app`
49. `GET/POST https://{region}-{project-id}.cloudfunctions.net/getShippingSettings`  
    **Deployed:** `https://getshippingsettings-q3rjv54uka-uc.a.run.app`
50. `POST https://{region}-{project-id}.cloudfunctions.net/updateShippingSettings`  
    **Deployed:** `https://updateshippingsettings-q3rjv54uka-uc.a.run.app`

### Order Availability (2)
50. `POST https://{region}-{project-id}.cloudfunctions.net/markOrderAsNotAvailable`
51. `POST https://{region}-{project-id}.cloudfunctions.net/respondToAvailabilityCheck`  
    **Deployed:** `https://respondtoavailabilitycheck-q3rjv54uka-uc.a.run.app`

### Parks Management (6)
52. `GET/POST https://{region}-{project-id}.cloudfunctions.net/getAllParks`
53. `GET/POST https://{region}-{project-id}.cloudfunctions.net/getParksByState`
54. `POST https://{region}-{project-id}.cloudfunctions.net/createPark`  
    **Deployed:** `https://createpark-q3rjv54uka-uc.a.run.app`
55. `POST https://{region}-{project-id}.cloudfunctions.net/updatePark`  
    **Deployed:** `https://updatepark-q3rjv54uka-uc.a.run.app`
56. `POST https://{region}-{project-id}.cloudfunctions.net/deletePark`  
    **Deployed:** `https://deletepark-q3rjv54uka-uc.a.run.app`
57. `POST https://{region}-{project-id}.cloudfunctions.net/initializeParks`  
    **Deployed:** `https://initializeparks-q3rjv54uka-uc.a.run.app`

### Earnings & Transactions (2)
58. `POST https://{region}-{project-id}.cloudfunctions.net/calculateSellerEarnings`  
    **Deployed:** `https://calculatesellerearnings-q3rjv54uka-uc.a.run.app`
59. `GET/POST https://{region}-{project-id}.cloudfunctions.net/getSellerTransactions`  
    **Deployed:** `https://getsellertransactions-q3rjv54uka-uc.a.run.app`

### Security & Admin (9) - NEW
60. `GET/POST https://{region}-{project-id}.cloudfunctions.net/getAccessLogs`  
    **Deployed:** `https://getaccesslogs-q3rjv54uka-uc.a.run.app`
61. `GET/POST https://{region}-{project-id}.cloudfunctions.net/getFailedLogins`  
    **Deployed:** `https://getfailedlogins-q3rjv54uka-uc.a.run.app`
62. `GET/POST https://{region}-{project-id}.cloudfunctions.net/getApiKeys`  
    **Deployed:** `https://getapikeys-q3rjv54uka-uc.a.run.app`
63. `POST https://{region}-{project-id}.cloudfunctions.net/createApiKey`  
    **Deployed:** `https://createapikey-q3rjv54uka-uc.a.run.app`
64. `POST https://{region}-{project-id}.cloudfunctions.net/revokeApiKey`  
    **Deployed:** `https://revokeapikey-q3rjv54uka-uc.a.run.app`
65. `GET/POST https://{region}-{project-id}.cloudfunctions.net/getSecuritySettings`  
    **Deployed:** `https://getsecuritysettings-q3rjv54uka-uc.a.run.app`
66. `POST https://{region}-{project-id}.cloudfunctions.net/updateSecuritySettings`  
    **Deployed:** `https://updatesecuritysettings-q3rjv54uka-uc.a.run.app`
67. `GET/POST https://{region}-{project-id}.cloudfunctions.net/getAuditTrail`  
    **Deployed:** `https://getaudittrail-q3rjv54uka-uc.a.run.app`
68. `GET/POST https://{region}-{project-id}.cloudfunctions.net/getFirestoreRules`  
    **Deployed:** `https://getfirestorerules-q3rjv54uka-uc.a.run.app`

### Testing (1)
69. `GET https://{region}-{project-id}.cloudfunctions.net/helloWorld`

---

## Quick Reference by Category

### Public Endpoints (No Auth Required)
- `getPublicShippingZones`
- `getAllParks`
- `getParksByState`
- `helloWorld`

### Seller Endpoints (Seller Auth Required)
- `createProduct`, `updateProduct`, `deleteProduct`
- `createNorthernProduct`, `updateNorthernProduct`
- `getSellerProducts`
- `getDashboardStats`, `getSellerAnalytics`
- `generateSalesReport`, `generateCustomerReport`
- `createDiscountCode`, `getDiscountCodes`, `updateDiscountCode`, `deleteDiscountCode`
- `getStoreSettings`, `updateStoreSettings`
- `getCustomers`
- `getShippingZones`, `createShippingZone`, `updateShippingZone`, `deleteShippingZone`
- `getShippingSettings`, `updateShippingSettings`
- `markOrderAsSent`, `markOrderAsReceived`
- `markOrderAsNotAvailable`
- `calculateSellerEarnings`, `getSellerTransactions`
- `requestPayout`, `cancelPayoutRequest`
- `savePayoutDetails`

### Admin Endpoints (Admin Auth Required)
- `getAllUsers`, `grantAdminRole`, `revokeAdminRole`
- `getPlatformSettings`, `updatePlatformSettings`
- `getAllOrders`
- `resolveDispute`
- `getAllPayouts`
- `createPark`, `updatePark`, `deletePark`, `initializeParks`
- `getAccessLogs`, `getFailedLogins`
- `getApiKeys`, `createApiKey`, `revokeApiKey`
- `getSecuritySettings`, `updateSecuritySettings`
- `getAuditTrail`
- `getFirestoreRules`

### Customer Endpoints (Customer Auth Required)
- `getOrdersByCustomer`
- `markOrderAsReceived`
- `respondToAvailabilityCheck`

### Mixed Auth Endpoints
- `verifyPaymentAndCreateOrder` (Optional - supports guest checkout)
- `updateOrderStatus` (Seller/Customer)
- `sendOrderMessage` (Seller/Customer)
- `getProduct` (Public)
- `searchProducts` (Public)

---

## Finding Your Firebase Project URL

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Functions** section
4. Click on any function to see its URL
5. The base URL format will be shown

Alternatively, you can find it in your Firebase config:
- Check `NEXT_PUBLIC_FIREBASE_PROJECT_ID` in your environment variables
- Default region is usually `us-central1` unless you specified otherwise

---

## Usage Example

```javascript
// Replace these with your actual values
const REGION = 'us-central1';
const PROJECT_ID = 'your-project-id';
const FUNCTION_NAME = 'verifyPaymentAndCreateOrder';

const url = `https://${REGION}-${PROJECT_ID}.cloudfunctions.net/${FUNCTION_NAME}`;

// Make request
const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}` // If auth required
  },
  body: JSON.stringify({ /* your data */ })
});
```

---

## Notes

- All endpoints support CORS (configured in functions)
- Most endpoints require authentication via `Authorization: Bearer <token>` header
- GET endpoints can also accept POST with query parameters in body
- All endpoints return JSON responses
- Error responses follow format: `{ success: false, error: "message" }`
- Success responses follow format: `{ success: true, data: {...} }`

