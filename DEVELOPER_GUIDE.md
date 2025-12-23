# Developer Guide - IKM Marketplace

This guide helps developers understand and follow the architecture when writing new code.

## Quick Start

### Creating a New Server Action

1. **Copy the template**: Use `src/lib/server-action-template.ts` as a starting point
2. **Follow the Write Contract**: Always implement all 5 steps in order
3. **Use auth utilities**: Import from `@/lib/auth-utils` for authentication

### Example: Creating a Product Review Action

```typescript
'use server';

import { z } from 'zod';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth-utils';

const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().min(1).max(5),
  comment: z.string().min(10).max(500),
});

export async function addProductReview(data: FormData) {
  // 2. Authorization Check (FIRST!)
  const auth = await requireAuth();

  // 1. Input Validation
  const rawData: Record<string, any> = {};
  data.forEach((value, key) => {
    rawData[key] = value;
  });

  const validation = reviewSchema.safeParse(rawData);
  if (!validation.success) {
    throw new Error(validation.error.errors.map(e => e.message).join(', '));
  }

  // 3. Domain Logic
  // Check if user already reviewed this product
  const firestore = getAdminFirestore();
  const existingReview = await firestore
    .collection('reviews')
    .where('productId', '==', validation.data.productId)
    .where('userId', '==', auth.uid)
    .limit(1)
    .get();

  if (!existingReview.empty) {
    throw new Error('You have already reviewed this product');
  }

  // 4. Firestore Write
  await firestore.collection('reviews').add({
    ...validation.data,
    userId: auth.uid, // Use verified auth.uid
    createdAt: new Date(),
  });

  // 5. Cache Invalidation
  revalidatePath(`/product/${validation.data.productId}`);
  revalidatePath('/reviews');

  return { success: true };
}
```

## Architecture Rules

### ✅ DO

1. **Always verify authentication in server actions**
   ```typescript
   const auth = await requireAuth(); // or requireAdmin() or requireOwnerOrAdmin(userId)
   ```

2. **Use verified auth.uid, not userId parameter**
   ```typescript
   // ✅ Good
   userId: auth.uid
   
   // ❌ Bad
   userId: userId // Parameter can be tampered with
   ```

3. **Validate all inputs with Zod**
   ```typescript
   const validation = schema.safeParse(data);
   if (!validation.success) {
     throw new Error('Validation failed');
   }
   ```

4. **Revalidate paths after writes**
   ```typescript
   revalidatePath('/relevant/path');
   ```

5. **Use server actions for ALL writes**
   - Never write to Firestore from client-side
   - Use real-time listeners for reads only

### ❌ DON'T

1. **Don't trust userId parameters**
   ```typescript
   // ❌ Bad - userId can be tampered with
   export async function updateProfile(userId: string, data: FormData) {
     await firestore.collection('users').doc(userId).update(data);
   }
   
   // ✅ Good - Verify ownership
   export async function updateProfile(userId: string, data: FormData) {
     const auth = await requireOwnerOrAdmin(userId);
     await firestore.collection('users').doc(auth.uid).update(data);
   }
   ```

2. **Don't skip authorization checks**
   ```typescript
   // ❌ Bad - No auth check
   export async function deleteProduct(productId: string) {
     await firestore.collection('products').doc(productId).delete();
   }
   
   // ✅ Good - Verify ownership
   export async function deleteProduct(productId: string) {
     const auth = await requireAuth();
     const product = await getProduct(productId);
     if (product.sellerId !== auth.uid && !auth.isAdmin) {
       throw new Error('Forbidden');
     }
     await firestore.collection('products').doc(productId).delete();
   }
   ```

3. **Don't write from client-side**
   ```typescript
   // ❌ Bad - Client-side write
   const firestore = useFirebase().firestore;
   await updateDoc(doc(firestore, 'products', id), { name: 'New Name' });
   
   // ✅ Good - Server action
   await updateProduct(id, userId, formData);
   ```

4. **Don't skip input validation**
   ```typescript
   // ❌ Bad - No validation
   export async function createProduct(data: any) {
     await firestore.collection('products').add(data);
   }
   
   // ✅ Good - Zod validation
   export async function createProduct(data: FormData) {
     const validation = productSchema.safeParse(data);
     if (!validation.success) throw new Error('Invalid input');
     await firestore.collection('products').add(validation.data);
   }
   ```

## Authentication Utilities

### `requireAuth()`
- Verifies user is authenticated
- Returns `{ uid, email, isAdmin }`
- Throws error if not authenticated

### `requireAdmin()`
- Verifies user is admin
- Returns `{ uid, email }`
- Throws error if not admin

### `requireOwnerOrAdmin(resourceOwnerId)`
- Verifies user owns resource OR is admin
- Returns `{ uid, email, isAdmin }`
- Throws error if neither owner nor admin

## State Machines

For operations with state transitions (like orders), use state machines:

```typescript
const ALLOWED_TRANSITIONS: Record<Status, Status[]> = {
  'Processing': ['Shipped', 'Cancelled'],
  'Shipped': ['Delivered', 'Cancelled'],
  'Delivered': [], // Final state
  'Cancelled': [], // Final state
};

// In your action
const allowed = ALLOWED_TRANSITIONS[currentStatus];
if (!allowed.includes(newStatus)) {
  throw new Error(`Invalid transition from ${currentStatus} to ${newStatus}`);
}
```

## Testing Your Code

Before submitting code, test:

1. **Happy path**: Normal operation works
2. **Unauthorized access**: Unauthenticated user gets error
3. **Wrong user**: User tries to access another user's resource
4. **Invalid input**: Invalid data is rejected
5. **State machine**: Invalid transitions are rejected

## Common Patterns

### Pattern 1: Owner-Only Action
```typescript
export async function updateMyProfile(data: FormData) {
  const auth = await requireAuth(); // Any authenticated user
  // ... validation and write using auth.uid
}
```

### Pattern 2: Owner or Admin Action
```typescript
export async function updateUserProfile(userId: string, data: FormData) {
  const auth = await requireOwnerOrAdmin(userId);
  // ... validation and write
}
```

### Pattern 3: Admin-Only Action
```typescript
export async function deleteUser(userId: string) {
  await requireAdmin(); // Must be admin
  // ... delete operation
}
```

### Pattern 4: State Machine Action
```typescript
export async function updateOrderStatus(orderId: string, newStatus: Status) {
  const auth = await requireAuth();
  const order = await getOrder(orderId);
  
  // Verify ownership
  if (order.sellerId !== auth.uid && !auth.isAdmin) {
    throw new Error('Forbidden');
  }
  
  // State machine validation
  const allowed = ALLOWED_TRANSITIONS[order.status];
  if (!allowed.includes(newStatus)) {
    throw new Error('Invalid transition');
  }
  
  // Write
  await firestore.collection('orders').doc(orderId).update({ status: newStatus });
  revalidatePath('/seller/orders');
}
```

## Questions?

- Check `ARCHITECTURE.md` for detailed architecture
- Check `src/lib/server-action-template.ts` for code template
- Check existing actions in `src/lib/*-actions.ts` for examples

