# IKM Marketplace - Architecture Documentation

## Overview
This document describes the redesigned architecture following Next.js 15 best practices and modern security patterns. This architecture enforces strict client-server separation, comprehensive authentication, and explicit authorization boundaries.

## Architecture Principles

### 1. Client-Server Separation
- **Client-side (Browser)**: Only for reading data with real-time listeners
- **Server-side (Server Actions)**: All writes, mutations, and sensitive operations
- **No client-side writes**: Client SDK never writes to Firestore directly

### 2. Security Model
- **Firestore Security Rules**: Enforce data access at the database level
- **Server Actions**: Validate and sanitize all inputs server-side
- **Middleware**: Gatekeeper for route protection (not source of truth)
- **Double Verification**: Both middleware and server actions verify authentication

### 3. Authentication & Authorization Flow

#### Authentication Boundary (Explicit Flow)

**Step 1: Client Authentication**
```
User → Firebase Auth → ID Token
```

**Step 2: Session Cookie Creation**
```
Client → POST /api/login → Server verifies ID token → Creates session cookie
```

**Step 3: Middleware Verification (Gatekeeper)**
```
Request → Middleware → Verifies session cookie → Sets X-User-UID header
```
- Middleware uses `verifySessionCookie()` to validate session
- Sets `X-User-UID` header for downstream use
- Redirects unauthenticated users to `/login`
- **Middleware is a gatekeeper, not a source of truth**

**Step 4: Server Action Verification (Source of Truth)**
```
Server Action → Verifies session cookie again → Validates user identity → Executes operation
```
- **Every server action MUST verify authentication independently**
- Never trust middleware alone - always verify in server action
- Uses `headers().get('X-User-UID')` or re-verifies session cookie
- Throws error if authentication fails

**Token Expiry Handling:**
- Session cookies expire after 14 days (configurable)
- Client-side token refresh happens automatically via `useUser()` hook
- On expiry: User redirected to login, session recreated on next login

#### Role Model (Explicit Definition)

**Where Roles Live:**
1. **Primary Source: Firebase Auth Custom Claims**
   - `isAdmin: boolean` stored in ID token
   - Set via `auth.setCustomUserClaims(userId, { isAdmin: true })`
   - Only server-side can modify (via Admin SDK)
   - Propagates to session cookie automatically

2. **Secondary Source: Firestore User Document**
   - `isAdmin: boolean` field in `/users/{userId}` document
   - Synced with custom claims for UI reactivity
   - **Read-only by users** - only Admin SDK can write
   - Used for easy querying and UI display

**Role Types:**
- **Customer**: Default role, can create orders
- **Seller**: Can create products, manage store, update order status
- **Admin**: Full access, can manage users, products, orders

**Role Escalation Prevention:**
- Custom claims can ONLY be set server-side via Admin SDK
- Firestore `isAdmin` field is write-protected by security rules
- Server actions verify roles from custom claims (not Firestore)
- No client-side code can modify roles

**Role Verification:**
```typescript
// In server action
const userId = headers().get('X-User-UID');
if (!userId) throw new Error('Unauthorized');

// Verify admin role from custom claims
const adminApp = getAdminApp();
const auth = getAuth(adminApp);
const userRecord = await auth.getUser(userId);
const isAdmin = userRecord.customClaims?.isAdmin === true;
```

### 4. Data Flow

#### Reading Data (Client-Side)
```
Component → useUserProfile() hook → Firestore onSnapshot → Real-time updates
```
- Uses Firebase Client SDK
- Real-time listeners for live data
- Security rules enforce read permissions
- **Field-level restrictions** apply (see Public Read Boundaries)

#### Writing Data (Server-Side)
```
Component → Server Action → Write Contract Layer → Firebase Admin SDK → Firestore
```

**Write Contract Layer (Explicit Flow):**
1. **Input Validation** (Zod schema)
   - Validates data types, formats, constraints
   - Rejects invalid input before any processing

2. **Authorization Check** (Role + Ownership)
   - Verifies user is authenticated
   - Checks user has required role (seller/admin)
   - Verifies ownership (user owns resource or is admin)
   - Throws error if unauthorized

