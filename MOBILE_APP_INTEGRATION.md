# Mobile App Integration Guide - Complete Tutorial

This guide shows you **exactly** how to use Cloud Functions in your mobile app (React Native, Flutter, or native).

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Getting Started](#getting-started)
3. [Authentication Setup](#authentication-setup)
4. [Calling Functions - Step by Step](#calling-functions---step-by-step)
5. [Complete Code Examples](#complete-code-examples)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, make sure you have:
1. ✅ Firebase SDK installed in your mobile app
2. ✅ Firebase Authentication configured
3. ✅ Cloud Functions deployed (see [CLOUD_FUNCTIONS_SETUP_GUIDE.md](./CLOUD_FUNCTIONS_SETUP_GUIDE.md))
4. ✅ Your function URLs (from deployment output)

---

## Getting Started

### Step 1: Get Your Function URLs

After deploying Cloud Functions, you'll see URLs like:
```
https://us-central1-your-project.cloudfunctions.net/verifyPaymentAndCreateOrder
https://us-central1-your-project.cloudfunctions.net/createProduct
...
```

**Save these URLs!** You'll need them to call functions.

**How to get them:**
1. Run: `firebase deploy --only functions`
2. Copy the URLs from the output
3. Or check Firebase Console → Functions → List all functions

---

## Authentication Setup

### Step 1: Initialize Firebase in Your Mobile App

**React Native (with react-native-firebase):**
```javascript
import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';

// Firebase is already initialized via firebase.json or GoogleService-Info.plist
```

**Flutter:**
```dart
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';

// Initialize in main.dart
await Firebase.initializeApp();
```

**Native iOS (Swift):**
```swift
import FirebaseCore
import FirebaseAuth

// In AppDelegate.swift
FirebaseApp.configure()
```

**Native Android (Kotlin):**
```kotlin
import com.google.firebase.Firebase
import com.google.firebase.auth.auth
import com.google.firebase.initialize

// In MainActivity.kt or Application class
Firebase.initialize(context = this)
```

---

### Step 2: Get Firebase ID Token

**IMPORTANT:** Every Cloud Function call needs a Firebase ID token in the `Authorization` header.

**React Native:**
```javascript
import auth from '@react-native-firebase/auth';

async function getIdToken() {
  const user = auth().currentUser;
  if (!user) {
    throw new Error('User not logged in');
  }
  const token = await user.getIdToken();
  return token;
}
```

**Flutter:**
```dart
import 'package:firebase_auth/firebase_auth.dart';

Future<String> getIdToken() async {
  final user = FirebaseAuth.instance.currentUser;
  if (user == null) {
    throw Exception('User not logged in');
  }
  final token = await user.getIdToken();
  return token!;
}
```

**Native iOS (Swift):**
```swift
import FirebaseAuth

func getIdToken() async throws -> String {
    guard let user = Auth.auth().currentUser else {
        throw NSError(domain: "AuthError", code: -1, userInfo: [NSLocalizedDescriptionKey: "User not logged in"])
    }
    let token = try await user.getIDToken()
    return token
}
```

**Native Android (Kotlin):**
```kotlin
import com.google.firebase.auth.FirebaseAuth

suspend fun getIdToken(): String {
    val user = FirebaseAuth.getInstance().currentUser
        ?: throw Exception("User not logged in")
    return user.getIdToken(true).await().token
        ?: throw Exception("Failed to get token")
}
```

---

## Calling Functions - Step by Step

### The Basic Pattern

Every Cloud Function call follows this pattern:

1. **Get authentication token**
2. **Prepare request data**
3. **Make HTTP request with token**
4. **Handle response**
5. **Handle errors**

---

## Complete Code Examples

### Example 1: Verify Payment and Create Order

This is the **most important** function - it creates orders after payment.

**React Native:**
```javascript
import auth from '@react-native-firebase/auth';

const FUNCTION_URL = 'https://us-central1-your-project.cloudfunctions.net/verifyPaymentAndCreateOrder';

async function verifyPaymentAndCreateOrder(paymentData) {
  try {
    // Step 1: Get authentication token
    const user = auth().currentUser;
    if (!user) {
      throw new Error('User must be logged in');
    }
    const token = await user.getIdToken();

    // Step 2: Prepare request data
    const requestData = {
      reference: paymentData.reference, // From Paystack
      idempotencyKey: paymentData.idempotencyKey, // Unique key to prevent duplicates
      cartItems: paymentData.cartItems,
      total: paymentData.total,
      deliveryAddress: paymentData.deliveryAddress,
      customerInfo: {
        email: paymentData.email,
        name: paymentData.name,
        firstName: paymentData.firstName,
        lastName: paymentData.lastName,
        phone: paymentData.phone,
      },
      shippingType: paymentData.shippingType, // "delivery" or "pickup"
      shippingPrice: paymentData.shippingPrice,
    };

    // Step 3: Make HTTP request
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`, // IMPORTANT: Include token!
      },
      body: JSON.stringify(requestData),
    });

    // Step 4: Parse response
    const result = await response.json();

    // Step 5: Handle errors
    if (!response.ok) {
      throw new Error(result.error || 'Failed to create order');
    }

    if (!result.success) {
      throw new Error(result.error || 'Order creation failed');
    }

    // Success!
    console.log('Order created:', result.orderId);
    return result;

  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

// Usage:
const paymentData = {
  reference: 'IKM_1234567890_abc123',
  idempotencyKey: 'unique-key-' + Date.now(),
  cartItems: [
    {
      id: 'product-123',
      name: 'Product Name',
      price: 50000,
      quantity: 2,
      imageUrl: 'https://...',
    },
  ],
  total: 100000,
  deliveryAddress: '123 Main St, Lagos',
  email: 'buyer@example.com',
  name: 'John Doe',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+2348123456789',
  shippingType: 'delivery',
  shippingPrice: 2500,
};

verifyPaymentAndCreateOrder(paymentData)
  .then(result => {
    console.log('Success! Order ID:', result.orderId);
  })
  .catch(error => {
    console.error('Failed:', error.message);
  });
```

**Flutter:**
```dart
import 'package:http/http.dart' as http;
import 'package:firebase_auth/firebase_auth.dart';
import 'dart:convert';

const String FUNCTION_URL = 'https://us-central1-your-project.cloudfunctions.net/verifyPaymentAndCreateOrder';

Future<Map<String, dynamic>> verifyPaymentAndCreateOrder(Map<String, dynamic> paymentData) async {
  try {
    // Step 1: Get authentication token
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      throw Exception('User must be logged in');
    }
    final token = await user.getIdToken();

    // Step 2: Prepare request data
    final requestData = {
      'reference': paymentData['reference'],
      'idempotencyKey': paymentData['idempotencyKey'],
      'cartItems': paymentData['cartItems'],
      'total': paymentData['total'],
      'deliveryAddress': paymentData['deliveryAddress'],
      'customerInfo': {
        'email': paymentData['email'],
        'name': paymentData['name'],
        'firstName': paymentData['firstName'],
        'lastName': paymentData['lastName'],
        'phone': paymentData['phone'],
      },
      'shippingType': paymentData['shippingType'],
      'shippingPrice': paymentData['shippingPrice'],
    };

    // Step 3: Make HTTP request
    final response = await http.post(
      Uri.parse(FUNCTION_URL),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token', // IMPORTANT: Include token!
      },
      body: jsonEncode(requestData),
    );

    // Step 4: Parse response
    final result = jsonDecode(response.body) as Map<String, dynamic>;

    // Step 5: Handle errors
    if (response.statusCode != 200) {
      throw Exception(result['error'] ?? 'Failed to create order');
    }

    if (result['success'] != true) {
      throw Exception(result['error'] ?? 'Order creation failed');
    }

    // Success!
    print('Order created: ${result['orderId']}');
    return result;

  } catch (error) {
    print('Error creating order: $error');
    rethrow;
  }
}

