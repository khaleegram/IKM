#!/bin/bash

# Cloud Functions Batch Deployment Script
# Fixes "No function matches" error and manages CPU Quota limits

set -e 

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[INFO]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }

# If "firebase functions:list" shows names like "default:functionName", keep this as "default:"
# If it just shows "functionName", change this to "" (empty)
CODEBASE_PREFIX="default:" 

deploy_batch() {
    local batch_name=$1
    shift
    local functions=("$@")
    
    echo "------------------------------------------"
    print_status "Deploying Batch: ${batch_name}"
    
    local func_list=""
    for func in "${functions[@]}"; do
        if [ -z "$func_list" ]; then
            func_list="functions:${CODEBASE_PREFIX}${func}"
        else
            func_list="${func_list},functions:${CODEBASE_PREFIX}${func}"
        fi
    done
    
    if firebase deploy --only "$func_list"; then
        print_status "✅ Batch '${batch_name}' success!"
    else
        print_error "❌ Batch '${batch_name}' failed."
    fi
}

wait_between_batches() {
    print_status "Waiting $1 minutes for CPU quota reset..."
    sleep $(($1 * 60))
}

# --- BATCH DEFINITIONS ---
BATCH1=("verifyPaymentAndCreateOrder" "updateOrderStatus" "markOrderAsReceived" "getOrdersByCustomer" "resolveAccountNumber")
BATCH2=("createProduct" "getSellerProducts" "getDashboardStats" "getSellerAnalytics" "createDiscountCode" "updateStoreSettings")
BATCH3=("getPublicShippingZones" "getShippingZones" "createShippingZone" "updateShippingZone" "deleteShippingZone")
BATCH4=("getShippingSettings" "updateShippingSettings" "markOrderAsSent" "sendOrderMessage" "linkGuestOrdersToAccount")
BATCH5=("requestPayout" "cancelPayoutRequest" "getAllPayouts" "calculateSellerEarnings" "getSellerTransactions")
BATCH6=("getAllParks" "getParksByState" "createPark" "updatePark" "deletePark" "initializeParks")
BATCH7=("markOrderAsNotAvailable" "respondToAvailabilityCheck" "searchProducts" "getProduct" "updateProduct" "deleteProduct")
BATCH8=("createNorthernProduct" "updateNorthernProduct" "findRecentTransactionByEmail" "getBanksList" "savePayoutDetails")
BATCH9=("getAllUsers" "grantAdminRole" "revokeAdminRole" "getPlatformSettings" "updatePlatformSettings" "getAllOrders")
BATCH10=("resolveDispute" "getStoreSettings" "getCustomers" "getDiscountCodes" "updateDiscountCode" "deleteDiscountCode")
BATCH11=("generateSalesReport" "generateCustomerReport" "calculateShippingOptions" "getOrdersBySeller")
BATCH12=("getAccessLogs" "getFailedLogins" "getApiKeys" "createApiKey" "revokeApiKey")
BATCH13=("getSecuritySettings" "updateSecuritySettings" "getAuditTrail" "getFirestoreRules")
BATCH14=("helloWorld")

# --- EXECUTION ---
print_status "Starting Cloud Functions Batch Deployment"
print_status "Total Batches: 14"

deploy_batch "1. Payments" "${BATCH1[@]}"
wait_between_batches 2

deploy_batch "2. Products & Store" "${BATCH2[@]}"
wait_between_batches 2

deploy_batch "3. Shipping Zones" "${BATCH3[@]}"
wait_between_batches 2

deploy_batch "4. Shipping & Guest Links" "${BATCH4[@]}"
wait_between_batches 2

deploy_batch "5. Payouts" "${BATCH5[@]}"
wait_between_batches 2

deploy_batch "6. Parks" "${BATCH6[@]}"
wait_between_batches 2

deploy_batch "7. Availability & Products" "${BATCH7[@]}"
wait_between_batches 2

deploy_batch "8. Northern & Email Search" "${BATCH8[@]}"
wait_between_batches 2

deploy_batch "9. Admin & Users" "${BATCH9[@]}"
wait_between_batches 2

deploy_batch "10. Disputes & Discount Admin" "${BATCH10[@]}"
wait_between_batches 2

deploy_batch "11. Analytics & Reporting" "${BATCH11[@]}"
wait_between_batches 2

deploy_batch "12. Security Logs" "${BATCH12[@]}"
wait_between_batches 2

deploy_batch "13. Audit & Rules" "${BATCH13[@]}"
wait_between_batches 2

deploy_batch "14. Misc" "${BATCH14[@]}"

print_status "=========================================="
print_status "🎉 All batches finished!"
print_status "=========================================="