/**
 * DOMAIN REDIRECT HANDLER
 * Automatically redirects Firebase default domains to primary custom domain
 * 
 * Redirects:
 * - *.web.app → latiao-snack.com.ua
 * - *.firebaseapp.com → latiao-snack.com.ua
 * - localhost → No redirect (development)
 * 
 * Preserves:
 * - Full path (e.g., /category/spicy → /category/spicy)
 * - Query parameters (e.g., ?id=123 → ?id=123)
 * - Hash fragments (e.g., #section → #section)
 * 
 * SEO Benefits:
 * - Prevents duplicate content penalties
 * - Consolidates link equity to primary domain
 * - Improves brand consistency
 */

(function() {
  'use strict';
  
  const PRODUCTION_DOMAIN = 'latiao-snack.com.ua';
  const FIREBASE_DOMAINS = ['web.app', 'firebaseapp.com'];
  
  // Get current hostname
  const hostname = window.location.hostname;
  
  // Skip redirect if already on production domain or localhost
  if (hostname === PRODUCTION_DOMAIN || hostname === 'localhost' || hostname === '127.0.0.1') {
    return;
  }
  
  // Check if current hostname contains Firebase default domains
  const shouldRedirect = FIREBASE_DOMAINS.some(domain => hostname.includes(domain));
  
  if (shouldRedirect) {
    // Build new URL with production domain
    const newUrl = 'https://' + PRODUCTION_DOMAIN + window.location.pathname + window.location.search + window.location.hash;
    
    // Log redirect in development mode only
    if (window.__consoleMode === 'development') {
      console.log('[Domain Redirect] Redirecting to primary domain:', newUrl);
    }
    
    // Use replace instead of assign to prevent back-button loop
    window.location.replace(newUrl);
  }
})();
