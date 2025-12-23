# How to Deploy Firestore Index

## Prerequisites

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase** (if not already done):
   ```bash
   firebase init
   ```
   - Select "Firestore" when prompted
   - Choose your Firebase project

## Deploy the Index

### Option 1: Deploy Only Indexes (Recommended)
```bash
firebase deploy --only firestore:indexes
```

### Option 2: Deploy Everything
```bash
firebase deploy
```

## Verify Deployment

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Indexes** tab
4. You should see an index for:
   - Collection: `stores`
   - Fields: `userId` (Ascending)
   - Status: **Enabled** (may take a few minutes to build)

## Index Building Time

- **Small collections**: Usually ready in 1-2 minutes
- **Large collections**: Can take 5-10 minutes or more
- You'll see the status change from "Building" to "Enabled" when ready

## Troubleshooting

### If you get "Project not found" error:
```bash
firebase use --add
```
Then select your project from the list.

### If you get permission errors:
Make sure you're logged in and have the correct permissions:
```bash
firebase login --reauth
```

### Check current project:
```bash
firebase projects:list
firebase use <project-id>
```

## After Deployment

Once the index is enabled, your store queries should work immediately. The real-time listeners will start returning results once the index is built.

