# Setting IAM Permissions for Parks Functions

## Important Note

With Firebase Functions v2, setting `invoker: 'public'` in the function code should automatically configure IAM permissions during deployment. **You may not need to run these commands manually.**

However, if you encounter 403 errors after deployment, you can set the permissions manually using the commands below.

## Prerequisites

1. Install Google Cloud CLI (gcloud):
   - Download from: https://cloud.google.com/sdk/docs/install
   - Or use package manager:
     - Windows (Chocolatey): `choco install gcloudsdk`
     - macOS (Homebrew): `brew install --cask google-cloud-sdk`
     - Linux: Follow instructions at the download page

2. Authenticate gcloud:
   ```bash
   gcloud auth login
   gcloud config set project ikm-marketplace
   ```

## Set IAM Permissions

Run these commands to allow public (unauthenticated) access to the parks functions:

```bash
# Make getAllParks publicly accessible
gcloud functions add-iam-policy-binding getAllParks \
  --region=us-central1 \
  --member="allUsers" \
  --role="roles/cloudfunctions.invoker"

# Make getParksByState publicly accessible
gcloud functions add-iam-policy-binding getParksByState \
  --region=us-central1 \
  --member="allUsers" \
  --role="roles/cloudfunctions.invoker"
```

## Verify Permissions

To verify the permissions were set correctly:

```bash
# Check getAllParks permissions
gcloud functions get-iam-policy getAllParks --region=us-central1

# Check getParksByState permissions
gcloud functions get-iam-policy getParksByState --region=us-central1
```

You should see `allUsers` with the role `roles/cloudfunctions.invoker` in the output.

## Alternative: Using Firebase Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: `ikm-marketplace`
3. Navigate to **Cloud Functions**
4. Click on `getAllParks` function
5. Go to **Permissions** tab
6. Click **Add Principal**
7. Add:
   - Principal: `allUsers`
   - Role: `Cloud Functions Invoker`
8. Repeat for `getParksByState`

## Troubleshooting

### If you get "Permission denied" error:
- Make sure you have the `roles/iam.securityAdmin` or `roles/owner` role on the project
- Contact your project administrator

### If functions still return 403 after setting permissions:
1. Wait 1-2 minutes for changes to propagate
2. Verify the function names are correct (case-sensitive)
3. Check that you're using the correct region (`us-central1`)
4. Try redeploying the functions to ensure `invoker: 'public'` is applied

## Current Project

- **Project ID**: `ikm-marketplace`
- **Region**: `us-central1`
- **Functions**:
  - `getAllParks`
  - `getParksByState`

