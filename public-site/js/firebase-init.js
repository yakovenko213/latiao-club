// ============================================
// FIREBASE INITIALIZATION (CLEAN MODE)
// ============================================
// Simple, stable Firebase initialization without persistence or analytics

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
    getFirestore,
    initializeFirestore,
    terminate,
    enableIndexedDbPersistence,
    getDocsFromCache,
    CACHE_SIZE_UNLIMITED,
    collection,
    doc,
    addDoc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    Timestamp,
    increment
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

// ============================================
// FIREBASE CONFIG
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyDyQvItRyL4IKl9NmEItswwPOEiKAbWkMw",
    authDomain: "my-magazin-81c96.firebaseapp.com",
    projectId: "my-magazin-81c96",
    storageBucket: "my-magazin-81c96.firebasestorage.app",
    messagingSenderId: "129061757346",
    appId: "1:129061757346:web:3e7bc5838cc5f7bda992fb"
};

// ============================================
// INITIALIZE FIREBASE
// ============================================
const app = initializeApp(firebaseConfig);

// ⚡ CRITICAL FIX: Force Long Polling for Codespaces proxy stability
// WebSockets fail over proxies - Long Polling is much more reliable
const db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    useFetchStreams: false,
    cacheSizeBytes: CACHE_SIZE_UNLIMITED  // Keep products in local memory
});

const auth = getAuth(app);
const functions = getFunctions(app);
const storage = getStorage(app);

// ⚡ CRITICAL: Enable persistence BEFORE any queries
// This allows instant loading from IndexedDB cache
let persistenceEnabled = false;
window.firestoreInitialized = false;

enableIndexedDbPersistence(db)
  .then(() => {
    persistenceEnabled = true;
    window.firestoreInitialized = true;
    console.log('✅ IndexedDB persistence enabled - cache ready');
  })
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('⚠️ Persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.warn('⚠️ Persistence not available in this browser');
    } else {
      console.error('❌ Persistence error:', err);
    }
    // Still mark as initialized even if persistence fails
    window.firestoreInitialized = true;
  });

// ============================================
// CRITICAL: EXPORT TO WINDOW SO LAYOUT.JS CAN RUN
// ============================================
window.firebaseInit = {
    db,
    auth,
    storage,
    functions,
    collection,
    doc,
    addDoc,
    setDoc,
    getDoc,
    getDocs,
    getDocsFromCache,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    Timestamp,
    increment
};

// Export to global scope for admin-chat.js and others
window.db = db;
window.functions = functions;
window.httpsCallable = httpsCallable;
window.collection = collection;
window.doc = doc;
window.addDoc = addDoc;
window.setDoc = setDoc;
window.getDoc = getDoc;
window.getDocs = getDocs;
window.getDocsFromCache = getDocsFromCache;
window.updateDoc = updateDoc;
window.onSnapshot = onSnapshot;
window.query = query;
window.where = where;
window.orderBy = orderBy;
window.Timestamp = Timestamp;
window.serverTimestamp = serverTimestamp;
window.increment = increment;

// ============================================
// MODULE EXPORTS FOR ES6 IMPORTS
// ============================================
export {
    db,
    auth,
    functions,
    storage,
    collection,
    doc,
    addDoc,
    setDoc,
    getDoc,
    getDocs,
    getDocsFromCache,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    Timestamp,
    httpsCallable,
    increment
};

// ============================================
// CREATE DEFAULT CHAT CONFIG IF NOT EXISTS
// ============================================
async function initializeChatConfig() {
    try {
        const chatConfigRef = doc(db, 'settings', 'chat_config');
        const chatConfigDoc = await getDoc(chatConfigRef);

        if (!chatConfigDoc.exists()) {
            console.log('💬 Creating default chat config...');
            await setDoc(chatConfigRef, {
                enabled: true,
                aiEnabled: true,
                enabledPages: [
                    '/',
                    '/index.html',
                    '/category.html',
                    '/product.html',
                    '/checkout.html',
                    '/cart.html'
                ],
                welcomeMessage: 'Привіт! 👋 Чим можу допомогти?',
                offlineMessage: 'Зараз всі адміністратори офлайн. Залиште повідомлення!',
                createdAt: serverTimestamp()
            });
            console.log('✅ Chat config created successfully');
        } else {
            console.log('💬 Chat config already exists');
        }
    } catch (error) {
        console.error('❌ Error initializing chat config:', error);
    }
}

// Initialize chat config on load
initializeChatConfig();

console.log("🔥 Firebase initialized successfully (Clean Mode)");

// ============================================
// 📱 DEVICE TRACKING SYSTEM
// ============================================
// Track what devices users are using to visit the site
// Data stored in: statistics/devices

async function trackDevice() {
  try {
    // Check if already tracked in this session
    if (sessionStorage.getItem('deviceTracked')) {
      console.log('📱 Device already tracked in this session');
      return;
    }

    const userAgent = navigator.userAgent;
    let deviceType = 'Unknown';

    // Device detection logic
    if (/iPhone/.test(userAgent)) {
      deviceType = 'iPhone';
    } else if (/iPad/.test(userAgent)) {
      deviceType = 'iPad';
    } else if (/Android/.test(userAgent) && /Mobile/.test(userAgent)) {
      deviceType = 'Android';
    } else if (/Android/.test(userAgent)) {
      deviceType = 'Android Tablet';
    } else if (/Windows/.test(userAgent)) {
      deviceType = 'Desktop (Windows)';
    } else if (/Macintosh|Mac OS X/.test(userAgent)) {
      deviceType = 'Desktop (Mac)';
    } else if (/Linux/.test(userAgent)) {
      deviceType = 'Desktop (Linux)';
    }

    console.log('📱 Detected device:', deviceType);

    // ✅ TASK 3: Use increment() to prevent race conditions
    // Update Firestore counter with atomic increment
    const deviceStatsRef = doc(db, 'statistics', 'devices');
    
    try {
      // Try to increment - will create field if doesn't exist
      await setDoc(deviceStatsRef, {
        [deviceType]: increment(1),
        lastUpdated: serverTimestamp()
      }, { merge: true });
      
      console.log('✅ Device counter incremented atomically:', deviceType);
    } catch (incrementError) {
      // Fallback: create document if it doesn't exist
      console.warn('⚠️ Increment failed, creating document...', incrementError);
      await setDoc(deviceStatsRef, {
        [deviceType]: 1,
        lastUpdated: serverTimestamp(),
        createdAt: serverTimestamp()
      });
    }

    // Mark as tracked in this session
    sessionStorage.setItem('deviceTracked', 'true');
    console.log('✅ Device tracked successfully:', deviceType);

  } catch (error) {
    console.error('❌ Error tracking device:', error);
  }
}

// Run device tracking when page loads
window.addEventListener('load', () => {
  // Small delay to ensure Firebase is fully ready
  setTimeout(trackDevice, 500);
});

// Export function for manual calls if needed
window.trackDevice = trackDevice;