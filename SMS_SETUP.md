# 🚀 Швидкий старт: SMS Authentication

## 📋 Що було реалізовано

### 1. Firebase Cloud Functions (`/functions/index.js`)
- ✅ `sendOtpCode` - відправка 4-значного коду через TurboSMS
- ✅ `verifyOtpCode` - перевірка коду та створення сесії користувача

### 2. Оновлено `login.html`
- ✅ Інтеграція з Cloud Functions через `httpsCallable`
- ✅ Loading states (спінери, деактивація кнопок)
- ✅ Toast-повідомлення про помилки/успіх
- ✅ Обробка помилок з інформативними повідомленнями

### 3. Оновлено `firebase-config.js`
- ✅ Додано експорт `functions`

## 🎯 Наступні кроки

### Крок 1: Налаштуйте TurboSMS
1. Відкрийте `admin.html`
2. Натисніть кнопку Settings (⚙️)
3. Вставте ваш TurboSMS API Token
4. (Опціонально) Вкажіть ім'я відправника (Alpha Name), наприклад "Latiao" або залиште порожнім для "Msg"
5. Збережіть

### Крок 2: Деплой Cloud Functions
```bash
firebase deploy --only functions
```

### Крок 3: Тестування
1. Відкрийте `login.html`
2. Введіть номер телефону
3. Натисніть "Отримати код"
4. Введіть код з SMS
5. Натисніть "Увійти"

## 🔧 Локальне тестування (опціонально)

```bash
# Запустити емулятор функцій
cd functions
npm run serve
```

Потім в `firebase-config.js` додайте:
```javascript
import { connectFunctionsEmulator } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js';
connectFunctionsEmulator(functions, "localhost", 5001);
```

## 📝 Примітки

- Коди дійсні протягом **5 хвилин**
- Максимум **3 спроби** введення коду
- Номери телефонів зберігаються у форматі **+380XXXXXXXXX**
- За замовчуванням відправник SMS: **"Msg"** (можна змінити в Settings на своє ім'я після реєстрації в TurboSMS)
- SMS відправляється ТІЛЬКИ якщо TurboSMS повертає успішний response_code (0)
- Якщо TurboSMS повертає помилку, користувач побачить конкретне повідомлення про помилку

## 🆘 Troubleshooting

### Помилка: "Налаштування SMS не знайдено"
→ Додайте TurboSMS токен в адмін-панелі

### Помилка: "Помилка відправки SMS"
→ Перевірте правильність API токена та баланс TurboSMS

### Помилка: "Невірне ім'я відправника"
→ Alpha Name не зареєстровано або не підтверджено в TurboSMS. Залиште поле порожнім для використання "Msg"

### Помилка: "Помилка авторизації"
→ Невірний API токен. Перевірте токен в особистому кабінеті TurboSMS

### Коди не приходять
→ Перевірте:
1. API токен в Firestore (`settings/config`)
2. Баланс на TurboSMS
3. Формат номера телефону

## 📚 Документація

Детальна документація: `/functions/README.md`
