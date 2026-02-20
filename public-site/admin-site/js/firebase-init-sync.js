// ============================================
// SYNCHRONOUS FIREBASE INITIALIZATION FOR ADMIN PANEL
// ============================================
// This file loads Firebase synchronously to ensure it's available
// before admin-chat.js executes

(async function() {
    console.log('🔥 Loading Firebase modules...');
    
    // Dynamically import Firebase modules
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
    const { 
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
    } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    const { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, connectAuthEmulator } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
    const { getFunctions, connectFunctionsEmulator } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js');
    const { getStorage, connectStorageEmulator } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js');

    // Firebase config
    const firebaseConfig = {
        apiKey: "AIzaSyDyQvItRyL4IKl9NmEItswwPOEiKAbWkMw",
        authDomain: "my-magazin-81c96.firebaseapp.com",
        projectId: "my-magazin-81c96",
        storageBucket: "my-magazin-81c96.firebasestorage.app",
        messagingSenderId: "129061757346",
        appId: "1:129061757346:web:3e7bc5838cc5f7bda992fb"
    };

    // Initialize Firebase
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
        console.log('🔧 ADMIN firebase-init-sync.js: Connecting to Firebase Emulators...');
        
        try {
            connectFirestoreEmulator(db, '127.0.0.1', 8080);
            console.log('✅ SYNC: Firestore Emulator connected (127.0.0.1:8080)');
        } catch (error) {
            console.warn('⚠️ Firestore Emulator error:', error.message);
        }
        
        try {
            connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
            console.log('✅ SYNC: Auth Emulator connected (127.0.0.1:9099)');
        } catch (error) {
            console.warn('⚠️ Auth Emulator error:', error.message);
        }
        
        try {
            connectFunctionsEmulator(functions, '127.0.0.1', 5001);
            console.log('✅ SYNC: Functions Emulator connected (127.0.0.1:5001)');
        } catch (error) {
            console.warn('⚠️ Functions Emulator error:', error.message);
        }
        
        try {
            connectStorageEmulator(storage, '127.0.0.1', 9199);
            console.log('✅ SYNC: Storage Emulator connected (127.0.0.1:9199)');
        } catch (error) {
            console.warn('⚠️ Storage Emulator error:', error.message);
        }
        
        console.log('🎯 SYNC using LOCAL emulators at http://localhost:4000');
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

    // Export to global scope IMMEDIATELY
    window.db = db;
    window.auth = auth;
    window.storage = storage;
    window.functions = functions;
    window.collection = collection;
    window.doc = doc;
    window.addDoc = addDoc;
    window.setDoc = setDoc;
    window.getDoc = getDoc;
    window.getDocs = getDocs;
    window.updateDoc = updateDoc;
    window.deleteDoc = deleteDoc;
    window.onSnapshot = onSnapshot;
    window.query = query;
    window.where = where;
    window.orderBy = orderBy;
    window.limit = limit;
    window.serverTimestamp = serverTimestamp;
    window.Timestamp = Timestamp;
    window.arrayUnion = arrayUnion;
    window.arrayRemove = arrayRemove;
    window.increment = increment;
    window.onAuthStateChanged = onAuthStateChanged;
    window.signInWithEmailAndPassword = signInWithEmailAndPassword;
    window.signOut = signOut;

    // Also keep the firebaseInit object for compatibility
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

    console.log('✅ Firebase (SYNC) initialized and exported to window');
    console.log('📦 window.firebaseInit available:', !!window.firebaseInit);
    console.log('🔧 arrayUnion available:', typeof window.firebaseInit?.arrayUnion);
    console.log('🔧 arrayUnion in global:', typeof window.arrayUnion);

    // Auto-initialize chat config if needed
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
})();
