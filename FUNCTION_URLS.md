# 🔗 Cloud Functions URLs

All your deployed Cloud Functions and their URLs.

## 📍 Base Information
- **Region:** `us-central1`
- **Project:** `ikm-marketplace`

---

## 💳 Payment Functions

### `verifyPaymentAndCreateOrder`
- **URL:** `https://verifypaymentandcreateorder-q3rjv54uka-uc.a.run.app`
- **Method:** `POST`
- **Auth:** Optional (guest checkout allowed)
- **Purpose:** Verify Paystack payment and create order

### `findRecentTransactionByEmail`
- **URL:** `https://findrecenttransactionbyemail-q3rjv54uka-uc.a.run.app`
- **Method:** `POST`
- **Auth:** Not required
- **Purpose:** Find recent Paystack transaction by email and amount

---

## 📦 Order Functions

### `updateOrderStatus`
- **URL:** `https://updateorderstatus-q3rjv54uka-uc.a.run.app`
- **Method:** `POST`
- **Auth:** Required (seller or admin)
- **Purpose:** Update order status

### `markOrderAsSent`
- **URL:** `https://markorderassent-q3rjv54uka-uc.a.run.app`
- **Method:** `POST`
- **Auth:** Required (seller)
- **Purpose:** Mark order as sent with optional photo

### `markOrderAsReceived`
- **URL:** `https://markorderasreceived-q3rjv54uka-uc.a.run.app`
- **Method:** `POST`
- **Auth:** Required (customer)
- **Purpose:** Mark order as received with optional photo

### `getOrdersByCustomer`
- **URL:** `https://getordersbycustomer-q3rjv54uka-uc.a.run.app`
- **Method:** `GET` or `POST`
- **Auth:** Required (customer)
- **Purpose:** Get all orders for a customer

### `getOrdersBySeller`
- **URL:** `https://getordersbyseller-q3rjv54uka-uc.a.run.app`
- **Method:** `GET` or `POST`
- **Auth:** Required (seller)
- **Purpose:** Get all orders for a seller

---

## 🚚 Shipping Functions

### `calculateShippingOptions`
- **URL:** `https://calculateshippingoptions-q3rjv54uka-uc.a.run.app`
- **Method:** `POST`
- **Auth:** Not required (public)
- **Purpose:** Calculate shipping options for cart

---

## 💰 Payout Functions

### `getBanksList`
- **URL:** `https://getbankslist-q3rjv54uka-uc.a.run.app`
- **Method:** `GET`
- **Auth:** Not required (public)
- **Purpose:** Get list of Nigerian banks from Paystack

### `resolveAccountNumber`
- **URL:** `https://resolveaccountnumber-q3rjv54uka-uc.a.run.app`
- **Method:** `POST`
- **Auth:** Not required (public)
- **Purpose:** Resolve bank account number to account name

### `savePayoutDetails`
- **URL:** `https://savepayoutdetails-q3rjv54uka-uc.a.run.app`
- **Method:** `POST`
- **Auth:** Required (seller)
- **Purpose:** Save payout bank account details

---

## 💬 Chat Functions

### `sendOrderMessage`
- **URL:** `https://sendordermessage-q3rjv54uka-uc.a.run.app`
- **Method:** `POST`
- **Auth:** Required (customer or seller)
- **Purpose:** Send message in order chat

---

## 👤 User Functions

### `linkGuestOrdersToAccount`
- **URL:** `https://linkguestorderstoaccount-q3rjv54uka-uc.a.run.app`
- **Method:** `POST`
- **Auth:** Required (user)
- **Purpose:** Link guest orders to user account after signup/login

---

## 🔍 Search Functions

### `searchProducts`
- **URL:** `https://searchproducts-q3rjv54uka-uc.a.run.app`
- **Method:** `GET` or `POST`
- **Auth:** Not required (public)
- **Purpose:** Search products by query

---

## 🧪 Test Function

### `helloWorld`
- **URL:** `https://helloworld-q3rjv54uka-uc.a.run.app`
- **Method:** `GET`
- **Auth:** Not required
- **Purpose:** Simple test function

---

## 🔐 Authentication

Functions that require authentication need a Firebase ID token in the header:

```typescript
headers: {
  'Authorization': `Bearer ${firebaseIdToken}`
}
```

**How to get Firebase ID token:**
```typescript
import { useFirebase } from '@/firebase/provider';

const { auth } = useFirebase();
const user = auth.currentUser;
const idToken = await user.getIdToken();
```

---

## 📝 Usage Example

```typescript
// Public function (no auth needed)
const response = await fetch('https://getbankslist-q3rjv54uka-uc.a.run.app');
const data = await response.json();
console.log(data.banks);

// Authenticated function
const idToken = await user.getIdToken();
const response = await fetch('https://getordersbycustomer-q3rjv54uka-uc.a.run.app', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${idToken}`
  },
  body: JSON.stringify({})
});
const data = await response.json();
```

---

## 🔍 View All Functions

You can also view all functions in Firebase Console:
- Go to: https://console.firebase.google.com/project/ikm-marketplace/functions
- See all deployed functions, logs, and metrics