3. **Domain Logic** (Business Rules)
   - Applies business rules (e.g., order status transitions)
   - Validates state transitions
   - Enforces invariants

4. **Firestore Write** (Admin SDK)
   - Executes write operation
   - Bypasses security rules (but validated above)
   - Returns serialized data

**Example Write Contract:**
```typescript
export async function updateProduct(userId: string, productId: string, data: FormData) {
  // 1. Input Validation
  const validation = productSchema.safeParse(data);
  if (!validation.success) throw new Error('Invalid input');
  
  // 2. Authorization Check
  if (!userId) throw new Error('Unauthorized');
  const product = await getProduct(productId);
  if (product.sellerId !== userId && !await isAdmin(userId)) {
    throw new Error('Forbidden');
  }
  
  // 3. Domain Logic
  if (data.price < 0) throw new Error('Price cannot be negative');
  
  // 4. Firestore Write
  await firestore.collection('products').doc(productId).update(data);
  revalidatePath('/seller/products');
}
```

## File Structure

### Server Actions (Write Contract Layer)
- `src/lib/store-actions.ts` - Store setup and settings updates
- `src/lib/user-actions.ts` - User profile operations
- `src/lib/product-actions.ts` - Product CRUD operations
- `src/lib/order-actions.ts` - Order status updates (with state machine)
- `src/lib/admin-actions.ts` - Admin operations (role management)

### Client Hooks (Read-Only)
- `src/lib/firebase/firestore/users.ts` - User profile hooks (read-only)
- `src/lib/firebase/firestore/products.ts` - Product hooks (read-only)
- `src/lib/firebase/firestore/orders.ts` - Order hooks (read-only)

### Authentication & Authorization
- `src/middleware.ts` - Next.js middleware (gatekeeper)
- `src/app/api/login/route.ts` - Session cookie creation
- `src/lib/firebase/auth/use-user.ts` - Client-side auth state

### Security
- `firestore.rules` - Firestore security rules (field-level restrictions)

## Security Rules

### Key Principles
1. **Principle of Least Privilege**: Users can only access what they need
2. **Input Validation**: All inputs validated at multiple layers (rules + server actions)
3. **Data Integrity**: Prevent unauthorized field modifications
4. **Public Read, Private Write**: Public data readable, writes restricted
5. **Field-Level Restrictions**: Not all fields are public, even in "public read" documents

### Public Read Boundaries

**Users Collection - Public Fields Only:**
When a user document is marked as "public read", only these fields are accessible:
- `displayName`
- `storeName`
- `storeDescription`
- `storeLogoUrl`
- `storeBannerUrl`
- `storeLocation` (state, lga, city only - not full address)
- `businessType`
- `storePolicies` (public policies only)

**Private Fields (Never Public):**
- `email` (only readable by owner/admin)
- `whatsappNumber` (only readable by owner/admin)
- `payoutDetails` (only readable by owner/admin)
- `deliveryLocations` (only readable by owner/admin)
- `isAdmin` (only readable by owner/admin)
- Internal flags and metadata

**Security Rule Implementation:**
```javascript
// In firestore.rules
match /users/{userId} {
  // Public read with field filtering
  allow read: if true; // Rules can't filter fields, so we rely on server-side filtering
  
  // Owner/admin can read all fields
  allow read: if isOwner(userId) || isAdmin();
}
```

**Note:** Since Firestore rules can't filter fields at read time, we enforce field-level privacy in:
1. **Client-side hooks**: Only expose public fields in TypeScript interfaces
2. **Server actions**: Filter private fields before returning data
3. **Security rules**: Prevent unauthorized writes to private fields

### Rules Breakdown

#### Products
- ✅ Public read (anyone can browse)
- ✅ Authenticated create (sellers create their own)
- ✅ Owner/Admin update (with field restrictions)
- ✅ Admin delete only
- ✅ Field validation: name (1-200 chars), description (min 10 chars), price (> 0)

#### Users
- ✅ Public read (for store browsing) - **public fields only**
- ✅ Owner create (during signup)
- ✅ Owner/Admin update (with field restrictions)
- ✅ Admin delete only
- ✅ Private fields (email, whatsappNumber, payoutDetails) write-protected

