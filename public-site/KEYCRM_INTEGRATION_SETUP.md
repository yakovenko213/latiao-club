# 🔗 KeyCRM Integration - Complete Setup Guide

## 📋 Overview

Автоматична передача замовлень з вашого сайту в KeyCRM для:
- ✅ Автоматичного списання товарів зі складу
- ✅ Уникнення ручного введення замовлень вночі
- ✅ Миттєвої синхронізації інвентаря
- ✅ Правильного статусу оплати (paid/not_paid)

---

## 🚀 Quick Start

### **Step 1: Get KeyCRM API Key**

1. Відкрийте KeyCRM → Settings → Integrations → API
2. Створіть новий API Key або скопіюйте існуючий
3. Переконайтесь що є права: `orders.create`, `orders.read`

### **Step 2: Add Credentials to Firestore**

1. Відкрийте Firebase Console → Firestore Database
2. Знайдіть колекцію `settings` → документ `admin`
3. Додайте/оновіть поля:
   ```javascript
   {
     keyCrmApiKey: "YOUR_API_KEY_HERE",
     keyCrmSourceId: 1  // ID джерела замовлень в KeyCRM (зазвичай 1 = Website)
   }
   ```

### **Step 3: Test Order**

1. Зробіть тестове замовлення на сайті
2. Перевірте Console (F12) на наявність:
   ```
   ✅ Order synced to KeyCRM successfully: 12345
   ```
3. Відкрийте KeyCRM → Orders → перевірте що замовлення з'явилось

---

## 🔧 How It Works

### **Order Flow:**

```
User submits order
    ↓
Save to Firestore (orders/{orderId})
    ↓
🔗 KEYCRM INTEGRATION
    ↓
Fetch API credentials from settings/admin
    ↓
Map order data to KeyCRM format
    ↓
POST to https://openapi.keycrm.app/v1/order
    ↓
✅ Success: Save KeyCRM order ID to Firestore
❌ Error: Log to errors/keycrm_{timestamp}
    ↓
Continue with payment flow (user sees no difference)
```

---

## 📊 Data Mapping

### **Buyer Information:**
```javascript
{
  full_name: "Іван Петренко",
  phone: "+380501234567",
  email: "",  // Optional
  comment: "Telegram: @ivan"
}
```

### **Shipping Information:**
```javascript
{
  shipping_method_id: 1,  // 1=Nova Poshta, 2=Ukrposhta
  shipping_address: "Київ, Відділення №1",
  shipping_city: "Київ",
  shipping_region: "",  // For Ukrposhta
  shipping_postcode: "",  // For Ukrposhta
  warehouse_ref: "Відділення №1",
  shipping_receive_point: "Відділення №1"
}
```

### **Products:**
```javascript
[
  {
    sku: "LAT-001",
    name: "Пекельний Latiao",
    price: 45,
    quantity: 2,
    discount: 0
  }
]
```

### **Payment:**
```javascript
{
  payment_method_id: 1,  // 1=COD, 2=Online
  status: "not_paid",  // or "paid" after Monobank callback
  amount: 90
}
```

### **Full Payload Example:**
```javascript
{
  source_id: 1,
  source_uuid: "7X2M9P",  // Your internal order ID
  buyer: { ... },
  shipping: { ... },
  products: [ ... ],
  payments: [ ... ],
  discount: 10,
  total_price: 80,
  comment: "Залиште на рецепції",
  manager_comment: "Promo: SAVE10 (-10 грн)"
}
```

---

## 💡 Payment Status Logic

### **Online Payment (Monobank/LiqPay):**
```javascript
// Initial status when order created
payment_method_id: 2
status: "not_paid"

// After Monobank webhook confirms payment
// (You need to update this via webhook handler)
status: "paid"
```

### **Cash on Delivery (COD):**
```javascript
payment_method_id: 1
status: "not_paid"  // Always not_paid for COD
```

**Important:** KeyCRM's inventory deduction triggers when order status changes, not when payment is confirmed. Make sure your KeyCRM workflow is configured correctly.

---

## 🛡️ Error Handling

### **If KeyCRM API Fails:**

1. **Order is STILL saved to Firestore** ✅
2. **User flow continues normally** ✅
3. **Error logged to Firestore:** `errors/keycrm_{timestamp}`
4. **Order marked with:**
   ```javascript
   {
     keyCrmSyncSuccess: false,
     keyCrmSyncError: "API error message",
     keyCrmSyncAttemptedAt: timestamp
   }
   ```

### **Manual Retry:**

If sync fails, you can manually retry from Admin Panel:
1. Find order in `orders` collection
2. Copy order data
3. Use KeyCRM API directly or re-trigger sync function

---

## 🧪 Testing Checklist

### **Before Going Live:**

