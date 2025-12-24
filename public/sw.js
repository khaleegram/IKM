// Service Worker for IKM Marketplace
// Provides offline support and caching

const CACHE_NAME = 'ikm-marketplace-v1';
const STATIC_CACHE = 'ikm-static-v1';
const IMAGE_CACHE = 'ikm-images-v1';
const API_CACHE = 'ikm-api-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/products',
  '/stores',
  '/offline',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return (
              name !== CACHE_NAME &&
              name !== STATIC_CACHE &&
              name !== IMAGE_CACHE &&
              name !== API_CACHE
            );
          })
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API requests - network first, cache fallback
    event.respondWith(networkFirst(request, API_CACHE));
  } else if (
    url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i) ||
    url.hostname.includes('firebasestorage.googleapis.com') ||
    url.hostname.includes('storage.googleapis.com')
  ) {
    // Images - cache first, network fallback
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
  } else if (url.pathname.match(/\.(js|css|woff|woff2|ttf|eot)$/i)) {
    // Static assets - cache first
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (url.origin === self.location.origin) {
    // Same-origin HTML pages - network first, cache fallback
    event.respondWith(networkFirst(request, STATIC_CACHE));
  }
});

// Cache first strategy
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // If offline and no cache, return offline page for HTML
    if (request.headers.get('accept')?.includes('text/html')) {
      const offlinePage = await cache.match('/offline');
      return offlinePage || new Response('Offline', { status: 503 });
    }
    throw error;
  }
}

// Network first strategy
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    
    // For HTML requests, return offline page
    if (request.headers.get('accept')?.includes('text/html')) {
      const offlinePage = await cache.match('/offline');
      return offlinePage || new Response('Offline', { status: 503 });
    }
    
    throw error;
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-cart') {
    event.waitUntil(syncCart());
  }
});

async function syncCart() {
  // Sync cart data when back online
  // Implementation depends on your cart storage strategy
  console.log('Syncing cart data...');
}

