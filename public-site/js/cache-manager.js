// ============================================
// CACHE MANAGER - Manual Cache Control
// ============================================
// Use this utility to manually clear caches if needed

/**
 * Clear all storefront caches
 */
function clearAllCaches() {
    if (!window.storefrontCache) {
        console.warn('Storefront cache not initialized yet');
        return;
    }
    
    window.storefrontCache.data = {};
    window.storefrontCache.timestamps = {};
    console.log('✅ All caches cleared');
    
    // Optionally reload the page
    if (confirm('Cache cleared! Reload page to fetch fresh data?')) {
        window.location.reload();
    }
}

/**
 * Clear specific cache key
 */
function clearCache(key) {
    if (!window.storefrontCache) {
        console.warn('Storefront cache not initialized yet');
        return;
    }
    
    delete window.storefrontCache.data[key];
    delete window.storefrontCache.timestamps[key];
    console.log(`✅ Cache cleared for: ${key}`);
}

/**
 * View cache status
 */
function viewCacheStatus() {
    if (!window.storefrontCache) {
        console.warn('Storefront cache not initialized yet');
        return;
    }
    
    console.group('📊 Cache Status');
    
    const cache = window.storefrontCache;
    const keys = Object.keys(cache.data);
    
    if (keys.length === 0) {
        console.log('No cached data');
    } else {
        keys.forEach(key => {
            const timestamp = cache.timestamps[key];
            const age = timestamp ? Math.round((Date.now() - timestamp) / 1000) : 'unknown';
            console.log(`${key}: ${age}s old`);
        });
    }
    
    console.groupEnd();
}

// Export to global scope for easy access from console
window.clearAllCaches = clearAllCaches;
window.clearCache = clearCache;
window.viewCacheStatus = viewCacheStatus;

console.log('🛠️ Cache manager loaded. Available commands:');
console.log('  - clearAllCaches()    : Clear all caches');
console.log('  - clearCache(key)     : Clear specific cache (e.g., "products")');
console.log('  - viewCacheStatus()   : View current cache status');

export { clearAllCaches, clearCache, viewCacheStatus };