- [ ] API Key configured in `settings/admin`
- [ ] Source ID set correctly (usually 1)
- [ ] Test order with Nova Poshta delivery
- [ ] Test order with Ukrposhta delivery
- [ ] Test order with Online payment
- [ ] Test order with COD payment
- [ ] Test order with promo code
- [ ] Verify order appears in KeyCRM
- [ ] Verify inventory decreases in KeyCRM
- [ ] Check Firestore for `keyCrmOrderId` field
- [ ] Test error handling (invalid API key)

### **Console Logs to Watch:**

```bash
# Success flow:
🔗 Sending order to KeyCRM... 7X2M9P
✅ KeyCRM API credentials loaded
📦 KeyCRM payload: {...}
✅ Order sent to KeyCRM successfully: {...}
✅ KeyCRM order ID saved to Firestore: 12345
✅ Order synced to KeyCRM successfully: 12345

# Error flow:
🔗 Sending order to KeyCRM... 7X2M9P
❌ KeyCRM integration error: API key invalid
📝 KeyCRM error logged to Firestore
⚠️ KeyCRM sync failed (non-blocking): API key invalid
```

---

## 📚 KeyCRM API Reference

### **Endpoint:**
```
POST https://openapi.keycrm.app/v1/order
```

### **Headers:**
```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_API_KEY"
}
```

### **Response (Success):**
```javascript
{
  "id": 12345,
  "source_uuid": "7X2M9P",
  "created_at": "2026-01-25T10:30:00Z",
  "status": "new"
}
```

### **Response (Error):**
```javascript
{
  "error": "Invalid API key",
  "code": 401
}
```

---

## 🔍 Debugging

### **Check Order in Firestore:**

```javascript
// Find order
db.collection('orders').doc('7X2M9P').get()

// Check KeyCRM sync status
{
  keyCrmOrderId: 12345,  // ✅ Synced successfully
  keyCrmSyncedAt: timestamp,
  keyCrmSyncSuccess: true
}

// OR

{
  keyCrmSyncSuccess: false,  // ❌ Failed
  keyCrmSyncError: "API error message",
  keyCrmSyncAttemptedAt: timestamp
}
```

### **Check Error Logs:**

```javascript
// Find KeyCRM errors
db.collection('errors')
  .where('type', '==', 'keycrm_integration')
  .orderBy('timestamp', 'desc')
  .limit(10)
  .get()
```

### **Common Issues:**

| Issue | Solution |
|-------|----------|
| `keyCrmApiKey` not found | Add to `settings/admin` in Firestore |
| API returns 401 | Check API key validity in KeyCRM |
| Products not found in KeyCRM | Ensure SKUs match KeyCRM catalog |
| Inventory not decreasing | Check KeyCRM workflow settings |
| Order appears but no payment | Webhook not configured (for online payments) |

---

## ⚙️ Advanced Configuration

### **Custom Shipping Methods:**

Edit mapping in `sendToKeyCRM()`:
```javascript
shipping_method_id: orderData.delivery.method === 'Нова Пошта' ? 1 : 
                    orderData.delivery.method === 'Укрпошта' ? 2 : 
                    3  // Custom method
```

### **Custom Payment Methods:**

Edit mapping in `sendToKeyCRM()`:
```javascript
payment_method_id: orderData.payment.method === 'online' ? 2 : 
                   orderData.payment.method === 'cod' ? 1 : 
                   3  // Custom method
```

### **Add Custom Fields:**

```javascript
// In sendToKeyCRM() function
const keyCrmPayload = {
  // ... existing fields
  custom_fields: {
    delivery_time: orderData.deliveryTime,
    gift_message: orderData.giftMessage,
    spiciness_level: orderData.items[0].spiciness
  }
}
```

---

## 🎯 Next Steps

### **Phase 1: Basic Sync (✅ Implemented)**
- Auto-send orders to KeyCRM
- Error logging
- Non-blocking integration

### **Phase 2: Webhook Integration (TODO)**
- Update payment status from Monobank webhook
- Trigger KeyCRM order status update
- Send confirmation email

### **Phase 3: Bidirectional Sync (TODO)**
- Fetch order status from KeyCRM
- Update Firestore when KeyCRM status changes
- Show tracking info on Thank You page

### **Phase 4: Inventory Sync (TODO)**
- Fetch product stock from KeyCRM
- Update website stock in real-time
- Show "Out of Stock" based on KeyCRM data

---

## 📞 Support

**KeyCRM API Documentation:**
- https://docs.keycrm.app/api/

**Questions?**
1. Check Console logs (F12)
2. Check Firestore `errors` collection
3. Verify API key in KeyCRM settings
4. Contact KeyCRM support if API issues persist

---

**Version:** 1.0.0  
**Last Updated:** 2026-01-25  
**Author:** Senior Full Stack Developer

🎉 **Orders now sync automatically to KeyCRM!** 🔗
