/**
 * ====================================================
 * PRODUCTION CONSOLE SILENCER
 * ====================================================
 * Disables debug console output on production domains
 * Keeps console.error for critical issues
 * Date: 04.02.2026
 */

(function() {
  'use strict';

  // Define production domains
  const PRODUCTION_DOMAINS = [
    'latiao-snack.com.ua',
    'www.latiao-snack.com.ua',
    'my-magazin-81c96.web.app',
    'my-magazin-81c96.firebaseapp.com'
  ];

  // Check if running on production
  const isProduction = PRODUCTION_DOMAINS.includes(window.location.hostname);
  
  // Also check for non-localhost environments
  const isNotLocal = window.location.hostname !== 'localhost' && 
                     window.location.hostname !== '127.0.0.1' &&
                     !window.location.hostname.startsWith('192.168.');

  if (isProduction || isNotLocal) {
    // Store original console methods for internal use
    const originalConsole = {
      log: console.log,
      debug: console.debug,
      info: console.info,
      warn: console.warn,
      table: console.table
    };

    // Silent no-op function
    const noop = function() {};

    // Disable debug console methods
    console.log = noop;
    console.debug = noop;
    console.info = noop;
    console.warn = noop;
    console.table = noop;

    // Keep console.error functional for critical issues
    // (console.error is left unchanged)

    // Optionally: Expose a way to debug in production (for admin)
    // Access via: window.__debug.log('message')
    window.__debug = originalConsole;

    // Mark that console is silenced
    window.__consoleMode = 'production-silent';
  } else {
    // Development mode - console works normally
    window.__consoleMode = 'development';
    
    // Log development mode indicator
    console.log(
      '%c🔧 DEVELOPMENT MODE', 
      'background: #4CAF50; color: white; padding: 8px; font-weight: bold; font-size: 14px;'
    );
    console.log('%cConsole logs are visible. In production, they will be silenced.', 'color: #666;');
  }
})();
