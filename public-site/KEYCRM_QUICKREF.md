# 🔗 KeyCRM Integration - Quick Reference

## ✅ Стан інтеграції: ПОВНІСТЮ РЕАЛІЗОВАНО

### 🎉 Що вже працює:
- ✅ Автоматична передача замовлень в KeyCRM
- ✅ Створення/оновлення клієнтів
- ✅ Синхронізація даних доставки (Нова Пошта, Укрпошта)
- ✅ Передача товарів, цін, знижок
- ✅ Обробка помилок та логування
- ✅ UI в адмін-панелі для налаштувань

---

## ⚡ Quick Setup (3 Steps)

### 1️⃣ Get API Key from KeyCRM
**KeyCRM** → **Settings** → **Integrations** → **API** → Copy Key

Права: `orders.create`, `orders.read`, `buyer.read`, `buyer.write`

### 2️⃣ Find Source ID
**KeyCRM** → **Settings** → **Order Sources** → Знайдіть "Website" → Запишіть ID (зазвичай **1**)

### 3️⃣ Add to Admin Panel
**Admin Panel** (`admin.html`) → **⚙️ Налаштування** → Заповніть:
- 🔑 **KeyCRM API Key**: [ваш ключ]
- 🔢 **KeyCRM Source ID**: [1]

Натисніть **💾 Зберегти налаштування**

---

## 🧪 Testing

### 1. Make Test Order
- Додайте товар → Checkout → Оформіть замовлення

### 2. Check Browser Console (F12)
```
✅ Order synced to KeyCRM successfully: 12345  // ✅ Success
⚠️ KeyCRM sync failed: error message          // ❌ Failed
```

### 3. Check KeyCRM
**KeyCRM** → **Orders** → Знайдіть ваше замовлення

---

## 🔍 Quick Debug

### Check Sync Status in Firestore:
```javascript
// In Firestore: orders/{orderId}
keyCrmOrderId: 12345          // ✅ Success
keyCrmCustomerId: 67890       // ✅ Customer synced
keyCrmSyncSuccess: true       // ✅ All good
keyCrmSyncedAt: [timestamp]   // ✅ When synced

// OR (if failed)
keyCrmSyncSuccess: false      // ❌ Failed
keyCrmSyncError: "error msg"  // ❌ Error details
```

### Error Logs Location:
```
Firestore → errors collection → type: "keycrm_integration"
```

---

## 📊 Data Mapping

| Field | KeyCRM API | Website Data |
|-------|--------|---------|
| **Buyer** | full_name | customer.fullName |
| | phone | customer.phone |
| | comment | "Telegram: ..." |
| **Shipping** | shipping_method_id | 1=NP, 2=UP |
| | shipping_address | delivery.address |
| | warehouse_ref | delivery.warehouse |
| **Products** | sku | item.sku |
| | name | item.name |
| | price | item.price |
| | quantity | item.quantity |
| **Payment** | payment_method_id | 1=COD, 2=Online |
| | status | "not_paid" / "paid" |
| | amount | summary.total |

---

## 🐛 Common Issues

| Problem | Fix |
|---------|-----|
| Order not syncing | Check API key in `settings/admin` |
| API 401 error | Verify key in KeyCRM settings |
| Missing products | Ensure SKUs match KeyCRM catalog |
| No inventory update | Check KeyCRM workflow settings |

---

## 📝 Code Location

**File:** `/checkout.html`

**Function:** `sendToKeyCRM(orderData, orderId)`

**Called after:** Order saved to Firestore (line ~3046)

**Non-blocking:** Runs async, doesn't affect user flow

---

## 🎯 Features

✅ Auto-sync orders to KeyCRM  
✅ Payment status mapping  
✅ Product SKU mapping  
✅ Error logging to Firestore  
✅ Non-blocking (user sees no delays)  
✅ Promo code in manager comment  
✅ Nova Poshta / Ukrposhta support  

---

## 📚 Full Docs

See [KEYCRM_INTEGRATION_SETUP.md](KEYCRM_INTEGRATION_SETUP.md) for complete guide.

---

**Status:** ✅ Live  
**Version:** 1.0.0  
**Updated:** 2026-01-25