// Usage:
final paymentData = {
  'reference': 'IKM_1234567890_abc123',
  'idempotencyKey': 'unique-key-${DateTime.now().millisecondsSinceEpoch}',
  'cartItems': [
    {
      'id': 'product-123',
      'name': 'Product Name',
      'price': 50000,
      'quantity': 2,
      'imageUrl': 'https://...',
    },
  ],
  'total': 100000,
  'deliveryAddress': '123 Main St, Lagos',
  'email': 'buyer@example.com',
  'name': 'John Doe',
  'firstName': 'John',
  'lastName': 'Doe',
  'phone': '+2348123456789',
  'shippingType': 'delivery',
  'shippingPrice': 2500,
};

try {
  final result = await verifyPaymentAndCreateOrder(paymentData);
  print('Success! Order ID: ${result['orderId']}');
} catch (error) {
  print('Failed: $error');
}
```

---

### Example 2: Create Product (Seller)

**React Native:**
```javascript
import auth from '@react-native-firebase/auth';

const FUNCTION_URL = 'https://us-central1-your-project.cloudfunctions.net/createProduct';

async function createProduct(productData) {
  try {
    // Get token
    const user = auth().currentUser;
    if (!user) throw new Error('User must be logged in');
    const token = await user.getIdToken();

    // Prepare data
    const requestData = {
      name: productData.name,
      description: productData.description,
      price: productData.price,
      compareAtPrice: productData.compareAtPrice,
      stock: productData.stock,
      category: productData.category,
      images: productData.images,
      allowShipping: productData.allowShipping ?? true,
      status: productData.status ?? 'active',
    };

    // Make request
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestData),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to create product');
    }

    return result;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

