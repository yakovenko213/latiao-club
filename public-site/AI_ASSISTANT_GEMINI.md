# 🤖 AI Assistant Integration - Gemini 2.0 Flash

## 📋 Overview

Ваш Live Chat тепер має вбудований **AI Assistant на базі Gemini 2.0 Flash**! 

Штучний інтелект автоматично відповідає клієнтам, коли адміністратор недоступний.

---

## ✨ Features

- 🎯 **Smart Auto-Responses**: ШІ відповідає на питання клієнтів автоматично
- ⏱️ **10-Second Grace Period**: Якщо адміністратор відповість протягом 10 секунд - ШІ не втручається
- 💬 **Custom System Prompt**: Повністю налаштовуйте особистість та стиль спілкування ШІ
- 🇺🇦 **Ukrainian Language**: ШІ відповідає українською мовою
- 📊 **Context-Aware**: ШІ аналізує останні 5 повідомлень для кращого розуміння контексту
- ⚡ **Real-time**: Миттєве збереження відповідей у Firestore

---

## 🚀 Quick Start

### 1️⃣ Отримайте API Key від Google

1. Відкрийте: https://aistudio.google.com/app/apikey
2. Натисніть **"Create API Key"**
3. Скопіюйте згенерований ключ

### 2️⃣ Додайте API Key у код

Відкрийте файл [`js/chat-logic.js`](js/chat-logic.js) та замініть:

```javascript
const CONFIG = {
    GEMINI_API_KEY: "YOUR_KEY_HERE", // 🔑 Вставте ваш ключ тут
    ...
};
```

На:

```javascript
const CONFIG = {
    GEMINI_API_KEY: "AIzaSyA...", // 🔑 Ваш реальний ключ
    ...
};
```

### 3️⃣ Налаштуйте ШІ в Admin Panel

1. Відкрийте **Admin Panel**: https://my-magazin-81c96.web.app/admin.html
2. Перейдіть у розділ **💬 Онлайн чат | ШІ**
3. Клікніть на вкладку **⚙️ Налаштування**
4. Знайдіть секцію **🤖 ШІ-асистент (Gemini 2.0 Flash)**

**Доступні налаштування:**

- ✅ **Увімкнути ШІ-асистента** - включає/виключає автовідповіді
- 📝 **Інструкції для ШІ (System Prompt)** - опишіть як ШІ має себе поводити

**Приклад System Prompt:**

```
Ти корисний асистент інтернет-магазину latiao.club, який продає корейські товари та косметику. 
Відповідай дружньо українською мовою. 

Твої основні завдання:
- Допомагати клієнтам з вибором товарів
- Відповідати на питання про доставку (доставка Новою Поштою по Україні, 2-3 дні)
- Пояснювати умови оплати (оплата при отриманні або онлайн картою)
- Рекомендувати популярні товари
- Бути ввічливим та професійним

Якщо не знаєш відповіді - чесно кажи про це та пропонуй зачекати менеджера.
```

5. Натисніть **💾 Зберегти налаштування чату**

### 4️⃣ Deploy зміни

```bash
firebase deploy --only hosting
```

---

## 🧠 How It Works

### Логіка роботи AI Assistant

```
📨 Клієнт надсилає повідомлення
    ↓
⏳ Система чекає 10 секунд
    ↓
❓ Адміністратор відповів?
    ├─ ✅ ТАК → ШІ не втручається
    └─ ❌ НІ → ШІ генерує відповідь
        ↓
🤖 Виклик Gemini 2.0 Flash API
    ↓ (використовує System Prompt + історію чату)
⏱️ Затримка 2-3 секунди (імітація набору)
    ↓
💾 Збереження відповіді з sender: "ai"
    ↓
✅ Клієнт бачить відповідь ШІ
```

### Технічні деталі

**Файл:** [`js/chat-logic.js`](js/chat-logic.js)

**Основні функції:**

- `initAIChatLogic()` - Ініціалізація системи
- `startMonitoringChats()` - Моніторинг всіх активних чатів
- `handleNewMessage()` - Обробка нових повідомлень
- `generateAIResponse()` - Генерація відповіді через Gemini API
- `callGeminiAPI()` - Виклик Gemini 2.0 Flash
- `saveAIResponse()` - Збереження відповіді у Firestore

**Firestore Structure:**

```
settings/
  └─ chat_config
      ├─ aiEnabled: true/false
      ├─ aiSystemPrompt: "Your custom instructions..."
      ├─ enabled: true/false
      └─ enabledPages: [...]

chats/
  └─ {chatId}/
      └─ messages/
          ├─ {messageId}
          │   ├─ text: "..."
          │   ├─ sender: "user" | "admin" | "ai"
          │   ├─ timestamp: Timestamp
          │   └─ read: boolean
```

