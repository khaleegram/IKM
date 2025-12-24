'use server';

import { getAdminFirestore } from './firebase/admin';
import { getPublicShippingZones, type ShippingZone } from './shipping-actions';

export interface ShippingOption {
  type: 'delivery' | 'pickup';
  price: number;
  name: string;
  description: string;
  estimatedDays?: number;
  pickupAddress?: string;
  available: boolean;
}

export interface ShippingCalculation {
  available: boolean;
  options: ShippingOption[];
  message?: string;
  sellerPhone?: string;
  sellerPickupAddress?: string;
}

/**
 * Calculate shipping options for a customer based on their state and seller's shipping zones
 * Also checks if products in the cart allow shipping
 */
export async function calculateShippingOptions(
  sellerId: string,
  customerState: string,
  productIds?: string[] // Optional: product IDs to check allowShipping
): Promise<ShippingCalculation> {
  const firestore = getAdminFirestore();

  // Get seller's shipping zones (public - no auth required for checkout)
  const zones = await getPublicShippingZones(sellerId);

  // Check if any products don't allow shipping
  let allProductsAllowShipping = true;
  if (productIds && productIds.length > 0) {
    const productDocs = await Promise.all(
      productIds.map(id => firestore.collection('products').doc(id).get())
    );
    allProductsAllowShipping = productDocs.every(doc => {
      const data = doc.data();
      return data?.allowShipping !== false; // Default to true if not set
    });
  }

  // Get seller's store info for pickup address and phone
  const storeDoc = await firestore.collection('stores').doc(sellerId).get();
  const storeData = storeDoc.data();
  const sellerPhone = storeData?.phone || '';
  const sellerPickupAddress = storeData?.pickupAddress || storeData?.storeLocation?.address || '';

  // Find matching shipping zone for customer's state
  const matchingZone = zones.find(zone => {
    // If zone has states array, check if customer state is in it
    if (zone.states && zone.states.length > 0) {
      return zone.states.some(state => 
        state.toLowerCase() === customerState.toLowerCase()
      );
    }
    // If no states specified, zone applies to all (or check by zone name)
    return zone.name.toLowerCase().includes(customerState.toLowerCase()) ||
           customerState.toLowerCase().includes(zone.name.toLowerCase());
  });

  const options: ShippingOption[] = [];

  // Only offer delivery if products allow shipping and there's a matching zone
  if (allProductsAllowShipping && matchingZone) {
    // Seller ships to this state - offer delivery
    // Note: Free shipping will be calculated on checkout based on order total
    options.push({
      type: 'delivery',
      price: matchingZone.rate,
      name: `Delivery to ${customerState}`,
      description: matchingZone.freeThreshold 
        ? `Standard delivery. Free shipping for orders over ₦${matchingZone.freeThreshold.toLocaleString()}`
        : `Standard delivery to ${customerState}`,
      estimatedDays: 3,
      available: true,
    });
  }

  // Always offer pickup option if seller has pickup address
  if (sellerPickupAddress) {
    options.push({
      type: 'pickup',
      price: 0,
      name: 'Pickup from Store',
      description: `Pick up your order from our store location`,
      pickupAddress: sellerPickupAddress,
      available: true,
    });
  }

  // Build message
  let message: string | undefined;
  if (!allProductsAllowShipping) {
    message = 'Some products in your cart do not allow shipping. Please choose pickup.';
  } else if (!matchingZone) {
    message = `We don't currently ship to ${customerState}. Please choose pickup or contact us to arrange delivery.`;
  }

  return {
    available: options.length > 0,
    options,
    message,
    sellerPhone,
    sellerPickupAddress,
  };
}

/**
 * Get shipping price for a specific option
 */
export async function getShippingPrice(
  sellerId: string,
  customerState: string,
  orderTotal: number,
  shippingType: 'delivery' | 'pickup' = 'delivery'
): Promise<number> {
  if (shippingType === 'pickup') {
    return 0;
  }

  const zones = await getPublicShippingZones(sellerId);
  const matchingZone = zones.find(zone => {
    if (zone.states && zone.states.length > 0) {
      return zone.states.some(state => 
        state.toLowerCase() === customerState.toLowerCase()
      );
    }
    return zone.name.toLowerCase().includes(customerState.toLowerCase()) ||
           customerState.toLowerCase().includes(zone.name.toLowerCase());
  });

  if (!matchingZone) {
    return 0; // No shipping available
  }

  // Check if free shipping threshold is met
  if (matchingZone.freeThreshold && orderTotal >= matchingZone.freeThreshold) {
    return 0;
  }

  return matchingZone.rate;
}


