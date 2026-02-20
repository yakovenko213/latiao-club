// ============================================
// FIREBASE INITIALIZATION (CLEAN MODE)
// ============================================
// Simple, stable Firebase initialization without persistence or analytics

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getFirestore,
    initializeFirestore,
    enableIndexedDbPersistence,
    connectFirestoreEmulator,
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
    arrayUnion,
    arrayRemove,
    increment
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth, connectAuthEmulator } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js';
import { getStorage, connectStorageEmulator } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

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

// ⚡ CRITICAL FIX: Initialize Firestore with experimentalForceLongPolling
// This bypasses Service Worker proxy issues and ensures stable connection
const db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    cacheSizeBytes: 40000000 // 40MB cache
});

const auth = getAuth(app);
const functions = getFunctions(app);
const storage = getStorage(app);

// ============================================
// 🔥 CONNECT TO LOCAL EMULATORS (DEV MODE)
// ============================================
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🔧 ADMIN firebase-init.js: Connecting to Firebase Emulators...');
    
    try {
        connectFirestoreEmulator(db, '127.0.0.1', 8080);
        console.log('✅ ADMIN: Firestore Emulator connected (127.0.0.1:8080)');
    } catch (error) {
        console.warn('⚠️ Firestore Emulator error:', error.message);
    }
    
    try {
        connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
        console.log('✅ ADMIN: Auth Emulator connected (127.0.0.1:9099)');
    } catch (error) {
        console.warn('⚠️ Auth Emulator error:', error.message);
    }
    
    try {
        connectFunctionsEmulator(functions, '127.0.0.1', 5001);
        console.log('✅ ADMIN: Functions Emulator connected (127.0.0.1:5001)');
    } catch (error) {
        console.warn('⚠️ Functions Emulator error:', error.message);
    }
    
    try {
        connectStorageEmulator(storage, '127.0.0.1', 9199);
        console.log('✅ ADMIN: Storage Emulator connected (127.0.0.1:9199)');
    } catch (error) {
        console.warn('⚠️ Storage Emulator error:', error.message);
    }
    
    console.log('🎯 ADMIN using LOCAL emulators at http://localhost:4000');
}

// ⚡ Enable offline persistence (with error handling)
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
        console.warn('⚠️ Persistence failed: Multiple tabs open. App will still work online.');
    } else if (err.code === 'unimplemented') {
        console.warn('⚠️ Persistence not supported in this browser. App will still work online.');
    } else {
        console.error('❌ Persistence error:', err);
    }
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
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    Timestamp,
    arrayUnion,
    arrayRemove,
    increment
};

// Export to global scope for admin-chat.js and others
window.db = db;
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
window.arrayUnion = arrayUnion;
window.arrayRemove = arrayRemove;
window.increment = increment;

console.log('✅ Firebase initialized');
console.log('📦 window.firebaseInit available:', !!window.firebaseInit);
console.log('🔧 arrayUnion available:', typeof window.firebaseInit?.arrayUnion);

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
    arrayUnion,
    arrayRemove,
    increment,
    httpsCallable
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