// Usage:
createProduct({
  name: 'New Product',
  description: 'This is a great product with lots of features...',
  price: 50000,
  compareAtPrice: 60000,
  stock: 100,
  category: 'Electronics',
  images: ['https://...'],
})
  .then(result => console.log('Product created:', result.productId))
  .catch(error => console.error('Failed:', error));
```

---

### Example 3: Get Orders (Customer)

**React Native:**
```javascript
import auth from '@react-native-firebase/auth';

const FUNCTION_URL = 'https://us-central1-your-project.cloudfunctions.net/getOrdersByCustomer';

async function getMyOrders(options = {}) {
  try {
    const user = auth().currentUser;
    if (!user) throw new Error('User must be logged in');
    const token = await user.getIdToken();

    // Build query string
    const params = new URLSearchParams();
    if (options.status) params.append('status', options.status);
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.startAfter) params.append('startAfter', options.startAfter);

    const url = `${FUNCTION_URL}?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to get orders');
    }

    return result.orders;
  } catch (error) {
    console.error('Error getting orders:', error);
    throw error;
  }
}

// Usage:
getMyOrders({ status: 'Processing', limit: 20 })
  .then(orders => {
    console.log('My orders:', orders);
    orders.forEach(order => {
      console.log(`Order ${order.id}: ${order.status} - ₦${order.total}`);
    });
  })
  .catch(error => console.error('Failed:', error));
```

---

### Example 4: Mark Order as Sent (Seller)

**React Native:**
```javascript
import auth from '@react-native-firebase/auth';

const FUNCTION_URL = 'https://us-central1-your-project.cloudfunctions.net/markOrderAsSent';

async function markOrderAsSent(orderId, photoUrl = null) {
  try {
    const user = auth().currentUser;
    if (!user) throw new Error('User must be logged in');
    const token = await user.getIdToken();

    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        orderId: orderId,
        photoUrl: photoUrl, // Optional
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to mark order as sent');
    }

    return result;
  } catch (error) {
    console.error('Error marking order as sent:', error);
    throw error;
  }
}

// Usage:
markOrderAsSent('order-id-12345', 'https://storage.googleapis.com/...')
  .then(result => console.log('Order marked as sent!'))
  .catch(error => console.error('Failed:', error));
```

---

### Example 5: Send Order Message (Chat)

**React Native:**
```javascript
import auth from '@react-native-firebase/auth';

const FUNCTION_URL = 'https://us-central1-your-project.cloudfunctions.net/sendOrderMessage';

async function sendOrderMessage(orderId, message, imageUrl = null) {
  try {
    const user = auth().currentUser;
    if (!user) throw new Error('User must be logged in');
    const token = await user.getIdToken();

    const requestData = {
      orderId: orderId,
    };

    // Include message OR imageUrl (at least one required)
    if (message) {
      requestData.message = message;
    }
    if (imageUrl) {
      requestData.imageUrl = imageUrl;
    }

    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestData),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to send message');
    }

    return result;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

// Usage:
sendOrderMessage('order-id-12345', 'When will this ship?')
  .then(result => console.log('Message sent:', result.messageId))
  .catch(error => console.error('Failed:', error));
```

---

### Example 6: Calculate Shipping (Public - No Auth)

**React Native:**
```javascript
const FUNCTION_URL = 'https://us-central1-your-project.cloudfunctions.net/calculateShippingOptions';

async function calculateShipping(sellerId, state, city, cartItems) {
  try {
    // No authentication needed for this function!

    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // No Authorization header needed!
      },
      body: JSON.stringify({
        sellerId: sellerId,
        state: state,
        city: city,
        cartItems: cartItems,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to calculate shipping');
    }

    return result.options;
  } catch (error) {
    console.error('Error calculating shipping:', error);
    throw error;
  }
}

// Usage:
calculateShipping('seller-id-123', 'Lagos', 'Ikeja', [
  { id: 'product-123', allowShipping: true },
])
  .then(options => {
    console.log('Shipping options:', options);
    options.forEach(option => {
      console.log(`${option.name}: ₦${option.price}`);
    });
  })
  .catch(error => console.error('Failed:', error));
```

---

## Error Handling

### Common Errors and Solutions

**1. "User not logged in" / "UNAUTHENTICATED"**
```javascript
// Solution: Check if user is logged in before calling function
const user = auth().currentUser;
if (!user) {
  // Redirect to login screen
  navigation.navigate('Login');
  return;
}
```

**2. "UNAUTHORIZED" / "Permission denied"**
```javascript
// Solution: User doesn't have permission (e.g., customer trying to create product)
// Show user-friendly error message
alert('You do not have permission to perform this action');
```

**3. "VALIDATION_ERROR"**
```javascript
// Solution: Check your input data
if (!productData.name || productData.name.length < 1) {
  alert('Product name is required');
  return;
}
```

**4. Network errors**
```javascript
// Solution: Add retry logic or show network error
try {
  await verifyPaymentAndCreateOrder(paymentData);
} catch (error) {
  if (error.message.includes('network') || error.message.includes('fetch')) {
    alert('Network error. Please check your internet connection.');
  } else {
    alert('Error: ' + error.message);
  }
}
```

**5. Function timeout**
```javascript
// Solution: Cloud Functions timeout after 60 seconds
// For long operations, show loading indicator
setLoading(true);
try {
  await verifyPaymentAndCreateOrder(paymentData);
} finally {
  setLoading(false);
}
```

---

## Best Practices

### 1. Create a Helper Function

Don't repeat code! Create a reusable function:

**React Native:**
```javascript
import auth from '@react-native-firebase/auth';

const BASE_URL = 'https://us-central1-your-project.cloudfunctions.net';

async function callCloudFunction(functionName, data = null, method = 'POST') {
  try {
    const user = auth().currentUser;
    if (!user) {
      throw new Error('User must be logged in');
    }
    const token = await user.getIdToken();

    const url = `${BASE_URL}/${functionName}`;
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    };

    if (data && method === 'POST') {
      options.body = JSON.stringify(data);
    } else if (data && method === 'GET') {
      // Append query params for GET
      const params = new URLSearchParams(data);
      url = `${url}?${params.toString()}`;
    }

    const response = await fetch(url, options);
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Function call failed');
    }

    return result;
  } catch (error) {
    console.error(`Error calling ${functionName}:`, error);
    throw error;
  }
}

// Now use it easily:
const order = await callCloudFunction('verifyPaymentAndCreateOrder', paymentData);
const products = await callCloudFunction('getOrdersByCustomer', { status: 'Processing' }, 'GET');
```

---

### 2. Handle Loading States

```javascript
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

async function handleCreateOrder() {
  setLoading(true);
  setError(null);
  
  try {
    const result = await verifyPaymentAndCreateOrder(paymentData);
    // Success!
    navigation.navigate('OrderSuccess', { orderId: result.orderId });
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
}
```

---

### 3. Retry Failed Requests

```javascript
async function callWithRetry(functionName, data, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await callCloudFunction(functionName, data);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

---

## Troubleshooting

### Problem: "Function not found" / 404 error
**Solution:**
- Check function URL is correct
- Make sure function is deployed: `firebase deploy --only functions`
- Check function name matches exactly (case-sensitive)

### Problem: "Unauthorized" / 401 error
**Solution:**
- Make sure user is logged in
- Check token is included in Authorization header
- Token might be expired - get a new one: `await user.getIdToken(true)`

### Problem: "CORS error" (web only)
**Solution:**
- Cloud Functions allow all origins by default
- If you see CORS errors, check function code allows your origin

### Problem: "Timeout" / Function takes too long
**Solution:**
- Cloud Functions timeout after 60 seconds
- Optimize your function code
- For long operations, use background functions

### Problem: "Network request failed"
**Solution:**
- Check internet connection
- Check function URL is correct
- Try calling function from browser/postman to test

---

## 🎉 You're Ready!

You now know how to:
- ✅ Call Cloud Functions from mobile app
- ✅ Handle authentication
- ✅ Handle errors properly
- ✅ Use best practices

**Next Steps:**
1. Deploy Cloud Functions (see [CLOUD_FUNCTIONS_SETUP_GUIDE.md](./CLOUD_FUNCTIONS_SETUP_GUIDE.md))
2. Get your function URLs
3. Start integrating in your mobile app!

---

**Need Help?**
- Check function logs: `firebase functions:log`
- Firebase Console: https://console.firebase.google.com/
- Firebase Docs: https://firebase.google.com/docs/functions