#### Orders
- ✅ Customer/Seller read (their own orders)
- ✅ Authenticated create (customers create orders)
- ✅ Seller/Admin update (status changes only, with state machine)
- ✅ Admin delete only
- ✅ Field validation: status transitions enforced

#### Delivery Locations
- ✅ Owner/Admin read/write only
- ✅ No public access

## Orders Lifecycle (State Machine)

### Order Status States
1. **Processing** - Initial state after payment verification
2. **Shipped** - Seller has shipped the order
3. **Delivered** - Order delivered to customer
4. **Cancelled** - Order cancelled (with restrictions)

### Allowed Transitions

**Processing → Shipped**
- **Who**: Seller only
- **When**: Seller has prepared and shipped the order
- **Validation**: Order must be in "Processing" state

**Shipped → Delivered**
- **Who**: Customer or System (auto after 7 days)
- **When**: Customer confirms receipt or auto-delivery timeout
- **Validation**: Order must be in "Shipped" state

**Any → Cancelled**
- **Who**: 
  - Customer: Only if status is "Processing"
  - Seller: Only if status is "Processing" or "Shipped"
  - Admin: Any status
- **When**: Customer/seller requests cancellation
- **Validation**: Strict rules based on current status

**Invalid Transitions:**
- Processing → Delivered (must go through Shipped)
- Shipped → Processing (no rollback)
- Delivered → Any (final state, no transitions)

### Implementation
```typescript
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  'Processing': ['Shipped', 'Cancelled'],
  'Shipped': ['Delivered', 'Cancelled'],
  'Delivered': [], // Final state
  'Cancelled': [], // Final state
};

export async function updateOrderStatus(
  userId: string,
  orderId: string,
  newStatus: OrderStatus
) {
  // 1. Authorization
  const order = await getOrder(orderId);
  const isSeller = order.sellerId === userId;
  const isAdmin = await isAdminUser(userId);
  if (!isSeller && !isAdmin) throw new Error('Forbidden');
  
  // 2. State Machine Validation
  const currentStatus = order.status;
  const allowed = ALLOWED_TRANSITIONS[currentStatus];
  if (!allowed.includes(newStatus)) {
    throw new Error(`Cannot transition from ${currentStatus} to ${newStatus}`);
  }
  
  // 3. Role-Based Transition Rules
  if (newStatus === 'Shipped' && !isSeller && !isAdmin) {
    throw new Error('Only seller can mark as shipped');
  }
  if (newStatus === 'Cancelled' && currentStatus === 'Delivered') {
    throw new Error('Cannot cancel delivered orders');
  }
  
  // 4. Execute Update
  await firestore.collection('orders').doc(orderId).update({ status: newStatus });
  revalidatePath('/seller/orders');
}
```

## Cache Invalidation Strategy

### Revalidation Approach
We use **path-based revalidation** with explicit tags for related data.

### Revalidation Rules

**After Product Updates:**
```typescript
revalidatePath('/seller/products');
revalidatePath('/products'); // Public products page
revalidatePath(`/product/${productId}`); // Product detail page
```

**After Store Updates:**
```typescript
revalidatePath('/seller/dashboard');
revalidatePath('/seller/settings');
revalidatePath('/stores'); // Public stores page
revalidatePath(`/store/${userId}`); // Store detail page
```

**After Order Updates:**
```typescript
revalidatePath('/seller/orders');
revalidatePath(`/seller/orders/${orderId}`);
revalidatePath('/profile'); // Customer orders page
```

**After User Updates:**
```typescript
revalidatePath('/seller/settings');
revalidatePath('/profile');
// Note: Public store pages update via real-time listeners
```

### Handling Concurrent Updates
- Real-time listeners handle live updates (no cache issues)
- Server actions revalidate paths after writes
- Multiple sellers updating different products don't conflict
- Same seller updating same product: Last write wins (expected behavior)

### Future: Tag-Based Revalidation
Consider migrating to Next.js tag-based revalidation for better performance:
```typescript
revalidateTag('products');
revalidateTag('stores');
revalidateTag('orders');
```

## Testing

