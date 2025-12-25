# 🚀 Deploy Cloud Functions - Complete Guide

## Step 1: Build Functions

```bash
cd functions
npm run build
```

This compiles TypeScript to JavaScript in `functions/lib/`.

---

## Step 2: Deploy All Functions

```bash
# From project root
firebase deploy --only functions
```

This will deploy ALL functions. It may take 5-10 minutes.

---

## Step 3: Get Function URLs

After deployment, get all function URLs:

```bash
firebase functions:list
```

Or check Firebase Console:
https://console.firebase.google.com/project/ikm-marketplace/functions

---

## Step 4: Update URLs in Code

After deployment, you'll get actual URLs. Update these files:

### 1. `src/lib/cloud-functions.ts`

Update the `FUNCTION_URLS` object with actual URLs from deployment.

### 2. Documentation Files

Update URLs in:
- `FUNCTION_URLS.md`
- `SELLER_FUNCTIONS_COMPLETE.md`
- `ADMIN_FUNCTIONS_COMPLETE.md`
- `ALL_FUNCTIONS_URLS.md`

---

## Step 5: Verify Deployment

Test a function:

```bash
curl https://helloworld-q3rjv54uka-uc.a.run.app
```

Should return: `{"message":"Hello from Cloud Functions! 🎉"}`

---

## 📋 Functions Deployed

### Seller Functions (16)
- ✅ Product Management (5 functions)
- ✅ Dashboard & Analytics (2 functions)
- ✅ Reports (2 functions)
- ✅ Marketing (4 functions)
- ✅ Store Management (2 functions)
- ✅ Customers (1 function)

### Admin Functions (7)
- ✅ User Management (3 functions)
- ✅ Platform Settings (2 functions)
- ✅ Orders & Disputes (2 functions)

### Other Functions (7)
- ✅ Payment (2 functions)
- ✅ Orders (5 functions)
- ✅ Shipping (1 function)
- ✅ Payouts (3 functions)
- ✅ Chat (1 function)
- ✅ User (1 function)
- ✅ Search (1 function)

**Total: 30+ functions**

---

## ⚠️ Important Notes

1. **First Deployment**: May take 10-15 minutes
2. **Subsequent Deployments**: Only changed functions deploy (faster)
3. **URLs**: Function URLs are generated automatically
4. **Secrets**: Paystack secret is already configured
5. **CORS**: All functions have CORS enabled for mobile apps

---

## 🔍 Troubleshooting

### Function not found
- Check function name matches exactly
- Verify function is deployed: `firebase functions:list`
- Check Firebase Console for errors

### Authentication errors
- Verify Firebase ID token is valid
- Check token includes required claims (isAdmin, etc.)
- Ensure token is not expired

### CORS errors
- All functions have CORS enabled
- Check request headers include `Content-Type: application/json`

---

## 📱 Mobile App Integration

After deployment, your mobile app can call any function using the URLs in:
- `SELLER_FUNCTIONS_COMPLETE.md` - For seller functions
- `ADMIN_FUNCTIONS_COMPLETE.md` - For admin functions

All functions are ready for mobile app integration! 🎉

