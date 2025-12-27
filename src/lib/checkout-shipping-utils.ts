'use client';

import type { ShippingOption } from './checkout-shipping-actions';
import type { ShippingZone } from './shipping-actions';

/**
 * Calculate final shipping price with free threshold check (client-side helper)
 * This is a pure calculation function that runs on the client
 * Now also respects deliveryFeePaidBy - if seller pays, shipping is always 0
 */
export function calculateFinalShippingPrice(
  selectedOption: ShippingOption | null,
  orderSubtotal: number,
  zones: ShippingZone[],
  deliveryFeePaidBy?: 'seller' | 'buyer'
): number {
  // If seller pays, shipping is always 0
  if (deliveryFeePaidBy === 'seller') {
    return 0;
  }

  // If no option selected, pickup selected, or contact selected, shipping is always 0
  if (!selectedOption || selectedOption.type === 'pickup' || selectedOption.type === 'contact') {
    return 0;
  }

  // Only calculate for delivery options
  if (selectedOption.type !== 'delivery') {
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
  
  // Check if free shipping threshold is met
  if (zone && zone.freeThreshold && orderSubtotal >= zone.freeThreshold) {
    return 0; // Free shipping
  }

  // Return the option's price (should be the zone rate)
  return selectedOption.price || 0;
}

