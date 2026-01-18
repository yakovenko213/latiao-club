# Firebase Cloud Functions - Latiao Club

## Встановлення

1. Встановіть залежності:
```bash
cd functions
npm install
```

2. Налаштуйте TurboSMS API токен в адмін-панелі (admin.html → Settings).

## Деплой функцій

```bash
firebase deploy --only functions
```

## Доступні функції

### 1. sendOtpCode
Відправляє 4-значний OTP код на номер телефону через TurboSMS.

**Параметри:**
- `phoneNumber` (string) - Номер телефону (9 цифр або з +380)

**Відповідь:**
```json
{
  "success": true,
  "message": "Код надіслано"
}
```

### 2. verifyOtpCode
Перевіряє OTP код та створює сесію користувача.

**Параметри:**
- `phoneNumber` (string) - Номер телефону
- `code` (string) - 4-значний код

**Відповідь:**
```json
{
  "success": true,
  "token": "custom-firebase-token",
  "phoneNumber": "+380XXXXXXXXX"
}
```

## Тестування локально

```bash
cd functions
npm run serve
```

Це запустить емулятор Firebase Functions на `http://localhost:5001`.

## Структура даних Firestore

### Collection: `settings`
Document ID: `config`
```javascript
{
  turboSmsToken: "your-turbosms-token",
  senderName: "Latiao", // або "Msg" за замовчуванням
  updatedAt: timestamp
}
```

### Collection: `otp_codes`
Document ID: phone number (e.g., "+380XXXXXXXXX")
```javascript
{
  code: "1234",
  createdAt: timestamp,
  attempts: 0,
  expiresAt: timestamp // 5 minutes from creation
}
```

### Collection: `users`
Document ID: phone number
```javascript
{
  phoneNumber: "+380XXXXXXXXX",
  createdAt: timestamp,
  lastLogin: timestamp
}
```

## Налаштування TurboSMS

1. Зареєструйтеся на https://turbosms.ua
2. Отримайте API токен в особистому кабінеті
3. Додайте токен в адмін-панелі: Settings → TurboSMS API Token
4. (Опціонально) Налаштуйте ім'я відправника: Settings → Ім'я відправника

### Відправник SMS
За замовчуванням використовується "Msg". Щоб використовувати власне ім'я (наприклад, "Latiao"):
1. Зареєструйте Alpha Name в TurboSMS (розділ "Імена відправників")
2. Дочекайтеся підтвердження (може зайняти 1-3 дні)
3. Додайте ім'я в адмін-панелі: Settings → Ім'я відправника (Alpha Name)

### Коди помилок TurboSMS
- `response_code: 0` - Успішно відправлено
- `response_code: 1` - Помилка авторизації (невірний токен)
- `response_code: 2` - Недостатньо коштів
- `response_code: 3` - Невірний номер телефону
- `response_code: 4` - Невірне ім'я відправника (не зареєстровано або не підтверджено)
- `response_code: 5` - Текст повідомлення порожній
