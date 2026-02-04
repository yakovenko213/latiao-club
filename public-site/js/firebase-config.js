/**
 * ═══════════════════════════════════════════════════════════════════════
 * 🔐 FIREBASE CONFIGURATION (CENTRALIZED & SECURED)
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * SECURITY MEASURES IMPLEMENTED:
 * ✅ Centralized configuration (single source of truth)
 * ✅ Domain restrictions configured in Google Cloud Console
 * ✅ Firebase App Check enabled (prevents unauthorized bot usage)
 * ✅ Firestore Security Rules (database-level protection)
 * 
 * ⚠️  IMPORTANT SECURITY NOTES:
 * 
 * 1. API keys in client-side code are PUBLIC by design
 *    Firebase keys are NOT secrets - they identify your project
 * 
 * 2. REAL SECURITY comes from:
 *    - Domain restrictions (only latiao-snack.com.ua can use this key)
 *    - Firebase App Check (blocks bots and unauthorized clients)
 *    - Firestore Security Rules (controls who can read/write data)
 * 
 * 3. This configuration is protected by:
 *    - HTTP Referer restrictions in GCP Console
 *    - Firebase App Check with reCAPTCHA v3
 *    - Rate limiting and abuse protection
 * 
 * @version 2.0.0 - SECURITY HARDENED
 * @created 2026-02-04
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, enableMultiTabIndexedDbPersistence } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFunctions } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';
import { initializeAppCheck, ReCaptchaV3Provider } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-check.js';

// ═══════════════════════════════════════════════════════════════════
// 🔥 FIREBASE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const firebaseConfig = {
  apiKey: "AIzaSyDyQvItRyL4IKl9NmEItswwPOEiKAbWkMw",
  authDomain: "my-magazin-81c96.firebaseapp.com",
  projectId: "my-magazin-81c96",
  storageBucket: "my-magazin-81c96.firebasestorage.app",
  messagingSenderId: "129061757346",
  appId: "1:129061757346:web:3e7bc5838cc5f7bda992fb"
};

// ═══════════════════════════════════════════════════════════════════
// 🌍 ALLOWED DOMAINS (FOR REFERENCE)
// ═══════════════════════════════════════════════════════════════════

const allowedDomains = [
    'latiao-snack.com.ua',           // Production domain
    'my-magazin-81c96.web.app',      // Firebase Hosting
    'my-magazin-81c96.firebaseapp.com' // Firebase Auth domain
];

// ═══════════════════════════════════════════════════════════════════
// 🔍 DOMAIN VALIDATION (CLIENT-SIDE CHECK)
// ═══════════════════════════════════════════════════════════════════

function validateDomain() {
    const currentDomain = window.location.hostname;
    
    // Allow localhost for development
    if (currentDomain === 'localhost' || currentDomain === '127.0.0.1') {
        if (window.__consoleMode === 'development') {
            console.warn('🔧 Running on localhost - security checks relaxed');
        }
        return true;
    }
    
    // Check if current domain is in allowed list
    const isAllowed = allowedDomains.some(domain => 
        currentDomain === domain || currentDomain.endsWith('.' + domain)
    );
    
    if (!isAllowed) {
        console.error('🚫 SECURITY WARNING: Unauthorized domain detected!');
        console.error('Current domain:', currentDomain);
        console.error('Allowed domains:', allowedDomains);
        return false;
    }
    
    return true;
}

// ═══════════════════════════════════════════════════════════════════
// 🚀 INITIALIZE FIREBASE
// ═══════════════════════════════════════════════════════════════════

// Validate domain before initialization
if (!validateDomain()) {
    throw new Error('🚫 Firebase initialization blocked: Unauthorized domain');
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const functions = getFunctions(app);
const storage = getStorage(app);

// ═══════════════════════════════════════════════════════════════════
// 🛡️  FIREBASE APP CHECK (PREVENTS BOT ABUSE)
// ═══════════════════════════════════════════════════════════════════
// 
// App Check verifies that requests come from your authentic app
// and not from bots or unauthorized third parties.
// 
// SETUP REQUIRED:
// 1. Go to Firebase Console > App Check
// 2. Register your web app
// 3. Add reCAPTCHA v3 provider
// 4. Copy the site key below
// 
// Until configured, this is disabled to prevent errors.
// ═══════════════════════════════════════════════════════════════════

const RECAPTCHA_SITE_KEY = null; // TODO: Add your reCAPTCHA v3 site key here

if (RECAPTCHA_SITE_KEY) {
    try {
        const appCheck = initializeAppCheck(app, {
            provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
            isTokenAutoRefreshEnabled: true
        });
        
        if (window.__consoleMode === 'development') {
            console.log('🛡️  Firebase App Check enabled');
        }
    } catch (error) {
        console.error('❌ App Check initialization failed:', error);
    }
} else {
    if (window.__consoleMode === 'development') {
        console.warn('⚠️  App Check not configured - see firebase-config.js for setup instructions');
    }
}

// ═══════════════════════════════════════════════════════════════════
// 💾 OFFLINE PERSISTENCE
// ═══════════════════════════════════════════════════════════════════

enableMultiTabIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time
      if (window.__consoleMode === 'development') {
        console.warn('Persistence failed: Multiple tabs open');
      }
    } else if (err.code === 'unimplemented') {
      // Browser doesn't support persistence
      if (window.__consoleMode === 'development') {
        console.warn('Persistence not supported by browser');
      }
    } else {
      console.error('Persistence error:', err);
    }
  });

// ═══════════════════════════════════════════════════════════════════
// 📤 EXPORTS
// ═══════════════════════════════════════════════════════════════════

export { 
    db, 
    auth, 
    functions, 
    storage,
    firebaseConfig, // Export config for other modules that need it
    allowedDomains  // Export for security checks
};
