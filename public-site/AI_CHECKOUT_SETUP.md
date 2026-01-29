# 🪄 AI Checkout Assistant - Інструкція з налаштування

## 📋 Зміст
1. [Огляд](#огляд)
2. [Швидкий старт](#швидкий-старт)
3. [Налаштування API](#налаштування-api)
4. [Інтеграція](#інтеграція)
5. [Приклади використання](#приклади-використання)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Огляд

**AI Checkout Assistant** - це інтелектуальний асистент, який автоматично заповнює форму оформлення замовлення на основі природної мови користувача.

### Можливості:
- ✅ Парсинг даних з природної мови
- ✅ Автоматичне заповнення всіх полів форми
- ✅ Підтримка Нової Пошти та Укрпошти
- ✅ Візуальний feedback (підсвічування полів)
- ✅ Підтримка OpenAI GPT-4 та Google Gemini
- ✅ Адаптивний UI (desktop + mobile)

---

## 🚀 Швидкий старт

### 1. Додайте скрипт у ваш HTML

**В `checkout.html` додайте ПЕРЕД закриваючим тегом `</body>`:**

```html
<!-- AI Checkout Assistant -->
<script src="js/ai-checkout-helper.js"></script>
```

### 2. Отримайте API ключ

#### Варіант A: OpenAI (рекомендовано)

1. Перейдіть на https://platform.openai.com/api-keys
2. Створіть новий API ключ
3. Скопіюйте ключ (формат: `sk-proj-...`)

#### Варіант B: Google Gemini (безкоштовно)

1. Перейдіть на https://makersuite.google.com/app/apikey
2. Створіть API ключ
3. Скопіюйте ключ

### 3. Налаштуйте ключ

Відкрийте `js/ai-checkout-helper.js` та замініть:

```javascript
const CONFIG = {
    // Для OpenAI:
    OPENAI_API_KEY: 'sk-proj-YOUR_ACTUAL_KEY_HERE',
    
    // Або для Gemini:
    GEMINI_API_KEY: 'YOUR_GEMINI_KEY_HERE',
    AI_PROVIDER: 'gemini' // Змініть на 'gemini'
};
```

---

## 🔧 Налаштування API

### OpenAI Configuration

```javascript
const CONFIG = {
    OPENAI_API_KEY: 'sk-proj-xxxxxxxxxxx',
    OPENAI_MODEL: 'gpt-4o-mini', // Дешевша модель
    // або 'gpt-4' для кращої якості
    AI_PROVIDER: 'openai'
};
```

**Вартість:**
- `gpt-4o-mini`: ~$0.00015 за запит
- `gpt-4`: ~$0.03 за запит

### Gemini Configuration

```javascript
const CONFIG = {
    GEMINI_API_KEY: 'AIzaSyxxxxxxxxxxx',
    AI_PROVIDER: 'gemini'
};
```

**Вартість:**
- Безкоштовно до 60 запитів/хвилину

---

## 🎨 Кастомізація UI

### Зміна тексту кнопки

```javascript
const CONFIG = {
    BUTTON_TEXT: '🤖 AI Помічник',
};
```

### Зміна позиції кнопки

```javascript
const CONFIG = {
    BUTTON_POSITION: { 
        bottom: '20px', 
        right: '20px' 
    }
};
```

### Зміна кольорів

У файлі `js/ai-checkout-helper.js` змініть стилі:

```css
#ai-checkout-button {
    background: linear-gradient(135deg, #ff6b00 0%, #ff8533 100%);
    /* Ваш градієнт */
}
```

---

## 📝 Приклади використання

### Приклад 1: Повні дані

**Користувач вводить:**
```
Марія Коваленко, +380671234567, Львів, відділення 3, онлайн оплата, @maria_k
```

**Результат:**
- ✅ ПІБ: Марія Коваленко
- ✅ Телефон: +380671234567
- ✅ Telegram: @maria_k
- ✅ Місто: Львів
- ✅ Доставка: Нова Пошта
- ✅ Відділення: №3
- ✅ Оплата: Онлайн

### Приклад 2: Часткові дані

**Користувач вводить:**
```
Іван Шевченко, 0501234567, Київ, п'яте відділення
```

**Результат:**
- ✅ ПІБ: Іван Шевченко
- ✅ Телефон: +380501234567 (автоформатування)
- ✅ Місто: Київ
- ✅ Відділення: №5

### Приклад 3: Укрпошта

**Користувач вводить:**
```
Олена Петренко, +380931234567, Бровари, Укрпошта, післяплата
```

**Результат:**
- ✅ ПІБ: Олена Петренко
- ✅ Телефон: +380931234567
- ✅ Місто: Бровари
- ✅ Доставка: Укрпошта
- ✅ Оплата: Післяплата

---

## 🔍 Як це працює

### 1. Користувач вводить текст

```
"Марія Коваленко, +380671234567, Львів, відділення 3, онлайн"
```

### 2. AI парсить дані

Система відправляє запит до OpenAI/Gemini з спеціальним промптом:

```
System: "You are a data extractor for Ukrainian checkout..."
User: "Марія Коваленко, +380671234567..."
```

### 3. AI повертає JSON

```json
{
  "firstName": "Марія",
  "lastName": "Коваленко",
  "phone": "+380671234567",
  "city": "Львів",
  "delivery": "nova",
  "branch": "3",
  "payment": "online"
}
```

### 4. Скрипт заповнює форму

- Знаходить поля за ID
- Встановлює значення
- Тригерить події (change, input)
- Підсвічує змінені поля (зелена рамка)

---

## 🛠️ Troubleshooting

### Проблема: Кнопка не з'являється

**Рішення:**
1. Перевірте консоль на помилки
2. Переконайтесь що скрипт підключений:
   ```html
   <script src="js/ai-checkout-helper.js"></script>
   ```
3. Очистіть кеш браузера (Ctrl+Shift+R)

### Проблема: AI не відповідає

**Рішення:**
1. Перевірте API ключ:
   ```javascript
   console.log(CONFIG.OPENAI_API_KEY); // Має бути ваш ключ
   ```
2. Перевірте Network tab (F12) - чи йде запит до API
3. Перевірте чи є кошти на акаунті OpenAI

### Проблема: Поля не заповнюються

**Рішення:**
1. Відкрийте консоль (F12)
2. Перевірте логи:
   ```
   ✅ Set fullName = "..."
   ✅ Set phone = "..."
   ```
3. Якщо бачите `⚠️ Field not found: ...` - перевірте ID елементів

### Проблема: Невірний парсинг даних

**Рішення:**
1. Змініте temperature на нижчу:
   ```javascript
   temperature: 0.1 // Більш детерміновані результати
   ```
2. Додайте більше прикладів у SYSTEM_PROMPT
3. Використайте `gpt-4` замість `gpt-4o-mini`

---

## 📊 Моніторинг та аналітика

### Логування подій

```javascript
// У js/ai-checkout-helper.js додайте:
console.log('🔍 AI Request:', userInput);
console.log('📦 AI Response:', extractedData);
console.log('✅ Fields filled:', Object.keys(extractedData));
```

### Відстеження використання

```javascript
// Відправка аналітики (Google Analytics, Meta Pixel)
function trackAIUsage(extractedData) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'ai_checkout_used', {
            fields_filled: Object.keys(extractedData).length
        });
    }
}
```

---

## 🔐 Безпека

### ⚠️ ВАЖЛИВО: Захист API ключа

**НІКОЛИ не коммітьте API ключ у Git!**

1. Створіть `.env` файл (додайте в `.gitignore`):
   ```
   OPENAI_API_KEY=sk-proj-xxxxx
   ```

2. Або використовуйте backend proxy:
   ```javascript
   // Замість прямого виклику OpenAI:
   const response = await fetch('/api/ai-checkout', {
       method: 'POST',
       body: JSON.stringify({ input: userInput })
   });
   ```

3. На backend (Node.js):
   ```javascript
   app.post('/api/ai-checkout', async (req, res) => {
       const { input } = req.body;
       const result = await callOpenAI(input, process.env.OPENAI_API_KEY);
       res.json(result);
   });
   ```

---

## 🎓 Додаткові ресурси

- [OpenAI API Docs](https://platform.openai.com/docs)
- [Gemini API Docs](https://ai.google.dev/docs)
- [Nova Poshta API](https://developers.novaposhta.ua/)

---

## 📞 Підтримка

Якщо виникли питання:
1. Перевірте консоль браузера (F12)
2. Перегляньте логи: `console.log` у коді
3. Перевірте Network tab - чи йдуть запити до API

---

**Версія:** 2.0.0  
**Остання оновлення:** 22.01.2026  
**Автор:** Senior Full Stack Developer
