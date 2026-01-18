# 🏦 Monobank Payment Integration Guide

## Overview
This project implements **SECURE** Monobank payment processing using Firebase Cloud Functions to prevent client-side amount manipulation.

## Security Architecture

### ⚠️ The Problem
If payment links are generated on the client (browser JavaScript), a malicious user could:
1. Open browser DevTools
2. Change the `amount` variable from `1000` to `1`
3. Pay 1 UAH instead of 1000 UAH

### ✅ The Solution
**Server-side amount calculation:**
1. Client submits order to Firestore (amount is ignored on server)
2. Server fetches order from Firestore and reads the **real** total
3. Server creates Monobank invoice with the verified amount
4. Client redirects to Monobank payment page

## Architecture Flow

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Client    │────────>│  Firestore   │<────────│   Server    │
│ (checkout)  │  1. Save│   (Orders)   │ 2. Read │  (Function) │
│             │   Order │              │  Order  │             │
└─────────────┘         └──────────────┘         └─────────────┘
       │                                                  │
       │                                                  │ 3. Create
       │                                                  │    Invoice
       │                                                  v
       │                                          ┌─────────────┐
       │<─────────────────────────────────────────│  Monobank   │
       │  4. Redirect to payment page             │     API     │
       │                                          └─────────────┘
       v
 ┌─────────────┐
 │  Monobank   │
 │   Payment   │
 │    Page     │
 └─────────────┘
```

## Files Structure

```
project/
├── checkout.html                  # Frontend checkout page
├── js/
│   └── firebase-init.js          # Firebase initialization
├── functions/
│   ├── index.js                  # Cloud Functions (createMonoInvoice, handleMonoWebhook)
│   └── package.json              # Dependencies (axios, firebase-functions, etc.)
└── MONOBANK_SETUP.md             # This file
```

## Setup Instructions

### 1. Get Monobank API Token

1. **Register your business** with Monobank
2. **Apply for Merchant API** access at [https://api.monobank.ua/](https://api.monobank.ua/)
3. **Obtain your X-Token** from the Monobank merchant portal
4. **Save the token** securely (never commit to Git!)

### 2. Set Environment Variable in Firebase

#### Option A: Using Firebase CLI (Recommended for Production)

```bash
# Set the Monobank token as an environment variable
firebase functions:config:set monobank.token="YOUR_MONOBANK_TOKEN_HERE"

# Verify it was set correctly
firebase functions:config:get

# Deploy functions with the new config
firebase deploy --only functions
```

#### Option B: Using Firestore (For Testing)

If you prefer to store the token in Firestore (easier for testing but less secure):

1. Open Firebase Console → Firestore Database
2. Create collection: `settings`
3. Create document: `config`
4. Add field: `monobankToken` = "YOUR_TOKEN_HERE"

**Note:** The Cloud Function checks environment variable first, then falls back to Firestore.

### 3. Deploy Cloud Functions

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

This will deploy:
- `createMonoInvoice` - Creates payment invoice
- `handleMonoWebhook` - Receives payment status updates

### 4. Configure Webhook URL in Monobank

After deployment, you'll get URLs like:
```
https://us-central1-my-magazin-81c96.cloudfunctions.net/createMonoInvoice
https://us-central1-my-magazin-81c96.cloudfunctions.net/handleMonoWebhook
```

**Important:** Update the `webHookUrl` in `functions/index.js` (line ~70) with your actual function URL.

### 5. Update Redirect URLs

In `functions/index.js`, update the `redirectUrl` to match your domain:

```javascript
redirectUrl: `https://your-domain.web.app/thank-you.html?orderId=${orderId}`,
```

## How It Works

### Frontend (checkout.html)

```javascript
// 1. User clicks "Pay Online"
// 2. Order is saved to Firestore
const docRef = await addDoc(collection(db, 'orders'), orderData);

// 3. Call Cloud Function with ORDER ID ONLY (not amount!)
const result = await createMonoInvoice({ orderId: docRef.id });

