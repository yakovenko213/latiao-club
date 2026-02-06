# 🔍 Діагностика TurboSMS Config

## Швидка перевірка

Відкрийте **Консоль браузера** (F12) на сторінці Admin Panel і вставте цей код:

```javascript
// Перевірка документа settings/sms_config
const docSnap = await getDoc(doc(db, 'settings', 'sms_config'));
if (docSnap.exists()) {
  const data = docSnap.data();
  console.log('✅ Документ знайдено!');
  console.log('📋 Поля у документі:', Object.keys(data));
  console.log('📄 Повні дані:', data);
} else {
  console.log('❌ Документ settings/sms_config не існує!');
}
```

---

## Можливі результати

### ✅ Якщо документ знайдено:
```
✅ Документ знайдено!
📋 Поля у документі: ['apiToken', 'sender', 'someOtherField']
📄 Повні дані: {
  apiToken: "your-token-here",
  sender: "LATIAO",
  ...
}
```

**Дія:** Подивіться на назви полів і переконайтеся, що є поле з API токеном.

### ❌ Якщо документ не існує:
```
❌ Документ settings/sms_config не існує!
```

**Дія:** Створіть документ вручну або перевірте, чи називається він інакше.

---

## Створення документа вручну

### Варіант 1: Через Firebase Console
1. Відкрийте [Firebase Console](https://console.firebase.google.com/)
2. Виберіть проєкт
3. Firestore Database
4. Колекція: `settings`
5. Документ ID: `sms_config`
6. Додайте поля:
   - **apiToken** (string): ваш TurboSMS API токен
   - **sender** (string): назва відправника (наприклад, "LATIAO")

### Варіант 2: Через консоль браузера
```javascript
await setDoc(doc(db, 'settings', 'sms_config'), {
  apiToken: 'YOUR_TURBOSMS_API_TOKEN_HERE',
  sender: 'LATIAO',
  createdAt: serverTimestamp()
});
console.log('✅ Документ створено!');
```

---

## Оновлений код підтримує ці назви полів

### Для API Token (шукає в такому порядку):
1. `turboSmsToken`
2. `apiToken` ⭐
3. `token`
4. `api_token`
5. `apiKey`
6. `turbosms_token`

### Для Sender Name (шукає в такому порядку):
1. `senderName`
2. `sender` ⭐
3. `alphaName`
4. `alpha_name`
5. `senderID`
6. Fallback: `'LATIAO'`

---

## Тестування після налаштування

1. Перезавантажте сторінку Admin Panel
2. Перейдіть у розділ **Промокоди**
3. Спробуйте створити промокод з SMS
4. Перевірте консоль на наявність таких логів:

```
🔑 Fetching TurboSMS credentials from Firestore...
📄 Document fields available: ['apiToken', 'sender']
📋 Full document data: {...}
✅ TurboSMS credentials loaded
🔑 Using Token: abcde...
📤 Using Sender: LATIAO
```

---

## Якщо все ще не працює

Виконайте тест прямо в консолі:

```javascript
try {
  const result = await fetchTurboSmsCredentials();
  console.log('✅ Успішно!', result);
} catch (error) {
  console.error('❌ Помилка:', error.message);
}
```

Якщо бачите помилку, скопіюйте вивід з консолі і повідомте:
- Які поля показує `📄 Document fields available`
- Повний вміст `📋 Full document data`
