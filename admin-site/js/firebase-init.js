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
    arrayUnion,
    arrayRemove,
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