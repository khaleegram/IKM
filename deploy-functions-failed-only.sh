#!/bin/bash

# Deploy Only Failed Functions - Batch Script
# This script deploys only the functions that failed in the previous deployment

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

wait_between_batches() {
    local minutes=$1
    print_status "Waiting ${minutes} minutes before next batch..."
    sleep $((minutes * 60))
}

deploy_batch() {
    local batch_name=$1
    shift
    local functions=("$@")
    
    print_status "=========================================="
    print_status "Deploying Batch: ${batch_name}"
    print_status "Functions: ${#functions[@]}"
    print_status "=========================================="
    
    # Build the firebase deploy command
    # Firebase requires functions: prefix for each function
    local deploy_cmd="firebase deploy --only"
    for func in "${functions[@]}"; do
        deploy_cmd="${deploy_cmd} functions:${func}"
    done
    
    for func in "${functions[@]}"; do
        print_status "  - ${func}"
    done
    
    if eval "$deploy_cmd"; then
        print_status "✅ Batch '${batch_name}' deployed successfully!"
    else
        print_error "❌ Batch '${batch_name}' had errors"
    fi
    
    echo ""
}

# Failed functions from your deployment (grouped into batches)
# Batch 1: Shipping & Payouts
BATCH1=(
    "getPublicShippingZones"
    "getShippingZones"
    "createShippingZone"
    "updateShippingZone"
    "deleteShippingZone"
    "getShippingSettings"
    "updateShippingSettings"
)

# Batch 2: Payouts & Earnings
BATCH2=(
    "requestPayout"
    "cancelPayoutRequest"
    "getAllPayouts"
    "calculateSellerEarnings"
    "getSellerTransactions"
)

# Batch 3: Order Availability & Parks
BATCH3=(
    "respondToAvailabilityCheck"
    "createPark"
    "updatePark"
    "deletePark"
    "initializeParks"
)

# Batch 4: Security Functions (Failed ones)
BATCH4=(
    "getFailedLogins"
    "createApiKey"
)

# Batch 5: Admin & Other Failed Functions
BATCH5=(
    "markOrderAsSent"
    "getAllUsers"
    "updatePlatformSettings"
    "resolveDispute"
    "createNorthernProduct"
    "findRecentTransactionByEmail"
    "getBanksList"
    "updateNorthernProduct"
)

# Batch 6: More Admin Functions
BATCH6=(
    "getStoreSettings"
    "grantAdminRole"
    "deleteDiscountCode"
    "calculateShippingOptions"
    "deletePark"
    "getPlatformSettings"
    "generateSalesReport"
    "getCustomers"
)

# Batch 7: More Functions
BATCH7=(
    "getAllParks"
    "getAllOrders"
    "deleteProduct"
    "deleteShippingZone"
    "savePayoutDetails"
    "helloWorld"
    "getOrdersBySeller"
    "updateProduct"
)

# Batch 8: Final Batch
BATCH8=(
    "markOrderAsNotAvailable"
    "getDiscountCodes"
    "getParksByState"
    "revokeAdminRole"
    "updateDiscountCode"
    "updateShippingZone"
    "getShippingSettings"
    "updatePark"
    "createPark"
    "generateCustomerReport"
    "searchProducts"
    "createShippingZone"
    "getProduct"
)

print_status "Starting Failed Functions Deployment"
print_status "Total batches: 8"
echo ""

deploy_batch "1. Shipping Functions" "${BATCH1[@]}"
wait_between_batches 2

deploy_batch "2. Payouts & Earnings" "${BATCH2[@]}"
wait_between_batches 2

deploy_batch "3. Order Availability & Parks" "${BATCH3[@]}"
wait_between_batches 2

deploy_batch "4. Security Functions" "${BATCH4[@]}"
wait_between_batches 2

deploy_batch "5. Admin Functions (Part 1)" "${BATCH5[@]}"
wait_between_batches 2

deploy_batch "6. Admin Functions (Part 2)" "${BATCH6[@]}"
wait_between_batches 2

deploy_batch "7. More Functions" "${BATCH7[@]}"
wait_between_batches 2

deploy_batch "8. Final Batch" "${BATCH8[@]}"

print_status "=========================================="
print_status "🎉 All failed functions deployment complete!"
print_status "=========================================="

