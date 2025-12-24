/**
 * Guest Session Management
 * Stores guest checkout data in localStorage for persistence
 */

export interface GuestDeliveryInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  state: string;
}

const GUEST_SESSION_KEY = 'ikm-guest-session';
const GUEST_DELIVERY_KEY = 'ikm-guest-delivery';

/**
 * Save guest delivery information to localStorage
 */
export function saveGuestDeliveryInfo(info: GuestDeliveryInfo): void {
  try {
    localStorage.setItem(GUEST_DELIVERY_KEY, JSON.stringify(info));
  } catch (error) {
    console.warn('Failed to save guest delivery info:', error);
  }
}

/**
 * Load guest delivery information from localStorage
 */
export function loadGuestDeliveryInfo(): GuestDeliveryInfo | null {
  try {
    const saved = localStorage.getItem(GUEST_DELIVERY_KEY);
    if (saved) {
      return JSON.parse(saved) as GuestDeliveryInfo;
    }
  } catch (error) {
    console.warn('Failed to load guest delivery info:', error);
  }
  return null;
}

/**
 * Clear guest delivery information
 */
export function clearGuestDeliveryInfo(): void {
  try {
    localStorage.removeItem(GUEST_DELIVERY_KEY);
  } catch (error) {
    console.warn('Failed to clear guest delivery info:', error);
  }
}

/**
 * Save guest session data (for tracking)
 */
export function saveGuestSession(sessionId: string, data: any): void {
  try {
    localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify({
      sessionId,
      ...data,
      timestamp: Date.now(),
    }));
  } catch (error) {
    console.warn('Failed to save guest session:', error);
  }
}

/**
 * Load guest session data
 */
export function loadGuestSession(): any | null {
  try {
    const saved = localStorage.getItem(GUEST_SESSION_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.warn('Failed to load guest session:', error);
  }
  return null;
}

/**
 * Clear guest session data
 */
export function clearGuestSession(): void {
  try {
    localStorage.removeItem(GUEST_SESSION_KEY);
  } catch (error) {
    console.warn('Failed to clear guest session:', error);
  }
}

/**
 * Generate a unique guest session ID
 */
export function generateGuestSessionId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

