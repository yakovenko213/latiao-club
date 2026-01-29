# 🪄 AI Checkout Smart Filler v3.0 - QUICK START

## ⚡ Що нового у версії 3.0?

### 🎯 Основні покращення:

1. **Інтелектуальний пошук полів** - більше не потрібні точні ID:
   - Шукає по ID, name, label text, placeholder
   - Розуміє українські назви ("ім'я", "телефон", "місто")
   - Працює навіть якщо ваші поля називаються інакше

2. **🔥 КРИТИЧНЕ ВИПРАВЛЕННЯ - Правильні events**:
   ```javascript
   field.dispatchEvent(new Event('input', { bubbles: true }));
   field.dispatchEvent(new Event('change', { bubbles: true }));
   field.dispatchEvent(new Event('blur', { bubbles: true }));
   ```
   Тепер Nova Poshta dropdown розпізнає зміни!

3. **Розширений debug mode**:
   - Логує кожне поле яке намагається знайти
   - Показує що було знайдено і як
   - Виводить доступні опції якщо branch не знайдено

4. **Покращений UI**:
   - Кнопка зліва внизу (не заважає користувачу)
   - Анімація floating
   - Більш інформативні повідомлення

---

## 🚀 ШВИДКИЙ СТАРТ (3 кроки)

### Крок 1: Додайте скрипт

```html
<!-- В кінці checkout.html, перед </body> -->
<script src="js/ai-checkout-helper.js"></script>
```

### Крок 2: Налаштуйте API ключ

Відкрийте `js/ai-checkout-helper.js` і замініть рядок 25:

```javascript
OPENAI_API_KEY: 'sk-proj-YOUR_API_KEY_HERE', // ⚠️ ЗАМІНІТЬ
```

**Альтернатива (використовується за замовчуванням):**

```javascript
AI_PROVIDER: 'gemini', // Вже налаштовано, працює одразу!
```

### Крок 3: Тестування

1. Відкрийте `test-ai-checkout.html` у браузері
2. Натисніть "🪄 Smart Filler" (зліва внизу)
3. Введіть тестовий текст:

```
Іван Шевченко, 0671234567, Київ, відділення 15, онлайн
```

4. Натисніть "Заповнити форму"
5. Перевірте:
   - ✅ Всі поля заповнені
   - ✅ Зелена анімація на полях
   - ✅ Dropdown з містами відкрився
   - ✅ Відділення вибрано
   - ✅ Console.log показує процес

---

## 🔍 Як працює інтелектуальний пошук?

### Приклад 1: Поле імені

Скрипт шукає поле за такими варіантами:
```javascript
['fullName', 'full-name', 'name', "ім'я", 'повне ім\'я', 'full_name']
```

**Знайде будь-який з цих варіантів:**
- `<input id="fullName">` ✅
- `<input name="full-name">` ✅
- `<label>Повне ім'я: <input></label>` ✅
- `<input placeholder="Введіть ім'я">` ✅

### Приклад 2: Кнопка доставки

Шукає по data-атрибуту та тексту:
```javascript
findClickable(['нова пошта', 'nova poshta', 'нп', 'nova'], 'data-delivery')
```

**Знайде:**
- `<div data-delivery="nova">` ✅
- `<button>Нова Пошта</button>` ✅
- `<div class="card">НП Доставка</div>` ✅

---

## 📋 Приклади використання

### Варіант 1: Повні дані

```
Марія Коваленко, +380501234567, Львів, відділення 3, онлайн оплата, @maria_k
```

**Результат:**
- Ім'я: `Марія Коваленко`
- Телефон: `+380501234567`
- Місто: `Львів` (автокомпліт спрацював)
- Відділення: `№3`
- Оплата: `Онлайн`
- Telegram: `@maria_k`

### Варіант 2: Мінімальні дані

```
Іван, 0671234567, Київ, 15, післяплата
```

**Результат:**
- Ім'я: `Іван`
- Телефон: `+380671234567` (авто-формат)
- Місто: `Київ`
- Відділення: `№15`
- Оплата: `Післяплата`

### Варіант 3: Укрпошта

```
Олена Петренко, +380931234567, Бровари, Укрпошта, готівка
```

**Результат:**
- Ім'я: `Олена Петренко`
- Доставка: `Укрпошта` ✅
- Оплата: `Післяплата`

---

## 🐛 Debug Mode

За замовчуванням DEBUG увімкнено. Відкрийте Console (F12):

