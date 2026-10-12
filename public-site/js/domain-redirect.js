/**
 * DOMAIN REDIRECT HANDLER — DISABLED
 *
 * Previously redirected Firebase default domains (*.web.app, *.firebaseapp.com)
 * to the custom domain latiao-snack.com.ua.
 *
 * The redirect is turned off so the site opens on the domain provided by the
 * hosting. The file is kept (and still included by the pages) so the redirect
 * can be restored easily: set ENABLE_REDIRECT to true.
 */

(function() {
  'use strict';

  const ENABLE_REDIRECT = false;
  if (!ENABLE_REDIRECT) {
    return;
  }

  const PRODUCTION_DOMAIN = 'latiao-snack.com.ua';
  const FIREBASE_DOMAINS = ['web.app', 'firebaseapp.com'];

  const hostname = window.location.hostname;

  if (hostname === PRODUCTION_DOMAIN || hostname === 'localhost' || hostname === '127.0.0.1') {
    return;
  }

  const shouldRedirect = FIREBASE_DOMAINS.some(domain => hostname.includes(domain));

  if (shouldRedirect) {
    const newUrl = 'https://' + PRODUCTION_DOMAIN + window.location.pathname + window.location.search + window.location.hash;

    if (window.__consoleMode === 'development') {
      console.log('[Domain Redirect] Redirecting to primary domain:', newUrl);
    }

    // Use replace instead of assign to prevent back-button loop
    window.location.replace(newUrl);
  }
})();