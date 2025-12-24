/**
 * Request Deduplication Utility
 * Prevents duplicate API calls when multiple components request the same data
 */

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

class RequestDeduplicator {
  private pendingRequests = new Map<string, PendingRequest<any>>();
  private readonly DEDUP_WINDOW = 1000; // 1 second window

  /**
   * Deduplicate a request - if the same request is made within the window, return the existing promise
   */
  async deduplicate<T>(
    key: string,
    requestFn: () => Promise<T>,
    windowMs: number = this.DEDUP_WINDOW
  ): Promise<T> {
    const now = Date.now();
    const existing = this.pendingRequests.get(key);

    // If there's a pending request within the window, return it
    if (existing && (now - existing.timestamp) < windowMs) {
      return existing.promise;
    }

    // Create new request
    const promise = requestFn().finally(() => {
      // Clean up after request completes
      setTimeout(() => {
        this.pendingRequests.delete(key);
      }, windowMs);
    });

    this.pendingRequests.set(key, {
      promise,
      timestamp: now,
    });

    return promise;
  }

  /**
   * Clear all pending requests
   */
  clear(): void {
    this.pendingRequests.clear();
  }

  /**
   * Clear expired requests
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > this.DEDUP_WINDOW * 2) {
        this.pendingRequests.delete(key);
      }
    }
  }
}

export const requestDeduplicator = new RequestDeduplicator();

/**
 * Generate a cache key from request parameters
 */
export function generateRequestKey(endpoint: string, params?: Record<string, any>): string {
  const paramStr = params ? JSON.stringify(params) : '';
  return `${endpoint}:${paramStr}`;
}

