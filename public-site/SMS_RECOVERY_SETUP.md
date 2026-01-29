# 📱 SMS Recovery Feature - Відновлення покинутих кошиків

## 🎯 Що це?

SMS Recovery Feature дозволяє адміністратору відправляти SMS-повідомлення клієнтам, які покинули свої кошики. SMS містить унікальне посилання, яке автоматично відновлює кошик і попередньо заповнює контактні дані на сторінці оформлення замовлення.

## ✨ Основні можливості

1. **Magic Link** - Автоматичне відновлення кошика при переході по посиланню
2. **Попереднє заповнення даних** - Ім'я, телефон, Telegram автоматично заповнюються
3. **Гнучкі налаштування** - Власний шаблон SMS з підтримкою змінних
4. **Простий UI** - Кнопка відправки одразу в таблиці покинутих кошиків
5. **Візуальний фідбек** - Тости-повідомлення про успіх/помилку

## 🔧 Налаштування

### 1. Налаштування TurboSMS API

1. Зареєструйтеся на [TurboSMS](https://turbosms.ua)
2. Отримайте API Token в особистому кабінеті
3. Відкрийте Admin Panel → ⚙️ Settings
4. Заповніть поле **"TurboSMS API Token"**
5. (Опціонально) Вкажіть **"Ім'я відправника"** (Alpha Name)

### 2. Налаштування SMS розсилки

1. Відкрийте Admin Panel → ⚙️ Settings
2. Прокрутіть до секції **"SMS налаштування (Покинуті кошики)"**
3. Увімкніть перемикач **"Увімкнути розсилку SMS"**
4. Налаштуйте **"Шаблон повідомлення"**:

**Доступні змінні:**
- `{name}` - Ім'я клієнта (з форми замовлення)
- `{link}` - Посилання для відновлення кошика

**Приклад шаблону:**
```
Вітаємо, {name}! Ви забули товари в кошику. Оформити: {link}
```

5. Натисніть **"Зберегти налаштування"**

### 3. Оновіть домен у коді

⚠️ **ВАЖЛИВО:** Замініть тестовий домен на свій реальний!

**Файл:** `admin.html` (функція `sendRecoverySMS`)

Знайдіть рядок:
```javascript
const recoveryLink = `https://latiao-snack.web.app/checkout.html?recovery_id=${phone}`;
```

Замініть `https://latiao-snack.web.app` на ваш домен:
```javascript
const recoveryLink = `https://your-domain.com/checkout.html?recovery_id=${phone}`;
```

## 📖 Як користуватися

### Для адміністратора:

1. Відкрийте **Admin Panel** → **"Покинуті кошики"**
2. Знайдіть клієнта в таблиці
3. Натисніть кнопку **"📩 SMS"** біля відповідного кошика
4. Чекайте підтвердження (кнопка стане зеленою)

### Для клієнта:

1. Клієнт отримує SMS з посиланням
2. Натискає на посилання
3. Автоматично переходить на checkout.html
4. Кошик автоматично відновлюється ✅
5. Контактні дані попередньо заповнені ✅
6. З'являється повідомлення: **"Ваш кошик відновлено! 🎉"**
7. Клієнт завершує оформлення замовлення

## 🔗 Як працює Magic Link?

### Технічна реалізація:

**1. Структура посилання:**
```
https://your-domain.com/checkout.html?recovery_id=PHONE_NUMBER
```

**2. Логіка відновлення (checkout.html):**
- Перевіряє URL параметр `recovery_id`
- Завантажує документ з Firestore: `abandoned_carts/{phone}`
- Відновлює `cart` в `localStorage`
- Попередньо заповнює форму: `fullName`, `phone`, `telegram`
- Показує toast-повідомлення
- Оновлює UI: `renderCart()`, `calculateTotals()`

## 🗄️ Структура даних Firestore

### Collection: `settings/sms_config`

```javascript
{
  enabled: true,                          // Чи увімкнена розсилка
  template: "Вітаємо, {name}!...",       // Шаблон повідомлення
  updatedAt: "2026-01-16T12:00:00Z"      // Дата оновлення
}
```

### Collection: `abandoned_carts/{phone}`

```javascript
{
  customer: {
    fullName: "Іван Петренко",
    phone: "+380501234567",
    telegram: "@ivan"
  },
  items: [
    {
      id: "prod_123",
      name: "Чіпси Lay's",
      price: 45,
      quantity: 2,
      image: "https://..."
    }
  ],
  delivery: {
    method: "Нова Пошта",
    city: "Київ",
    branch: "Відділення №1"
  },
  comment: "Швидше, будь ласка",
  total: 1250,
  updatedAt: Timestamp
}
```

## 🔐 Безпека

✅ **API Token** зберігається в Firestore (доступний тільки адміну)  
✅ **Телефон** використовується як Document ID (унікальний ідентифікатор)  
✅ **CORS** налаштований для TurboSMS API  
✅ **Валідація** перевіряє наявність налаштувань перед відправкою

## 📊 Моніторинг

### Перевірка успішної відправки:

1. **В браузері (Console):**
   - `📩 Sending recovery SMS to: +380...`
   - `📝 Message text: Вітаємо, Іван!...`
   - `📥 TurboSMS response: { response_code: 0 }`

2. **В UI:**
   - Кнопка стає зеленою з текстом "Відправлено"
   - З'являється toast: "SMS успішно відправлено! 📨"

3. **В TurboSMS кабінеті:**
   - Перевірте історію відправлених SMS
   - Перевірте баланс рахунку

## ⚠️ Можливі помилки

| Помилка | Причина | Рішення |
|---------|---------|---------|
| "SMS розсилка вимкнена" | Не увімкнено в налаштуваннях | Увімкніть перемикач в Settings |
| "TurboSMS API Token не налаштовано" | Відсутній токен | Додайте токен в Settings |
| "Кошик не знайдено" | Документ видалено з Firestore | Кошик вже був оформлений або видалений |
| "401 Unauthorized" | Неправильний API Token | Перевірте токен в TurboSMS кабінеті |
| "402 Payment Required" | Недостатньо коштів | Поповніть баланс TurboSMS |
| "Invalid phone number" | Неправильний формат номеру | Перевірте формат: +380XXXXXXXXX |

## 🧪 Тестування

### Перевірка Magic Link:

1. Створіть тестовий документ в Firestore:
   ```
   Collection: abandoned_carts
   Document ID: +380501234567
   Data: {
     customer: { fullName: "Test", phone: "+380501234567" },
     items: [...],
     total: 500
   }
   ```

2. Відкрийте в браузері:
   ```
   https://your-domain.com/checkout.html?recovery_id=+380501234567
   ```

3. Перевірте:
   - ✅ Кошик відновлено
   - ✅ Ім'я та телефон попередньо заповнені
   - ✅ З'явилося повідомлення "Ваш кошик відновлено!"

## 📝 Технічні деталі

### Файли, що були змінені:

1. **checkout.html**
   - Додано логіку перевірки `recovery_id` в URL
   - Додано функцію `showRecoveryToast()`
   - Оновлено імпорти: `getDoc`, `doc`

2. **admin.html**
   - Додано UI блок "SMS налаштування"
   - Додано кнопку "📩 SMS" в таблиці
   - Додано функцію `sendRecoverySMS(phone)`
   - Оновлено `openSettingsModal()` та `settings-form` submit

### API Endpoints:

**TurboSMS API:**
```
POST https://api.turbosms.ua/message/send.json
Headers: {
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_TOKEN"
}
Body: {
  "recipients": ["+380501234567"],
  "sms": {
    "sender": "Latiao",
    "text": "Вітаємо, Іван! Ви забули товари в кошику. Оформити: https://..."
  }
}
```

## 🎨 Кастомізація

### Зміна тексту toast-повідомлення:

**Файл:** `checkout.html` → функція `showRecoveryToast()`

```javascript
toast.innerHTML = `
  <i data-lucide="check-circle" class="w-6 h-6"></i>
  <div>
    <div class="font-bold text-lg">Ваш кошик відновлено! 🎉</div>
    <div class="text-sm opacity-90">Можете продовжити оформлення замовлення</div>
  </div>
`;
```

### Зміна стилю кнопки SMS:

**Файл:** `admin.html` → функція `loadAbandonedCarts()`

```html
<button onclick="sendRecoverySMS('${phone}')" 
        class="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg...">
  <i data-lucide="mail" class="w-4 h-4"></i>
  <span class="text-xs font-semibold">📩 SMS</span>
</button>
```

## 📞 Підтримка

Якщо виникли питання:
1. Перевірте консоль браузера (F12) на наявність помилок
2. Перевірте Firestore Rules (дозвіл на читання `abandoned_carts`)
3. Перевірте баланс TurboSMS
4. Перевірте формат номерів телефонів

---

**Створено:** 16 січня 2026  
**Версія:** 1.0  
**Автор:** GitHub Copilot
