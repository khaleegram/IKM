'use server';

import { getAdminFirestore } from './firebase/admin';
import { getPublicShippingZones } from './shipping-actions';

export interface ShippingOption {
  type: 'delivery' | 'pickup' | 'contact';
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
  
  // If no state provided, only return pickup (if available)
  const hasState = customerState && customerState.trim().length > 0;

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
  
  // Format pickup address - handle both old (string) and new (object) formats
  let sellerPickupAddress = '';
  if (storeData?.pickupAddress) {
    if (typeof storeData.pickupAddress === 'object' && storeData.pickupAddress !== null) {
      // New format: { state, lga, street }
      const addr = storeData.pickupAddress;
      sellerPickupAddress = `${addr.street || ''}, ${addr.lga || ''}, ${addr.state || ''} State`.trim();
    } else if (typeof storeData.pickupAddress === 'string') {
      // Old format: just a string
      sellerPickupAddress = storeData.pickupAddress;
    }
  }
  
  // Fallback to storeLocation if pickupAddress not set
  if (!sellerPickupAddress && storeData?.storeLocation) {
    const loc = storeData.storeLocation;
    sellerPickupAddress = loc.address || `${loc.city || ''}, ${loc.lga || ''}, ${loc.state || ''} State`.trim();
  }

  // Normalize customer state for matching (handle FCT = Abuja, etc.)
  const normalizeStateForMatching = (state: string): string => {
    const normalized = state.toLowerCase().trim();
    // Handle common aliases
    if (normalized === 'fct' || normalized === 'abuja' || normalized === 'federal capital territory') {
      return 'fct (abuja)';
    }
    return normalized;
  };

  const normalizedCustomerState = normalizeStateForMatching(customerState);

  // Find matching shipping zone for customer's state
  const matchingZone = zones.find(zone => {
    // If zone has states array, check if customer state is in it
    if (zone.states && zone.states.length > 0) {
      return zone.states.some(state => 
        normalizeStateForMatching(state) === normalizedCustomerState
      );
    }
    // If no states specified, zone applies to all (or check by zone name)
    const zoneNameNormalized = normalizeStateForMatching(zone.name);
    return zoneNameNormalized === normalizedCustomerState ||
           zoneNameNormalized.includes(normalizedCustomerState) ||
           normalizedCustomerState.includes(zoneNameNormalized);
  });

  const options: ShippingOption[] = [];

  // Always offer pickup option if seller has pickup address (shown first, before state selection)
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

  // Only show delivery/contact options if customer has selected a state
  if (hasState) {
    // Offer delivery if products allow shipping and there's a matching zone
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
    } else if (!matchingZone || !allProductsAllowShipping) {
      // Delivery not available to this state - offer "Contact Seller" option
      options.push({
        type: 'contact',
        price: 0,
        name: 'Contact Seller to Arrange',
        description: `Chat with the seller to arrange delivery or pickup. You'll be able to discuss details after placing your order.`,
        available: true,
      });
    }
  }

  // Build message (only if state is selected)
  let message: string | undefined;
  if (hasState) {
    if (!allProductsAllowShipping) {
      message = 'Some products in your cart do not allow shipping. Please choose pickup or contact seller.';
    } else if (!matchingZone) {
      message = `We don't currently ship to ${customerState}. Please choose pickup or contact seller to arrange delivery.`;
    }
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

  // Normalize state for matching
  const normalizeStateForMatching = (state: string): string => {
    const normalized = state.toLowerCase().trim();
    if (normalized === 'fct' || normalized === 'abuja' || normalized === 'federal capital territory') {
      return 'fct (abuja)';
    }
    return normalized;
  };

  const zones = await getPublicShippingZones(sellerId);
  const normalizedCustomerState = normalizeStateForMatching(customerState);
  const matchingZone = zones.find(zone => {
    if (zone.states && zone.states.length > 0) {
      return zone.states.some(state => 
        normalizeStateForMatching(state) === normalizedCustomerState
      );
    }
    const zoneNameNormalized = normalizeStateForMatching(zone.name);
    return zoneNameNormalized === normalizedCustomerState ||
           zoneNameNormalized.includes(normalizedCustomerState) ||
           normalizedCustomerState.includes(zoneNameNormalized);
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


