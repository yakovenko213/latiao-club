# 🔧 KeyCRM Troubleshooting - Виправлення проблем

## 🚨 Проблема: Замовлення не потрапляють в KeyCRM

### Симптом:
У консолі браузера (F12) немає логів про спробу відправки:
```
🔗 KEYCRM SYNC STARTED
```

Або бачите помилки про відсутність налаштувань.

---

## ✅ Рішення 1: Створити документ settings/admin

### Крок 1: Відкрийте Firebase Console
https://console.firebase.google.com/

### Крок 2: Виберіть проект
- `my-magazin-81c96` (або ваш проект)

### Крок 3: Firestore Database
1. Ліва панель → **Firestore Database**
2. Натисніть **Start collection** (якщо collection `settings` не існує)
3. Collection ID: `settings`
4. Document ID: `admin`

### Крок 4: Додайте поля
Додайте наступні поля в документ `settings/admin`:

| Field | Type | Value |
|-------|------|-------|
| `keyCrmApiKey` | string | [ваш API ключ з KeyCRM] |
| `keyCrmSourceId` | number | 1 |
| `updatedAt` | timestamp | [автоматично] |

**Приклад:**
```json
{
  "keyCrmApiKey": "sk_test_1234567890abcdef",
  "keyCrmSourceId": 1,
  "updatedAt": "2026-01-25T16:00:00Z"
}
```

### Крок 5: Збережіть документ
Натисніть **Save**

---

## ✅ Рішення 2: Використати Admin Panel (рекомендовано)

### Крок 1: Відкрийте Admin Panel
https://my-magazin-81c96.web.app/admin.html

### Крок 2: Увійдіть як адміністратор
- Використайте ваші облікові дані

### Крок 3: Відкрийте налаштування
- Натисніть **⚙️ Налаштування** (праворуч вгорі)

### Крок 4: Заповніть KeyCRM дані
Знайдіть секцію **KeyCRM**:
- 🔑 **KeyCRM API Key**: вставте ваш API ключ
- 🔢 **KeyCRM Source ID**: введіть `1` (або ваш Source ID)

### Крок 5: Збережіть
- Натисніть **💾 Зберегти налаштування**
- Дочекайтесь підтвердження: ✅ Налаштування збережено!

---

## 🧪 Тестування

### Крок 1: Зробіть тестове замовлення
1. Відкрийте сайт: https://my-magazin-81c96.web.app/
2. Додайте товар в корзину
3. Перейдіть в Checkout
4. Заповніть всі поля
5. Оформіть замовлення

### Крок 2: Відкрийте консоль (F12)
Натисніть **F12** → вкладка **Console**

### Крок 3: Шукайте логи KeyCRM

#### ✅ Успішна синхронізація:
```
🔗 ═══════════════════════════════════════════════
🔗 KEYCRM SYNC STARTED
🔗 ═══════════════════════════════════════════════
🔗 Order ID: 2VJ7BZ
🔗 Step 1: Fetching settings/admin from Firestore...
🔗 Settings document exists: true
🔗 Settings data loaded: { hasApiKey: true, sourceId: 1 }
✅ KeyCRM API credentials loaded { sourceId: 1 }
🔍 Searching for customer by phone: +380965661827
✅ Customer found in KeyCRM: 12345
🔄 Updating customer in KeyCRM... 12345
✅ Customer updated successfully
📦 KeyCRM order payload: {...}
✅ Order sent to KeyCRM successfully: {...}
✅ KeyCRM order ID saved to Firestore: 67890
✅ Order synced to KeyCRM successfully: 67890
```

#### ❌ Помилка - Документ не знайдено:
```
🔗 KEYCRM SYNC STARTED
🔗 Step 1: Fetching settings/admin from Firestore...
🔗 Settings document exists: false
❌ Admin settings document NOT FOUND in Firestore
❌ Path: settings/admin
💡 SOLUTION: Open Admin Panel → Settings → Save KeyCRM credentials
```

**Рішення:** Створіть документ `settings/admin` (Рішення 1 або 2)

#### ❌ Помилка - API Key відсутній:
```
🔗 Settings document exists: true
🔗 Settings data loaded: { hasApiKey: false, sourceId: 1 }
❌ KeyCRM API key is EMPTY or MISSING
💡 SOLUTION: Open Admin Panel → Settings → Add KeyCRM API Key → Save
```

