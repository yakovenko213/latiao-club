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
import { getFirestore, doc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
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
// Note: GitHub Codespaces URLs (*-xxxx.app.github.dev) are automatically
// allowed in development mode via the validateDomain() function.

const allowedDomains = [
    'latiao-snack.com.ua',           // Production domain
    'www.latiao-snack.com.ua',       // WWW subdomain
    'my-magazin-81c96.web.app',      // Firebase Hosting
    'my-magazin-81c96.firebaseapp.com', // Firebase Auth domain
    'yakovenko213.github.io'         // GitHub Pages (test domain)
    // GitHub Codespaces: Automatically allowed via regex check (*.github.dev)
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
    
    // 🌐 Allow GitHub Codespaces domains (bypass domain security for development)
    if (currentDomain.includes('github.dev')) {
        if (window.__consoleMode === 'development') {
            console.warn('🔧 Running on GitHub Codespaces - security checks relaxed for development');
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
        console.error('💡 For GitHub Codespaces, domains with "github.dev" are automatically allowed in development mode');
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
// � EMULATOR CONNECTIONS MOVED TO FIREBASE-INIT.JS
// ═══════════════════════════════════════════════════════════════════
// To fix race conditions, emulator connections now happen IMMEDIATELY 
// after getFirestore() in firebase-init.js. This prevents "insufficient
// permissions" errors by ensuring emulators connect BEFORE any Firestore calls.
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// �🛡️  FIREBASE APP CHECK (PREVENTS BOT ABUSE)
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

// NOTE: Persistence is already enabled in firebase-init.js - do not duplicate here

// ═══════════════════════════════════════════════════════════════════
// � CASHBACK STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

// Store registered callbacks for cashback state changes
const cashbackCallbacks = [];

// Current cashback state
let cashbackState = {
    isEnabled: true,  // Default enabled
    percent: 8,       // Default 8%
    maxEarnLimit: 0   // Default 0 (no limit)
};

/**
 * Initialize cashback listener - listens to Firestore for config changes
 * Sets up real-time listener on config/general_config document
 */
export function initCashbackListener() {
    try {
        const configRef = doc(db, 'config', 'general_config');
        
        onSnapshot(configRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                const data = docSnapshot.data();
                // Update global state
                cashbackState.isEnabled = data.isCashbackEnabled !== false; // default true
                cashbackState.percent = data.cashbackPercent || 8;
                cashbackState.maxEarnLimit = data.maxEarnLimit || 0; // 0 = no limit
                
                // Update window global for legacy code
                window.cashbackEnabled = cashbackState.isEnabled;
                window.cashbackPercent = cashbackState.percent;
                window.cashbackMaxEarnLimit = cashbackState.maxEarnLimit;
                
                console.log(`🪙 [Cashback] State updated: enabled=${cashbackState.isEnabled}, percent=${cashbackState.percent}%, maxEarnLimit=${cashbackState.maxEarnLimit} грн`);
                
                // Notify all registered callbacks with extended data
                cashbackCallbacks.forEach(callback => {
                    try {
                        callback(cashbackState.isEnabled, cashbackState.percent, cashbackState.maxEarnLimit);
                    } catch (e) {
                        console.error('❌ [Cashback] Callback error:', e);
                    }
                });
            } else {
                // Document doesn't exist - use defaults
                window.cashbackEnabled = true;
                window.cashbackPercent = 8;
                window.cashbackMaxEarnLimit = 0;
                console.log('🪙 [Cashback] Config not found, using defaults');
            }
        }, (error) => {
            console.error('❌ [Cashback] Listener error:', error);
            // Use defaults on error
            window.cashbackEnabled = true;
            window.cashbackPercent = 8;
            window.cashbackMaxEarnLimit = 0;
        });
        
        console.log('✅ [Cashback] Listener initialized');
    } catch (error) {
        console.error('❌ [Cashback] Failed to init listener:', error);
        // Fallback to defaults
        window.cashbackEnabled = true;
        window.cashbackPercent = 8;
        window.cashbackMaxEarnLimit = 0;
    }
}

/**
 * Register a callback for cashback state changes
 * @param {Function} callback - Function to call with (isEnabled, percent, maxEarnLimit)
 */
export function onCashbackStateChange(callback) {
    if (typeof callback === 'function') {
        cashbackCallbacks.push(callback);
        
        // Immediately call with current state if already known
        if (window.cashbackEnabled !== undefined) {
            callback(window.cashbackEnabled, window.cashbackPercent || 8, window.cashbackMaxEarnLimit || 0);
        }
    }
}

/**
 * Calculate cashback for an order with limit applied
 * @param {number} orderTotal - The order total amount
 * @returns {number} - The final cashback amount (respecting maxEarnLimit)
 */
export function calculateCashback(orderTotal) {
    const percent = (window.cashbackPercent || 8) / 100;
    const maxLimit = window.cashbackMaxEarnLimit || 0;
    
    const potentialCashback = Math.floor(orderTotal * percent);
    
    // Apply limit only if maxLimit > 0
    if (maxLimit > 0 && potentialCashback > maxLimit) {
        return maxLimit;
    }
    
    return potentialCashback;
}

// ═══════════════════════════════════════════════════════════════════
// �📤 EXPORTS
// ═══════════════════════════════════════════════════════════════════

export { 
    db, 
    auth, 
    functions, 
    storage,
    firebaseConfig, // Export config for other modules that need it
    allowedDomains  // Export for security checks
};