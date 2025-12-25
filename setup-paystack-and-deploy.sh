#!/bin/bash
# Setup Paystack key and deploy all functions

echo "🔧 Setting Paystack secret key..."
firebase functions:config:set paystack.secret_key="sk_live_a5692b9836dc8cce64e756611711d666e11c7a91"

echo ""
echo "✅ Config set! Verifying..."
firebase functions:config:get

echo ""
echo "🚀 Building functions..."
cd functions
npm run build
cd ..

echo ""
echo "🚀 Deploying all functions..."
firebase deploy --only functions

echo ""
echo "✅ Done! Testing getBanksList..."
curl -s https://us-central1-ikm-marketplace.cloudfunctions.net/getBanksList | head -20