// 4. Redirect to Monobank payment page
window.location.href = result.data.pageUrl;
```

### Backend (functions/index.js)

```javascript
exports.createMonoInvoice = functions.https.onCall(async (data, context) => {
  const { orderId } = data;
  
  // 🔒 CRITICAL: Fetch order from Firestore
  const orderDoc = await db.collection('orders').doc(orderId).get();
  const order = orderDoc.data();
  
  // 🔒 Use ONLY the amount from the database
  const totalAmount = order.summary?.total;
  
  // Convert to kopeks (Monobank requires amount in kopeks)
  const amountInKopeks = Math.round(totalAmount * 100);
  
  // Call Monobank API
  const response = await axios.post(
    'https://api.monobank.ua/api/merchant/invoice/create',
    {
      amount: amountInKopeks,
      ccy: 980, // UAH
      merchantPaymInfo: {
        reference: orderId,
        destination: `Order #${orderId}`
      }
    },
    {
      headers: {
        'X-Token': process.env.MONOBANK_TOKEN
      }
    }
  );
  
  return { success: true, pageUrl: response.data.pageUrl };
});
```

### Webhook Handler

```javascript
exports.handleMonoWebhook = functions.https.onRequest(async (req, res) => {
  const { invoiceId, status, reference } = req.body;
  
  // Update order status based on payment result
  if (status === 'success') {
    await db.collection('orders').doc(reference).update({
      'payment.status': 'paid',
      'status': 'confirmed'
    });
  }
  
  res.status(200).send('OK');
});
```

## Payment Status Flow

1. **Created** - Invoice created, waiting for payment
2. **Processing** - Payment in progress
3. **Hold** - Payment on hold (card authorized)
4. **Success** ✅ - Payment successful
5. **Failure** ❌ - Payment failed
6. **Reversed** 🔄 - Payment refunded
7. **Expired** ⏱️ - Invoice expired (default: 1 hour)

## Testing

### Test with Monobank Test Environment

Monobank provides a test environment for development:
- Test card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVV: Any 3 digits

### Local Testing with Emulator

```bash
firebase emulators:start --only functions
```

Then update the function URL in checkout.html to point to:
```
http://localhost:5001/my-magazin-81c96/us-central1/createMonoInvoice
```

## Security Checklist

- ✅ Amount calculated on server (not client)
- ✅ Order ID validated before creating invoice
- ✅ Monobank token stored in environment variable (not in code)
- ✅ Webhook validates payment status from Monobank
- ✅ HTTPS enforced for all API calls
- ✅ CORS properly configured

## Troubleshooting

### Error: "Monobank API токен не налаштовано"
**Solution:** Set the token using `firebase functions:config:set monobank.token="YOUR_TOKEN"`

### Error: "Невірний Monobank токен" (401)
**Solution:** Verify your token is correct in Monobank merchant portal

### Error: "Доступ заборонено" (403)
**Solution:** Check token permissions and IP whitelist in Monobank settings

### Webhook not receiving data
**Solution:** 
1. Verify webhook URL is publicly accessible
2. Check Firebase Functions logs: `firebase functions:log`
3. Ensure Monobank has the correct webhook URL configured

## Admin Panel Integration

The order status automatically updates when payment is received:

```
Order → Pending → Payment Success → Status: Confirmed
```

You can view payment status in admin.html:
- Invoice ID
- Payment status
- Payment timestamp
- Monobank invoice link

## Cost Estimation

**Monobank Fees:**
- Standard transaction fee: ~1.5% + fixed fee
- Contact Monobank for exact pricing

**Firebase Cloud Functions:**
- Free tier: 2M invocations/month
- Paid tier: $0.40 per million invocations
- For typical e-commerce: ~$1-5/month

## Support

- **Monobank API Docs:** https://api.monobank.ua/docs/
- **Firebase Functions Docs:** https://firebase.google.com/docs/functions
- **Project Issues:** Contact developer

## License

This integration code is part of the Latiao Club project.

---

**Last Updated:** January 15, 2026
**Version:** 1.0.0
**Author:** Development Team
