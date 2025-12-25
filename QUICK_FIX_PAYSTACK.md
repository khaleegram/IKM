# Quick Fix - Set Paystack Key and Deploy

## Run These Commands (Copy & Paste):

```bash
# 1. Set the Paystack key
firebase functions:config:set paystack.secret_key="sk_live_a5692b9836dc8cce64e756611711d666e11c7a91"

# 2. Verify it's set
firebase functions:config:get

# 3. Build functions
cd functions
npm run build
cd ..

# 4. Deploy all functions
firebase deploy --only functions

# 5. Test it works
curl https://us-central1-ikm-marketplace.cloudfunctions.net/getBanksList
```

## Or Use the Batch File (Windows):

Just run:
```bash
setup-paystack-and-deploy.bat
```

---

## What I've Done:

✅ Updated `firebase.json` to allow legacy config (`disallowLegacyRuntimeConfig: false`)
✅ Created setup scripts for you
✅ Code is ready - just needs the key set and redeploy

---

## After Running Commands:

You should see:
- ✅ Config set successfully
- ✅ Functions deploy successfully  
- ✅ `getBanksList` returns bank data (not an error)

Then you're done! 🎉

