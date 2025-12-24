'use server';

import { getAdminFirestore } from './firebase/admin';
import { getShippingZones, type ShippingZone } from './shipping-actions';

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
 */
export async function calculateShippingOptions(
  sellerId: string,
  customerState: string
): Promise<ShippingCalculation> {
  const firestore = getAdminFirestore();

  // Get seller's shipping zones
  const zones = await getShippingZones(sellerId);

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

  if (matchingZone) {
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
  } else {
    // Seller doesn't ship to this state - offer pickup only
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
  }

  // Always offer pickup option if seller has pickup address
  if (sellerPickupAddress && !options.some(o => o.type === 'pickup')) {
    options.push({
      type: 'pickup',
      price: 0,
      name: 'Pickup from Store',
      description: `Pick up your order from our store location`,
      pickupAddress: sellerPickupAddress,
      available: true,
    });
  }

  return {
    available: options.length > 0,
    options,
    message: matchingZone 
      ? undefined 
      : `We don't currently ship to ${customerState}. Please choose pickup or contact us to arrange delivery.`,
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

  const zones = await getShippingZones(sellerId);
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

/**
 * Calculate final shipping price with free threshold check (client-side helper)
 */
export function calculateFinalShippingPrice(
  selectedOption: ShippingOption | null,
  orderSubtotal: number,
  zones: ShippingZone[]
): number {
  if (!selectedOption || selectedOption.type === 'pickup') {
    return 0;
  }

  // Find matching zone to check free threshold
  // Match by price or by description containing zone name
  const zone = zones.find(z => {
    if (z.rate === selectedOption.price) return true;
    // Try to match by zone name in description
    if (selectedOption.description?.includes(z.name)) return true;
    return false;
  });
  
  if (zone && zone.freeThreshold && orderSubtotal >= zone.freeThreshold) {
    return 0; // Free shipping
  }

  return selectedOption.price;
}

