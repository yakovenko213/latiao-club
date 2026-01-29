# 💬 Live Chat Widget - Інструкція по інтеграції

## 📦 Що включено

### Файли:
- **`js/chat-widget.js`** - Основний скрипт віджета (ES6 модуль)
- **`images/chat-icon.png`** - Іконка для FAB кнопки
- **`test-chat-widget.html`** - Тестова сторінка

## 🚀 Швидкий старт

### 1. Додайте віджет на сторінку

```html
<!-- В кінці body, перед </body> -->
<script type="module" src="./js/chat-widget.js"></script>
```

### 2. Налаштуйте в адмін-панелі

1. Відкрийте `admin.html`
2. Перейдіть до **💬 Онлайн чат | ШІ**
3. Відкрийте вкладку **⚙️ Налаштування**
4. Увімкніть чат: ☑️ **Увімкнути чат на сайті**
5. Виберіть сторінки де показувати чат

### 3. Firestore структура

Віджет автоматично працює з такими колекціями:

```javascript
// Налаштування
settings/chat_config
{
  enabled: true,
  enabledPages: ["/", "/index.html", "/product.html"],
  welcomeMessage: "Привіт! 👋 Чим можу допомогти?"
}

// Чат сесії
chats/{userId}
{
  userId: "device_abc123",
  userName: "Гість",
  lastMessage: "Текст повідомлення",
  lastMessageTime: Timestamp,
  activePage: "/product.html",
  status: "active",
  unreadCount: 2
}

// Повідомлення (підколекція)
chats/{userId}/messages/{messageId}
{
  sender: "client" | "admin" | "ai",
  senderName: "Гість",
  text: "Текст повідомлення",
  timestamp: Timestamp,
  read: false
}
```

## ✨ Функціонал

### 🎯 Умовне завантаження
- Перевіряє `enabledPages` перед показом
- Порівнює `window.location.pathname`
- Підтримує `/` та `/index.html` як синоніми

### 🎨 UI/UX
- **Іконка:** PNG з GitHub репозиторію
- **Анімація:** Bounce при завантаженні + subtle bounce кожні 3 сек
- **Hover ефект:** Масштабування і обертання
- **Червоний badge:** При непрочитаних повідомленнях

### 📱 Адаптивність
- Desktop: 400x600px віконце справа знизу
- Mobile: Повноекранний режим
- Touch-friendly кнопки

### ⚡ Real-time
- `onSnapshot` для миттєвої синхронізації
- Автоматичне оновлення при нових повідомленнях
- Підтримка множинних вкладок

### 🆔 Ідентифікація
- Генерує унікальний `deviceId`
- Зберігається в `localStorage`
- Зберігає історію між сесіями

## 🎨 Стилізація

### CSS класи для кастомізації:

```css
/* Контейнер віджета */
#chat-widget-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
}

/* FAB кнопка */
#chat-toggle-btn {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #ff6b00 0%, #ff8533 100%);
}

/* Вікно чату */
#chat-window {
  width: 400px;
  height: 600px;
  border-radius: 20px;
}

/* Заголовок */
.chat-header {
  background: linear-gradient(135deg, #ff6b00 0%, #ff8533 100%);
}

/* Повідомлення клієнта */
.chat-message.client .message-bubble {
  background: linear-gradient(135deg, #ff6b00 0%, #ff8533 100%);
}

/* Повідомлення адміна */
.chat-message.admin .message-bubble {
  background: white;
  border: 1px solid #e5e7eb;
}
```

## 🔧 Конфігурація

Змініть константи в `chat-widget.js`:

```javascript
const CONFIG = {
  DEBUG: true,                    // Консольні логи
  STORAGE_KEY: 'latiao_chat_session',
  USER_ID_KEY: 'latiao_user_id',
  CHAT_ICON: 'https://raw.githubusercontent.com/...' // URL іконки
};
```

## 📊 Події та хуки

Віджет викликає наступні події:

```javascript
// Чат відкрито
window.dispatchEvent(new Event('chatOpened'));

// Чат закрито
window.dispatchEvent(new Event('chatClosed'));

// Нове повідомлення отримано
window.dispatchEvent(new CustomEvent('chatMessage', { 
  detail: { sender, text, timestamp }
}));
```

## 🐛 Діагностика

Увімкніть `CONFIG.DEBUG = true` для логів:

```
💬 Chat Widget: Firebase initialized
💬 Chat Widget Check: { currentPath: '/product.html', isEnabled: true }
💬 Chat loaded on this page
💬 User ID: device_abc123
💬 Chat session created: xyz789
💬 Listening for new messages...
```

## 📱 Інтеграція на сторінках

### Головна сторінка (index.html):
```html
<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8">
  <title>Головна</title>
</head>
<body>
  <!-- Ваш контент -->
  
  <!-- Live Chat Widget -->
  <script type="module" src="./js/chat-widget.js"></script>
</body>
</html>
```

### Сторінка товару (product.html):
```html
<!-- Live Chat Widget -->
<script type="module" src="./js/chat-widget.js"></script>
</body>
</html>
```

### Checkout (checkout.html):
```html
<!-- Live Chat Widget -->
<script type="module" src="./js/chat-widget.js"></script>
</body>
</html>
```

## 🎯 Тестування

1. Відкрийте `test-chat-widget.html`
2. Побачите помаранчеву кнопку справа знизу
3. Клікніть для відкриття вікна чату
4. Напишіть тестове повідомлення
5. Відкрийте `admin.html` → 💬 Онлайн чат
6. Побачите нову сесію і повідомлення

## 🔒 Безпека

Встановіть Firestore правила:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Налаштування - тільки читання
    match /settings/chat_config {
      allow read: if true;
      allow write: if false; // Тільки через адмін-панель
    }
    
    // Чати - користувачі можуть створювати свої
    match /chats/{chatId} {
      allow read: if true;
      allow create: if true;
      allow update: if request.auth != null || chatId == request.resource.data.userId;
      
      // Повідомлення
      match /messages/{messageId} {
        allow read: if true;
        allow create: if true;
        allow update: if request.auth != null;
      }
    }
  }
}
```

## 🎨 Використання іконки

### Формати:
- PNG (64x64px мінімум, рекомендовано 256x256px)
- SVG (векторний, масштабується)

### Fallback:
Якщо іконка не завантажилася, показується emoji 💬

```html
<img src="..." onerror="this.parentElement.innerHTML='💬'">
```

## 📞 Підтримка

Якщо виникли проблеми:
1. Перевірте консоль браузера (F12)
2. Увімкніть `CONFIG.DEBUG = true`
3. Перевірте Firestore Rules
4. Переконайтеся що `chat_config` існує

## 🚀 Готово!

Ваш Live Chat віджет повністю налаштований і готовий до роботи!

Відкрийте будь-яку сторінку де увімкнено чат і побачите помаранчеву кнопку з анімацією. ✨
