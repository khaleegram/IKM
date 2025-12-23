# Cron Job Setup for Auto-Release Escrow

The auto-release escrow feature requires a daily cron job to automatically release funds for orders that have been marked as "Sent" for 7+ days without any disputes.

## Vercel Cron (Recommended)

If you're using Vercel, the cron job is already configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/auto-release-escrow",
      "schedule": "0 2 * * *"
    }
  ]
}
```

This runs daily at 2:00 AM UTC.

### Security

Add a `CRON_SECRET` environment variable in Vercel:

1. Go to your Vercel project settings
2. Navigate to Environment Variables
3. Add `CRON_SECRET` with a secure random string
4. Update the cron URL in `vercel.json` to include the secret:
   ```
   /api/cron/auto-release-escrow?secret=YOUR_SECRET
   ```

## External Cron Service

If you're not using Vercel, you can use an external cron service:

### Option 1: EasyCron / Cron-Job.org

1. Sign up for a free cron service
2. Create a new cron job with:
   - URL: `https://your-domain.com/api/cron/auto-release-escrow?secret=YOUR_SECRET`
   - Schedule: Daily at 2:00 AM
   - Method: GET or POST

### Option 2: GitHub Actions

Create `.github/workflows/auto-release-escrow.yml`:

```yaml
name: Auto-Release Escrow

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2:00 AM UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - name: Call API
        run: |
          curl -X GET "https://your-domain.com/api/cron/auto-release-escrow?secret=${{ secrets.CRON_SECRET }}"
```

## Manual Testing

You can manually trigger the auto-release by calling:

```bash
curl -X GET "https://your-domain.com/api/cron/auto-release-escrow?secret=YOUR_SECRET"
```

Or visit the URL in your browser (if GET method is enabled).

## Monitoring

The API returns a JSON response with:
- `success`: boolean
- `released`: number of orders processed
- `message`: status message
- `timestamp`: when the job ran

Check your server logs to monitor the cron job execution.

