# 🔧 Fix: Paystack Config Not Accessible in Functions

## Problem
Firebase Functions v2 (2nd Gen) doesn't support `functions.config()` the same way as v1. The config was set but functions can't access it.

## ✅ Temporary Fix (Applied)
Added a hardcoded fallback key in `functions/src/utils.ts` to get things working immediately.

## 🔄 Proper Solution: Use Firebase Secrets

### Step 1: Set the Secret
```bash
firebase functions:secrets:set PAYSTACK_SECRET_KEY
# When prompted, paste: sk_live
```

### Step 2: Update Function Definition
In `functions/src/index.ts`, update functions that need the secret:

```typescript
import { defineSecret } from 'firebase-functions/params';

// Define the secret
const paystackSecret = defineSecret('PAYSTACK_SECRET_KEY');

// Update function to use secret
export const getBanksList = functions
  .runWith({ secrets: [paystackSecret] })
  .https.onRequest(async (request, response) => {
    // Access secret value
    const paystackKey = paystackSecret.value();
    // ... rest of function
  });
```

### Step 3: Update utils.ts
Remove hardcoded key and use secret:

```typescript
export function getPaystackSecretKey(secret?: string): string {
  // Use provided secret (from defineSecret)
  if (secret) return secret;
  
  // Fallback to env var
  if (process.env.PAYSTACK_SECRET_KEY) {
    return process.env.PAYSTACK_SECRET_KEY;
  }
  
  throw new Error('Paystack secret not configured');
}
```

### Step 4: Redeploy
```bash
firebase deploy --only functions
```

## ⚠️ Current Status
- ✅ Temporary fix: Hardcoded key works
- ⏳ TODO: Migrate to Firebase Secrets (proper solution)

