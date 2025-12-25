# 🚀 Quick Start: Using Cloud Functions in Your Web App

## Simple Example: Get Banks List

This is the easiest function to test - it's public and doesn't need authentication.

### Option 1: Direct Browser Test
Just open this URL in your browser:
```
https://getbankslist-q3rjv54uka-uc.a.run.app
```

You should see JSON with all Nigerian banks!

---

### Option 2: Use in Your Code

**In a React Component:**
```typescript
'use client';

import { useState, useEffect } from 'react';

export function BanksList() {
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBanks() {
      try {
        const response = await fetch('https://getbankslist-q3rjv54uka-uc.a.run.app');
        const data = await response.json();
        
        if (data.success) {
          setBanks(data.banks);
        }
      } catch (error) {
        console.error('Error fetching banks:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchBanks();
  }, []);

  if (loading) return <div>Loading banks...</div>;

  return (
    <div>
      <h2>Nigerian Banks</h2>
      <ul>
        {banks.map(bank => (
          <li key={bank.code}>{bank.name} ({bank.code})</li>
        ))}
      </ul>
    </div>
  );
}
```

---

## Example: Function with Authentication

For functions that need authentication (like `getOrdersByCustomer`):

```typescript
'use client';

import { useFirebase } from '@/firebase/provider';
import { useState, useEffect } from 'react';

export function MyOrders() {
  const { auth } = useFirebase();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Get Firebase ID token
        const idToken = await user.getIdToken();
        
        // Call Cloud Function
        const response = await fetch('https://getordersbycustomer-q3rjv54uka-uc.a.run.app', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}` // ← Important!
          },
          body: JSON.stringify({})
        });
        
        const data = await response.json();
        
        if (data.success) {
          setOrders(data.orders);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchOrders();
  }, [auth]);

  if (loading) return <div>Loading orders...</div>;
  if (orders.length === 0) return <div>No orders yet</div>;

  return (
    <div>
      <h2>My Orders</h2>
      {orders.map(order => (
        <div key={order.id}>
          Order #{order.id} - ₦{order.total}
        </div>
      ))}
    </div>
  );
}
```

---

## 🎯 When to Use Cloud Functions vs Server Actions

### Use Server Actions (Current Code):
- ✅ Web app only
- ✅ Simpler code
- ✅ Already working
- ✅ No authentication headers needed

### Use Cloud Functions:
- ✅ When building mobile app
- ✅ Need same code for web + mobile
- ✅ Want to share backend logic

**For now:** Keep using server actions in your web app. Cloud Functions are ready for when you build your mobile app!

---

## 📚 Next Steps

1. **Test a function** - Try the `getBanksList` example above
2. **Read the docs** - Check `CLOUD_FUNCTIONS_FUNCTIONS.md` for all function details
3. **Keep building** - Your current web app code works fine as-is!

---

## ❓ Need Help?

- Check `FUNCTION_URLS.md` for all function URLs
- Check `CLOUD_FUNCTIONS_FUNCTIONS.md` for detailed function documentation
- Check `NEXT_STEPS_BEGINNER_GUIDE.md` for more guidance

