// ============================================
// GLOBAL CASHBACK CONFIGURATION LISTENER
// ============================================
// This module listens to config/general_config and provides
// real-time cashback enabled/disabled state to all pages

import { db } from './firebase-init.js';
import { doc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// ============================================
// STATE
// ============================================
let cashbackEnabled = true; // Default: enabled
let cashbackPercent = 8; // Default: 8%
let cashbackListeners = []; // Callbacks to notify on change
let unsubscribe = null;

// ============================================
// INITIALIZE LISTENER
// ============================================
export function initCashbackListener() {
  console.log('🪙 [Cashback Config] Initializing global listener...');
  
  if (unsubscribe) {
    console.log('⚠️ [Cashback Config] Listener already initialized');
    return;
  }
  
  try {
    const configRef = doc(db, 'config', 'general_config');
    
    // Real-time listener with onSnapshot
    unsubscribe = onSnapshot(configRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        cashbackEnabled = data.isCashbackEnabled !== false; // default true
        cashbackPercent = data.cashbackPercent || 8; // default 8%
        console.log('🔥 [Cashback Config] Real-time update:', { 
          enabled: cashbackEnabled, 
          percent: cashbackPercent 
        });
      } else {
        // Document doesn't exist - default values
        cashbackEnabled = true;
        cashbackPercent = 8;
        console.log('📝 [Cashback Config] Document not found, using defaults');
      }
      
      // Make globally accessible
      window.cashbackEnabled = cashbackEnabled;
      window.cashbackPercent = cashbackPercent;
      
      // Notify all listeners
      notifyListeners();
    }, (error) => {
      console.error('❌ [Cashback Config] Listener error:', error);
      // On error, default to enabled
      cashbackEnabled = true;
      cashbackPercent = 8;
      window.cashbackEnabled = true;
      window.cashbackPercent = 8;
      notifyListeners();
    });
    
    console.log('✅ [Cashback Config] Listener initialized successfully');
    
  } catch (error) {
    console.error('❌ [Cashback Config] Failed to initialize listener:', error);
    // On error, default values
    cashbackEnabled = true;
    cashbackPercent = 8;
    window.cashbackEnabled = true;
    window.cashbackPercent = 8;
  }
}

// ============================================
// GET CURRENT STATE
// ============================================
export function isCashbackEnabled() {
  return cashbackEnabled;
}

export function getCashbackPercent() {
  return cashbackPercent;
}

// ============================================
// REGISTER CALLBACK
// ============================================
// Register a callback to be notified when cashback state changes
export function onCashbackStateChange(callback) {
  if (typeof callback === 'function') {
    cashbackListeners.push(callback);
    // Immediately call with current state
    callback(cashbackEnabled, cashbackPercent);
  }
}

// ============================================
// NOTIFY LISTENERS
// ============================================
function notifyListeners() {
  console.log(`📢 [Cashback Config] Notifying ${cashbackListeners.length} listeners...`);
  cashbackListeners.forEach(callback => {
    try {
      callback(cashbackEnabled, cashbackPercent);
    } catch (error) {
      console.error('❌ [Cashback Config] Error in listener callback:', error);
    }
  });
}

// ============================================
// CLEANUP
// ============================================
export function cleanupCashbackListener() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
    console.log('🧹 [Cashback Config] Listener cleaned up');
  }
  cashbackListeners = [];
}

// ============================================
// AUTO-INITIALIZE ON MODULE LOAD
// ============================================
// Wait for Firebase to be ready, then initialize
if (typeof window !== 'undefined') {
  // Check if Firebase is already initialized
  if (db) {
    initCashbackListener();
  } else {
    // Wait for Firebase initialization
    console.log('⏳ [Cashback Config] Waiting for Firebase initialization...');
    const checkFirebase = setInterval(() => {
      if (db || window.db) {
        clearInterval(checkFirebase);
        initCashbackListener();
      }
    }, 100);
    
    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(checkFirebase);
      if (!unsubscribe) {
        console.warn('⚠️ [Cashback Config] Firebase not ready after 10s, defaulting to enabled');
        cashbackEnabled = true;
        window.cashbackEnabled = true;
      }
    }, 10000);
  }
}

// Export for external access
export { cashbackEnabled, cashbackPercent };
