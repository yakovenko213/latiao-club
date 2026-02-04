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
    
    const { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
    const { getFunctions } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js');
    const { getStorage } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js');

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
    const db = getFirestore(app);
    const auth = getAuth(app);
    const functions = getFunctions(app);
    const storage = getStorage(app);

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
