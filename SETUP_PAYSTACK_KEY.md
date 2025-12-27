# Setting Up Paystack Secret Key for Cloud Functions

## ⚠️ Important

Your `firebase.json` has `disallowLegacyRuntimeConfig: true`, which means you should use **environment variables (secrets)** instead of the legacy config system.

---

## Method 1: Using Firebase Console (Recommended)

This is the **new and recommended** method for Firebase Functions.

### Steps:

1. Go to: https://console.firebase.google.com/
2. Select your project
3. Click **Functions** in the left menu
4. Click **Secrets** tab (not Config!)
5. Click **"Add secret"**
6. Enter:
   - **Name:** `PAYSTACK_SECRET_KEY`
   - **Value:** Your Paystack secret key (from `.env.local`)
7. Click **Save**

**That's it!** The function will automatically have access to `process.env.PAYSTACK_SECRET_KEY`.

---

## Method 2: Using Firebase CLI (Legacy - Not Recommended)

If you want to use the legacy config method (not recommended with your setup):

```bash
# Note: Must use 2-part key format (paystack.secret_key, not paystack_secret_key)
firebase functions:config:set paystack.secret_key="sk_live_"
```

**But wait!** Your `firebase.json` has `disallowLegacyRuntimeConfig: true`, which means this method won't work.

**Solution:** Either:
1. Remove `disallowLegacyRuntimeConfig: true` from `firebase.json`, OR
2. Use Method 1 (Secrets) instead (recommended)

---

## Method 3: Remove Legacy Config Restriction

If you prefer to use the legacy config method:

1. Edit `firebase.json`
2. Remove or set `disallowLegacyRuntimeConfig: false`
3. Then use:
   ```bash
   firebase functions:config:set paystack.secret_key=""
   ```

---

## ✅ Recommended: Use Method 1 (Secrets)

**Why?**
- ✅ Modern approach
- ✅ More secure
- ✅ Works with your current `firebase.json` setup
- ✅ Better for production

**Steps:**
1. Firebase Console → Functions → Secrets
2. Add secret: `PAYSTACK_SECRET_KEY`
3. Value: Your secret key
4. Deploy functions

---

## 🔍 Verify It's Set

After setting the secret, deploy and test:

```bash
firebase deploy --only functions
```

Then test a function that uses Paystack (like `verifyPaymentAndCreateOrder`). If it works, the key is set correctly!

---

## 📝 Note

The code automatically checks:
1. First: `process.env.PAYSTACK_SECRET_KEY` (secrets/environment variables)
2. Fallback: `functions.config().paystack.secret_key` (legacy config)

So either method will work, but **Method 1 (Secrets) is recommended**.

