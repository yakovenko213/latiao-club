/**
 * Force Cache Clear Script for Admin Panel
 */

(function() {
    'use strict';
    
    const CURRENT_VERSION = '1770237732360'; // Will be replaced by build script
    const VERSION_KEY = 'latiao_admin_version';
    
    // Check stored version
    const storedVersion = localStorage.getItem(VERSION_KEY);
    
    if (storedVersion !== CURRENT_VERSION) {
        console.log('🔄 New admin version detected, clearing cache...');
        
        // Clear localStorage (except auth data)
        const keysToPreserve = ['latiao-admin-auth', 'latiao-theme'];
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
                console.log('✅ All admin caches cleared');
            });
        }
        
        console.log('✅ Admin cache cleared, version updated to:', CURRENT_VERSION);
    }
})();
