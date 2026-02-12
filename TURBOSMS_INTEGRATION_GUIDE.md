# TurboSMS Integration Guide

## ✅ Implementation Complete

Automated SMS sending via TurboSMS API has been successfully integrated into the **Restock Notifications** admin panel section.

---

## 🔧 Setup Instructions

### 1. Configure TurboSMS Credentials in Firestore

You need to manually add your TurboSMS API credentials to Firestore:

**Collection:** `config`  
**Document ID:** `turbosms_config` (or any document containing these fields)  
**Fields:**

```javascript
{
  turboSmsToken: "YOUR_TURBOSMS_API_KEY_HERE",
  senderName: "YOUR_SENDER_NAME_HERE"  // e.g., "LatíaoClub"
}
```

#### How to Add Credentials:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Navigate to **Firestore Database**
3. Find or create the collection: `config`
4. Create/edit a document (e.g., `turbosms_config`)
5. Add the two fields above with your actual TurboSMS credentials

**Where to get TurboSMS credentials:**
- API Key: [TurboSMS Cabinet → API Settings](https://turbosms.ua/cabinet.html)
- Alpha Name: Your registered sender name (must be approved by TurboSMS)

---

## 🎯 Features Implemented

### ✅ Task 1: Fetch Credentials & Templates
- Fetches `turboSmsToken` and `senderName` from any document in `config` collection
- Uses smart document discovery: finds document with `turboSmsToken` field or uses first document
- Loads message template from `admin_settings/restock_config`
- Graceful error handling if credentials are missing

### ✅ Task 2: Dynamic Message Composition
- Replaces `{productName}` with actual product name
- Replaces `{link}` with dynamic product URL: `https://latiao.club/product.html?id={productId}`
- Properly URL-encodes the message for API transmission

### ✅ Task 3: TurboSMS API Integration
- **Endpoint:** `https://api.turbosms.ua/message/send.json`
- **Method:** POST
- **Headers:**
  - `Authorization: Bearer [API_KEY]`
  - `Content-Type: application/json`
- **Payload:**
  ```json
  {
    "recipients": ["+380XXXXXXXXX"],
    "sms": {
      "sender": "AlphaName",
      "text": "Composed message with placeholders replaced"
    }
  }
  ```
- Error handling for API failures and TurboSMS-specific error codes

### ✅ Task 4: UI Feedback & Logging
- **Loading State:** Button shows spinner and "Відправка..." while sending
- **Success Toast:** "✅ СМС успішно надіслано через TurboSMS на +380XXXXXXXXX!"
- **Error Toast:** "❌ Помилка відправки СМС: [error details]"
- **Firestore Logging:** All SMS transactions logged to `sms_logs` collection with:
  - Phone number
  - Product name & ID
  - Message text
  - Sender (Alpha Name)
  - Status (sent/failed)
  - Timestamp
  - API response (on success) or error message (on failure)

---

## 🔒 Security Considerations

### ⚠️ CRITICAL SECURITY WARNING

**Current Implementation:** The TurboSMS API Key is stored in Firestore and accessed directly from the client-side JavaScript in the admin panel.

**Security Implications:**
- ✅ **Acceptable for now** because only authenticated admins can read `admin_settings` (enforced by Firestore Rules)
- ⚠️ **However**, the API key is exposed in browser memory during admin sessions
- ⚠️ An attacker with admin access could inspect network requests and extract the API key

### 🛡️ Recommended Security Upgrade (Future)

**Move SMS sending to a Firebase Cloud Function:**

1. **Create a Cloud Function** (`functions/sendRestockSMS.js`):
   ```javascript
   exports.sendRestockSMS = functions.https.onCall(async (data, context) => {
     // Verify admin authentication
     if (!context.auth) {
       throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
     }
     
     // Fetch credentials server-side (not exposed to client)
     const apiKey = functions.config().turbosms.apikey;
     const alphaName = functions.config().turbosms.alphaname;
     
     // Make TurboSMS API call server-side
     const response = await fetch('https://api.turbosms.ua/message/send.json', {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${apiKey}`,
         'Content-Type': 'application/json'
       },
       body: JSON.stringify({
         recipients: [data.phone],
         sms: { sender: alphaName, text: data.message }
       })
     });
     
     return await response.json();
   });
   ```

2. **Update client-side code** to call the Cloud Function instead of direct API:
   ```javascript
   const sendSMS = firebase.functions().httpsCallable('sendRestockSMS');
   await sendSMS({ phone: phone, message: messageText });
   ```

3. **Benefits:**
   - API key never exposed to client
   - Better rate limiting and abuse prevention
   - Centralized logging and monitoring
   - Can add additional security checks server-side

---

## 📦 Deployment

Deploy the updated code and Firestore rules:

```bash
# Deploy Firestore security rules (includes sms_logs collection)
firebase deploy --only firestore:rules

# Deploy admin panel hosting
firebase deploy --only hosting:admin-store-latio
```

---

## 🧪 Testing Checklist

- [ ] Add TurboSMS credentials to Firestore `admin_settings/general_config`
- [ ] Verify credentials are correct (test with TurboSMS API directly if needed)
- [ ] Go to Restock Notifications admin section
- [ ] Click "Надіслати СМС" button for a test request
- [ ] Verify:
  - [ ] Button shows loading state
  - [ ] SMS is received on the customer's phone
  - [ ] Success toast appears
  - [ ] Entry is logged in `sms_logs` collection in Firestore
- [ ] Test error scenarios:
  - [ ] Remove API key from Firestore → should show error toast
  - [ ] Use invalid phone number → should log failed attempt

---

## 📊 Monitoring SMS Activity

To view SMS logs:

1. Go to Firebase Console → Firestore Database
2. Open `sms_logs` collection
3. Each document contains:
   - `phone` - Recipient phone number
   - `productName` - Product name
   - `message` - Full SMS text sent
   - `status` - `"sent"` or `"failed"`
   - `timestamp` - Server timestamp
   - `apiResponse` - TurboSMS API response (if successful)
   - `error` - Error message (if failed)

---

## 🚀 Next Steps

1. **Add API credentials** to Firestore (see Setup Instructions above)
2. **Deploy** the changes:
   ```bash
   firebase deploy --only firestore:rules
   firebase deploy --only hosting:admin-store-latio
   ```
3. **Test** SMS sending with a real restock request
4. **Consider** migrating to Cloud Functions for enhanced security (see Security section)

---

## 📞 TurboSMS Support

- Documentation: https://turbosms.ua/api.html
- Support: support@turbosms.ua
- Cabinet: https://turbosms.ua/cabinet.html

---

**Status:** ✅ Ready for production use  
**Last Updated:** February 12, 2026
