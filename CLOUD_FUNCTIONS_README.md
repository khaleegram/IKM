# Cloud Functions - Complete Guide Index

Welcome! This is your **complete guide** to setting up and using Cloud Functions for your web and mobile apps.

---

## 🎯 What Are Cloud Functions?

Cloud Functions let you run server-side code in the cloud. Instead of having business logic in your Next.js app, you put it in Cloud Functions that **both your web app and mobile app** can call.

**Benefits:**
- ✅ Write business logic once, use it everywhere
- ✅ Better security (server-side only)
- ✅ Automatic scaling
- ✅ Works with both web and mobile apps

---

## 📚 Documentation Guide

Follow these guides **in order**:

### 1. **Quick Start** (Start Here!)
**File:** [CLOUD_FUNCTIONS_QUICK_START.md](./CLOUD_FUNCTIONS_QUICK_START.md)

**What it is:** Step-by-step checklist to get Cloud Functions working in 30 minutes.

**When to use:** First time setting up Cloud Functions.

**Time required:** 30 minutes

---

### 2. **Detailed Setup Guide**
**File:** [CLOUD_FUNCTIONS_SETUP_GUIDE.md](./CLOUD_FUNCTIONS_SETUP_GUIDE.md)

**What it is:** Comprehensive setup guide with detailed explanations of every step.

**When to use:** If you want to understand everything in detail, or if you run into issues.

**Time required:** 1 hour

---

### 3. **Function Reference**
**File:** [CLOUD_FUNCTIONS_FUNCTIONS.md](./CLOUD_FUNCTIONS_FUNCTIONS.md)

**What it is:** Complete list of all available Cloud Functions with request/response examples.

**When to use:** When you need to know what functions are available and how to call them.

**Includes:**
- Payment functions
- Order functions
- Product functions
- User functions
- Shipping functions
- And more...

---

### 4. **Mobile App Integration**
**File:** [MOBILE_APP_INTEGRATION.md](./MOBILE_APP_INTEGRATION.md)

**What it is:** Complete tutorial on how to call Cloud Functions from your mobile app.

**When to use:** When integrating Cloud Functions into your React Native, Flutter, or native mobile app.

**Includes:**
- Step-by-step code examples
- Authentication setup
- Error handling
- Best practices
- Troubleshooting

**Examples for:**
- React Native
- Flutter
- Native iOS (Swift)
- Native Android (Kotlin)

---

### 5. **Directory Structure**
**File:** [FUNCTIONS_DIRECTORY_STRUCTURE.md](./FUNCTIONS_DIRECTORY_STRUCTURE.md)

**What it is:** Explanation of the `functions` folder structure.

**When to use:** To understand how Cloud Functions are organized.

---

## 🚀 Quick Start Path

**New to Cloud Functions?** Follow this path:

1. ✅ Read [CLOUD_FUNCTIONS_QUICK_START.md](./CLOUD_FUNCTIONS_QUICK_START.md)
2. ✅ Complete the setup checklist
3. ✅ Test with the "helloWorld" function
4. ✅ Read [CLOUD_FUNCTIONS_FUNCTIONS.md](./CLOUD_FUNCTIONS_FUNCTIONS.md) to see available functions
5. ✅ Read [MOBILE_APP_INTEGRATION.md](./MOBILE_APP_INTEGRATION.md) to integrate in mobile app

**Total time:** ~2 hours for complete setup and understanding

---

## 🔑 Key Concepts

### Authentication
All functions require Firebase authentication (except public ones).

**How it works:**
1. User logs in with Firebase Auth
2. Mobile app gets ID token
3. Token sent in `Authorization: Bearer TOKEN` header
4. Function verifies token server-side

### Function Types

**HTTP Functions** (what we're using):
- Called via HTTP POST/GET
- Return JSON responses
- Can be called from anywhere (web, mobile, etc.)

**Background Functions** (not covered here):
- Triggered by events (Firestore writes, etc.)
- Run automatically
- Don't return responses

---

## 📋 Available Functions (Summary)

### Payment Functions
- `verifyPaymentAndCreateOrder` - Verify Paystack payment and create order
- `findRecentTransactionByEmail` - Find recent transaction (fallback)

### Order Functions
- `updateOrderStatus` - Update order status
- `markOrderAsSent` - Mark order as sent (seller)
- `markOrderAsReceived` - Mark order as received (customer)
- `getOrdersByCustomer` - Get customer's orders
- `getOrdersBySeller` - Get seller's orders

### Product Functions
- `createProduct` - Create new product
- `updateProduct` - Update product
- `deleteProduct` - Delete product

### User Functions
- `updateUserProfile` - Update user profile
- `linkGuestOrdersToAccount` - Link guest orders after signup

### Shipping Functions
- `calculateShippingOptions` - Calculate shipping (public)

### Payout Functions
- `getBanksList` - Get list of banks (public)
- `resolveAccountNumber` - Resolve account number
- `savePayoutDetails` - Save payout details

### Review Functions
- `createReview` - Create product review

### Chat Functions
- `sendOrderMessage` - Send order chat message

### Search Functions
- `searchProducts` - Search products (public)

**See [CLOUD_FUNCTIONS_FUNCTIONS.md](./CLOUD_FUNCTIONS_FUNCTIONS.md) for complete details.**

---

## ⚠️ Important Notes

### Costs
- **Free tier:** 2 million function invocations/month
- **After free tier:** $0.40 per million invocations
- **Very cheap** for most apps!

### Performance
- **Cold start:** First call after inactivity takes 1-2 seconds
- **Warm calls:** Subsequent calls are fast (~100ms)
- **Timeout:** Functions timeout after 60 seconds

### Security
- ✅ Always verify authentication server-side
- ✅ Never trust client-side data
- ✅ Use environment variables for secrets
- ✅ Validate all input data

---

## 🆘 Need Help?

### Common Issues

**"Function not found"**
- Check function URL is correct
- Make sure function is deployed

**"Unauthorized"**
- Check user is logged in
- Check token is in Authorization header

**"Timeout"**
- Function takes longer than 60 seconds
- Optimize function code

**"Network error"**
- Check internet connection
- Check function URL is correct

### Getting Help

1. **Check logs:**
   ```bash
   firebase functions:log
   ```

2. **Firebase Console:**
   - https://console.firebase.google.com/
   - Functions → Logs

3. **Firebase Docs:**
   - https://firebase.google.com/docs/functions

---

## ✅ Checklist

Before using Cloud Functions, make sure you've:

- [ ] Completed [CLOUD_FUNCTIONS_QUICK_START.md](./CLOUD_FUNCTIONS_QUICK_START.md)
- [ ] Deployed at least one test function
- [ ] Set up environment variables
- [ ] Read [CLOUD_FUNCTIONS_FUNCTIONS.md](./CLOUD_FUNCTIONS_FUNCTIONS.md)
- [ ] Read [MOBILE_APP_INTEGRATION.md](./MOBILE_APP_INTEGRATION.md)
- [ ] Tested a function call from your app

---

## 🎉 You're Ready!

Once you complete the setup, you'll have:
- ✅ Cloud Functions deployed and working
- ✅ Shared business logic for web and mobile
- ✅ Complete documentation
- ✅ Code examples for mobile integration

**Let's get started!** Begin with [CLOUD_FUNCTIONS_QUICK_START.md](./CLOUD_FUNCTIONS_QUICK_START.md)

---

**Questions?** Check the individual guides for detailed explanations!

