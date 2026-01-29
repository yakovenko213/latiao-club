/ Import Firebase SDK
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDyQvItRyL4IKl9NmEItswwPOEiKAbWkMw",
  authDomain: "my-magazin-81c96.firebaseapp.com",
  projectId: "my-magazin-81c96",
  storageBucket: "my-magazin-81c96.firebasestorage.app",
  messagingSenderId: "129061757346",
  appId: "1:129061757346:web:3e7bc5838cc5f7bda992fb"
};

// Initialize Firebase with error handling
let app = null;
let db = null;
let auth = null;

try {
  console.log('🔧 Initializing Firebase...');
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase App initialized');
  
  db = getFirestore(app);
  console.log('✅ Firestore initialized');
  console.log('📊 Firestore instance:', db ? 'Valid' : 'Invalid');
  
  auth = getAuth(app);
  console.log('✅ Firebase Auth initialized');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  console.error('Error details:', {
    name: error.name,
    message: error.message,
    code: error.code
  });
  
  // Re-throw to let calling code handle it
  throw error;
}

// Export for use in other modules
export { db, auth };