# Debugging Guide - Data Fetching Issues

## How to Debug Data Fetching

### 1. Check Browser Console

Open your browser's developer console (F12) and look for these logs:

#### Products
- `🔍 Products Query: Setting up listener...` - Listener is being set up
- `📦 Products Snapshot:` - Shows how many products were fetched
- `✅ Products loaded: X products` - Confirms products were loaded
- `❌ Error fetching all products:` - Shows error if fetch failed

#### Stores/Users
- `🔍 Users Query: Setting up listener...` - Listener is being set up
- `👥 Users Snapshot:` - Shows how many users were fetched
- `🏪 All User Profiles Fetched:` - Shows stores found
- `❌ Error fetching all user profiles:` - Shows error if fetch failed

#### User Profile
- `🔍 User Profile Query: Setting up listener for userId: ...` - Listener is being set up
- `📥 User profile updated:` - Shows profile data when fetched
- `🔄 Setting new profile state:` - Shows what's being set in state
- `❌ Error fetching user profile:` - Shows error if fetch failed

#### Store Setup Progress
- `🔍 Setup Progress Calculation:` - Shows what data is being evaluated
- `✅ Task Completion Status:` - Shows which tasks are completed
- `📊 StoreSetupProgress Component:` - Shows what the component is rendering

### 2. Common Issues and Fixes

#### Issue: "No query available, firestore might not be initialized"
**Cause:** Firebase Client SDK not initialized
**Fix:** 
- Check that `FirebaseClientProvider` wraps your app in `layout.tsx`
- Check browser console for Firebase initialization errors
- Verify environment variables are set

#### Issue: "Error code: permission-denied"
**Cause:** Security rules blocking access
**Fix:**
- Check `firestore.rules` file
- Verify rules allow public read for products/users
- Deploy updated rules: `firebase deploy --only firestore:rules`

#### Issue: "Products loaded: 0 products"
**Cause:** No products in database OR query not matching
**Fix:**
- Check Firestore console to see if products exist
- Verify product documents have required fields
- Check if `createdAt` field exists (needed for sorting)

#### Issue: "Stores with storeName: 0"
**Cause:** Users don't have `storeName` field set
**Fix:**
- Check Firestore console - user documents need `storeName` field
- Verify store setup was completed successfully
- Check that `storeName` is not empty string

#### Issue: "0 of 7 tasks completed" but data exists
**Cause:** Profile data not being fetched or structure mismatch
**Fix:**
- Check console logs for `📥 User profile updated:` - verify data structure
- Check `🔍 Setup Progress Calculation:` - verify fields are being read
- Verify profile document in Firestore has all required fields

### 3. Verify Data in Firestore Console

1. Go to Firebase Console → Firestore Database
2. Check `products` collection - should have documents
3. Check `users` collection - should have documents with `storeName`
4. Verify field names match what code expects:
   - Products: `initialPrice` (not `price`)
   - Users: `storeName`, `storeDescription`, `storeLocation`, `businessType`

### 4. Test Security Rules

1. Go to Firebase Console → Firestore → Rules
2. Click "Rules Playground"
3. Test queries:
   - Read products (should work for anyone)
   - Read users (should work for anyone)
   - List products (should work for anyone)
   - List users (should work for anyone)

### 5. Network Tab

Check browser Network tab:
- Look for Firestore requests
- Check if requests are returning 200 OK
- Check response data
- Look for CORS errors

### 6. Environment Variables

Verify these are set in `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### 7. Clear Cache and Reload

Sometimes cached data causes issues:
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Clear browser cache
3. Restart dev server

## Quick Debug Checklist

- [ ] Firebase initialized? (Check console for errors)
- [ ] Security rules deployed? (Check Firebase Console)
- [ ] Data exists in Firestore? (Check Firebase Console)
- [ ] Field names match? (`initialPrice` not `price`)
- [ ] Environment variables set? (Check `.env.local`)
- [ ] Console shows listener setup? (Check browser console)
- [ ] No permission errors? (Check console for `permission-denied`)
- [ ] Network requests successful? (Check Network tab)

