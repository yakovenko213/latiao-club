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

  // Skip Firebase and external API calls
  if (url.origin.includes('firebase') || 
      url.origin.includes('googleapis') ||
      url.origin.includes('gstatic')) {
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
  try {
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
    // Network failed, return cached version if available
    if (cached) {
      return cached;
    }
    
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
    const cached = await caches.match(request);
    
    if (cached) {
      return cached;
    }
    
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
