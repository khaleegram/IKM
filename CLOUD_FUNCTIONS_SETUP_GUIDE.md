# Firebase Cloud Functions - Complete Setup Guide

## 🎯 What Are Cloud Functions?

Cloud Functions let you run server-side code in the cloud. Instead of having server logic in your Next.js app, you put it in Cloud Functions that both your **web app** and **mobile app** can call. This means:
- ✅ Write business logic once, use it everywhere
- ✅ Better security (server-side only)
- ✅ Automatic scaling
- ✅ Works with both web and mobile apps

---

## 📋 Prerequisites

Before starting, make sure you have:
1. ✅ Node.js installed (v18 or higher) - [Download here](https://nodejs.org/)
2. ✅ A Firebase project (you already have this!)
3. ✅ Firebase CLI installed (we'll install this together)

---

## Step 1: Install Firebase CLI

**What is Firebase CLI?**
It's a tool that lets you deploy and manage your Cloud Functions from your computer.

### Installation:

**On Windows (Git Bash or PowerShell):**
```bash
npm install -g firebase-tools
```

**Verify installation:**
```bash
firebase --version
```
You should see something like: `12.9.3` or higher.

**If you get an error:**
- Make sure Node.js is installed: `node --version`
- If you see "command not found", restart your terminal

---

## Step 2: Login to Firebase

You need to connect your computer to your Firebase project.

```bash
firebase login
```

**What happens:**
1. Your browser will open
2. Sign in with your Google account (the one you use for Firebase)
3. Allow Firebase CLI to access your account
4. Come back to the terminal - it should say "Success! Logged in as..."

**If browser doesn't open:**
```bash
firebase login --no-localhost
```
This gives you a link to paste in your browser.

---

## Step 3: Initialize Cloud Functions in Your Project

**IMPORTANT:** We'll create Cloud Functions in a `functions` folder at the root of your project.

### Navigate to your project folder:
```bash
cd C:\Users\User\Desktop\Projects\IKM
```

### Initialize Firebase Functions:
```bash
firebase init functions
```

**You'll see questions - answer like this:**

1. **"What language would you like to use?"**
   - Select: **TypeScript** (arrow keys to navigate, Enter to select)

2. **"Do you want to use ESLint?"**
   - Select: **Yes**

3. **"Do you want to install dependencies?"**
   - Select: **Yes**

**What this does:**
- Creates a `functions` folder
- Creates `functions/package.json`
- Creates `functions/tsconfig.json`
- Installs necessary packages

**Expected output:**
```
✔  Firebase initialization complete!
```

---

## Step 4: Verify Setup

Check that the `functions` folder was created:

```bash
ls functions
# or on Windows PowerShell:
dir functions
```

You should see:
- `package.json`
- `tsconfig.json`
- `src/index.ts`
- `node_modules/` (folder)

---

## Step 5: Install Additional Dependencies

Navigate to the functions folder and install packages we need:

```bash
cd functions
npm install firebase-admin firebase-functions zod
npm install --save-dev @types/node
```

**What each package does:**
- `firebase-admin` - Access to Firestore, Auth, Storage from server
- `firebase-functions` - Create HTTP functions, triggers, etc.
- `zod` - Validate input data (same as your Next.js app)

---

## Step 6: Configure Firebase Project

Make sure Cloud Functions knows which Firebase project to use:

**Option 1: If you only have one Firebase project:**
The `firebase init` should have already set this. Verify:
```bash
firebase use
```

**Option 2: If you have multiple projects:**
```bash
firebase projects:list
```
Find your project ID, then:
```bash
firebase use YOUR_PROJECT_ID
```

---

## Step 7: Set Up Environment Variables

Cloud Functions need your Paystack secret key and other secrets.

### Method 1: Using Firebase Console (Recommended for beginners)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **Functions** in the left menu
4. Click **Config** tab
5. Click **"Add variable"**
6. Add:
   - Name: `PAYSTACK_SECRET_KEY`
   - Value: Your secret key from `.env.local`

### Method 2: Using Firebase CLI

```bash
firebase functions:config:set paystack.secret_key="sk_test_YOUR_KEY_HERE"
```

**Get your secret key:**
- Look in your `.env.local` file
- Copy the value of `PAYSTACK_SECRET_KEY`

**View current config:**
```bash
firebase functions:config:get
```

---

## Step 8: Understanding the Structure

After setup, your project will look like this:

```
IKM/
├── src/                    # Your Next.js app (existing)
├── functions/              # Cloud Functions (NEW!)
│   ├── src/
│   │   └── index.ts       # Main functions file
│   ├── package.json       # Functions dependencies
│   └── tsconfig.json      # TypeScript config
├── firebase.json           # Firebase config (created)
└── .firebaserc            # Project ID (created)
```

---

## Step 9: Write Your First Cloud Function

We'll create example functions in the next step. For now, let's test that everything works.

### Edit `functions/src/index.ts`:

Replace the entire file with this simple test:

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Simple test function
export const helloWorld = functions.https.onRequest((request, response) => {
  response.json({ message: 'Hello from Cloud Functions! 🎉' });
});
```

**Save the file.**

---

## Step 10: Deploy Your First Function

**IMPORTANT:** Deploying functions costs money (very small amount), but Firebase gives you a free tier.

### Deploy:
```bash
cd functions
npm run build
cd ..
firebase deploy --only functions
```

**What happens:**
1. TypeScript code compiles to JavaScript
2. Code uploads to Firebase
3. Firebase creates the function
4. You get a URL to call the function

**Expected output:**
```
✔  functions[helloWorld]: Successful create operation.
Function URL: https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/helloWorld
```

**If you see errors:**
- Make sure you're logged in: `firebase login`
- Make sure you're in the project root (not functions folder)
- Check that Node.js version is v18+

---

## Step 11: Test Your Function

Copy the URL from the deploy output, then:

**In browser:**
Just paste the URL in your browser. You should see:
```json
{"message": "Hello from Cloud Functions! 🎉"}
```

**Using curl (if you have it):**
```bash
curl https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/helloWorld
```

---

## ✅ Setup Complete!

You've successfully:
- ✅ Installed Firebase CLI
- ✅ Logged into Firebase
- ✅ Initialized Cloud Functions
- ✅ Deployed your first function
- ✅ Tested it works

---

## 🔧 Common Issues & Solutions

### Issue 1: "Firebase CLI not found"
**Solution:**
```bash
npm install -g firebase-tools
```
Restart your terminal after installing.

### Issue 2: "Permission denied"
**Solution:**
Make sure you're logged in:
```bash
firebase login
```

### Issue 3: "Project not found"
**Solution:**
List your projects and select the right one:
```bash
firebase projects:list
firebase use YOUR_PROJECT_ID
```

### Issue 4: "Module not found" errors
**Solution:**
Make sure you installed dependencies in the functions folder:
```bash
cd functions
npm install
```

### Issue 5: TypeScript errors
**Solution:**
Make sure you're using Node.js v18+:
```bash
node --version
```
If it's v16 or lower, update Node.js.

---

## 📚 Next Steps

1. ✅ Complete this setup guide (you just did!)
2. ✅ Read the **CLOUD_FUNCTIONS_FUNCTIONS.md** guide to see all available functions
3. ✅ Read the **MOBILE_APP_INTEGRATION.md** guide to use functions from your mobile app
4. ✅ Test functions using the examples

---

## 💡 Important Notes

1. **Costs:** Cloud Functions have a generous free tier (2 million invocations/month free)
2. **Cold Starts:** First call after inactivity might be slower (1-2 seconds)
3. **Logs:** View function logs in Firebase Console → Functions → Logs
4. **Updates:** When you change function code, you must deploy again
5. **Environment Variables:** Never commit secrets to Git!

---

## 🆘 Need Help?

- Firebase Docs: https://firebase.google.com/docs/functions
- Firebase Console: https://console.firebase.google.com/
- Check function logs: `firebase functions:log`

---

**You're ready! Let's create the actual business functions next!** 🚀

