'use client';

import type { ShippingOption } from './checkout-shipping-actions';
import type { ShippingZone } from './shipping-actions';

/**
 * Calculate final shipping price with free threshold check (client-side helper)
 * This is a pure calculation function that runs on the client
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

