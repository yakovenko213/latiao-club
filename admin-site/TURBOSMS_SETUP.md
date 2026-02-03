# TurboSMS API Integration - Setup Guide 🚀

## ✅ Implementation Complete

Кнопка "Запит відгуку" в адмін-панелі тепер відправляє SMS через TurboSMS API замість WhatsApp.

---

## 🔑 Required Firestore Configuration

### 1. **API Credentials** (settings/general)
```javascript
{
  turbo_sms_api_key: "YOUR_TURBOSMS_API_KEY",
  alpha_name: "YOUR_SENDER_NAME"  // e.g., "LatiaoCafe"
}
```

### 2. **Message Templates** (settings/review_automation)
```javascript
{
  templates: [
    {
      id: "1706889600000",
      text: "Вітаємо, {customer_name}! Дякуємо за замовлення. Будь ласка, залишіть відгук: {review_link}",
      createdAt: "2024-02-02T12:00:00.000Z"
    },
    {
      id: "1706889700000",
      text: "Привіт, {customer_name}! Сподіваємось, Вам сподобалось. Поділіться враженнями: {review_link}",
      createdAt: "2024-02-02T12:01:40.000Z"
    }
  ]
}
```

---

## 📋 How to Set Up

### Step 1: Add API Credentials
1. Відкрийте Firebase Console → Firestore Database
2. Знайдіть або створіть документ: `settings/general`
3. Додайте поля:
   - `turbo_sms_api_key`: Ваш API ключ з TurboSMS
   - `alpha_name`: Ім'я відправника (буде показано клієнту)

### Step 2: Add Message Templates
1. У Firestore знайдіть документ: `settings/review_automation`
2. Додайте масив `templates` з текстами повідомлень
3. Використовуйте плейсхолдери:
   - `{customer_name}` - замінюється на ім'я клієнта
   - `{review_link}` - замінюється на посилання для відгуку

---

## 🔄 How It Works

### Button Click Flow:
```
1. User clicks "Запит відгуку" button
2. Function validates phone number (auto-converts to +380 format)
3. Fetches API credentials from settings/general
4. Fetches random template from settings/review_automation
5. Replaces placeholders with customer data
6. Sends POST request to TurboSMS API
7. On success:
   - Shows toast "Запит надіслано!"
   - Updates order: review_request_sent = true
8. On error:
   - Shows alert with error message
```

---

## 📞 Phone Number Formatting

Система автоматично конвертує номери в міжнародний формат:
- `0501234567` → `380501234567`
- `80501234567` → `380501234567`
- `380501234567` → залишається без змін

---

## 🔗 API Endpoint

**URL**: `https://api.turbosms.ua/message/send.json`

**Request Example**:
```json
{
  "recipients": ["380501234567"],
  "sms": {
    "sender": "LatiaoCafe",
    "text": "Вітаємо, Олександр! Дякуємо за замовлення. Будь ласка, залишіть відгук: https://latiao-snack.com.ua/review?orderId=abc123def456"
  }
}
```

**Headers**:
```
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

**Success Response**:
```json
{
  "response_code": 0,
  "response_status": "OK",
  "message_id": "..."
}
```

---

## 🎯 Key Features

✅ **Random Template Selection** - Picks different messages each time  
✅ **Phone Auto-Formatting** - Converts to +380 format  
✅ **Loading State** - Button shows spinner during API call  
✅ **Error Handling** - Shows user-friendly error messages  
✅ **Firestore Update** - Marks order as `review_request_sent: true`  
✅ **Prevention of Double-Click** - Button disabled during request  
✅ **Fallback Template** - Uses default message if no templates found  

---

## 🧪 Testing Checklist

- [ ] API credentials are in `settings/general`
- [ ] Templates exist in `settings/review_automation`
- [ ] Phone numbers convert to +380 format
- [ ] SMS is received on test phone
- [ ] Order status updates to "Надіслано"
- [ ] Button shows loading spinner
- [ ] Error alert appears on API failure

---

## 🔒 Security Notes

- API ключ зберігається в Firestore (приватний документ)
- Firestore Rules мають обмежувати доступ до `settings/general` тільки для адмінів
- Ключ не виставляється на клієнтську сторону публічного сайту

---

## 📚 Related Files

| File | Purpose |
|------|---------|
| [admin-site/index.html](index.html) | Main admin panel with updated sendReviewRequest() |
| [settings/general](https://console.firebase.google.com) | Firestore doc with API credentials |
| [settings/review_automation](https://console.firebase.google.com) | Firestore doc with SMS templates |

---

## 🆘 Troubleshooting

### Error: "Налаштування API не знайдені"
→ Перевірте, чи існує документ `settings/general` у Firestore

### Error: "API ключ TurboSMS або Alpha Name не налаштовані"
→ Додайте поля `turbo_sms_api_key` та `alpha_name` в `settings/general`

### SMS не надсилаються
→ Перевірте баланс TurboSMS та валідність API ключа

### Error: "Помилка надсилання SMS"
→ Перевірте логи консолі браузера для деталей від TurboSMS API

---

## ✨ Next Steps (Optional)

- [ ] Add SMS sending statistics dashboard
- [ ] Implement scheduled auto-sending (via Cloud Functions)
- [ ] Add SMS delivery status tracking
- [ ] Create A/B testing for different templates

---

**Status**: ✅ Ready for Production  
**Last Updated**: February 3, 2026