---

## ⚙️ Configuration Options

### У файлі `chat-logic.js`:

```javascript
const CONFIG = {
    GEMINI_API_KEY: "YOUR_KEY_HERE",        // API ключ
    GEMINI_API_URL: "...",                  // Gemini API endpoint
    AI_RESPONSE_DELAY: 2500,                // 2.5 сек затримка
    ADMIN_GRACE_PERIOD: 10000,              // 10 сек для адміна
    DEBUG: true                             // Логи в консолі
};
```

### Налаштування Gemini API:

```javascript
generationConfig: {
    temperature: 0.7,      // Креативність (0.0 - 1.0)
    topK: 40,             // Різноманітність токенів
    topP: 0.95,           // Nucleus sampling
    maxOutputTokens: 1024 // Макс. довжина відповіді
}
```

**Рекомендації:**

- `temperature: 0.7` - Збалансована креативність (не занадто сухо, не занадто випадково)
- `temperature: 0.3` - Більш передбачувані відповіді
- `temperature: 0.9` - Більш креативні відповіді

---

## 🔒 Security & Best Practices

### ⚠️ Важливо: API Key Security

❌ **НЕ РОБІТЬ ТАК:**
```javascript
// API ключ видимий у коді клієнта - небезпечно!
const GEMINI_API_KEY = "AIzaSyA...";
```

✅ **ПРАВИЛЬНО (Рекомендовано для продакшену):**

**Варіант 1: Firebase Cloud Functions**

Створіть серверну функцію:

```javascript
// functions/index.js
const functions = require('firebase-functions');
const axios = require('axios');

exports.callGemini = functions.https.onCall(async (data, context) => {
    const apiKey = functions.config().gemini.key; // Зберігається на сервері
    
    const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
        data.requestBody
    );
    
    return response.data;
});
```

Налаштуйте секрет:
```bash
firebase functions:config:set gemini.key="YOUR_API_KEY"
firebase deploy --only functions
```

У `chat-logic.js` викликайте функцію:
```javascript
const callGemini = window.httpsCallable(window.functions, 'callGemini');
const result = await callGemini({ requestBody });
```

**Варіант 2: Environment Variables (для тестування)**

Якщо використовуєте Firebase Hosting з локальним сервером:

```javascript
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
```

### 🛡️ Rate Limiting

Gemini API має ліміти:
- **Free tier**: 15 requests/minute
- **Paid tier**: 360 requests/minute

Для високого трафіку додайте rate limiting у `chat-logic.js`.

---

## 🧪 Testing

### 1. Тестування в консолі браузера

Відкрийте Admin Panel → F12 → Console

Перевірте логи:
```
🤖 AI Chat Logic script loaded
🤖 AI Chat Logic: Initializing...
✅ AI Chat Logic: Firebase ready
👀 AI Chat Logic: Monitoring all chats...
```

### 2. Тестування реального чату

1. Відкрийте сайт у **приватному вікні** (щоб бути "клієнтом")
2. Напишіть повідомлення у чат
3. Зачекайте 10+ секунд (не відповідайте як адмін)
4. ШІ має відповісти автоматично

**Консоль має показати:**
```
📨 AI Chat Logic: New user message in chat_xxx: "Привіт!"
🤖 AI Chat Logic: Generating response for chat_xxx...
✅ AI Chat Logic: Response saved for chat_xxx
```

### 3. Тестування Grace Period

1. Клієнт пише повідомлення
2. **Протягом 10 секунд** відповідайте як адміністратор
3. ШІ **НЕ МАЄ** відповісти

**Консоль має показати:**
```
👤 AI Chat Logic: Admin already handled chat_xxx, skipping AI
```

---

## 🐛 Troubleshooting

### Проблема: ШІ не відповідає

**Можливі причини:**

1. **API Key невірний**
   - Перевірте: https://aistudio.google.com/app/apikey
   - Переконайтесь що ключ активний

2. **ШІ вимкнено в налаштуваннях**
   - Admin Panel → Налаштування → "Увімкнути ШІ-асистента" має бути ✅

3. **Firebase правила блокують запис**
   - Перевірте [`firestore.rules`](firestore.rules)
   - Переконайтесь що `sender: "ai"` дозволений

4. **Консольні помилки**
   - Відкрийте F12 → Console
   - Шукайте `❌ AI Chat Logic:` або `❌ Gemini API Error:`

### Проблема: ШІ відповідає занадто швидко

Збільште затримку в `chat-logic.js`:

```javascript
const CONFIG = {
    AI_RESPONSE_DELAY: 5000,        // 5 секунд замість 2.5
    ADMIN_GRACE_PERIOD: 20000,      // 20 секунд замість 10
};
```

