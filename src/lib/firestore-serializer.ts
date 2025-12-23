/**
 * Firestore Data Serialization Utilities
 * 
 * Converts Firestore data types (Timestamps, etc.) to plain JSON-serializable objects
 * for passing from server actions to client components.
 */

/**
 * Convert Firestore Timestamp to ISO string
 */
function serializeTimestamp(timestamp: any): string | null {
  if (!timestamp) return null;
  
  // Firestore Admin SDK Timestamp (has toDate method)
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toISOString();
  }
  
  // Firestore Client SDK Timestamp (has toMillis method)
  if (timestamp.toMillis && typeof timestamp.toMillis === 'function') {
    return new Date(timestamp.toMillis()).toISOString();
  }
  
  // Raw Firestore Timestamp object with _seconds and _nanoseconds
  if (typeof timestamp === 'object' && '_seconds' in timestamp && '_nanoseconds' in timestamp) {
    const seconds = timestamp._seconds || 0;
    const nanoseconds = timestamp._nanoseconds || 0;
    const milliseconds = seconds * 1000 + Math.floor(nanoseconds / 1000000);
    return new Date(milliseconds).toISOString();
  }
  
  // Already a Date object
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  
  // Already a string
  if (typeof timestamp === 'string') {
    return timestamp;
  }
  
  return null;
}

/**
 * Recursively serialize Firestore data to plain objects
 */
export function serializeFirestoreData(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }
  
  // Handle Firestore Timestamps
  if (data.toDate || data.toMillis) {
    return serializeTimestamp(data);
  }
  
  // Handle Date objects
  if (data instanceof Date) {
    return data.toISOString();
  }
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => serializeFirestoreData(item));
  }
  
  // Handle objects
  if (typeof data === 'object') {
    const serialized: any = {};
    for (const [key, value] of Object.entries(data)) {
      // Skip internal Firestore properties
      if (key.startsWith('_')) {
        continue;
      }
      serialized[key] = serializeFirestoreData(value);
    }
    return serialized;
  }
  
  // Primitive types (string, number, boolean) are already serializable
  return data;
}

