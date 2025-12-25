# Cloud Functions - Quick Start Checklist

This is your **step-by-step checklist** to get Cloud Functions working. Follow this in order!

---

## ✅ Pre-Setup Checklist

Before you start, make sure you have:
- [ ] Node.js installed (v18 or higher)
- [ ] Firebase project created
- [ ] Firebase Console access

---

## 📝 Step-by-Step Setup

### Step 1: Install Firebase CLI (5 minutes)

```bash
npm install -g firebase-tools
```

**Verify:**
```bash
firebase --version
```

**Expected:** Should show version number like `12.9.3`

**If error:** Restart your terminal and try again.

---

### Step 2: Login to Firebase (2 minutes)

```bash
firebase login
```

**What to do:**
1. Browser opens automatically
2. Sign in with Google account
3. Allow Firebase CLI access
4. Return to terminal - should say "Success!"

**If browser doesn't open:**
```bash
firebase login --no-localhost
```
Copy the link and paste in browser.

---

### Step 3: Initialize Cloud Functions (5 minutes)

```bash
# Make sure you're in your project folder
cd C:\Users\User\Desktop\Projects\IKM

# Initialize functions
firebase init functions
```

**Answer the questions:**
1. **Language?** → Choose: **TypeScript**
2. **Use ESLint?** → Choose: **Yes**
3. **Install dependencies?** → Choose: **Yes**

**Wait for it to complete** - this creates the `functions` folder.

---

### Step 4: Verify Setup (1 minute)

```bash
# Check functions folder exists
dir functions

# Should see:
# - src/
# - package.json
# - tsconfig.json
# - node_modules/
```

---

### Step 5: Install Additional Packages (2 minutes)

```bash
cd functions
npm install firebase-admin firebase-functions zod
npm install --save-dev @types/node
cd ..
```

---

### Step 6: Set Environment Variables (3 minutes)

**Option A: Using Firebase Console (Easier for beginners)**

1. Go to: https://console.firebase.google.com/
2. Select your project
3. Click **Functions** in left menu
4. Click **Config** tab
5. Click **"Add variable"**
6. Add:
   - Name: `PAYSTACK_SECRET_KEY`
   - Value: (Get from your `.env.local` file)
   - Click **Save**

**Option B: Using CLI**

```bash
firebase functions:config:set paystack.secret_key="sk_test_YOUR_KEY_HERE"
```

**Get your key from:** `.env.local` file in your project root

---

### Step 7: Set Firebase Project (1 minute)

```bash
# Check current project
firebase use

# If wrong project, list all projects
firebase projects:list

# Set correct project
firebase use YOUR_PROJECT_ID
```

---

### Step 8: Test Deploy (5 minutes)

We'll deploy a simple test function first to make sure everything works.

**Edit `functions/src/index.ts`:**

Replace everything with:

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const helloWorld = functions.https.onRequest((request, response) => {
  response.json({ message: 'Hello from Cloud Functions! 🎉' });
});
```

**Deploy:**

```bash
cd functions
npm run build
cd ..
firebase deploy --only functions:helloWorld
```

**Expected output:**
```
✔  functions[helloWorld]: Successful create operation.
Function URL: https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/helloWorld
```

**Test it:**
- Copy the URL
- Paste in browser
- Should see: `{"message": "Hello from Cloud Functions! 🎉"}`

✅ **If this works, your setup is complete!**

---

## 🚀 Next Steps

Once setup is complete:

1. ✅ Read [CLOUD_FUNCTIONS_FUNCTIONS.md](./CLOUD_FUNCTIONS_FUNCTIONS.md) - See all available functions
2. ✅ Read [MOBILE_APP_INTEGRATION.md](./MOBILE_APP_INTEGRATION.md) - Learn how to call from mobile
3. ✅ Deploy actual business functions (we'll create these next)

---

## ❌ Troubleshooting

### "Firebase CLI not found"
```bash
npm install -g firebase-tools
# Restart terminal
```

### "Permission denied"
```bash
firebase login
```

### "Project not found"
```bash
firebase projects:list
firebase use YOUR_PROJECT_ID
```

### "Module not found" errors
```bash
cd functions
npm install
```

### TypeScript errors
Make sure Node.js is v18+:
```bash
node --version
```

---

## 📚 Full Documentation

- **Setup Guide:** [CLOUD_FUNCTIONS_SETUP_GUIDE.md](./CLOUD_FUNCTIONS_SETUP_GUIDE.md) - Detailed setup instructions
- **Function Reference:** [CLOUD_FUNCTIONS_FUNCTIONS.md](./CLOUD_FUNCTIONS_FUNCTIONS.md) - All available functions
- **Mobile Integration:** [MOBILE_APP_INTEGRATION.md](./MOBILE_APP_INTEGRATION.md) - How to use from mobile app

---

**You're ready to proceed!** 🎉