### Happy Path Testing
1. **Settings Page**
   - Go to `/seller/settings`
   - Edit any field
   - Click save button
   - Check browser console for success logs
   - Verify data appears in Firestore
   - Verify UI updates via real-time listener

2. **Security Rules**
   - Deploy rules to Firebase Console
   - Test with Firebase Rules Playground
   - Verify unauthorized access is blocked

### Security & Edge Case Testing

#### 1. Unauthorized Client Write Attempts
**Test:** Attempt to write to Firestore from client-side
```typescript
// ❌ This should fail
const firestore = useFirebase().firestore;
await updateDoc(doc(firestore, 'users', userId), { isAdmin: true });
```
**Expected:** Security rules block the write, error thrown

#### 2. Role Escalation Attempts
**Test:** Regular user tries to grant themselves admin role
```typescript
// ❌ This should fail
await updateUserProfileAction(userId, { isAdmin: true });
```
**Expected:** Server action rejects (field not in schema or write-protected)

#### 3. Invalid Field Injection
**Test:** Attempt to inject unauthorized fields
```typescript
// ❌ This should fail
await updateProduct(userId, productId, {
  name: 'Valid Name',
  sellerId: 'different-user-id', // Trying to change owner
  price: -100 // Invalid price
});
```
**Expected:** Zod validation or authorization check fails

#### 4. Race Conditions on Concurrent Updates
**Test:** Two users update same resource simultaneously
```typescript
// User A and User B both update product at same time
await Promise.all([
  updateProduct(userA, productId, { name: 'Name A' }),
  updateProduct(userB, productId, { name: 'Name B' })
]);
```
**Expected:** Last write wins (Firestore behavior), but authorization prevents unauthorized updates

#### 5. Order Status Transition Violations
**Test:** Attempt invalid status transitions
```typescript
// ❌ This should fail
await updateOrderStatus(userId, orderId, 'Delivered'); // From 'Processing'
```
**Expected:** State machine validation throws error

#### 6. Token Expiry Handling
**Test:** Make request with expired session cookie
**Expected:** Middleware redirects to login, server action rejects with 401

#### 7. Public Field Privacy
**Test:** Attempt to read private fields via public read
```typescript
// Should only return public fields
const profile = await getUserProfile(userId);
console.log(profile.email); // Should be undefined for non-owner
```
**Expected:** Private fields filtered out in server action or client hook

## Migration Guide

### Before (Old Pattern)
```typescript
// ❌ Client-side write
const firestore = useFirebase().firestore;
await updateDoc(doc(firestore, 'users', userId), { storeName });
```

### After (New Pattern)
```typescript
// ✅ Server action with Write Contract
import { updateUserProfileAction } from '@/lib/user-actions';
await updateUserProfileAction(userId, { storeName });
```

## Best Practices

1. **Never write to Firestore from client-side** - Use server actions
2. **Always validate inputs** - Use Zod schemas in server actions
3. **Verify authentication in every server action** - Never trust middleware alone
4. **Use real-time listeners for reads** - Better UX with live updates
5. **Revalidate paths after updates** - Keep Next.js cache fresh
6. **Enforce state machines for complex flows** - Orders, payments, etc.
7. **Filter private fields** - Don't expose sensitive data in public reads
8. **Handle errors gracefully** - Show user-friendly messages
9. **Log security events** - Track unauthorized access attempts
10. **Test edge cases** - Don't just test happy paths

## Write Contract Template

Every server action should follow this pattern:

```typescript
'use server';

export async function actionName(userId: string, data: FormData) {
  // 1. Input Validation
  const validation = schema.safeParse(data);
  if (!validation.success) {
    throw new Error('Validation failed');
  }
  
  // 2. Authorization Check
  if (!userId) throw new Error('Unauthorized');
  const isAuthorized = await checkAuthorization(userId, resourceId);
  if (!isAuthorized) throw new Error('Forbidden');
  
  // 3. Domain Logic
  await applyBusinessRules(validation.data);
  
  // 4. Firestore Write
  await firestore.collection('collection').doc(id).update(data);
  
  // 5. Cache Invalidation
  revalidatePath('/relevant/path');
  
  return { success: true };
}
```
