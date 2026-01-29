# 🔥 FIREBASE SECURITY RULES - Copy & Paste Ready

## Готові до використання правила безпеки

---

## 📝 ІНСТРУКЦІЯ

### Крок 1: Отримайте ваш Admin UID
```
Використайте файл get-my-uid.html або консоль браузера
```

### Крок 2: Замініть UID у правилах нижче
```
Знайдіть: YOUR_ADMIN_UID_HERE
Замініть на: ваш реальний UID
```

### Крок 3: Застосуйте правила

#### Варіант A: Через Firebase Console
1. Відкрийте [Firebase Console](https://console.firebase.google.com)
2. Оберіть ваш проект
3. Скопіюйте та вставте правила в відповідні розділи

#### Варіант B: Через CLI
```bash
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

---

## 🗄️ FIRESTORE DATABASE RULES

**Файл:** `firestore.rules`

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ============================================
    // 🔐 ADMIN FUNCTION
    // ============================================
    function isAdmin() {
      return request.auth != null && 
             request.auth.uid == 'YOUR_ADMIN_UID_HERE'; // ⚠️ ЗАМІНІТЬ НА ВАШ UID
    }
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }
    
    // ============================================
    // PRODUCTS - публічне читання, адмін пише
    // ============================================
    match /products/{productId} {
      allow read: if true; // всі можуть читати
      allow create, update, delete: if isAdmin(); // тільки адмін може змінювати
    }
    
    // ============================================
    // ORDERS - адмін бачить все, користувачі створюють
    // ============================================
    match /orders/{orderId} {
      allow read: if isAdmin(); // тільки адмін читає всі замовлення
      allow create: if isAuthenticated(); // авторизовані користувачі створюють
      allow update, delete: if isAdmin(); // тільки адмін змінює
    }
    
    // ============================================
    // USERS - користувачі бачать тільки себе
    // ============================================
    match /users/{userId} {
      allow read, write: if isOwner(userId); // користувач бачить тільки свої дані
      allow read, write: if isAdmin(); // адмін бачить все
    }
    
    // ============================================
    // CATEGORIES - публічне читання, адмін пише
    // ============================================
    match /categories/{categoryId} {
      allow read: if true; // всі можуть читати
      allow write: if isAdmin(); // тільки адмін змінює
    }
    
    // ============================================
    // PAGES - публічне читання, адмін пише
    // ============================================
    match /pages/{pageId} {
      allow read: if true; // всі можуть читати
      allow write: if isAdmin(); // тільки адмін змінює
    }
    
    // ============================================
    // PROMO CODES - тільки адмін
    // ============================================
    match /promoCodes/{promoId} {
      allow read, write: if isAdmin(); // повний доступ тільки адміну
    }
    
    // ============================================
    // ANALYTICS - тільки адмін
    // ============================================
    match /analytics/{docId} {
      allow read, write: if isAdmin();
    }
    
    // ============================================
    // SETTINGS - публічне читання, адмін пише
    // ============================================
    match /settings/{settingId} {
      allow read: if true; // всі можуть читати налаштування
      allow write: if isAdmin(); // тільки адмін змінює
    }
    
    // ============================================
    // CARTS - користувачі керують своїми кошиками
    // ============================================
    match /carts/{cartId} {
      allow read, write: if isOwner(cartId); // користувач керує своїм кошиком
      allow read, write: if isAdmin(); // адмін бачить все
    }
    
    // ============================================
    // DEFAULT - все інше тільки для адміна
    // ============================================
    match /{document=**} {
      allow read, write: if isAdmin();
    }
  }
}
```

---

## 🗂️ FIREBASE STORAGE RULES

**Файл:** `storage.rules`

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // ============================================
    // 🔐 ADMIN FUNCTION
    // ============================================
    function isAdmin() {
      return request.auth != null && 
             request.auth.uid == 'YOUR_ADMIN_UID_HERE'; // ⚠️ ЗАМІНІТЬ НА ВАШ UID
    }
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // File size limit (10MB)
    function isValidSize() {
      return request.resource.size < 10 * 1024 * 1024;
    }
    
    // Valid image types
    function isImage() {
      return request.resource.contentType.matches('image/.*');
    }
    
    // ============================================
    // PRODUCT IMAGES - тільки адмін завантажує
    // ============================================
    match /products/{allPaths=**} {
      allow read: if true; // всі можуть читати/дивитись зображення
      allow write: if isAdmin() && isValidSize() && isImage();
    }
    
    // ============================================
    // REVIEW IMAGES - авторизовані користувачі
    // ============================================
    match /reviews/{allPaths=**} {
      allow read: if true; // всі можуть читати
      allow write: if isAuthenticated() && isValidSize() && isImage();
    }
    
    // ============================================
    // USER AVATARS - користувачі завантажують свої
    // ============================================
    match /users/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && 
                      request.auth.uid == userId && 
                      isValidSize() && 
                      isImage();
    }
    
    // ============================================
    // DEFAULT - все інше тільки для адміна
    // ============================================
    match /{allPaths=**} {
      allow read: if true; // публічне читання
      allow write: if isAdmin(); // тільки адмін завантажує
    }
  }
}
```

---

## 🚀 DEPLOY КОМАНДИ

### Deploy тільки Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### Deploy тільки Storage Rules
```bash
firebase deploy --only storage:rules
```

### Deploy обидва
```bash
firebase deploy --only firestore:rules,storage:rules
```

### Deploy все (Hosting + Rules)
```bash
firebase deploy
```

---

## ✅ ТЕСТУВАННЯ

### Тест 1: Firestore - Неавторизований доступ
Відкрийте DevTools Console на головній сторінці (вийдіть з облікового запису):
```javascript
// Має повернути Permission Denied
firebase.firestore().collection('orders').get()
  .then(snap => console.log('✅ Доступ є'))
  .catch(err => console.log('🚫 Доступ заборонено:', err.code));
```

### Тест 2: Firestore - Адмін доступ
Авторизуйтесь як адмін і виконайте:
```javascript
// Має успішно повернути дані
firebase.firestore().collection('orders').get()
  .then(snap => console.log('✅ Адмін доступ:', snap.size, 'документів'))
  .catch(err => console.log('🚫 Помилка:', err));
```

### Тест 3: Storage - Завантаження без авторизації
```javascript
// Має повернути Permission Denied
const storageRef = firebase.storage().ref('products/test.jpg');
storageRef.putString('test', 'raw')
  .then(() => console.log('✅ Завантажено'))
  .catch(err => console.log('🚫 Заборонено:', err.code));
```

---

## 🔒 ВАЖЛИВО

1. **Замініть `YOUR_ADMIN_UID_HERE`** на ваш реальний UID перед deploy
2. **Тестуйте rules** на Firebase Emulator перед production
3. **Backup** поточних rules перед змінами
4. **Моніторьте** Firebase Console → Usage для підозрілої активності

---

## 📋 КОНТРОЛЬНИЙ СПИСОК

- [ ] UID замінено в Firestore Rules
- [ ] UID замінено в Storage Rules  
- [ ] Rules збережено у файли `firestore.rules` та `storage.rules`
- [ ] Виконано `firebase deploy --only firestore:rules,storage:rules`
- [ ] Протестовано: неавторизований доступ блокується
- [ ] Протестовано: адмін має повний доступ
- [ ] Firebase Console → Firestore → Rules показує нові правила
- [ ] Firebase Console → Storage → Rules показує нові правила

---

**Готово!** Тепер ваша база даних і сховище повністю захищені 🔐
