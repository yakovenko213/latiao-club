# 🔗 KeyCRM Integration - Quick Reference

## ⚡ Quick Setup (3 Steps)

### 1️⃣ Get API Key
KeyCRM → Settings → Integrations → API → Copy Key

### 2️⃣ Add to Firestore
```
Collection: settings
Document: admin
Fields:
  keyCrmApiKey: "YOUR_KEY"
  keyCrmSourceId: 1
```

### 3️⃣ Test
Make test order → Check KeyCRM Orders

---

## 🔍 Quick Debug

### Check Sync Status:
```javascript
// In Firestore orders/{orderId}
keyCrmOrderId: 12345  // ✅ Success
keyCrmSyncSuccess: true

// OR
keyCrmSyncSuccess: false  // ❌ Failed
keyCrmSyncError: "message"
```

### Console Logs:
```
✅ Order synced to KeyCRM successfully: 12345  // Success
⚠️ KeyCRM sync failed (non-blocking): error    // Failed
```

### Error Logs:
```
Firestore → errors → type: "keycrm_integration"
```

---

## 📊 Data Map

| Field | KeyCRM | Website |
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
