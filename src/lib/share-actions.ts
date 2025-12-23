'use client';

/**
 * Share product functionality
 */
export function shareProduct(productName: string, productId: string) {
  const url = `${window.location.origin}/product/${productId}`;
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

