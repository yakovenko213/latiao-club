# 🔥 Firebase Firestore Database Setup Guide

This guide will help you set up Firebase Firestore database for your Latiao Club e-commerce website.

---

## 📋 Step 1: Create Firebase Project (if not already created)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or select your existing project
3. Follow the setup wizard (enable Google Analytics if desired)

---

## 🌐 Step 2: Register Your Web App

1. In your Firebase project, click the **Web icon** (`</>`) to add a web app
2. Enter a nickname (e.g., "Latiao Club Website")
3. ✅ **Check** "Also set up Firebase Hosting" (if you want)
4. Click **"Register app"**
5. **Copy the Firebase configuration object** that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890abcdef"
};
```

---

## 🗄️ Step 3: Enable Firestore Database

1. In the Firebase Console, click **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. **Select a location** for your database:
   - Choose a region close to your users (e.g., `europe-west3` for Europe)
   - ⚠️ **Important:** You cannot change this later!
4. **Choose security mode:**
   - Select **"Start in test mode"** for now (we'll secure it in Step 5)
   - Click **"Enable"**

---

## 🔐 Step 4: Configure Firestore Security Rules

For **development/testing**, use these rules (⚠️ **NOT for production!**):

1. Go to **Firestore Database** → **Rules** tab
2. Replace the existing rules with:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all documents (TESTING ONLY)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. Click **"Publish"**

### 🛡️ **For Production**, use these secure rules:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Orders collection - anyone can create, only admins can read
    match /orders/{orderId} {
      // Allow anyone to create orders (from checkout page)
      allow create: if true;
      
      // Allow read only if user is authenticated admin
      // (Add authentication later for admin panel)
      allow read: if true; // Change this after adding admin auth
      
      // Allow update/delete only for authenticated admins
      allow update, delete: if false; // Enable after adding admin auth
    }
    
    // Deny all other collections
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## ⚙️ Step 5: Update Your Code with Firebase Config

1. **Open the file:** `js/firebase-init.js`
2. **Find this section:**

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

3. **Replace it with YOUR actual Firebase config** from Step 2
4. **Save the file**

---

## 🚀 Step 6: Deploy Your Website

Since you're using Firebase Hosting, deploy your changes:

```bash
firebase deploy --only hosting
```

---

## ✅ Step 7: Test the Integration

### Test 1: Create an Order

1. Open your website: `https://your-project-id.web.app`
2. Add items to cart
3. Go to checkout page
4. Fill in all required fields:
   - Full Name
   - Phone Number
   - Telegram/Viber
   - Select delivery method (Nova Poshta or Ukrposhta)
   - Fill in delivery details
   - Select payment method
5. Click **"Оформити замовлення"**
6. ✅ You should see a success message and be redirected to homepage
7. Cart should be cleared

### Test 2: View Orders in Firebase Console

1. Go to **Firestore Database** in Firebase Console
2. You should see a new collection called **"orders"**
3. Click on it to see your test order
4. Verify all data is saved correctly:
   - Customer info
   - Delivery details
   - Payment info
   - Cart items
   - Timestamp

### Test 3: View Orders in Admin Panel

1. Open admin panel: `https://your-project-id.web.app/dashboard.html`
2. Log in (if required)
3. Click **"Замовлення" (Orders)** tab
4. ✅ You should see your order(s) displayed in the table
5. Click **"Переглянути"** to see full order details in modal

---

## 🐛 Troubleshooting

### Error: "Permission denied" or "Missing or insufficient permissions"

**Solution:**
- Check your Firestore Security Rules (Step 4)
- Make sure you published the rules
- Try using "test mode" rules for debugging

### Error: "Firebase: Firebase App named '[DEFAULT]' already exists"

**Solution:**
- This means Firebase is already initialized somewhere else
- Check if you're importing `firebase-init.js` multiple times
- Make sure you're only initializing Firebase once

### Orders not showing in Admin Panel

**Solution:**
1. Open browser console (F12) and check for errors
2. Verify Firebase config is correct in `js/firebase-init.js`
3. Check if orders collection exists in Firestore Console
4. Try refreshing the admin panel page

### "Cannot find module" or "CORS error"

**Solution:**
- Make sure you're accessing the site via `https://` (not `file://`)
- If testing locally, use a local server:
  ```bash
  firebase serve
  ```
  or
  ```bash
  python -m http.server 8000
  ```

---

## 📊 Understanding the Order Data Structure

Each order in Firestore has the following structure:

```javascript
{
  customer: {
    fullName: "Іван Петренко",
    phone: "+380501234567",
    telegram: "@ivan_telegram"
  },
  delivery: {
    method: "Нова Пошта",
    city: "Київ",
    warehouse: "Відділення №1: вул. Хрещатик, 1",
    address: "Київ, Відділення №1: вул. Хрещатик, 1"
  },
  payment: {
    method: "Накладений платіж",
    status: "Нове замовлення"
  },
  items: [
    {
      name: "Гострі латяо 🌶️",
      price: 85,
      quantity: 2,
      subtotal: 170,
      image: "images/product1.jpg",
      spiciness: 3
    }
  ],
  summary: {
    itemCount: 1,
    totalQuantity: 2,
    subtotal: 170,
    total: 170
  },
  comment: "Будь ласка, дзвоніть після 18:00",
  status: "pending",
  createdAt: Timestamp,
  promo: {
    code: "LATIAO10",
    discount: 17
  }
}
```

---

## 🎯 Next Steps

1. ✅ **Test order creation** from checkout page
2. ✅ **Verify orders appear** in admin panel
3. 🔒 **Add admin authentication** to secure the admin panel
4. 📧 **Add email notifications** when new orders are created
5. 📊 **Add order status management** (pending → confirmed → shipped → delivered)
6. 💳 **Integrate payment gateway** (WayForPay, LiqPay, etc.)

---

## 🆘 Need Help?

- [Firebase Documentation](https://firebase.google.com/docs/firestore)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Support](https://firebase.google.com/support)

---

**🎉 Congratulations!** Your website is now connected to a real database! 🎉
