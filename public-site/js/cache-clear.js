/**
 * Force Cache Clear Script
 * Add this to detect and clear old cached versions
 */

(function() {
    'use strict';
    
    const CURRENT_VERSION = '1770237732360'; // Will be replaced by build script
    const VERSION_KEY = 'latiao_site_version';
    
    // Check stored version
    const storedVersion = localStorage.getItem(VERSION_KEY);
    
    if (storedVersion !== CURRENT_VERSION) {
        console.log('🔄 New version detected, clearing cache...');
        
        // Clear localStorage (except important user data)
        const keysToPreserve = ['latiao-theme', 'latiao-user-phone'];
        const preservedData = {};
        
        keysToPreserve.forEach(key => {
            const value = localStorage.getItem(key);
            if (value) preservedData[key] = value;
        });
        
        // Clear all storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Restore preserved data
        Object.entries(preservedData).forEach(([key, value]) => {
            localStorage.setItem(key, value);
        });
        
        // Store new version
        localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
        
        // Clear service worker cache if exists
        if ('serviceWorker' in navigator && 'caches' in window) {
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        console.log('Deleting cache:', cacheName);
                        return caches.delete(cacheName);
                    })
                );
            }).then(() => {
                console.log('✅ All caches cleared');
            });
        }
        
        console.log('✅ Cache cleared, version updated to:', CURRENT_VERSION);
        
        // Force reload if needed (optional, uncomment if aggressive)
        // window.location.reload(true);
    }
})();
