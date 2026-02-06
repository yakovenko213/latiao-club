# 📱 SMS Notification - Quick Reference

## 🚀 Quick Start

### **1. Configure TurboSMS Credentials**
```javascript
// In Firebase Console → Firestore
// Create document: settings/sms_config

{
  turboSmsToken: "your-turbosms-api-token-here",
  alphaName: "LATIAO"  // Or your registered sender name
}
```

### **2. Test the Feature**
1. Open Admin Panel
2. Go to **Промокоди** tab
3. Fill personal promo form
4. Check ☑️ **Відправити SMS клієнту**
5. Edit message if needed
6. Click **Видати код**

---

## 📋 Code Snippets

### **Fetch TurboSMS Credentials**
```javascript
async function fetchTurboSmsCredentials() {
  const smsConfigRef = doc(db, 'settings', 'sms_config')
  const smsConfigDoc = await getDoc(smsConfigRef)
  
  if (smsConfigDoc.exists()) {
    const data = smsConfigDoc.data()
    return {
      apiKey: data.turboSmsToken,
      alphaName: data.alphaName || 'LATIAO'
    }
  }
  
  throw new Error('TurboSMS credentials not found')
}
```

### **Send SMS**
```javascript
async function sendPromoSms(phone, message) {
  const { apiKey, alphaName } = await fetchTurboSmsCredentials()
  
  const response = await fetch('https://api.turbosms.ua/message/send.json', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      recipients: [phone],
      sms: {
        sender: alphaName,
        text: message
      }
    })
  })
  
  const result = await response.json()
  return result
}
```

### **Replace Placeholders**
```javascript
const template = "Промокод [CODE] на знижку [DISCOUNT]!"
const message = template
  .replace(/\[CODE\]/g, 'BONUS50')
  .replace(/\[DISCOUNT\]/g, '100 грн')

// Result: "Промокод BONUS50 на знижку 100 грн!"
```

---

## 🧪 Manual Testing Commands

### **Test in Browser Console**
```javascript
// Test credential fetching
await fetchTurboSmsCredentials()

// Test SMS sending
await sendPromoSms('+380991234567', 'Test message')

// Test placeholder replacement
const msg = "Code: [CODE], Discount: [DISCOUNT]"
  .replace(/\[CODE\]/g, 'TEST50')
  .replace(/\[DISCOUNT\]/g, '50 грн')
console.log(msg)
```

---

## 🎯 TurboSMS API Response Examples

### **✅ Success Response**
```json
{
  "response_code": 0,
  "response_status": "OK",
  "response_result": [
    {
      "phone": "+380991234567",
      "message_id": "123456789",
      "response_code": 0
    }
  ]
}
```

### **❌ Error Response**
```json
{
  "response_code": 103,
  "response_status": "Insufficient funds"
}
```

---

## 🔧 Troubleshooting

### **Issue: SMS Not Sending**
**Check:**
1. TurboSMS credentials in Firestore:
   ```javascript
   // In browser console:
   const doc = await getDoc(doc(db, 'settings', 'sms_config'))
   console.log(doc.data())
   ```
2. Network request in DevTools → Network tab
3. Console errors
4. TurboSMS account balance

### **Issue: Wrong Sender Name**
**Fix:**
```javascript
// Update Firestore:
await updateDoc(doc(db, 'settings', 'sms_config'), {
  alphaName: 'YOUR_SENDER_NAME'
})
```

### **Issue: Placeholders Not Replaced**
**Check:**
- Placeholders are: `[CODE]` and `[DISCOUNT]` (brackets required)
- Case-sensitive
- Regex uses `/\[CODE\]/g` for global replacement

---

## 📊 Analytics & Logging

### **Console Logs to Monitor**
```
✅ Key Success Indicators:
  - "✅ Promo code created successfully"
  - "✅ SMS sent successfully via TurboSMS"

⚠️ Important Warnings:
  - "⚠️ TurboSMS API returned non-success status"

❌ Critical Errors:
  - "❌ Error fetching TurboSMS credentials"
  - "❌ Error sending promo SMS"
```

### **Track SMS Delivery**
```javascript
// Add to promo document for tracking
promoData.smsStatus = {
  sent: true,
  sentAt: serverTimestamp(),
  phone: normalizedPhone,
  success: smsStatus.success
}
```

---

## 🎨 Customize SMS Template

### **Default Template**
```
Привіт! Ми даруємо вам персональний промокод [CODE] на знижку [DISCOUNT]! Використайте його при наступному замовленні.
```

### **Alternative Templates**
```
🌶️ Гостренька пропозиція! Ваш промокод [CODE] дає [DISCOUNT] знижки. Встигніть скористатись!

🎉 Вітаємо! Спеціально для вас: [CODE] = [DISCOUNT] економії. Приємних покупок!

💰 Ексклюзивна знижка [DISCOUNT]! Промокод: [CODE]. Діє обмежений час!
```

### **Update Default in HTML**
```html
<textarea id="personal-promo-sms-message">
  <!-- Edit this default text -->
  Ваш новий текст з плейсхолдерами [CODE] і [DISCOUNT]
</textarea>
```

---

## 🔐 Security Best Practices

### **Never Expose API Keys**
```javascript
// ✅ GOOD: Fetch from Firestore
const { apiKey } = await fetchTurboSmsCredentials()

// ❌ BAD: Hardcode in frontend
const apiKey = "hardcoded-token-here" // DON'T DO THIS
```

### **Firestore Security Rules**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /settings/sms_config {
      allow read: if request.auth != null && isAdmin();
      allow write: if request.auth != null && isAdmin();
    }
  }
}
```

---

## 📱 Phone Number Formats

### **Supported Input Formats**
```
+380991234567 ✅
380991234567  ✅
80991234567   ✅
0991234567    ✅
991234567     ✅
```

### **Normalized Output**
All formats → `+380991234567`

---

## ✨ UI States

### **1. Initial State**
- SMS checkbox: unchecked
- SMS textarea: hidden
- Button: "Видати код"

### **2. Loading State**
- Button disabled
- Button text: "Обробка..." with spinner
- Form locked

### **3. Success State**
- Toast notification appears
- Form resets
- SMS textarea hidden
- Button re-enabled

### **4. Error State**
- Red error toast
- Form NOT reset
- Button re-enabled
- Console shows error details

---

## 🎯 One-Line Status Check

```javascript
// Paste in browser console for instant status
console.log('SMS Feature:', document.getElementById('personal-promo-sms-toggle') ? '✅ Enabled' : '❌ Missing')
```

---

## 📞 Support Contact

**TurboSMS Issues:**
- Website: https://turbosms.ua
- Support: support@turbosms.ua
- API Docs: https://turbosms.ua/api.html

---

## ⚡ Performance Notes

- **Credential fetch**: ~200-500ms (cached by Firestore)
- **SMS API call**: ~1-3 seconds
- **Total flow**: ~3-5 seconds (promo creation + SMS)
- **Timeout**: None (awaits completion)

---

## 🎉 Final Checklist

Before going live:
- [ ] TurboSMS credentials configured
- [ ] Test SMS received on real phone
- [ ] Console logs clear (no errors)
- [ ] Form resets properly
- [ ] Notifications display correctly
- [ ] Error handling tested
- [ ] Phone normalization works
- [ ] Placeholder replacement verified

---

**Quick Help:** If stuck, check browser console → Look for emoji logs 🔑📤✅❌
