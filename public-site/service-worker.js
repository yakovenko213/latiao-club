/**
 * ====================================================
 * SERVICE WORKER - Aggressive Asset Caching
 * ====================================================
 * Cache product images and static assets for 1 year
 * Date: 04.02.2026
 */

const CACHE_VERSION = 'latiao-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const FONT_CACHE = `${CACHE_VERSION}-fonts`;

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/category.html',
  '/product.html',
  '/cart.html',
  '/checkout.html',
  '/js/product-cache-manager.js',
  '/js/dark-mode.js'
];

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Caching static assets');
        return cache.addAll(STATIC_ASSETS).catch((err) => {
          console.warn('⚠️ Some assets failed to cache:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

/**
 * Activate event - clean old caches
 */
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('latiao-') && name !== STATIC_CACHE && name !== IMAGE_CACHE && name !== FONT_CACHE)
          .map((name) => {
            console.log('🗑️ Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
    .then(() => self.clients.claim())
  );
});

/**
 * Fetch event - cache-first strategy with smart routing
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // ⚡ CRITICAL: Skip localhost (emulators) and Firebase API calls
  // These must NEVER be cached or proxied by Service Worker
  if (url.hostname === 'localhost' ||
      url.hostname === '127.0.0.1' ||
      url.origin.includes('firebase') || 
      url.origin.includes('firestore') ||
      url.origin.includes('googleapis') ||
      url.origin.includes('gstatic') ||
      url.origin.includes('google.com') ||
      url.hostname.includes('firebaseio.com')) {
    // Return immediately - let browser handle these directly
    return;
  }

  // Image caching strategy (Cache-first, long TTL)
  if (request.destination === 'image' || 
      /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE, 365 * 24 * 60 * 60 * 1000)); // 1 year
    return;
  }

  // Font caching strategy (Cache-first, permanent)
  if (request.destination === 'font' || 
      /\.(woff|woff2|ttf|eot)$/i.test(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request, FONT_CACHE, 365 * 24 * 60 * 60 * 1000)); // 1 year
    return;
  }

  // Static assets (Cache-first with 1-hour TTL)
  if (/\.(css|js)$/i.test(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE, 60 * 60 * 1000)); // 1 hour
    return;
  }

  // HTML pages (Network-first with fallback)
  if (request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(networkFirstStrategy(request, STATIC_CACHE));
    return;
  }

  // Default: network only
  event.respondWith(fetch(request));
});

/**
 * Cache-first strategy with age check
 */
async function cacheFirstStrategy(request, cacheName, maxAge) {
  // ⚡ Wrap in try-catch to handle all errors gracefully
  try {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    if (cached) {
      // Check cache age
      const cachedTime = new Date(cached.headers.get('sw-cache-time'));
      const age = Date.now() - cachedTime.getTime();

      if (!isNaN(age) && age < maxAge) {
        // Cache is still fresh
        return cached;
      }
    }

    // Fetch from network and update cache
    const response = await fetch(request);
    
    if (response.ok) {
      const responseToCache = response.clone();
      
      // Add timestamp header
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cache-time', new Date().toISOString());
      
      const newResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      cache.put(request, newResponse);
      return response;
    }
    
    // If network failed but we have cache, return it even if expired
    if (cached) {
      return cached;
    }
    
    return response;
  } catch (error) {
    // ⚡ Enhanced error handling: Return cache or fail gracefully
    console.warn(`⚠️ Service Worker fetch failed for ${request.url}:`, error.message);
    
    // Try to get cached version from outer scope
    try {
      const cache = await caches.open(cacheName);
      const fallbackCached = await cache.match(request);
      if (fallbackCached) {
        console.log('✅ Serving stale cache for:', request.url);
        return fallbackCached;
      }
    } catch (cacheError) {
      console.error('❌ Cache fallback failed:', cacheError.message);
    }
    
    // If no cache available, re-throw to let browser handle it
    throw error;
  }
}

/**
 * Network-first strategy with cache fallback
 */
async function networkFirstStrategy(request, cacheName) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // ⚡ Enhanced error handling with better logging
    console.warn(`⚠️ Network-first fetch failed for ${request.url}:`, error.message);
    
    try {
      const cached = await caches.match(request);
      
      if (cached) {
        console.log('✅ Serving cached fallback for:', request.url);
        return cached;
      }
    } catch (cacheError) {
      console.error('❌ Cache lookup failed:', cacheError.message);
    }
    
    // Re-throw original error if no cache available
    throw error;
  }
}

/**
 * Message handler for cache management
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      })
    );
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
