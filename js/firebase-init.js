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
    serverTimestamp
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
    serverTimestamp
};

// ============================================
// MODULE EXPORTS FOR ES6 IMPORTS
// ============================================
export { 
    db, 
    auth, 
    functions, 
    storage,
    collection,
    addDoc,
    serverTimestamp,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    setDoc,
    onSnapshot,
    httpsCallable
};

console.log("🔥 Firebase initialized successfully (Clean Mode)");

