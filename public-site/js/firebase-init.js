// ============================================
// FIREBASE INITIALIZATION (CLEAN MODE)
// ============================================
// Simple, stable Firebase initialization without persistence or analytics

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
    getFirestore,
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
const db = getFirestore(app);
const auth = getAuth(app);
const functions = getFunctions(app);
const storage = getStorage(app);

// ============================================
// CRITICAL: EXPORT TO WINDOW SO LAYOUT.JS CAN RUN
// ============================================
// Export Firebase app instance for pepper hunt and other modules
window.firebaseApp = app;  // ← CRITICAL FOR PEPPER HUNT!
window.firebaseDb = db;    // Alternative access

window.firebaseInit = {
    app,
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
window.updateDoc = updateDoc;
window.onSnapshot = onSnapshot;
window.query = query;
window.orderBy = orderBy;
window.Timestamp = Timestamp;
window.serverTimestamp = serverTimestamp;
window.increment = increment;

// ============================================
// LOG SUCCESSFUL INITIALIZATION
// ============================================
console.log('🔥 Firebase initialized successfully (Clean Mode)');
console.log('✅ window.firebaseApp available:', !!window.firebaseApp);
console.log('✅ window.firebaseDb available:', !!window.firebaseDb);
console.log('✅ Firebase App instance:', window.firebaseApp);

// Dispatch event for modules waiting for Firebase
window.dispatchEvent(new Event('firebaseReady'));

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

    // ✅ Use addDoc() instead of setDoc() + increment()
    // This only requires 'create' permission, not 'update' permission
    // Perfect for unauthenticated visitors
    const analyticsRef = collection(db, 'analytics_sessions');
    
    try {
      // Add a new document to analytics_sessions collection
      await addDoc(analyticsRef, {
        deviceType: deviceType,
        timestamp: serverTimestamp(),
        page: window.location.pathname,
        referrer: document.referrer || 'direct',
        userAgent: navigator.userAgent,
        trackedBy: 'firebase-init-v1'
      });
      
      console.log('✅ Device tracked successfully:', deviceType);
    } catch (trackError) {
      console.warn('⚠️ Device tracking failed (permissions?):', trackError.message);
      // Silently fail - don't block user experience
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