**Рішення:** Додайте API Key через Admin Panel

#### ❌ Помилка - 401 Unauthorized:
```
❌ KEYCRM API error: 401 - Unauthorized
⚠️ KeyCRM sync failed (non-blocking): KeyCRM API error: 401
```

**Рішення:** API Key невірний або закінчився термін дії. Отримайте новий ключ з KeyCRM.

#### ❌ Помилка - 422 Validation Error:
```
❌ VALIDATION ERROR (422): {"field": "source_id", "message": "Invalid source"}
```

**Рішення:** Перевірте що Source ID існує в KeyCRM (зазвичай 1).

---

## 🔍 Перевірка в KeyCRM

### Крок 1: Увійдіть в KeyCRM
https://keycrm.app/

### Крок 2: Перейдіть в Orders
Ліва панель → **Orders** (Замовлення)

### Крок 3: Знайдіть замовлення
- Шукайте по номеру телефону клієнта
- Або по Order ID (2VJ7BZ)
- Або по імені клієнта

### Крок 4: Перевірте дані
- ✅ Ім'я клієнта
- ✅ Телефон
- ✅ Email
- ✅ Адреса доставки
- ✅ Товари
- ✅ Загальна сума
- ✅ Спосіб оплати

---

## 📊 Перевірка в Firestore

### Крок 1: Відкрийте Firestore
Firebase Console → Firestore Database

### Крок 2: Знайдіть замовлення
Collection: `orders` → Document: `2VJ7BZ` (ваш Order ID)

### Крок 3: Перевірте поля KeyCRM

#### ✅ Успішна синхронізація:
```json
{
  "keyCrmOrderId": 67890,
  "keyCrmCustomerId": 12345,
  "keyCrmSyncedAt": "2026-01-25T16:35:45Z",
  "keyCrmSyncSuccess": true
}
```

#### ❌ Помилка синхронізації:
```json
{
  "keyCrmSyncSuccess": false,
  "keyCrmSyncError": "KeyCRM API key not configured",
  "keyCrmSyncAttemptedAt": "2026-01-25T16:35:45Z"
}
```

### Крок 4: Перевірте логи помилок
Collection: `errors` → Filter: `type == "keycrm_integration"`

---

## 📝 Checklist

- [ ] Документ `settings/admin` існує в Firestore
- [ ] Поле `keyCrmApiKey` заповнено
- [ ] Поле `keyCrmSourceId` заповнено (зазвичай 1)
- [ ] API Key отримано з KeyCRM → Settings → API
- [ ] API Key має права: `orders.create`, `orders.read`, `buyer.read`, `buyer.write`
- [ ] Source ID існує в KeyCRM → Settings → Order Sources
- [ ] Зроблено тестове замовлення
- [ ] Перевірено логи в консолі (F12)
- [ ] Замовлення з'явилось в KeyCRM → Orders
- [ ] Дані клієнта та товари правильні

---

## 🆘 Якщо проблема залишається

### 1. Очистіть кеш браузера
- Ctrl + Shift + Delete
- Виберіть "Очистити кеш"
- Оновіть сторінку (F5)

### 2. Перезавантажте сайт
```bash
firebase deploy --only hosting
```

### 3. Перевірте Firebase Rules
Firestore Rules → переконайтесь що:
```javascript
allow read, write: if request.auth != null;
```

### 4. Перевірте мережу
- F12 → Network
- Шукайте запити до `openapi.keycrm.app`
- Перевірте статус код (200 = успіх, 401 = неавторизовано)

---

## 📚 Додаткові ресурси

- **KeyCRM API Docs**: https://docs.keycrm.app/
- **Quick Reference**: `KEYCRM_QUICKREF.md`
- **Full Setup Guide**: `KEYCRM_INTEGRATION_SETUP.md`
- **Firebase Console**: https://console.firebase.google.com/

---

## ✅ Результат

Після виконання всіх кроків ви побачите в консолі:
```
✅ Order synced to KeyCRM successfully: 67890
```

І замовлення з'явиться в KeyCRM → Orders з усіма даними! 🎉
