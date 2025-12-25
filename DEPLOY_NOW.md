# Deploy Functions Now

The config is set, but functions were skipped during the last deploy. You need to **force a redeploy** so functions pick up the config.

## Run This Command:

```bash
firebase deploy --only functions --force
```

The `--force` flag will redeploy all functions even if no code changes were detected.

## Or Make a Small Code Change:

If `--force` doesn't work, we can add a comment to trigger a redeploy:

```bash
echo "// Updated $(date)" >> functions/src/index.ts
cd functions && npm run build && cd ..
firebase deploy --only functions
```

## After Deploy:

Test it:
```bash
curl https://us-central1-ikm-marketplace.cloudfunctions.net/getBanksList
```

You should see bank data, not an error!