```
═══════════════════════════════════════════════
📦 AI EXTRACTED DATA:
┌─────────────────┬──────────────────────┐
│ name            │ "Іван"               │
│ surname         │ "Шевченко"           │
│ phone           │ "+380671234567"      │
│ city            │ "Київ"               │
│ delivery_service│ "nova"               │
│ branch          │ "15"                 │
│ payment_method  │ "online"             │
└─────────────────┴──────────────────────┘
═══════════════════════════════════════════════
🔍 Searching for field: [fullName, full-name, name, ім'я, повне ім'я, full_name]
✅ Found by ID: fullName
✅ Set field "fullName" = "Іван Шевченко"

🔍 Searching for field: [phone, tel, telephone, телефон, мобільний, mobile]
✅ Found by ID: phone
✅ Set field "phone" = "+380671234567"

🚚 Selecting delivery: nova
🔍 Searching for clickable: [нова пошта, nova poshta, нп, nova]
✅ Found by data-delivery: nova
✅ Selected delivery: nova

📍 Filling Nova Poshta city: Київ
✅ Set Nova Poshta city: Київ, waiting for autocomplete...
✅ Selected first city suggestion

🏢 Filling branch: 15
✅ Selected branch: 15

💳 Selecting payment: online
✅ Selected payment: online
═══════════════════════════════════════════════
✅ FORM FILL COMPLETED
═══════════════════════════════════════════════
```

**Якщо щось не спрацювало:**

```
⚠️ Could not find field for: [telegram, tg, телеграм]
⚠️ Branch 99 not found. Available:
["Відділення №1", "Відділення №2", ...]
```

---

## ⚙️ Налаштування

### Змінити позицію кнопки

```javascript
// Рядок 169-170
#ai-checkout-button {
    bottom: 30px;
    left: 30px;  // Змініть на right: 30px для правого боку
}
```

### Змінити текст кнопки

```javascript
// Рядок 523
button.innerHTML = `
    <span style="font-size: 24px;">🪄</span>
    <span>Ваш текст тут</span>
`;
```

### Вимкнути debug

```javascript
// Рядок 37
DEBUG: false
```

### Змінити AI провайдера

```javascript
// Рядок 34
AI_PROVIDER: 'openai', // або 'gemini'
```

---

## 🔒 Безпека

⚠️ **НІКОЛИ не комітьте API ключі в Git!**

### Рекомендація: Backend Proxy

Створіть файл `api/ai-checkout.php`:

```php
<?php
header('Content-Type: application/json');
$input = json_decode(file_get_contents('php://input'), true);

$response = file_get_contents('https://api.openai.com/v1/chat/completions', false, stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . getenv('OPENAI_API_KEY')
        ],
        'content' => json_encode([
            'model' => 'gpt-4o-mini',
            'messages' => $input['messages']
        ])
    ]
]));

echo $response;
```

Змініть в JS:

```javascript
// Замість прямого виклику OpenAI
const response = await fetch('/api/ai-checkout.php', {
    method: 'POST',
    body: JSON.stringify({ messages: [...] })
});
```

---

## 📊 Порівняння з версією 2.0

| Функція | v2.0 | v3.0 |
|---------|------|------|
| Пошук полів | `getElementById` тільки | 4 стратегії (ID, name, label, placeholder) |
| Events | `input`, `change` | `input`, `change`, `blur` + `bubbles: true` |
| Debug | Мінімальний | Повний з console.table() |
| Помилки | "Field not found" | "Tried X strategies, found by Y" |
| Nova Poshta | Не спрацьовував | ✅ Працює |
| UI Position | Bottom-right | Bottom-left (не заважає) |

---

## 🎯 Troubleshooting

### Проблема: "Поля не заповнюються"

**Рішення:**
1. Відкрийте Console (F12)
2. Знайдіть `⚠️ Could not find field for: [...]`
3. Подивіться які ID/name мають ваші поля
4. Додайте їх у масив пошуку:

```javascript
// Рядок 785
setFieldValue(['fullName', 'YOUR_FIELD_ID_HERE'], fullName);
```

### Проблема: "Nova Poshta dropdown не відкривається"

**Перевірте:**
1. Чи є у вас `#np-city-input`?
2. Чи правильний selector для списку міст?

**Виправлення (рядок 899):**

```javascript
const suggestionsList = document.querySelector('#np-city-list, .city-suggestions, #YOUR_LIST_ID');
```

### Проблема: "Branch не вибирається"

**Debug:**
1. Відкрийте Console
2. Знайдіть: `⚠️ Branch X not found. Available: [...]`
3. Подивіться формат ваших options
4. Змініть regex (рядок 929):

```javascript
const branchOption = options.find(opt => {
    const text = opt.textContent.toLowerCase();
    return text.includes(`YOUR_FORMAT_${branchNumber}`); // Змініть тут
});
```

---

## 📞 Підтримка

Якщо щось не працює:

1. Відкрийте `test-ai-checkout.html` - це повністю робоча тестова версія
2. Порівняйте HTML структуру вашої форми з тестовою
3. Перевірте Console logs - вони покажуть що саме не знайдено
4. Додайте ваші специфічні ID у масиви пошуку

---

## ✅ Checklist перед деплоєм

- [ ] API ключ налаштовано
- [ ] Тестування на `test-ai-checkout.html` пройшло успішно
- [ ] Всі поля форми заповнюються
- [ ] Nova Poshta autocomplete працює
- [ ] Відділення вибирається правильно
- [ ] Debug mode вимкнено (`DEBUG: false`)
- [ ] API ключ НЕ закомічений в Git

---

**Версія:** 3.0.0  
**Дата:** 22.01.2026  
**Ліцензія:** MIT  
**Автор:** Senior Frontend Developer
