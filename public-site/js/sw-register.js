/**
 * ====================================================
 * SERVICE WORKER REGISTRATION
 * ====================================================
 * Register and manage service worker for asset caching
 * Date: 04.02.2026
 */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {

        // Check for updates every 60 seconds
        setInterval(() => {
          registration.update();
        }, 60000);

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              console.log('🔄 New version available! Refresh to update.');
              
              // Optional: Show update notification
              if (window.showUpdateNotification) {
                window.showUpdateNotification();
              }
            }
          });
        });
      })
      .catch((error) => {
        console.warn('⚠️ Service Worker registration failed:', error);
      });
  });

  // Handle service worker messages
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CACHE_UPDATED') {
      console.log('💾 Cache updated for:', event.data.url);
    }
  });

  // Force update on page visibility change (user returns to tab)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CHECK_UPDATE' });
    }
  });
}

/**
 * Clear all caches (for debugging)
 */
window.clearAllCaches = async function() {
  try {
    // Clear Service Worker caches
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
    }
    
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    
    // Clear IndexedDB cache
    if (window.productCache) {
      await window.productCache.clearAll();
    }
    
    // Clear localStorage/sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    
    console.log('🗑️ All caches cleared!');
    alert('✅ Всі кеші очищені! Перезавантажте сторінку.');
  } catch (error) {
    console.error('❌ Failed to clear caches:', error);
  }
};

/**
 * Get cache stats
 */
window.getCacheStats = async function() {
  const stats = {
    serviceWorkerCaches: [],
    indexedDB: {},
    localStorage: 0,
    sessionStorage: 0
  };

  try {
    // Service Worker caches
    const cacheNames = await caches.keys();
    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      stats.serviceWorkerCaches.push({
        name,
        entries: keys.length
      });
    }

    // IndexedDB
    if (window.productCache) {
      stats.indexedDB = await window.productCache.getStats();
    }

    // Storage sizes (approximate)
    stats.localStorage = new Blob(Object.values(localStorage)).size;
    stats.sessionStorage = new Blob(Object.values(sessionStorage)).size;

    console.table(stats.serviceWorkerCaches);
    console.log('IndexedDB:', stats.indexedDB);
    console.log('localStorage size:', (stats.localStorage / 1024).toFixed(2), 'KB');
    console.log('sessionStorage size:', (stats.sessionStorage / 1024).toFixed(2), 'KB');

    return stats;
  } catch (error) {
    console.error('❌ Failed to get cache stats:', error);
    return stats;
  }
};
