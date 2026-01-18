# ⚡ Quick Start: Monobank Payment Setup

## 1️⃣ Get Your Monobank Token

1. Register at [https://api.monobank.ua/](https://api.monobank.ua/)
2. Get your **X-Token** from merchant portal
3. **Do NOT commit this token to Git!**

## 2️⃣ Set Token in Firebase

```bash
# Set environment variable (REQUIRED)
firebase functions:config:set monobank.token="YOUR_MONOBANK_TOKEN_HERE"

# Verify
firebase functions:config:get

# Deploy
firebase deploy --only functions
```

## 3️⃣ Test It!

1. Go to checkout page
2. Select "Онлайн оплата" (Online payment)
3. Complete the order
4. You'll be redirected to Monobank payment page

## 🔍 Check Logs

```bash
# View function logs
firebase functions:log

# Filter by function
firebase functions:log --only createMonoInvoice
```

## 📊 Monitor Payments

Go to admin panel → Orders → Click "View Details"

You'll see:
- Payment status
- Invoice ID
- Payment link
- Timestamps

## ⚠️ Troubleshooting

### "Monobank API токен не налаштовано"
```bash
firebase functions:config:set monobank.token="YOUR_TOKEN"
firebase deploy --only functions
```

### "401 Unauthorized"
- Check if token is correct
- Verify token has merchant permissions

### Webhook not working
1. Check URL in Monobank dashboard: `https://us-central1-my-magazin-81c96.cloudfunctions.net/handleMonoWebhook`
2. View logs: `firebase functions:log --only handleMonoWebhook`

## 📚 Full Documentation

See [MONOBANK_SETUP.md](MONOBANK_SETUP.md) for detailed information.

## 🎯 How It Works (Security)

```
Client ──saves order──> Firestore
                            ↓
                    Server reads REAL amount
                            ↓
                    Creates Monobank invoice
                            ↓
Client <──redirects to────── Payment page
```

**Why?** To prevent users from changing the amount in browser DevTools!

---

✅ **Status:** Deployed and ready!  
🔗 **Webhook URL:** `https://us-central1-my-magazin-81c96.cloudfunctions.net/handleMonoWebhook`  
🌐 **Site:** `https://my-magazin-81c96.web.app`
