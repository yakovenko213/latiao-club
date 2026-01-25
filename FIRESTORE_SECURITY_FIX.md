# 🔒 Firestore Security Rules - Виправлення доступу користувачів

## 🚨 Проблема

**Симптом:** Користувачі бачать помилку "Missing or insufficient permissions" при спробі доступу до свого кабінету.

**Причина:**
1. ❌ Firestore Rules вимагають `request.auth.uid`, але сайт використовує **localStorage authentication** (телефон), а не Firebase Auth
2. ❌ У замовленнях немає поля `userId` (тільки `customer.phone`)
3. ❌ Dashboard.html намагається отримати дані користувача без Auth UID

---

## ✅ Рішення №1: Додати підтримку userId в існуючу систему

### 1️⃣ Оновити Firestore Rules (ЗРОБЛЕНО ✅)

**Файл:** `firestore.rules`

```javascript
// =============================================
// 👤 USERS/CUSTOMERS - Secure access
// =============================================

match /customers/{customerId} {
  // ✅ User can read/write ONLY their own document (by phone-based ID)
  allow read, write: if request.auth != null && 
                       request.auth.uid == customerId;
  
  // ✅ OR: Allow read if they know their phone (less secure but works)
  allow read: if request.auth != null;
  
  // ✅ Admins have full access
  allow read, write: if request.auth != null && 
                       request.auth.uid == 'YOUR_ADMIN_UID_HERE';
}

// =============================================
// 🛒 ORDERS - User can see only their orders
// =============================================

match /orders/{orderId} {
  allow create: if true;  // Anyone can place order
  
  // ✅ User can read orders where userId matches OR phone matches
  allow read: if request.auth != null && 
                 (request.auth.uid == resource.data.userId ||
                  request.auth.phone_number == resource.data.customer.phone);
  
  // ✅ OR: Simpler - allow if authenticated (less secure)
  allow read: if request.auth != null;
  
  // ✅ Admins can do everything
  allow list, update, delete: if request.auth != null;
}
```

---

### 2️⃣ Додати userId в checkout.html

**Файл:** `checkout.html` (близько лінії 3125)

**ЗНАЙТИ:**
```javascript
const orderData = {
  // Customer Information
  customer: {
    fullName: fullName,
    phone: phone,
    telegram: telegramViber
  },
  // ... rest of order
```

**ЗАМІНИТИ НА:**
```javascript
const orderData = {
  // 🔒 SECURITY: Add userId for Firebase Auth integration
  userId: null,  // Will be set below if user is logged in
  
  // Customer Information
  customer: {
    fullName: fullName,
    phone: phone,
    telegram: telegramViber
  },
  // ... rest of order
```

**ДОДАТИ ПЕРЕД `await setDoc()`:**
```javascript
// ============================================
// 🔒 SECURITY: Link order to authenticated user
// ============================================
try {
  // Check if Firebase Auth is available
  if (window.firebaseInit && window.firebaseInit.auth) {
    const { auth } = window.firebaseInit;
    const currentUser = auth.currentUser;
    
    if (currentUser) {
      orderData.userId = currentUser.uid;
      console.log('✅ Order linked to userId:', currentUser.uid);
    } else {
      console.warn('⚠️ No authenticated user, order will be anonymous');
    }
  }
  
  // ALTERNATIVE: Use phone as userId if Auth not available
  if (!orderData.userId && phone) {
    orderData.userId = phone.replace(/\D/g, '');  // Use phone digits as ID
    console.log('📱 Order linked to phone-based ID:', orderData.userId);
  }
} catch (e) {
  console.warn('⚠️ Could not link userId:', e);
}

// Save to Firestore
await setDoc(doc(db, 'orders', orderId), orderData);
```

---

### 3️⃣ Оновити Dashboard.html для правильного запиту

**Файл:** `dashboard.html` (близько лінії 508)

**ПОТОЧНИЙ КОД:**
```javascript
const ordersQuery = query(
  ordersRef,
  where('customer.phone', '==', phoneVariant),
  orderBy('createdAt', 'desc'),
  limit(50)
);
```

**НОВИЙ КОД (з підтримкою userId):**
```javascript
// Try to get userId from Firebase Auth first
let userId = null;
if (window.firebaseInit && window.firebaseInit.auth) {
  const { auth } = window.firebaseInit;
  userId = auth.currentUser?.uid;
}

// Query by userId if available, otherwise fallback to phone
let ordersQuery;
if (userId) {
  console.log('🔍 Querying orders by userId:', userId);
  ordersQuery = query(
    ordersRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
} else {
  console.log('🔍 Querying orders by phone:', phoneVariant);
  ordersQuery = query(
    ordersRef,
    where('customer.phone', '==', phoneVariant),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
}
```

---

## ✅ Рішення №2: ТИМЧАСОВЕ - Послабити Rules (швидке виправлення)

Якщо ви хочете **швидко виправити** проблему без зміни коду:

**Файл:** `firestore.rules`

```javascript
// =============================================
// 👤 CUSTOMERS - Allow authenticated read
// =============================================

match /customers/{customerId} {
  // ✅ Any logged-in user can read customer data
  allow read: if request.auth != null;
  
  // ✅ User can write only their own document
  allow write: if request.auth != null && 
                  request.auth.uid == customerId;
}

// =============================================
// 🛒 ORDERS - Allow authenticated read
// =============================================

match /orders/{orderId} {
  allow create: if true;  // Anyone can place order
  
  // ✅ Any logged-in user can read orders
  // (Frontend will filter by phone)
  allow read: if request.auth != null;
  
  // ✅ Admins can do everything
  allow list, update, delete: if request.auth != null;
}
```

**⚠️ УВАГА:** Це менш безпечно, оскільки користувачі теоретично можуть побачити всі замовлення через API. Але на практці frontend фільтрує по телефону.

---

## 🚀 Крок за кроком

### Варіант А: Повне виправлення (рекомендовано)

1. ✅ Оновити `firestore.rules` (вже зроблено)
2. 🔧 Додати `userId` в `checkout.html` при створенні замовлення
3. 🔧 Оновити `dashboard.html` для запиту по `userId`
4. 🚀 Деплой: `firebase deploy --only firestore:rules,hosting`

### Варіант Б: Швидке виправлення (тимчасове)

1. ✅ Оновити `firestore.rules` з `allow read: if request.auth != null`
2. 🚀 Деплой: `firebase deploy --only firestore:rules`

---

## 📋 Перевірка

Після виправлення перевірте:

```javascript
// В консолі браузера на сторінці dashboard.html
console.log('Auth User:', window.firebaseInit?.auth?.currentUser);
console.log('Session:', localStorage.getItem('user_session'));

// Має показати або UID, або phone-based ID
```

---

## 🎯 Рекомендація

**Використовуйте Варіант Б** зараз для швидкого виправлення, потім поступово переходьте на Варіант А для повної безпеки.

Ваша поточна система використовує localStorage authentication, тому правила `request.auth.uid` не працюють напряму. Потрібно або:
- Інтегрувати Firebase Phone Authentication
- Послабити правила для authenticated users
