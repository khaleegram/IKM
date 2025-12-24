# IKM Platform - Complete Architecture Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Application Architecture](#application-architecture)
4. [Database Schema (Firestore)](#database-schema-firestore)
5. [Authentication & Authorization](#authentication--authorization)
6. [Payment System](#payment-system)
7. [Order & Delivery System](#order--delivery-system)
8. [Shipping System](#shipping-system)
9. [Chat System](#chat-system)
10. [Dispute Resolution](#dispute-resolution)
11. [Platform Settings](#platform-settings)
12. [Seller Dashboard Features](#seller-dashboard-features)
13. [File Structure](#file-structure)
14. [API Routes](#api-routes)
15. [Security](#security)
16. [Deployment](#deployment)

---

## System Overview

IKM is a **Local-First, Northern Nigeria Reality** e-commerce platform designed for sellers and customers in Northern Nigeria. The platform emphasizes:

- **Escrow-based payments** - Funds held until customer confirmation
- **Customer confirmation is final** - No transport data overrides customer confirmation
- **Optional photos** - Used for transparency, never enforced
- **Central chat system** - Every order has a conversation thread
- **Simple dispute resolution** - Human-reviewed disputes
- **State-based shipping** - Sellers configure shipping zones by state
- **Pickup options** - For areas where sellers don't ship

### Core Philosophy
> "We do not control transport. We control money, confirmation, communication, and disputes. If the customer confirms receipt, that is truth."

---

## Technology Stack

### Frontend
- **Framework**: Next.js 15.5.9 (App Router)
- **UI Library**: React 18+ with TypeScript
- **UI Components**: Shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS
- **State Management**: React Hooks (useState, useEffect, useTransition, useMemo, useCallback)
- **Form Handling**: React Hook Form (implicit via Shadcn)
- **Icons**: Lucide React
- **Charts**: Recharts
- **Date Handling**: date-fns

### Backend
- **Runtime**: Node.js (Vercel Serverless Functions)
- **Server Actions**: Next.js Server Actions ('use server')
- **API Routes**: Next.js API Routes
- **Validation**: Zod schemas
- **Idempotency**: Custom implementation with localStorage + Firestore

### Database & Storage
- **Primary Database**: Firebase Firestore
- **File Storage**: Firebase Storage
- **Real-time Updates**: Firestore onSnapshot listeners
- **Offline Support**: Firestore automatic reconnection

### Third-Party Services
- **Payment Gateway**: Paystack API
- **Email Service**: Resend API
- **Authentication**: Firebase Auth
- **Hosting**: Vercel
- **Cron Jobs**: Vercel Cron (via vercel.json)

### Development Tools
- **Package Manager**: npm/yarn
- **Build Tool**: Turbopack (Next.js)
- **Type Checking**: TypeScript
- **Linting**: ESLint (implicit)

---

## Application Architecture

### Architecture Pattern
- **Hybrid Architecture**: Server Components + Client Components + Server Actions
- **Data Flow**: 
  - Client Components → Server Actions → Firestore Admin SDK
  - Real-time: Firestore Client SDK → onSnapshot → Client Components
- **State Management**: 
  - Server State: Firestore hooks (useOrdersBySeller, useProductsBySeller, etc.)
  - Client State: React useState/useReducer
  - Payment State: localStorage (for recovery)

### Key Design Decisions

1. **Server Actions for Mutations**: All writes go through Server Actions for security and validation
2. **Client Hooks for Reads**: Real-time reads use Firestore client SDK hooks
3. **Idempotency Keys**: Payment processing uses idempotency keys to prevent duplicates
4. **Escrow System**: Funds held in escrow until customer confirmation or auto-release
5. **State-Based Shipping**: Shipping calculated based on customer state and seller zones

---

## Database Schema (Firestore)

### Collections

#### `users` (Document ID: userId)
```typescript
{
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  isAdmin?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `stores` (Document ID: userId)
```typescript
{
  userId: string;
  storeName: string;
  storeDescription?: string;
  storeLogoUrl?: string;
  storeBannerUrl?: string;
  storeLocation?: {
    state: string;
    lga: string;
    city: string;
    address?: string;
  };
  businessType?: string;
  storePolicies?: {
    shipping?: string;
    returns?: string;
    refunds?: string;
    privacy?: string;
  };
  // Social media
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  tiktokUrl?: string;
  // Store hours
  storeHours?: {
    monday?: string;
    tuesday?: string;
    // ... other days
  };
  // Contact info
  email?: string;
  phone?: string;
  website?: string;
  pickupAddress?: string; // Default pickup address
  // Store theme
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  storeLayout?: 'grid' | 'list' | 'masonry';
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  // Domain
  subdomain?: string; // Auto-generated subdomain
  customDomain?: string;
  domainStatus?: 'none' | 'pending' | 'verified' | 'failed';
  // Shipping settings
  shippingSettings?: {
    defaultPackagingType?: string;
    packagingCost?: number;
  };
  onboardingCompleted?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `products` (Document ID: auto-generated)
```typescript
{
  sellerId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  category?: string;
  stock?: number;
  status: 'active' | 'inactive' | 'draft';
  views?: number; // For analytics
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `orders` (Document ID: auto-generated)
```typescript
{
  customerId: string;
  sellerId: string;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  total: number;
  status: 'Processing' | 'Sent' | 'Received' | 'Completed' | 'Cancelled' | 'Disputed';
  deliveryAddress: string; // Or "PICKUP: [address]" for pickup orders
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    state?: string;
  };
  // Payment
  paymentReference?: string;
  paystackReference?: string;
  idempotencyKey?: string; // For preventing duplicate orders
  // Commission
  commissionRate?: number; // Commission rate at time of order
  // Escrow
  escrowStatus: 'held' | 'released' | 'refunded';
  fundsReleasedAt?: Timestamp;
  // Delivery tracking
  sentAt?: Timestamp;
  sentPhotoUrl?: string;
  receivedAt?: Timestamp;
  receivedPhotoUrl?: string;
  autoReleaseDate?: Timestamp; // Date when funds auto-release
  // Shipping
  shippingType?: 'delivery' | 'pickup';
  shippingPrice?: number;
  // Discount
  discountCode?: string;
  // Dispute
  dispute?: {
    id: string;
    orderId: string;
    openedBy: string; // customerId
    type: 'item_not_received' | 'wrong_item' | 'damaged_item';
    description: string;
    status: 'open' | 'resolved' | 'closed';
    photos?: string[];
    resolvedBy?: string; // adminId
    resolvedAt?: Timestamp;
    createdAt: Timestamp;
  };
  // Notes
  notes?: Array<{
    id: string;
    note: string;
    isInternal: boolean;
    createdBy: string;
    createdAt: Timestamp;
  }>;
  createdAt: Timestamp;
}
```

#### `order_chat` (Document ID: auto-generated)
```typescript
{
  orderId: string;
  senderId: string;
  senderType: 'customer' | 'seller' | 'system';
  message?: string;
  imageUrl?: string;
  isSystemMessage: boolean;
  createdAt: Timestamp;
}
```

#### `shipping_zones` (Document ID: auto-generated)
```typescript
{
  sellerId: string;
  name: string; // e.g., "Lagos Zone"
  rate: number; // Shipping price in NGN
  freeThreshold?: number; // Order total for free shipping
  states?: string[]; // Array of states this zone applies to (e.g., ["Lagos", "Abuja"])
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `discount_codes` (Document ID: auto-generated)
```typescript
{
  sellerId: string;
  code: string; // Uppercase
  type: 'percentage' | 'fixed';
  value: number; // Percentage (0-100) or fixed amount
  uses: number; // Current usage count
  maxUses?: number; // Maximum allowed uses
  minOrderAmount?: number; // Minimum order amount to apply
  validFrom?: Timestamp;
  validUntil?: Timestamp;
  status: 'active' | 'inactive' | 'expired';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `email_campaigns` (Document ID: auto-generated)
```typescript
{
  sellerId: string;
  subject: string;
  message: string; // HTML supported
  recipientType: 'all' | 'segment' | 'custom';
  segment?: 'VIP' | 'Regular' | 'New';
  recipientEmails?: string[]; // For custom type
  sentCount: number;
  status: 'draft' | 'sending' | 'sent' | 'failed';
  sentAt?: Timestamp;
  createdAt: Timestamp;
}
```

#### `addresses` (Document ID: auto-generated)
```typescript
{
  userId: string;
  label: string; // "Home", "Work", etc.
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  lga: string;
  isDefault?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `payments` (Document ID: auto-generated)
```typescript
{
  customerId: string;
  orderId?: string;
  reference: string; // Paystack reference
  amount: number;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  paystackStatus?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `platform_settings` (Document ID: 'settings')
```typescript
{
  commissionRate: number; // e.g., 0.05 for 5%
  minimumPayoutAmount: number; // e.g., 1000
  platformFee: number; // e.g., 0 for no fixed fee
  currencyCode: string; // "NGN"
  revenueTrackingEnabled: boolean;
  lastUpdated: Timestamp;
}
```

#### `earnings` (Document ID: userId)
```typescript
{
  sellerId: string;
  totalEarnings: number;
  availableBalance: number; // Available for payout
  pendingBalance: number; // In escrow
  totalWithdrawn: number;
  lastPayoutAt?: Timestamp;
  transactions: Array<{
    id: string;
    type: 'order' | 'payout' | 'refund';
    amount: number;
    orderId?: string;
    payoutId?: string;
    status: 'pending' | 'completed' | 'failed';
    createdAt: Timestamp;
  }>;
  updatedAt: Timestamp;
}
```

#### `payouts` (Document ID: auto-generated)
```typescript
{
  sellerId: string;
  amount: number;
  bankAccount: {
    accountNumber: string;
    accountName: string;
    bankCode: string;
    bankName: string;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  paystackTransferCode?: string;
  failureReason?: string;
  createdAt: Timestamp;
  processedAt?: Timestamp;
}
```

#### `failed_payments` (Document ID: auto-generated)
```typescript
{
  reference: string;
  idempotencyKey: string;
  customerId: string;
  amount: number;
  error: string;
  createdAt: Timestamp;
}
```

#### `payment_mismatches` (Document ID: auto-generated)
```typescript
{
  reference: string;
  idempotencyKey: string;
  expectedAmount: number;
  actualAmount: number;
  customerId: string;
  createdAt: Timestamp;
}
```

---

## Authentication & Authorization

### Authentication Flow
1. User signs in with Firebase Auth (Email/Password)
2. Custom token created with `isAdmin` claim (if admin)
3. Token stored in cookies via middleware
4. Server Actions read token from headers (`X-User-UID`, `X-Is-Admin`)

### Authorization Functions

#### `requireAuth()` - `src/lib/auth-utils.ts`
- Verifies user is authenticated
- Returns: `{ uid: string, email?: string, isAdmin?: boolean }`
- Throws if not authenticated

#### `requireOwnerOrAdmin(userId: string)` - `src/lib/auth-utils.ts`
- Verifies user owns resource OR is admin
- Used for seller-specific actions

#### `requireAdmin()` - `src/lib/auth-utils.ts`
- Verifies user is admin
- Used for platform-wide actions

### Middleware
- `src/middleware.ts` - Sets auth headers for Server Actions
- Reads Firebase Auth token from cookies
- Adds `X-User-UID` and `X-Is-Admin` headers

---

## Payment System

### Payment Flow

1. **Customer adds items to cart** → Stored in React Context
2. **Customer proceeds to checkout** → Enters delivery info, selects shipping
3. **Customer clicks "Place Order"** → Paystack payment initialized
4. **Payment Success** → `onPaymentSuccess` callback
5. **Create Payment Attempt** → Stored in localStorage with idempotency key
6. **Verify Payment** → Server Action `verifyPaymentAndCreateOrder`
   - Checks idempotency (prevents duplicates)
   - Verifies with Paystack API
   - Creates order with `escrowStatus: 'held'`
   - Creates payment record
   - Creates initial chat messages
   - Stores commission rate on order
7. **Order Created** → Real-time update via Firestore listener

### Payment State Management

**File**: `src/lib/payment-state.ts`

- **localStorage-based persistence** for payment attempts
- **Recovery mechanism** for failed/pending payments
- **Auto-expiration** after 24 hours
- **Retry functionality** for failed verifications

### Payment Recovery

**Components**:
- `PaymentRecoveryBanner` - Global banner for recoverable payments
- `/profile/payments/recover` - Dedicated recovery page

**Features**:
- Lists all pending/failed payments
- Allows retry of payment verification
- Shows payment status and error messages

### Payment Reconciliation

**Cron Job**: `/api/cron/reconcile-payments` (Daily at 3 AM UTC)

- Compares local payment records with Paystack status
- Updates payment statuses in Firestore
- Logs discrepancies for manual review

### Webhooks

**Route**: `/api/webhooks/paystack`

**Handles**:
- `charge.success` - Payment successful
- `charge.failed` - Payment failed
- `transfer.success` - Payout successful
- `transfer.failed` - Payout failed

---

## Order & Delivery System

### Order Lifecycle

```
Processing → Sent → Received → Completed
     ↓
  Disputed (can happen at any time before completion)
```

### Order States

1. **Processing**: Order created, payment verified, seller preparing
2. **Sent**: Seller marked item as sent (optional photo uploaded)
3. **Received**: Customer marked item as received (optional photo uploaded)
4. **Completed**: Customer confirmed receipt → Funds released to seller
5. **Cancelled**: Order cancelled (before sent)
6. **Disputed**: Customer opened dispute → Funds frozen

### Escrow System

**File**: `src/lib/order-delivery-actions.ts`

#### Mark as Sent
- **Action**: `markOrderAsSent()`
- **Trigger**: Seller clicks "Mark as Sent"
- **Updates**:
  - Order status → `'Sent'`
  - `sentAt` timestamp
  - `sentPhotoUrl` (optional)
  - `autoReleaseDate` (X days from now, configurable)
  - Creates system message in chat

#### Mark as Received
- **Action**: `markOrderAsReceived()`
- **Trigger**: Customer clicks "Mark as Received"
- **Updates**:
  - Order status → `'Received'` → `'Completed'`
  - `receivedAt` timestamp
  - `receivedPhotoUrl` (optional)
  - `escrowStatus` → `'released'`
  - `fundsReleasedAt` timestamp
  - Updates seller earnings
  - Creates system message in chat

#### Auto-Release
- **Cron Job**: `/api/cron/auto-release-escrow` (Daily at 2 AM UTC)
- **Action**: `autoReleaseEscrow()`
- **Logic**:
  - Finds orders where:
    - `status === 'Sent'`
    - `autoReleaseDate <= now`
    - `escrowStatus === 'held'`
    - No open dispute
  - Releases funds to seller
  - Updates `escrowStatus` → `'released'`
  - Updates seller earnings

---

## Shipping System

### Shipping Zones

**Collection**: `shipping_zones`

Sellers create shipping zones with:
- **Name**: Zone identifier (e.g., "Lagos Zone")
- **Rate**: Shipping price in NGN
- **Free Threshold**: Order total for free shipping (optional)
- **States**: Array of states this zone applies to (optional - empty = all states)

### Shipping Calculation Flow

1. **Customer enters state** in checkout form
2. **System calculates options** via `calculateShippingOptions()`
3. **Checks seller's zones** for matching state
4. **Returns options**:
   - Delivery option (if zone matches)
   - Pickup option (if seller has pickup address)
   - Warning message (if no shipping available)

### Shipping Options Display

**Component**: Checkout page shipping section

- **Radio buttons** for customer to select option
- **Price display** with free shipping indicator
- **Pickup address** shown for pickup option
- **Free shipping** calculated dynamically based on order total

### Free Shipping Logic

- Checked client-side via `calculateFinalShippingPrice()`
- If order subtotal >= zone's `freeThreshold` → Shipping = 0
- Otherwise → Shipping = zone's `rate`

---

## Chat System

### Order Chat

**Collection**: `order_chat`

Every order has an associated chat thread.

**Message Types**:
- **Text messages**: Customer/seller text communication
- **Image messages**: Photos shared in chat
- **System messages**: Auto-generated for order events
  - "Order placed"
  - "Payment confirmed"
  - "Item sent" (with photo if uploaded)
  - "Item received" (with photo if uploaded)
  - "Dispute opened"

### Chat Component

**File**: `src/components/order-chat.tsx`

**Features**:
- Real-time message updates (Firestore listener)
- Image upload support
- System message styling
- Read-only after order completion (except for disputes)

### Chat Actions

**File**: `src/lib/order-chat-actions.ts`

- `sendChatMessage()` - Send text/image message
- `getOrderChatMessages()` - Get chat history

---

## Dispute Resolution

### Dispute Types

1. **Item not received**
2. **Wrong item**
3. **Damaged item**

### Dispute Flow

1. **Customer opens dispute** → `openDispute()`
   - Creates dispute record
   - Freezes escrow (prevents auto-release)
   - Updates order status → `'Disputed'`
   - Creates system message in chat

2. **Admin reviews dispute** → Admin panel
   - Views dispute details
   - Reviews photos/evidence
   - Makes decision

3. **Admin resolves dispute** → `resolveDispute()`
   - **Refund customer**: `escrowStatus` → `'refunded'`
   - **Release to seller**: `escrowStatus` → `'released'`
   - Updates order status → `'Completed'`
   - Updates seller earnings (if released)

### Dispute Actions

**File**: `src/lib/dispute-actions.ts`

- `openDispute()` - Customer opens dispute
- `resolveDispute()` - Admin resolves dispute

---

## Platform Settings

### Configurable Settings

**Collection**: `platform_settings` (Single document: 'settings')

- **Commission Rate**: Platform commission percentage (0-1)
- **Minimum Payout Amount**: Minimum amount for seller payouts
- **Platform Fee**: Fixed fee per transaction (optional)
- **Currency Code**: "NGN"
- **Revenue Tracking**: Enable/disable revenue tracking

### Settings Management

**File**: `src/lib/platform-settings-actions.ts`

- `getPlatformSettings()` - Get current settings (cached)
- `updatePlatformSettings()` - Update settings (admin only)
- `getPlatformCommissionRate()` - Get commission rate (cached)
- `getMinimumPayoutAmount()` - Get minimum payout (cached)
- `clearSettingsCache()` - Clear cache (for updates)

**Admin UI**: `/admin/settings`

---

## Seller Dashboard Features

### 1. Dashboard (`/seller/dashboard`)
- Overview cards (revenue, orders, products, customers)
- Recent orders table
- Quick stats

### 2. Products (`/seller/products`)
- Product list with infinite scroll
- Create/edit/delete products
- Image upload to Firebase Storage
- Product status management

### 3. Orders (`/seller/orders`)
- Order list with filters
- Order detail page with:
  - Order information
  - Customer details
  - "Mark as Sent" button (with photo upload)
  - Order chat integration

### 4. Customers (`/seller/customers`)
- Customer database from orders
- Segmentation: VIP, Regular, New
- Customer details (orders, spending, contact info)
- Search and filter

### 5. Analytics (`/seller/analytics`)
- Revenue charts (daily, weekly, monthly)
- Traffic and conversion metrics
- Product performance
- Geographic data
- Real-time data from Firestore

### 6. Reports (`/seller/reports`)
- Generate reports:
  - Sales Report
  - Revenue Report
  - Customer Report
  - Product Performance Report
- Export as JSON/CSV
- Scheduled reports (UI ready, backend pending)

### 7. Marketing (`/seller/marketing`)
- **Discount Codes**:
  - Create codes (percentage or fixed)
  - Set max uses, validity dates
  - Track usage
  - Real data from Firestore
- **Email Campaigns**:
  - Send to all customers
  - Send to segments (VIP, Regular, New)
  - Send to custom list
  - Integrated with Resend API
  - Campaign history

### 8. Shipping (`/seller/shipping`)
- **Shipping Zones**:
  - Create/edit/delete zones
  - Set rates per zone
  - Set free shipping thresholds
  - Select states for each zone
- **Packaging Settings**:
  - Default packaging type
  - Packaging cost

### 9. Storefront (`/seller/storefront`)
- **Live Preview Designer**:
  - Primary color picker
  - Secondary color picker
  - Font family selection
  - Layout selection (grid, list, masonry)
- **Real-time Preview**: Shows how store will look
- **Save to Firestore**: Settings applied to store pages

### 10. Domain (`/seller/domain`)
- **Subdomain Management**:
  - Auto-generated subdomain on store creation
  - Display full store URL
  - Subdomain rules and validation
- **Custom Domain** (UI ready, DNS verification pending)

### 11. Payouts (`/seller/payouts`)
- **Bank Account Setup**:
  - Account number resolution (Paystack API)
  - Bank selection
  - Account name verification
- **Payout Requests**:
  - Request payout
  - Minimum amount check (from platform settings)
  - Payout history
  - Status tracking

### 12. Settings (`/seller/settings`)
- **Store Information**: Name, description, logo, banner
- **Location**: State, LGA, city, address
- **Business Type**: Category selection
- **Policies**: Shipping, returns, refunds, privacy
- **Social Media**: Facebook, Instagram, Twitter, TikTok
- **Store Hours**: Per day configuration
- **Contact Info**: Email, phone, website, **pickup address**
- **Store Theme**: Colors, fonts
- **SEO Settings**: Meta title, description, keywords

---

## File Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (app)/                   # Main app routes (authenticated)
│   │   ├── layout.tsx           # App layout with sidebar
│   │   ├── page.tsx             # Home page (product listing)
│   │   ├── products/            # Product pages
│   │   ├── product/[id]/        # Product detail
│   │   ├── cart/                # Shopping cart
│   │   ├── checkout/            # Checkout page
│   │   ├── profile/             # Customer profile & orders
│   │   ├── store/[sellerId]/    # Seller storefront
│   │   └── seller/              # Seller dashboard
│   │       ├── dashboard/       # Dashboard
│   │       ├── products/        # Product management
│   │       ├── orders/          # Order management
│   │       │   └── [id]/        # Order detail
│   │       ├── customers/       # Customer database
│   │       ├── analytics/       # Analytics dashboard
│   │       ├── reports/         # Report generation
│   │       ├── marketing/       # Marketing campaigns
│   │       ├── shipping/        # Shipping zones
│   │       ├── storefront/      # Storefront designer
│   │       ├── domain/          # Domain management
│   │       ├── payouts/         # Payout management
│   │       └── settings/        # Store settings
│   ├── admin/                   # Admin panel
│   │   ├── layout.tsx           # Admin layout
│   │   ├── dashboard/           # Admin dashboard
│   │   ├── orders/             # All orders
│   │   ├── users/              # User management
│   │   ├── disputes/           # Dispute resolution
│   │   ├── branding/           # Platform branding
│   │   └── settings/           # Platform settings
│   ├── api/                     # API routes
│   │   ├── cron/               # Cron jobs
│   │   │   ├── auto-release-escrow/  # Daily escrow release
│   │   │   └── reconcile-payments/   # Daily payment reconciliation
│   │   ├── webhooks/           # Webhooks
│   │   │   └── paystack/      # Paystack webhook
│   │   ├── upload-image/      # Image upload endpoint
│   │   └── search/            # Global search API
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Landing page (if exists)
│
├── lib/                        # Core library code
│   ├── firebase/              # Firebase configuration
│   │   ├── admin.ts          # Admin SDK initialization
│   │   ├── client-provider.tsx  # Client SDK provider
│   │   └── firestore/        # Firestore hooks & types
│   │       ├── products.ts
│   │       ├── orders.ts
│   │       ├── stores.ts
│   │       ├── users.ts
│   │       ├── addresses.ts
│   │       └── order-chat.ts
│   ├── auth-utils.ts         # Authentication utilities
│   ├── payment-actions.ts    # Payment processing
│   ├── payment-state.ts      # Payment state management
│   ├── payment-recovery.ts   # Payment recovery hook
│   ├── payment-reconciliation.ts  # Payment reconciliation
│   ├── order-actions.ts      # Order management
│   ├── order-delivery-actions.ts  # Delivery tracking
│   ├── order-chat-actions.ts # Chat actions
│   ├── dispute-actions.ts    # Dispute management
│   ├── shipping-actions.ts   # Shipping zone management
│   ├── checkout-shipping-actions.ts  # Shipping calculation
│   ├── discount-actions.ts   # Discount code management
│   ├── email-marketing-actions.ts  # Email campaigns
│   ├── store-actions.ts      # Store management
│   ├── storefront-actions.ts # Storefront settings
│   ├── domain-actions.ts     # Domain management
│   ├── subdomain-actions.ts  # Subdomain generation
│   ├── platform-settings-actions.ts  # Platform settings
│   ├── payout-actions.ts     # Payout management
│   ├── earnings-actions.ts   # Earnings management
│   ├── address-actions.ts    # Address management
│   ├── user-actions.ts       # User profile management
│   ├── search-actions.ts    # Global search
│   ├── report-actions.ts     # Report generation
│   ├── storage-actions.ts    # Firebase Storage uploads
│   ├── firestore-serializer.ts  # Firestore data serialization
│   ├── cart-context.tsx      # Shopping cart context
│   └── data/                 # Static data
│       ├── nigerian-locations.ts  # States & LGAs
│       └── business-categories.ts  # Business categories
│
├── components/               # React components
│   ├── ui/                   # Shadcn UI components
│   ├── order-chat.tsx        # Order chat component
│   ├── open-dispute-dialog.tsx  # Dispute dialog
│   ├── payment-recovery-banner.tsx  # Payment recovery
│   ├── global-search.tsx     # Global search bar
│   ├── DynamicLogo.tsx       # Dynamic logo component
│   └── copilot-widget.tsx    # CoPilot widget
│
├── hooks/                    # Custom React hooks
│   └── use-toast.ts          # Toast notifications
│
├── firebase/                 # Firebase client setup
│   ├── provider.tsx         # Firebase provider
│   ├── error-emitter.ts     # Error handling
│   └── errors.ts           # Custom error types
│
├── middleware.ts            # Next.js middleware (auth)
│
└── storage.rules            # Firebase Storage security rules
```

---

## API Routes

### Cron Jobs

#### `/api/cron/auto-release-escrow`
- **Schedule**: Daily at 2:00 AM UTC
- **Function**: Auto-releases escrow for orders marked as sent after X days
- **Action**: `autoReleaseEscrow()` from `order-delivery-actions.ts`

#### `/api/cron/reconcile-payments`
- **Schedule**: Daily at 3:00 AM UTC
- **Function**: Reconciles payment statuses with Paystack
- **Action**: `reconcilePayments()` from `payment-reconciliation.ts`

### Webhooks

#### `/api/webhooks/paystack`
- **Method**: POST
- **Function**: Handles Paystack webhook events
- **Events**:
  - `charge.success` - Payment successful
  - `charge.failed` - Payment failed
  - `transfer.success` - Payout successful
  - `transfer.failed` - Payout failed

### Image Upload

#### `/api/upload-image`
- **Method**: POST
- **Function**: Uploads images to Firebase Storage
- **Uses**: `storage-actions.ts`

### Search

#### `/api/search`
- **Method**: POST
- **Function**: Global search across products, orders, customers
- **Uses**: `search-actions.ts`

---

## Security

### Firestore Security Rules

**Key Rules**:
- **Products**: Public read, seller write
- **Orders**: Read by customer/seller, write via Server Actions only
- **Stores**: Public read, owner/admin write
- **Chat**: Read by order participants, write by participants
- **Shipping Zones**: Read by all, write by owner/admin
- **Discount Codes**: Read by all, write by owner/admin
- **Earnings**: Read/write by owner/admin only
- **Platform Settings**: Read by all, write by admin only

### Storage Security Rules

**Key Rules**:
- **Product Images**: Public read, authenticated write
- **Chat Images**: Public read, authenticated write
- **Order Photos** (sent/received): Public read, authenticated write
- **Dispute Photos**: Public read, authenticated write
- **ID Verifications**: Read by owner/admin, write by owner

### Server Actions Security

- All Server Actions verify authentication
- Owner checks for seller-specific actions
- Admin checks for platform-wide actions
- Input validation via Zod schemas
- Idempotency checks for payment processing

### Payment Security

- **Idempotency Keys**: Prevent duplicate orders
- **Payment Verification**: Server-side only
- **Webhook Verification**: Paystack signature verification (recommended)
- **Amount Validation**: Verify Paystack amount matches expected

---

## Deployment

### Vercel Configuration

**File**: `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/auto-release-escrow",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/reconcile-payments",
      "schedule": "0 3 * * *"
    }
  ]
}
```

### Environment Variables

**Required**:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_ADMIN_PRIVATE_KEY`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PROJECT_ID`
- `PAYSTACK_SECRET_KEY`
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
- `RESEND_API_KEY` (for email marketing)
- `NEXT_PUBLIC_STORE_DOMAIN` (for subdomains, e.g., "ikm.com")
- `NEXT_PUBLIC_APP_DOMAIN` (fallback domain)

### Build Process

1. Install dependencies: `npm install`
2. Build: `npm run build`
3. Deploy to Vercel: Automatic via Git push

### Firebase Setup

1. **Firestore**: Create collections (auto-created on first write)
2. **Storage**: Create bucket, deploy security rules
3. **Auth**: Enable Email/Password provider
4. **Indexes**: Create composite indexes for queries:
   - `orders`: `sellerId + createdAt`
   - `orders`: `customerId + createdAt`
   - `shipping_zones`: `sellerId + createdAt`
   - `discount_codes`: `sellerId + code + status`

---

## Data Flow Examples

### Order Creation Flow

```
1. Customer adds items to cart (Client State)
   ↓
2. Customer fills checkout form (Client State)
   ↓
3. Customer selects shipping option (Client State)
   ↓
4. Customer clicks "Place Order" (Client)
   ↓
5. Paystack payment initialized (Client)
   ↓
6. Payment success → onPaymentSuccess (Client)
   ↓
7. Create payment attempt (localStorage)
   ↓
8. verifyPaymentAndCreateOrder (Server Action)
   ├─ Check idempotency (Firestore)
   ├─ Verify with Paystack API
   ├─ Create order (Firestore)
   ├─ Create payment record (Firestore)
   ├─ Create chat messages (Firestore)
   └─ Return order ID
   ↓
9. Update payment state (localStorage)
   ↓
10. Real-time order update (Firestore listener)
    ↓
11. Seller sees new order (Real-time)
```

### Shipping Calculation Flow

```
1. Customer enters state in checkout (Client)
   ↓
2. calculateShippingOptions (Server Action)
   ├─ Get seller's shipping zones (Firestore)
   ├─ Get seller's store (pickup address, phone)
   ├─ Find matching zone for customer state
   └─ Return shipping options
   ↓
3. Display options to customer (Client)
   ↓
4. Customer selects option (Client)
   ↓
5. Calculate final price (Client)
   ├─ Check free shipping threshold
   └─ Update total
   ↓
6. Customer proceeds to payment
```

### Escrow Release Flow

```
1. Seller marks order as sent (Client)
   ↓
2. markOrderAsSent (Server Action)
   ├─ Update order status → 'Sent'
   ├─ Set sentAt timestamp
   ├─ Set autoReleaseDate (X days from now)
   └─ Create system message
   ↓
3. Customer marks as received (Client)
   ↓
4. markOrderAsReceived (Server Action)
   ├─ Update order status → 'Received' → 'Completed'
   ├─ Set receivedAt timestamp
   ├─ Update escrowStatus → 'released'
   ├─ Update seller earnings
   └─ Create system message
   ↓
5. OR Auto-release (Cron Job)
   ├─ Find orders ready for auto-release
   ├─ Update escrowStatus → 'released'
   └─ Update seller earnings
```

---

## Key Features Summary

### ✅ Implemented Features

1. **Payment System**
   - Paystack integration
   - Idempotency handling
   - Payment recovery
   - Payment reconciliation

2. **Order Management**
   - Order creation with escrow
   - Order status tracking
   - Delivery tracking (sent/received)
   - Auto-release after X days

3. **Chat System**
   - Order-specific chat
   - Text and image messages
   - System messages
   - Real-time updates

4. **Dispute Resolution**
   - Customer can open disputes
   - Admin resolution
   - Escrow freezing/releasing

5. **Shipping System**
   - State-based shipping zones
   - Free shipping thresholds
   - Pickup options
   - Customer confirmation required

6. **Seller Dashboard**
   - Products, Orders, Customers
   - Analytics, Reports
   - Marketing (discounts, emails)
   - Shipping zones
   - Storefront designer
   - Domain management
   - Payouts

7. **Platform Settings**
   - Configurable commission rates
   - Minimum payout amounts
   - Admin UI for settings

8. **Subdomain System**
   - Auto-generated subdomains
   - Store URL generation
   - Subdomain validation

9. **Global Search**
   - Firestore-based search
   - Products, orders, customers
   - Real-time results

### 🔄 Future Enhancements

1. **Scheduled Reports**: Backend for automated report delivery
2. **Custom Domain DNS**: Full DNS verification and SSL
3. **Carrier Integration**: Real carrier API integration
4. **Advanced Analytics**: More detailed analytics and insights
5. **Inventory Management**: Stock tracking and alerts
6. **Multi-vendor Support**: Support for multiple sellers per order

---

## Performance Considerations

1. **Firestore Indexes**: Composite indexes for complex queries
2. **Pagination**: Infinite scroll for product/order lists
3. **Caching**: Platform settings cached server-side
4. **Image Optimization**: Next.js Image component for product images
5. **Code Splitting**: Automatic via Next.js App Router
6. **Server Actions**: Reduced client bundle size

---

## Error Handling

1. **Payment Failures**: Stored in localStorage for recovery
2. **Network Errors**: Firestore automatic reconnection
3. **Permission Errors**: Clear error messages to users
4. **Validation Errors**: Zod schema validation with clear messages
5. **Idempotency**: Prevents duplicate orders on retries

---

## Testing Recommendations

1. **Payment Flow**: Test with Paystack test keys
2. **Escrow Release**: Test auto-release cron job
3. **Shipping Calculation**: Test with various states and zones
4. **Dispute Flow**: Test dispute creation and resolution
5. **Chat System**: Test real-time message delivery
6. **Payment Recovery**: Test failed payment recovery

---

## Monitoring & Logging

1. **Console Logging**: Development logging for debugging
2. **Error Tracking**: Consider Sentry or similar
3. **Payment Reconciliation**: Daily cron job logs discrepancies
4. **Webhook Logging**: Log all Paystack webhook events

---

## Security Best Practices

1. **Server Actions**: All mutations go through Server Actions
2. **Input Validation**: Zod schemas for all inputs
3. **Authentication**: Verified on every Server Action
4. **Authorization**: Owner/admin checks for sensitive operations
5. **Idempotency**: Payment processing is idempotent
6. **HTTPS**: Enforced by Vercel
7. **Environment Variables**: Secrets stored in Vercel

---

This architecture document provides a complete overview of the IKM platform. All features are implemented and functional, with real data integration (no mock data).
