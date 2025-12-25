# Cloud Functions Deployment Guide

## ✅ Functions Created!

All Cloud Functions have been created! Here's what you have:

### Functions List

1. **Payment Functions**
   - `verifyPaymentAndCreateOrder` - Verify Paystack payment and create order
   - `findRecentTransactionByEmail` - Find recent transaction by email/amount

2. **Order Functions**
   - `updateOrderStatus` - Update order status
   - `markOrderAsSent` - Mark order as sent (seller)
   - `markOrderAsReceived` - Mark order as received (customer)
   - `getOrdersByCustomer` - Get customer's orders
   - `getOrdersBySeller` - Get seller's orders

3. **Shipping Functions** (Public)
   - `calculateShippingOptions` - Calculate shipping options

4. **Payout Functions**
   - `getBanksList` - Get list of banks (public)
   - `resolveAccountNumber` - Resolve account number
   - `savePayoutDetails` - Save payout details

5. **Chat Functions**
   - `sendOrderMessage` - Send order chat message

6. **User Functions**
   - `linkGuestOrdersToAccount` - Link guest orders to account

7. **Search Functions** (Public)
   - `searchProducts` - Search products

---

## 📋 Deployment Steps

### Step 1: Set Environment Variables

**IMPORTANT:** You need to set your Paystack secret key in Firebase Console.

**Option A: Using Firebase Console (Recommended)**

1. Go to: https://console.firebase.google.com/
2. Select your project
3. Click **Functions** in left menu
4. Click **Config** tab
5. Click **"Add variable"**
6. Add:
   - **Name:** `PAYSTACK_SECRET_KEY`
   - **Value:** Your Paystack secret key (from `.env.local` - copy the value of `PAYSTACK_SECRET_KEY`)
7. Click **Save**

**Option B: Using Firebase CLI**

```bash
firebase functions:config:set paystack.secret_key="sk_test_YOUR_KEY_HERE"
```

**Get your key:**
- Look in `.env.local` file
- Copy the value of `PAYSTACK_SECRET_KEY`

---

### Step 2: Build Functions

Make sure TypeScript compiles without errors:

```bash
cd functions
npm run build
```

**Expected output:**
- Should create `lib/` folder with compiled JavaScript
- No errors (warnings are okay)

**If you see errors:**
- Check the error messages
- Fix any TypeScript issues
- Run `npm run build` again

---

### Step 3: Deploy Functions

**Deploy all functions:**

```bash
# Make sure you're in project root (not functions folder)
cd ..
firebase deploy --only functions
```

**Expected output:**
```
✔  functions[helloWorld]: Successful create operation.
✔  functions[verifyPaymentAndCreateOrder]: Successful create operation.
✔  functions[findRecentTransactionByEmail]: Successful create operation.
✔  functions[updateOrderStatus]: Successful create operation.
...
Function URLs:
  helloWorld: https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/helloWorld
  verifyPaymentAndCreateOrder: https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/verifyPaymentAndCreateOrder
  ...
```

**Save these URLs!** You'll need them to call functions from your apps.

---

### Step 4: Verify Deployment

**Test a function:**

1. Copy the `helloWorld` function URL from deployment output
2. Paste it in your browser
3. Should see: `{"message": "Hello from Cloud Functions! 🎉"}`

**Check function logs:**

```bash
firebase functions:log
```

**Or in Firebase Console:**
- Go to Functions → Logs
- See all function invocations and errors

---

## 🔧 Troubleshooting

### Error: "Paystack secret key is not configured"

**Solution:**
- Make sure you set `PAYSTACK_SECRET_KEY` in Firebase Console → Functions → Config
- Or set it via CLI: `firebase functions:config:set paystack.secret_key="YOUR_KEY"`

### Error: "Module not found"

**Solution:**
```bash
cd functions
npm install
npm run build
```

### Error: TypeScript compilation errors

**Solution:**
- Check error messages in `npm run build` output
- Fix TypeScript errors
- Make sure all imports are correct

### Functions not deploying

**Solution:**
- Make sure you're logged in: `firebase login`
- Make sure you're in the correct project: `firebase use`
- Check your Firebase project has Functions enabled (Billing plan required)

---

## 📝 Function URLs

After deployment, you'll get URLs like:

```
https://us-central1-YOUR-PROJECT.cloudfunctions.net/verifyPaymentAndCreateOrder
https://us-central1-YOUR-PROJECT.cloudfunctions.net/getOrdersByCustomer
https://us-central1-YOUR-PROJECT.cloudfunctions.net/calculateShippingOptions
...
```

**Save these URLs!** You'll need them for:
- Mobile app integration (see [MOBILE_APP_INTEGRATION.md](./MOBILE_APP_INTEGRATION.md))
- Web app integration (optional - you can still use server actions)

---

## ✅ Next Steps

1. ✅ Deploy functions (you just did this!)
2. ✅ Test functions work (call helloWorld)
3. ✅ Save function URLs
4. ✅ Read [MOBILE_APP_INTEGRATION.md](./MOBILE_APP_INTEGRATION.md) to use from mobile app
5. ✅ (Optional) Update web app to use Cloud Functions instead of server actions

---

## 🎉 You're Done!

Your Cloud Functions are now:
- ✅ Created
- ✅ Deployed
- ✅ Ready to use from web and mobile apps!

**Check the function reference:** [CLOUD_FUNCTIONS_FUNCTIONS.md](./CLOUD_FUNCTIONS_FUNCTIONS.md)

