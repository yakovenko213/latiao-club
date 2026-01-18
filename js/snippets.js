/* ===========================================
   FIREBASE CONNECTION SNIPPETS
   Quick reference for key code blocks
   =========================================== */

// ============================================
// 1. FIREBASE CONFIGURATION (js/firebase-init.js)
// ============================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyDyQvItRyL4IKl9NmEItswwPOEiKAbWkMw",
  authDomain: "my-magazin-81c96.firebaseapp.com",
  projectId: "my-magazin-81c96",
  storageBucket: "my-magazin-81c96.firebasestorage.app",
  messagingSenderId: "129061757346",
  appId: "1:129061757346:web:3e7bc5838cc5f7bda992fb"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, addDoc, serverTimestamp };


// ============================================
// 2. IMPORT IN CHECKOUT.HTML
// ============================================

// Add to the top of your <script type="module"> tag:
import { db, collection, addDoc, serverTimestamp } from './js/firebase-init.js';


// ============================================
// 3. SAVE ORDER TO FIRESTORE (Core Logic)
// ============================================

async function submitOrder() {
  try {
    // Collect all order data
    const orderData = {
      customer: {
        fullName: document.getElementById('fullName').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        telegram: document.getElementById('telegram').value.trim()
      },
      delivery: {
        method: 'Нова Пошта',
        city: 'Київ',
        address: 'Київ, Відділення №1'
      },
      payment: {
        method: 'Накладений платіж',
        status: 'Нове замовлення'
      },
      items: cartItems.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity
      })),
      summary: {
        total: calculateTotals().total
      },
      status: 'pending',
      createdAt: serverTimestamp() // ⭐ Auto timestamp
    };
    
    // ⭐ SAVE TO FIRESTORE - This is the key line
    const docRef = await addDoc(collection(db, 'orders'), orderData);
    
    console.log('✅ Order saved! ID:', docRef.id);
    
    // Success actions
    localStorage.removeItem('latiao_cart'); // Clear cart
    alert('🎉 Замовлення оформлено! Номер: ' + docRef.id.substring(0, 8).toUpperCase());
    window.location.href = 'index.html'; // Redirect
    
  } catch (error) {
    console.error('❌ Error:', error);
    alert('⚠️ Помилка: ' + error.message);
  }
}


// ============================================
// 4. FIRESTORE SECURITY RULES
// ============================================

// Add to Firebase Console → Firestore → Rules:
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /orders/{orderId} {
      allow create: if true; // Anyone can create orders
      allow read: if true;   // Anyone can read (change for production)
    }
  }
}


// ============================================
// 5. QUICK TEST
// ============================================

// Open browser console and run:
const testOrder = {
  customer: { fullName: 'Test User', phone: '123', telegram: '@test' },
  items: [{ name: 'Test Item', price: 100, quantity: 1 }],
  createdAt: serverTimestamp()
};

addDoc(collection(db, 'orders'), testOrder)
  .then(doc => console.log('✅ Test order created:', doc.id))
  .catch(err => console.error('❌ Error:', err));
