# 🚀 Payout Automation - Setup Guide

## ✅ What Was Implemented

### 1. **Configurable Processing Time**
- Added `payoutProcessingDays` to platform settings (default: 3 days)
- Admin can configure this in `/admin/settings`
- Range: 1-30 business days

### 2. **Dynamic Processing Date Calculation**
- When seller requests payout, system calculates `expectedProcessingDate`
- Uses business days (excludes weekends)
- Stored in payout document for automation

### 3. **Automated Payout Processing**
- New function: `processDuePayouts()` - processes all payouts that are due
- New cron endpoint: `/api/cron/process-payouts`
- Automatically transfers money via Paystack when due date arrives

### 4. **Updated UI Messages**
- Payout page now shows dynamic processing time
- Toast messages use configured days instead of hardcoded "1-3 days"

---

## 🔧 Setup Instructions

### Step 1: Configure Processing Days (Optional)

1. Go to `/admin/settings`
2. Find "Payout Processing Time" section
3. Set your desired processing days (default: 3)
4. Click "Save Settings"

### Step 2: Set Up Cron Job

You need to call the cron endpoint daily. Options:

#### Option A: Vercel Cron (Recommended if using Vercel)

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/process-payouts?secret=YOUR_SECRET_TOKEN",
      "schedule": "0 9 * * *"
    }
  ]
}
```

#### Option B: External Cron Service

Use a service like:
- **cron-job.org** (free)
- **EasyCron** (free tier available)
- **GitHub Actions** (free)

**Cron Schedule:** `0 9 * * *` (9:00 AM UTC daily)

**URL:** `https://your-domain.com/api/cron/process-payouts?secret=YOUR_SECRET_TOKEN`

#### Option C: Firebase Cloud Scheduler (If using Firebase)

Create a scheduled function that calls the endpoint.

---

### Step 3: Set Environment Variable

Add to `.env.local`:
```env
CRON_SECRET=your-super-secret-token-here
```

**Important:** Use a strong, random secret token!

---

## 🔄 How It Works

### Flow:

1. **Seller Requests Payout**
   - System calculates `expectedProcessingDate` (request date + processing days)
   - Payout status: `pending`
   - Payout stored with expected date

2. **Daily Cron Job Runs**
   - Checks all `pending` payouts
   - Finds payouts where `expectedProcessingDate <= today`
   - Processes each due payout automatically

3. **Automatic Processing**
   - Creates Paystack transfer recipient
   - Initiates transfer to seller's bank account
   - Updates payout status to `completed` or `failed`
   - Creates transaction record
   - Sends email notification to seller

4. **Webhook Confirmation**
   - Paystack sends webhook when transfer completes
   - System updates payout status if needed

---

## 📊 Monitoring

### Check Payout Status

- **Seller View:** `/seller/payouts` - See all payouts and status
- **Admin View:** `/admin/payouts` - See all payouts across platform

### Check Cron Job

Call the endpoint manually:
```
GET https://your-domain.com/api/cron/process-payouts?secret=YOUR_SECRET_TOKEN
```

Response:
```json
{
  "success": true,
  "message": "Payout processing completed. 2 processed, 0 failed.",
  "processed": 2,
  "failed": 0,
  "processedIds": ["payout-id-1", "payout-id-2"],
  "failedDetails": [],
  "timestamp": "2024-01-15T09:00:00.000Z"
}
```

---

## ⚠️ Important Notes

1. **Business Days Only**: Processing days exclude weekends (Saturday & Sunday)
2. **Manual Override**: Admins can still manually process payouts in `/admin/payouts`
3. **Failed Payouts**: If automatic processing fails, payout status is set to `failed` with error message
4. **Balance Check**: System verifies seller has sufficient balance before processing
5. **Paystack Balance**: Ensure your Paystack account has sufficient balance for transfers

---

## 🐛 Troubleshooting

### Payouts Not Processing

1. **Check Cron Job**: Verify cron job is running
2. **Check Logs**: Check server logs for errors
3. **Check Paystack**: Verify Paystack secret key is configured
4. **Check Balance**: Ensure Paystack account has funds
5. **Check Expected Date**: Verify `expectedProcessingDate` has passed

### Manual Processing Still Works

Admins can still manually process payouts:
- Go to `/admin/payouts`
- Click "Process" on any pending payout
- This bypasses the expected date check

---

## 🔐 Security

- Cron endpoint is protected by `CRON_SECRET` token
- Always use HTTPS for cron endpoint
- Never commit `CRON_SECRET` to version control
- Use strong, random token (32+ characters)

---

## 📝 Files Modified

1. `src/lib/firebase/firestore/platform-settings.ts` - Added `payoutProcessingDays`
2. `src/lib/platform-settings-actions.ts` - Added getter and schema
3. `src/app/admin/settings/page.tsx` - Added UI for configuration
4. `src/app/(app)/seller/payouts/page.tsx` - Dynamic message
5. `src/lib/payout-request-actions.ts` - Added automation functions
6. `src/app/api/cron/process-payouts/route.ts` - New cron endpoint

---

## 🎉 Result

- ✅ Payouts process automatically after configured days
- ✅ No manual admin intervention needed
- ✅ Configurable processing time
- ✅ Business days calculation (excludes weekends)
- ✅ Email notifications to sellers
- ✅ Transaction records created automatically

