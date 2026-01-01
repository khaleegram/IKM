'use client';

/**
 * Get absolute URL from a path
 */
export function getAbsoluteUrl(path: string): string {
  if (typeof window !== 'undefined') {
    // Client-side: use current origin
    return `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`;
  }
  // Server-side: use environment variable
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                  process.env.NEXT_PUBLIC_APP_DOMAIN ||
                  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:9002');
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Generate WhatsApp share URL
 */
export function generateWhatsAppShareUrl(text: string, url: string): string {
  const message = `${text}\n\n${url}`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/**
 * Format product share message for WhatsApp
 */
export function formatProductShareMessage(productName: string, price: number, url: string): string {
  return `🛍️ ${productName}\n\n💰 ₦${price.toLocaleString()}\n\n${url}`;
}

/**
 * Format store share message for WhatsApp
 */
export function formatStoreShareMessage(storeName: string, description: string | undefined, url: string): string {
  const desc = description ? `\n${description}` : '';
  return `🏪 ${storeName}${desc}\n\n${url}`;
}

/**
 * Share product functionality
 */
export function shareProduct(productName: string, productId: string) {
  const url = getAbsoluteUrl(`/product/${productId}`);
  const text = `Check out ${productName} on IKM Marketplace!`;

  if (navigator.share) {
    navigator.share({
      title: productName,
      text: text,
      url: url,
    }).catch((error) => {
      console.error('Error sharing:', error);
      // Fallback to clipboard
      copyToClipboard(url);
    });
  } else {
    // Fallback to clipboard
    copyToClipboard(url);
  }
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(() => {
    // Toast will be shown by the calling component
  }).catch((error) => {
    console.error('Failed to copy to clipboard:', error);
  });
}

