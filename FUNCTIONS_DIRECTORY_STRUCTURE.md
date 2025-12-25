# Cloud Functions Directory Structure

This document explains the structure of the `functions` folder that will be created when you run `firebase init functions`.

---

## 📁 Folder Structure

After running `firebase init functions`, you'll have:

```
IKM/
├── functions/                    # Cloud Functions folder
│   ├── src/                     # Source code
│   │   ├── index.ts            # Main entry point (all functions here)
│   │   └── ...                 # Other TypeScript files (optional)
│   ├── lib/                    # Compiled JavaScript (auto-generated)
│   │   └── index.js           # Don't edit this - it's compiled from src/
│   ├── node_modules/           # Dependencies
│   ├── package.json            # Functions dependencies
│   ├── tsconfig.json           # TypeScript configuration
│   └── .eslintrc.js            # ESLint configuration (if you chose ESLint)
├── firebase.json               # Firebase config (updated with functions)
└── .firebaserc                 # Your Firebase project ID
```

---

## 📄 Key Files Explained

### `functions/package.json`

**What it is:** Lists all packages (dependencies) your functions need.

**Example:**
```json
{
  "name": "functions",
  "scripts": {
    "build": "tsc",
    "serve": "npm run build && firebase emulators:start --only functions",
    "shell": "npm run build && firebase functions:shell",
    "start": "npm run shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log"
  },
  "engines": {
    "node": "18"
  },
  "main": "lib/index.js",
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^5.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

**Important:**
- `dependencies` - Packages your functions need to run
- `devDependencies` - Packages needed only for development (TypeScript, etc.)

---

### `functions/tsconfig.json`

**What it is:** TypeScript configuration - tells TypeScript how to compile your code.

**You don't need to edit this** - it's already configured correctly.

---

### `functions/src/index.ts`

**What it is:** This is where you write all your Cloud Functions!

**Structure:**
```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin (only do this once!)
admin.initializeApp();

// Example function
export const helloWorld = functions.https.onRequest((request, response) => {
  response.json({ message: 'Hello!' });
});

// Export all your functions here
export const verifyPaymentAndCreateOrder = functions.https.onRequest(async (request, response) => {
  // Your code here
});

export const createProduct = functions.https.onRequest(async (request, response) => {
  // Your code here
});

// ... more functions
```

**Important:**
- Each function must be `export const functionName = ...`
- Functions are HTTP endpoints that can be called via POST/GET
- All functions share the same Firebase Admin instance

---

### `functions/lib/`

**What it is:** Compiled JavaScript code (auto-generated).

**Don't edit files here!** They're automatically generated when you run:
```bash
npm run build
```

**What happens:**
1. You write TypeScript in `src/index.ts`
2. Run `npm run build`
3. TypeScript compiles to JavaScript in `lib/index.js`
4. Firebase deploys from `lib/` folder

---

## 🔧 Development Workflow

### 1. Write Function Code

Edit `functions/src/index.ts`:
```typescript
export const myFunction = functions.https.onRequest(async (request, response) => {
  // Write your code here
});
```

### 2. Build

```bash
cd functions
npm run build
```

**What this does:**
- Compiles TypeScript → JavaScript
- Outputs to `lib/` folder
- Checks for errors

### 3. Deploy

```bash
cd ..
firebase deploy --only functions
```

**Or deploy specific function:**
```bash
firebase deploy --only functions:myFunction
```

---

## 📦 Adding Dependencies

**To add a new package:**

```bash
cd functions
npm install package-name
```

**Example:**
```bash
npm install zod          # Add zod for validation
npm install uuid         # Add uuid for generating IDs
```

**Then rebuild:**
```bash
npm run build
```

---

## 🧪 Testing Locally (Optional)

**Run functions locally:**

```bash
cd functions
npm run serve
```

**What this does:**
- Starts Firebase emulator
- Functions run on `http://localhost:5001`
- Useful for testing before deploying

**Note:** Local testing is optional - you can deploy directly if you prefer.

---

## 📝 File Organization Tips

### Option 1: All functions in one file (Simple)

**Good for:** Small projects, learning

Put all functions in `functions/src/index.ts`:
```typescript
// All functions here
export const function1 = ...;
export const function2 = ...;
export const function3 = ...;
```

### Option 2: Split into multiple files (Organized)

**Good for:** Large projects, better organization

Create separate files:
```
functions/src/
├── index.ts              # Main file (exports all functions)
├── payments.ts           # Payment-related functions
├── orders.ts             # Order-related functions
├── products.ts           # Product-related functions
└── utils.ts              # Helper functions
```

**Example `functions/src/payments.ts`:**
```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const verifyPayment = functions.https.onRequest(async (request, response) => {
  // Payment logic here
});
```

**Example `functions/src/index.ts`:**
```typescript
export * from './payments';
export * from './orders';
export * from './products';
```

---

## 🔒 Environment Variables

**How to access environment variables:**

**In function code:**
```typescript
const paystackKey = functions.config().paystack.secret_key;
```

**Set in Firebase Console or CLI:**
```bash
firebase functions:config:set paystack.secret_key="your-key-here"
```

---

## 📚 Summary

1. **Write code** in `functions/src/index.ts`
2. **Build** with `npm run build`
3. **Deploy** with `firebase deploy --only functions`
4. **Functions compile** from TypeScript (src/) to JavaScript (lib/)
5. **Don't edit** `lib/` folder - it's auto-generated

---

**Next:** See the actual function implementations in the guides!