### Проблема: ШІ відповідає навіть коли адмін онлайн

Це нормально - ШІ чекає 10 секунд. Якщо адмін не відповість протягом цього часу, ШІ втрутиться.

Щоб збільшити час очікування:
```javascript
ADMIN_GRACE_PERIOD: 30000, // 30 секунд
```

### Проблема: Gemini API повертає помилку 429

**Rate limit exceeded** - занадто багато запитів.

**Рішення:**
1. Перейдіть на платний план Google AI
2. Додайте rate limiting у код
3. Кешуйте відповіді на типові питання

---

## 📊 Monitoring & Analytics

### Дивіться статистику ШІ

У Firestore Console перевірте:

```
chats/{chatId}/messages
```

Відфільтруйте за `sender == "ai"` щоб побачити всі відповіді ШІ.

### Корисні запити

**Скільки відповідей дав ШІ:**
```javascript
const aiMessages = await getDocs(
    query(collection(db, 'chats', chatId, 'messages'), 
    where('sender', '==', 'ai'))
);
console.log('AI responses:', aiMessages.size);
```

**Середній час відповіді:**
```javascript
// Порівняйте timestamp останнього user message 
// з timestamp першого ai message після нього
```

---

## 🎨 Customization Ideas

### 1. Різні промпти для різних сторінок

```javascript
function getSystemPrompt(page) {
    if (page.includes('checkout')) {
        return "Ти асистент оформлення замовлення. Допомагай з питаннями оплати та доставки.";
    } else if (page.includes('category')) {
        return "Ти асистент вибору товарів. Рекомендуй популярні позиції.";
    }
    return "Загальний асистент магазину.";
}
```

### 2. Emoji у відповідях

Додайте у System Prompt:
```
Використовуй емодзі щоб зробити відповіді дружніми: 
😊 👍 🎉 💝 🚚 💳 ✅
```

### 3. Quick Replies

Після відповіді ШІ додайте кнопки швидких дій:

```javascript
await saveAIResponse(chatId, `${aiResponse}\n\n[Кнопка: Переглянути каталог] [Кнопка: Зв'язатися з менеджером]`);
```

### 4. Escalation to Human

Якщо клієнт каже "хочу з менеджером" - ШІ більше не відповідає:

```javascript
if (userMessage.includes('менеджер') || userMessage.includes('людина')) {
    // Позначити чат як "needs_human"
    await updateDoc(chatRef, { needsHuman: true });
    return;
}
```

---

## 📚 API Reference

### Gemini 2.0 Flash Docs

- **Official Docs**: https://ai.google.dev/gemini-api/docs
- **API Reference**: https://ai.google.dev/api/rest/v1beta/models/generateContent
- **Pricing**: https://ai.google.dev/pricing

### Firebase Integration

- **Cloud Functions**: https://firebase.google.com/docs/functions
- **Firestore Security**: https://firebase.google.com/docs/firestore/security/get-started
- **Callable Functions**: https://firebase.google.com/docs/functions/callable

---

## 🎯 Next Steps

1. ✅ Додайте свій Gemini API Key
2. ✅ Налаштуйте System Prompt в Admin Panel
3. ✅ Протестуйте на реальних клієнтах
4. 📊 Моніторте якість відповідей
5. 🔒 Перенесіть API Key у Cloud Function (для безпеки)
6. 📈 Аналізуйте метрики (скільки чатів обробив ШІ)
7. 🎨 Додайте персоналізацію

---

## 💡 Tips for Better AI Responses

### ✅ DO:
- Пишіть детальні System Prompts (200-500 слів)
- Вказуйте конкретні приклади відповідей
- Додавайте FAQ у промпт
- Тестуйте різні формулювання
- Оновлюйте промпт на основі реальних чатів

### ❌ DON'T:
- Не робіть промпт занадто коротким
- Не використовуйте суперечливі інструкції
- Не очікуйте що ШІ знає ваші ціни (додайте їх у промпт!)
- Не забувайте про tone of voice вашого бренду

---

## 🆘 Support

Якщо у вас виникли проблеми:

1. Перевірте консоль браузера (F12)
2. Перевірте Firestore Rules
3. Перевірте що API Key валідний
4. Перегляньте [`CHAT_WIDGET_GUIDE.md`](CHAT_WIDGET_GUIDE.md)
5. Перегляньте [`LIVE_CHAT_SETUP.md`](LIVE_CHAT_SETUP.md)

---

## 📄 License

MIT License - використовуйте вільно у ваших проектах!

---

**Автор:** Senior Full Stack Developer  
**Версія:** 1.0.0  
**Дата:** January 2026  

🚀 **Happy Coding!**
