# 🔒 Firestore Security Rules для Live Chat

## Проблема

Ви бачите помилку:
```
Missing or insufficient permissions
```

Це означає, що Firestore Rules не дозволяють запис в колекцію `settings`.

## ✅ Рішення

Додайте ці правила в **Firebase Console → Firestore Database → Rules**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ═════════════════════════════════════════════════════════════
    // 🔧 CHAT SETTINGS - Admin Write Access
    // ═════════════════════════════════════════════════════════════
    match /settings/chat_config {
      // Public read (for chat widget to check if enabled)
      allow read: if true;
      
      // Write only for authenticated admin users
      // Option 1: By specific UID
      allow write: if request.auth != null && request.auth.uid == 'YOUR_ADMIN_UID_HERE';
      
      // Option 2: By custom claim (recommended)
      // allow write: if request.auth != null && request.auth.token.admin == true;
      
      // Option 3: For development ONLY (remove in production!)
      // allow write: if true;
    }
    
    // ═════════════════════════════════════════════════════════════
    // 💬 CHAT SESSIONS
    // ═════════════════════════════════════════════════════════════
    match /chats/{chatId} {
      // Anyone can read their own chat
      allow read: if true;
      
      // Anyone can create a new chat
      allow create: if true;
      
      // Only admin or chat owner can update
      allow update: if request.auth != null || 
                       chatId == request.resource.data.userId;
      
      // Admins can delete
      allow delete: if request.auth != null;
      
      // Messages subcollection
      match /messages/{messageId} {
        allow read: if true;
        allow create: if true;
        allow update: if request.auth != null;
        allow delete: if request.auth != null;
      }
    }
    
    // ═════════════════════════════════════════════════════════════
    // 📄 PAGES & CATEGORIES (for dynamic loading)
    // ═════════════════════════════════════════════════════════════
    match /pages/{pageId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /categories/{categoryId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 🔑 Отримання вашого Admin UID

### Спосіб 1: Через консоль браузера
1. Відкрийте `admin.html`
2. Натисніть F12 (Developer Tools)
3. Вставте в консоль:
```javascript
firebase.auth().currentUser.uid
```

### Спосіб 2: Через спеціальну сторінку
1. Відкрийте `get-my-uid.html` (якщо існує)
2. Скопіюйте ваш UID

### Спосіб 3: Firebase Console
1. Відкрийте [Firebase Console](https://console.firebase.google.com)
2. Виберіть проект `my-magazin-81c96`
3. Перейдіть в **Authentication → Users**
4. Знайдіть свій email
5. Скопіюйте **User UID**

## 📝 Інструкція по застосуванню

### Крок 1: Отримайте ваш UID
```javascript
// В консолі admin.html виконайте:
console.log(firebase.auth().currentUser?.uid);
// Скопіюйте результат, наприклад: "abc123xyz789"
```

### Крок 2: Оновіть Rules
1. Відкрийте [Firebase Console](https://console.firebase.google.com/project/my-magazin-81c96/firestore/rules)
2. Замініть `YOUR_ADMIN_UID_HERE` на ваш реальний UID
3. Натисніть **"Publish"**

### Крок 3: Перевірте
1. Відкрийте `admin.html`
2. Перейдіть в **💬 Онлайн чат | ШІ → ⚙️ Налаштування**
3. Виберіть сторінки
4. Натисніть **"💾 Зберегти налаштування чату"**
5. Повинна з'явитися зелена галочка: **"✅ Успішно збережено!"**

## 🔐 Опція з Custom Claims (Рекомендовано для продакшену)

Якщо у вас декілька адмінів, використовуйте Custom Claims:

### 1. Встановіть claim через Firebase Admin SDK:
```javascript
// В Cloud Functions або локально
const admin = require('firebase-admin');
admin.auth().setCustomUserClaims(uid, { admin: true });
```

### 2. Використовуйте в Rules:
```javascript
match /settings/chat_config {
  allow read: if true;
  allow write: if request.auth != null && 
                  request.auth.token.admin == true;
}
```

## ⚠️ Для розробки (ТИМЧАСОВО!)

Якщо хочете швидко протестувати БЕЗ аутентифікації:

```javascript
match /settings/chat_config {
  allow read: if true;
  allow write: if true;  // ⚠️ НЕБЕЗПЕЧНО! Видаліть в продакшені!
}
```

**ВАЖЛИВО:** Це дозволить будь-кому редагувати налаштування. Використовуйте тільки для тестування!

## 🧪 Тестування

### Перевірка запису:
```javascript
// В консолі admin.html:
const db = firebase.firestore();
await db.collection('settings').doc('chat_config').set({
  test: true,
  enabled: true,
  enabledPages: ['/test.html']
});
console.log('✅ Success!');
```

### Перевірка читання:
```javascript
// В консолі будь-якої сторінки:
const db = firebase.firestore();
const doc = await db.collection('settings').doc('chat_config').get();
console.log('📄 Config:', doc.data());
```

## 📊 Поточний стан

Після натискання кнопки "Зберегти" у вас буде:

```javascript
settings/chat_config
{
  enabled: true,              // Глобальний перемикач
  enabledPages: [             // Масив сторінок
    "/",
    "/index.html",
    "/product.html?slug=latiao",
    "/category.html"
  ],
  welcomeMessage: "Привіт! 👋 Чим можу допомогти?",
  aiEnabled: true,
  lastUpdated: Timestamp      // Автоматично
}
```

## 🎯 Результат

Після застосування rules:
- ✅ Кнопка "Зберегти" працює
- ✅ Налаштування зберігаються в Firestore
- ✅ Віджет чату з'являється тільки на вибраних сторінках
- ✅ В консолі детальні логи про статус чату

## 🆘 Якщо все ще не працює

1. **Перевірте аутентифікацію:**
```javascript
firebase.auth().currentUser
// Повинен повертати об'єкт користувача, а не null
```

2. **Перевірте Rules:**
   - Firebase Console → Firestore → Rules
   - Переконайтеся що правила опубліковані (Published)

3. **Перевірте консоль:**
   - F12 → Console
   - Шукайте червоні помилки з "permission denied"

4. **Очистіть кеш:**
   - Ctrl+Shift+R (жорстке перезавантаження)
   - Або очистіть кеш браузера

## 📞 Додаткова інформація

- [Firebase Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Custom Claims Guide](https://firebase.google.com/docs/auth/admin/custom-claims)
- [Testing Rules](https://firebase.google.com/docs/firestore/security/test-rules-emulator)
