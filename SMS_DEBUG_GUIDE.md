# 🔍 Діагностика TurboSMS - Крок за кроком

## Що було зроблено:

✅ **Task 1**: Функція `fetchTurboSmsCredentials()` оновлена з діагностикою  
✅ **Task 2**: Функція `sendPromoSms()` правильно використовує `apiToken`  
✅ **Task 3**: Повідомлення про помилку тепер показують доступні поля  

---

## 🧪 Як тестувати:

### Крок 1: Відкрийте консоль браузера
- Натисніть **F12** або **Ctrl+Shift+I**
- Перейдіть на вкладку **Console**

### Крок 2: Перевірте документ вручну
Вставте цей код у консоль:

```javascript
const docRef = doc(db, "settings", "sms_config");
const docSnap = await getDoc(docRef);
if (docSnap.exists()) {
  console.log("✅ Документ існує");
  console.log("📂 Поля:", Object.keys(docSnap.data()));
  console.log("📄 Дані:", docSnap.data());
} else {
  console.log("❌ Документ не існує");
}
```

### Крок 3: Подивіться на вивід
Ви побачите щось на зразок:
```
✅ Документ існує
📂 Поля: ['apiKey', 'senderName', 'enabled', 'createdAt', 'updatedAt', 'provider']
📄 Дані: {
  apiKey: "your-token-here",
  senderName: "LATIAO",
  ...
}
```

### Крок 4: Визначте назву поля токена
З виводу вище знайдіть поле, яке містить ваш TurboSMS токен. Можливі варіанти:
- `apiKey` ← Найчастіше
- `turboSmsToken`
- `token`
- `apiToken`

### Крок 5: Тест функції
Викличте функцію напряму:
```javascript
try {
  const creds = await fetchTurboSmsCredentials();
  console.log("✅ Успішно!", creds);
} catch (error) {
  console.error("❌ Помилка:", error.message);
}
```

---

## 📋 Що показує оновлений код:

### При успіху:
```
📂 REAL FIELDS IN FIRESTORE: ['apiKey', 'senderName', ...]
📄 FULL DOCUMENT DATA: {...}
✅ TurboSMS credentials loaded successfully
🔑 Using Token: abcde...
📤 Using Sender: LATIAO
```

### При помилці:
```
📂 REAL FIELDS IN FIRESTORE: ['wrongField', 'anotherField']
❌ API Token not found. Available fields in DB are: wrongField, anotherField
```

**Повідомлення користувачу:**
```
Помилка створення промокоду
Налаштування SMS некоректні. API Token not found. Available fields in DB are: wrongField, anotherField
```

---

## 🛠️ Варіанти назв полів, які шукає код:

### Для API Token (у порядку пріоритету):
1. `turboSmsToken`
2. `turbosmsToken`
3. `TurboSmsToken`
4. `token`
5. `apiToken`
6. `apiKey` ⭐ (найчастіше)
7. `api_token`

### Для Sender Name:
1. `senderName`
2. `sendername`
3. `SenderName`
4. `alphaName`
5. `sender`
6. Fallback: `'TurboSMS'`

---

## ✅ Швидке виправлення

Якщо ваше поле називається інакше (наприклад, `turbosms_api_key`), виконайте:

```javascript
await updateDoc(doc(db, 'settings', 'sms_config'), {
  apiToken: 'ваш-токен',  // або apiKey
  senderName: 'LATIAO'
});
console.log("✅ Поля оновлено!");
```

Або додайте нове поле через Firebase Console:
1. Firestore → collections → settings → sms_config
2. Додайте поле: `apiToken` (string) = ваш токен
3. Додайте поле: `senderName` (string) = назва відправника

---

## 🎯 Перевірка після виправлення

1. Перезавантажте Admin Panel
2. Перейдіть у **Промокоди**
3. Створіть промокод з SMS
4. Перевірте консоль:

```
✅ TurboSMS credentials loaded successfully
🔑 Using Token: YOUR_...
📤 Using Sender: LATIAO
📦 TurboSMS Payload: {...}
📥 TurboSMS Response: {...}
✅ SMS sent successfully via TurboSMS
```

---

## 🆘 Якщо все ще проблеми

Скопіюйте і надішліть мені:
1. Вивід з консолі: `📂 REAL FIELDS IN FIRESTORE`
2. Повний вміст документа (без токена)

Приклад:
```
Поля в документі: apiKey, senderName, enabled
Структура: { apiKey: "...", senderName: "LATIAO", enabled: true }
```

Я точно скажу, що потрібно змінити!
