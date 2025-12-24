# Firebase Firestore Database Structure

Complete documentation of all Firestore collections, fields, and data types for the IKM platform.

---

## Table of Contents

1. [Main Collections](#main-collections)
2. [Subcollections](#subcollections)
3. [Data Types Reference](#data-types-reference)
4. [Relationships](#relationships)
5. [Indexes Required](#indexes-required)

---

## Main Collections

### 1. `users` Collection

**Document ID**: `userId` (Firebase Auth UID)

**Description**: User profiles for both sellers and buyers

**Fields**:
```typescript
{
  // Basic Info
  id?: string;                    // Document ID (same as userId)
  displayName: string;            // User's display name
  email: string;                  // User's email address
  firstName?: string;             // First name
  lastName?: string;              // Last name
  phone?: string;                 // Phone number
  whatsappNumber?: string;        // WhatsApp number (format: +234...)
  
  // Role
  role?: 'buyer' | 'seller' | 'admin';  // User role: buyer, seller, or admin
  
  // Admin (deprecated - use role instead)
  isAdmin?: boolean;              // true if user is admin (kept for backward compatibility)
  
  // Seller Info (if user is a seller)
  storeName?: string;             // Store name
  storeDescription?: string;      // Store description
  storeLogoUrl?: string;          // Store logo image URL
  storeBannerUrl?: string;        // Store banner image URL
  
  // Location
  storeLocation?: {
    state: string;                // State
    lga: string;                  // Local Government Area
    city: string;                 // City
    address?: string;             // Full address
  };
  
  // Business Info
  businessType?: string;          // Business category
  
  // Policies
  storePolicies?: {
    shipping?: string;            // Shipping policy text
    returns?: string;             // Returns policy text
    refunds?: string;             // Refunds policy text
    privacy?: string;             // Privacy policy text
  };
  
  // Payout Details (for sellers)
  payoutDetails?: {
    bankName: string;             // Bank name
    bankCode: string;             // Bank code
    accountNumber: string;        // Account number
    accountName: string;          // Account name
  };
  
  // Onboarding
  onboardingCompleted?: boolean;  // true if seller completed onboarding
  
  // Guest Users
  isGuest?: boolean;              // true if created from guest checkout
  
  // Timestamps
  createdAt?: Timestamp;          // Account creation date
  updatedAt?: Timestamp;          // Last update date
}
```

**Subcollections**:
- `deliveryLocations` - Seller's delivery locations
- `addresses` - User's saved addresses (for buyers)

---

### 2. `stores` Collection

**Document ID**: `userId` (same as user ID)

**Description**: Store profiles and settings

**Fields**:
```typescript
{
  // Basic Info
  id?: string;                    // Document ID
  userId: string;                 // Owner's user ID
  storeName: string;              // Store name
  storeDescription?: string;      // Store description
  storeLogoUrl?: string;          // Logo URL
  storeBannerUrl?: string;        // Banner URL
  
  // Location
  storeLocation?: {
    state: string;
    lga: string;
    city: string;
    address?: string;
  };
  
  // Business
  businessType?: string;
  
  // Policies
  storePolicies?: {
    shipping?: string;
    returns?: string;
    refunds?: string;
    privacy?: string;
  };
  
  // Social Media
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  tiktokUrl?: string;
  
  // Store Hours
  storeHours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
  
  // Contact
  email?: string;
  phone?: string;
  website?: string;
  pickupAddress?: string;         // Default pickup address
  
  // Theme/Customization
  primaryColor?: string;          // Hex color (e.g., "#FF5733")
  secondaryColor?: string;        // Hex color
  fontFamily?: string;            // Font family name
  storeLayout?: 'grid' | 'list' | 'masonry';
  
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  
  // Domain
  subdomain?: string;             // Auto-generated subdomain
  customDomain?: string;          // Custom domain
  domainStatus?: 'none' | 'pending' | 'verified' | 'failed';
  dnsRecords?: Array<{
    type: 'A' | 'CNAME' | 'TXT';
    name: string;
    value: string;
    status?: 'pending' | 'verified' | 'failed';
    lastCheckedAt?: Timestamp;
  }>;
  
  // Shipping Settings
  shippingSettings?: {
    defaultPackagingType?: string;
    packagingCost?: number;
  };
  
  // Status
  onboardingCompleted?: boolean;
  
  // Timestamps
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
```

---

### 3. `products` Collection

**Document ID**: Auto-generated

**Description**: Product listings

**Fields**:
```typescript
{
  // Basic Info
  id?: string;                    // Document ID
  sellerId: string;               // Seller's user ID
  name: string;                   // Product name
  description?: string;           // Product description
  price: number;                  // Selling price (in NGN)
  compareAtPrice?: number;        // Original price (for discounts)
  stock: number;                  // Available stock quantity
  sku?: string;                   // Stock Keeping Unit
  imageUrl?: string;              // Main product image URL
  category?: string;              // Product category
  
  // Status
  status?: 'active' | 'draft' | 'inactive';
  isFeatured?: boolean;           // Featured product flag
  
  // Variants
  variants?: Array<{
    id: string;                   // Variant ID
    name: string;                 // Variant name (e.g., "Size", "Color")
    options: Array<{
      value: string;              // Option value (e.g., "Small", "Red")
      priceModifier: number;      // Price adjustment (+₦500, -₦200, etc.)
      stock: number;              // Stock for this option
      sku?: string;               // SKU for this option
    }>;
  }>;
  
  // Analytics
  views?: number;                 // Total views
  salesCount?: number;            // Total sales
  averageRating?: number;         // Average rating (1-5)
  reviewCount?: number;           // Total number of reviews
  
  // Timestamps
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
```

**Indexes Required**:
- `sellerId` (ascending)
- `category` (ascending)
- `status` (ascending)
- `isFeatured` (descending)
- `createdAt` (descending)

---

### 4. `orders` Collection

**Document ID**: Auto-generated

**Description**: Customer orders

**Fields**:
```typescript
{
  // Basic Info
  id?: string;                    // Document ID
  customerId: string;             // Customer's user ID (or guest ID)
  sellerId: string;               // Seller's user ID
  idempotencyKey: string;         // Unique key to prevent duplicate orders
  
  // Order Items
  items: Array<{
    productId: string;            // Product document ID
    name: string;                 // Product name
    price: number;                // Price per unit
    quantity: number;             // Quantity ordered
  }>;
  
  // Pricing
  total: number;                  // Total order amount (in NGN)
  shippingPrice?: number;         // Shipping cost
  shippingType?: 'delivery' | 'pickup';
  
  // Status
  status: 'Processing' | 'Sent' | 'Received' | 'Completed' | 'Cancelled' | 'Disputed';
  
  // Delivery Info
  deliveryAddress: string;        // Full delivery address
  customerInfo: {
    name: string;                 // Customer full name
    email: string;                // Customer email
    phone: string;                // Customer phone
    state?: string;               // Customer state
    isGuest?: boolean;            // true if guest order
  };
  
  // Payment
  paymentReference?: string;      // Paystack reference
  paystackReference?: string;    // Paystack reference (duplicate)
  paymentMethod?: string;         // Payment method (e.g., "Paystack")
  discountCode?: string;          // Applied discount code
  
  // Escrow
  escrowStatus: 'held' | 'released' | 'refunded';
  commissionRate?: number;        // Platform commission rate at time of order
  fundsReleasedAt?: Timestamp;    // When funds were released
  autoReleaseDate?: Timestamp;    // Auto-release date if no dispute
  
  // Delivery Tracking
  sentAt?: Timestamp;             // When order was sent
  sentPhotoUrl?: string;          // Photo proof of sending
  receivedAt?: Timestamp;         // When order was received
  receivedPhotoUrl?: string;      // Photo proof of receipt
  
  // Dispute
  dispute?: {
    id: string;
    orderId: string;
    openedBy: string;             // customerId
    type: 'item_not_received' | 'wrong_item' | 'damaged_item';
    description: string;
    status: 'open' | 'resolved' | 'closed';
    photos?: string[];            // Array of photo URLs
    resolvedBy?: string;          // adminId
    resolvedAt?: Timestamp;
    createdAt: Timestamp;
  };
  
  // Notes
  notes?: Array<{
    id: string;
    note: string;
    isInternal: boolean;          // true if seller/admin only
    createdBy: string;            // userId
    createdAt: Timestamp;
  }>;
  
  // Refunds
  refunds?: Array<{
    id: string;
    orderId: string;
    amount: number;
    reason: string;
    refundMethod: 'original_payment' | 'store_credit' | 'manual';
    status: 'pending' | 'processed' | 'failed';
    processedBy?: string;        // adminId
    createdAt: Timestamp;
    processedAt?: Timestamp;
  }>;
  
  // Timestamps
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
```

**Subcollections**:
- `chat` - Order chat messages

**Indexes Required**:
- `customerId` (ascending)
- `sellerId` (ascending)
- `status` (ascending)
- `createdAt` (descending)
- `idempotencyKey` (ascending) - Unique

---

### 5. `orders/{orderId}/chat` Subcollection

**Document ID**: Auto-generated

**Description**: Chat messages for each order

**Fields**:
```typescript
{
  id?: string;                    // Document ID
  orderId: string;               // Parent order ID
  senderId: string;              // User ID of sender
  senderType: 'customer' | 'seller' | 'system';
  message?: string;               // Text message
  imageUrl?: string;              // Image attachment URL
  isSystemMessage: boolean;      // true if system-generated
  createdAt?: Timestamp;
}
```

**Indexes Required**:
- `orderId` (ascending)
- `createdAt` (ascending)

---

### 6. `addresses` Collection

**Document ID**: Auto-generated

**Description**: User's saved delivery addresses

**Fields**:
```typescript
{
  id?: string;                    // Document ID
  userId: string;                 // User's ID
  label: string;                  // Address label (e.g., "Home", "Work")
  firstName: string;              // First name
  lastName: string;               // Last name
  phone: string;                  // Phone number
  address: string;                // Full address
  city: string;                   // City
  state: string;                  // State
  lga: string;                    // Local Government Area
  isDefault?: boolean;            // true if default address
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
```

**Indexes Required**:
- `userId` (ascending)
- `isDefault` (descending)

---

### 7. `payments` Collection

**Document ID**: Auto-generated

**Description**: Payment records

**Fields**:
```typescript
{
  id?: string;                    // Document ID
  orderId?: string;               // Related order ID
  customerId: string;             // Customer's user ID
  sellerId: string;               // Seller's user ID
  amount: number;                 // Payment amount (in NGN)
  reference: string;             // Paystack reference
  idempotencyKey: string;         // Unique key to prevent duplicates
  status: 'completed' | 'pending' | 'failed';
  method: string;                 // Payment method (e.g., "Paystack")
  discountCode?: string;          // Applied discount code
  isGuest?: boolean;              // true if guest payment
  verifiedAt?: Timestamp;         // When payment was verified
  createdAt?: Timestamp;
}
```

**Indexes Required**:
- `customerId` (ascending)
- `sellerId` (ascending)
- `orderId` (ascending)
- `reference` (ascending) - Unique
- `idempotencyKey` (ascending) - Unique

---

### 8. `shipping_zones` Collection

**Document ID**: Auto-generated

**Description**: Seller's shipping zones and rates

**Fields**:
```typescript
{
  id?: string;                    // Document ID
  sellerId: string;               // Seller's user ID
  name: string;                   // Zone name (e.g., "Lagos Zone")
  rate: number;                   // Shipping rate (in NGN)
  freeThreshold?: number;         // Order total for free shipping
  states?: string[];              // Array of states (e.g., ["Lagos", "Abuja"])
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
```

**Indexes Required**:
- `sellerId` (ascending)
- `createdAt` (descending)

---

### 9. `discount_codes` Collection

**Document ID**: Auto-generated

**Description**: Seller's discount codes

**Fields**:
```typescript
{
  id?: string;                    // Document ID
  sellerId: string;               // Seller's user ID
  code: string;                   // Discount code (UPPERCASE)
  type: 'percentage' | 'fixed';  // Discount type
  value: number;                  // Discount value (percentage 0-100 or fixed amount)
  uses: number;                  // Current usage count
  maxUses?: number;              // Maximum allowed uses
  minOrderAmount?: number;        // Minimum order amount to apply
  validFrom?: Timestamp;          // Start date
  validUntil?: Timestamp;         // End date
  status: 'active' | 'inactive' | 'expired';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
```

**Indexes Required**:
- `sellerId` (ascending)
- `code` (ascending)
- `status` (ascending)
- `validUntil` (ascending)

---

### 10. `email_campaigns` Collection

**Document ID**: Auto-generated

**Description**: Email marketing campaigns

**Fields**:
```typescript
{
  id?: string;                    // Document ID
  sellerId: string;               // Seller's user ID
  subject: string;                 // Email subject
  message: string;                // Email body (HTML supported)
  recipientType: 'all' | 'segment' | 'custom';
  segment?: 'VIP' | 'Regular' | 'New';
  recipientEmails?: string[];     // For custom type
  recipientCount: number;         // Number of recipients
  sentCount: number;              // Number of emails sent
  status: 'draft' | 'pending' | 'sending' | 'sent' | 'failed';
  sentAt?: Timestamp;            // When campaign was sent
  createdAt?: Timestamp;
}
```

**Indexes Required**:
- `sellerId` (ascending)
- `status` (ascending)
- `createdAt` (descending)

---

### 11. `reviews` Collection

**Document ID**: Auto-generated

**Description**: Product reviews

**Fields**:
```typescript
{
  id?: string;                    // Document ID
  productId: string;              // Product document ID
  userId: string;                 // Reviewer's user ID
  rating: number;                 // Rating (1-5)
  comment: string;                // Review text
  orderId?: string;               // Related order ID
  verifiedPurchase?: boolean;     // true if from verified purchase
  helpfulCount?: number;          // Number of helpful votes
  helpfulUsers?: string[];        // Array of user IDs who marked helpful
  sellerReply?: string;           // Seller's reply
  sellerReplyAt?: Timestamp;      // When seller replied
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
```

**Indexes Required**:
- `productId` (ascending)
- `userId` (ascending)
- `createdAt` (descending)
- `rating` (descending)

---

### 12. `wishlists` Collection

**Document ID**: Auto-generated

**Description**: User's wishlist items

**Fields**:
```typescript
{
  id?: string;                    // Document ID
  userId: string;                 // User's ID
  productId: string;              // Product document ID
  createdAt?: Timestamp;
}
```

**Indexes Required**:
- `userId` (ascending)
- `productId` (ascending)
- `createdAt` (descending)
- Composite: `userId` + `productId` (unique)

---

### 13. `recentlyViewed` Collection

**Document ID**: `userId` (user's ID)

**Description**: User's recently viewed products (single document per user)

**Fields**:
```typescript
{
  userId: string;                 // User's ID (same as document ID)
  products: Array<{
    productId: string;            // Product document ID
    viewedAt: Timestamp;          // When viewed
  }>;
  updatedAt?: Timestamp;
}
```

---

### 14. `notifications` Collection

**Document ID**: Auto-generated

**Description**: User notifications

**Fields**:
```typescript
{
  id?: string;                    // Document ID
  userId: string;                 // User's ID
  type: 'new_order' | 'order_confirmed' | 'order_status_update' | 
        'payout_completed' | 'payout_failed' | 'payout_reversed' | 
        'review_received' | 'message' | 'system';
  title: string;                  // Notification title
  message: string;                // Notification message
  orderId?: string;               // Related order ID
  payoutId?: string;              // Related payout ID
  read: boolean;                  // true if read
  link?: string;                  // Optional navigation link
  createdAt?: Timestamp;
}
```

**Indexes Required**:
- `userId` (ascending)
- `read` (ascending)
- `createdAt` (descending)

---

### 15. `payouts` Collection

**Document ID**: Auto-generated

**Description**: Seller payout requests

**Fields**:
```typescript
{
  id?: string;                    // Document ID
  sellerId: string;               // Seller's user ID
  amount: number;                 // Payout amount (in NGN)
  bankName: string;               // Bank name
  bankCode: string;               // Bank code
  accountNumber: string;          // Account number
  accountName: string;            // Account name
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  requestedAt?: Timestamp;       // When requested
  processedAt?: Timestamp;        // When processed
  processedBy?: string;           // Admin user ID
  transferReference?: string;    // Paystack transfer reference
  failureReason?: string;         // Reason if failed
  createdAt?: Timestamp;
}
```

**Indexes Required**:
- `sellerId` (ascending)
- `status` (ascending)
- `createdAt` (descending)

---

### 16. `transactions` Collection

**Document ID**: Auto-generated

**Description**: Financial transactions (sales, payouts, commissions, refunds)

**Fields**:
```typescript
{
  id?: string;                    // Document ID
  sellerId: string;               // Seller's user ID
  type: 'sale' | 'payout' | 'commission' | 'refund';
  amount: number;                 // Transaction amount (in NGN)
  orderId?: string;               // Related order ID
  payoutId?: string;              // Related payout ID
  description: string;            // Transaction description
  status: 'completed' | 'pending' | 'failed';
  createdAt?: Timestamp;
}
```

**Indexes Required**:
- `sellerId` (ascending)
- `type` (ascending)
- `status` (ascending)
- `createdAt` (descending)

---

### 17. `users/{userId}/deliveryLocations` Subcollection

**Document ID**: Auto-generated

**Description**: Seller's delivery locations

**Fields**:
```typescript
{
  id?: string;                    // Document ID
  name: string;                   // Location name
  createdAt?: Timestamp;
}
```

---

### 18. `users/{userId}/addresses` Subcollection

**Document ID**: Auto-generated

**Description**: User's saved addresses (alternative to main addresses collection)

**Fields**:
```typescript
{
  id?: string;                    // Document ID
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  state: string;
  isDefault: boolean;
  label: string;
  createdAt?: Timestamp;
}
```

---

## Additional Collections (System/Admin)

### 19. `platform_settings` Collection

**Document ID**: `main` (single document)

**Description**: Platform-wide settings

**Fields**:
```typescript
{
  commissionRate: number;         // Platform commission rate (0-100)
  minPayoutAmount: number;        // Minimum payout amount
  autoReleaseDays: number;        // Days before auto-release funds
  // ... other platform settings
  updatedAt?: Timestamp;
}
```

---

### 20. `settings` Collection

**Document ID**: `branding` (for branding settings)

**Description**: Platform branding settings

**Fields**:
```typescript
{
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  // ... other branding settings
}
```

---

### 21. `failed_payments` Collection

**Document ID**: Auto-generated

**Description**: Failed payment attempts (for reconciliation)

**Fields**:
```typescript
{
  reference: string;
  idempotencyKey: string;
  customerId: string;
  amount: number;
  error: string;
  retryCount: number;
  createdAt?: Timestamp;
}
```

---

### 22. `payment_mismatches` Collection

**Document ID**: Auto-generated

**Description**: Payment amount mismatches

**Fields**:
```typescript
{
  reference: string;
  idempotencyKey: string;
  expectedAmount: number;
  actualAmount: number;
  customerId: string;
  createdAt?: Timestamp;
}
```

---

### 23. `payment_retries` Collection

**Document ID**: Auto-generated

**Description**: Payment retry attempts

**Fields**:
```typescript
{
  reference: string;
  idempotencyKey: string;
  success: boolean;
  orderId?: string;
  retriedAt?: Timestamp;
}
```

---

### 24. `pending_payments` Collection

**Document ID**: Auto-generated

**Description**: Pending payment verifications

**Fields**:
```typescript
{
  reference: string;
  idempotencyKey: string;
  customerId: string;
  amount: number;
  createdAt?: Timestamp;
}
```

---

### 25. `reconciliation_logs` Collection

**Document ID**: Auto-generated

**Description**: Payment reconciliation logs

**Fields**:
```typescript
{
  date: string;                   // Date string (YYYY-MM-DD)
  totalPayments: number;
  totalAmount: number;
  reconciledAt?: Timestamp;
}
```

---

## Data Types Reference

### Timestamp
- **Type**: Firestore Timestamp
- **Format**: `Timestamp` object with `seconds` and `nanoseconds`
- **Example**: `{ seconds: 1699123456, nanoseconds: 0 }`
- **Conversion**: Use `toDate()` to convert to JavaScript Date

### Number
- **Type**: `number`
- **Currency**: All prices in NGN (Nigerian Naira)
- **Precision**: Store as integers (kobo) or decimals

### String
- **Type**: `string`
- **Case Sensitivity**: Discount codes are stored UPPERCASE

### Boolean
- **Type**: `boolean`
- **Values**: `true` or `false`

### Array
- **Type**: `Array<T>`
- **Example**: `string[]`, `number[]`, `object[]`

### Object/Nested Object
- **Type**: `object`
- **Example**: `{ state: string, city: string }`

---

## Relationships

### User → Store
- **Relationship**: One-to-One
- **Link**: `stores.userId` = `users.id`

### User → Products
- **Relationship**: One-to-Many
- **Link**: `products.sellerId` = `users.id`

### User → Orders (as Customer)
- **Relationship**: One-to-Many
- **Link**: `orders.customerId` = `users.id`

### User → Orders (as Seller)
- **Relationship**: One-to-Many
- **Link**: `orders.sellerId` = `users.id`

### Product → Reviews
- **Relationship**: One-to-Many
- **Link**: `reviews.productId` = `products.id`

### Order → Chat Messages
- **Relationship**: One-to-Many
- **Link**: `orders/{orderId}/chat` subcollection

### Order → Payment
- **Relationship**: One-to-One (optional)
- **Link**: `payments.orderId` = `orders.id`

### Seller → Shipping Zones
- **Relationship**: One-to-Many
- **Link**: `shipping_zones.sellerId` = `users.id`

### Seller → Discount Codes
- **Relationship**: One-to-Many
- **Link**: `discount_codes.sellerId` = `users.id`

### Seller → Email Campaigns
- **Relationship**: One-to-Many
- **Link**: `email_campaigns.sellerId` = `users.id`

### Seller → Payouts
- **Relationship**: One-to-Many
- **Link**: `payouts.sellerId` = `users.id`

### User → Addresses
- **Relationship**: One-to-Many
- **Link**: `addresses.userId` = `users.id`

### User → Wishlist
- **Relationship**: One-to-Many
- **Link**: `wishlists.userId` = `users.id`

---

## Indexes Required

### Composite Indexes

1. **orders**
   - `customerId` + `status` + `createdAt`
   - `sellerId` + `status` + `createdAt`

2. **products**
   - `sellerId` + `status` + `createdAt`
   - `category` + `status` + `createdAt`

3. **reviews**
   - `productId` + `createdAt`
   - `userId` + `createdAt`

4. **wishlists**
   - `userId` + `productId` (unique)

5. **notifications**
   - `userId` + `read` + `createdAt`

6. **payouts**
   - `sellerId` + `status` + `createdAt`

7. **transactions**
   - `sellerId` + `type` + `createdAt`

---

## Important Notes

1. **User Roles**: 
   - `role: 'buyer'` - Regular customers who can purchase products
   - `role: 'seller'` - Users who have a store and can sell products
   - `role: 'admin'` - Platform administrators
   - Default role for signup is `'seller'` (they get a store)
   - Default role for checkout account creation is `'buyer'` (no store created)
   - Guest users are created with `role: 'buyer'`

2. **Guest Users**: Guest checkout creates users with `isGuest: true` and ID format: `guest_{email}_{timestamp}`

2. **Idempotency Keys**: Used in orders and payments to prevent duplicates. Must be unique.

3. **Timestamps**: Always use `FieldValue.serverTimestamp()` when creating/updating documents.

4. **Status Fields**: Many collections have status fields - always check valid enum values.

5. **Subcollections**: 
   - `orders/{orderId}/chat` - Order chat messages
   - `users/{userId}/deliveryLocations` - Seller delivery locations
   - `users/{userId}/addresses` - User addresses (alternative)

6. **Required Fields**: Fields without `?` are required. Fields with `?` are optional.

7. **Array Fields**: Some fields are arrays (e.g., `items`, `variants.options`, `states`). Handle accordingly.

---

## Query Examples

### Get all products for a seller
```typescript
firestore.collection('products')
  .where('sellerId', '==', sellerId)
  .where('status', '==', 'active')
  .orderBy('createdAt', 'desc')
```

### Get orders for a customer
```typescript
firestore.collection('orders')
  .where('customerId', '==', customerId)
  .orderBy('createdAt', 'desc')
```

### Get shipping zones for a seller
```typescript
firestore.collection('shipping_zones')
  .where('sellerId', '==', sellerId)
  .orderBy('createdAt', 'desc')
```

### Get order chat messages
```typescript
firestore.collection('orders')
  .doc(orderId)
  .collection('chat')
  .orderBy('createdAt', 'asc')
```

---

## End of Documentation

This document contains all Firestore collections, fields, and relationships used in the IKM platform. Use this as a reference when building the mobile application.

