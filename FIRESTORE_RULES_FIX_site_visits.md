# 🔒 FIRESTORE SECURITY RULES - site_visits Collection

## ⚠️ ISSUE: "Missing or insufficient permissions"

### 🎯 **Root Cause:**
Firestore Security Rules not allowing unauthenticated visitors to write to `site_visits` collection.

---

## ✅ **SOLUTION: Updated Security Rules**

### **Copy-Paste This Into Firebase Console:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // =============================================
    // 📊 VISITOR DEVICE TRACKING (Public Write)
    // =============================================
    
    // ⚠️ CRITICAL: site_visits - Track ALL visitor devices
    match /site_visits/{visitId} {
      allow create: if true;  // ✅ ANYONE (unauthenticated) can CREATE documents
      allow read, update, delete: if request.auth != null;  // ❌ Only authenticated admins
    }
    
    // =============================================
    // 📊 OTHER ANALYTICS COLLECTIONS
    // =============================================
    
    match /analytics_cart_adds/{eventId} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }
    
    match /analytics_sessions/{sessionId} {
      allow create, update: if true;
      allow read: if request.auth != null;
      allow delete: if request.auth != null;
    }
    
    match /analytics_checkout_events/{eventId} {
      allow create, update: if true;
      allow read: if request.auth != null;
      allow delete: if request.auth != null;
    }
    
    match /analytics_timings/{timingId} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }
    
    // =============================================
    // 🛒 ORDERS (Public Create for Checkout)
    // =============================================
    
    match /orders/{orderId} {
      allow create: if true;  // ✅ Anyone can place an order
      allow get, list: if true;  // ✅ Anyone can read specific order (for dashboard.html)
      allow update: if request.auth != null  // Admins can update anything
        || request.resource.data.diff(resource.data).affectedKeys().hasOnly(['linkOpened', 'linkOpenedAt']);
      allow delete: if request.auth != null;  // ❌ Only admins can delete
    }
    
    // =============================================
    // ⚙️ ADMIN SETTINGS (Admin Only)
    // =============================================
    
    match /settings/{docId} {
      allow read: if true;  // Public read for site config
      allow write: if request.auth != null;  // ❌ Only authenticated admins can write
    }
    
    match /admin_settings/{docId} {
      allow read, write: if request.auth != null;  // ❌ Only authenticated admins
    }
    
    // =============================================
    // 🌐 PUBLIC COLLECTIONS
    // =============================================
    
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /categories/{categoryId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /pages/{pageId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /popups/{popupId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /promocodes/{promoId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // =============================================
    // 👤 USERS & CUSTOMERS (Public for Phone Auth)
    // =============================================
    
    match /users/{userId} {
      allow read, write: if true;  // ✅ Public for phone-based registration
    }
    
    match /customers/{customerId} {
      allow read, write: if true;  // ✅ Public for phone-based auth
    }
    
    // =============================================
    // 🛒 ABANDONED CARTS
    // =============================================
    
    match /abandoned_carts/{cartId} {
      allow create, update, delete: if true;
      allow read: if request.auth != null;
    }
    
    // =============================================
    // 💬 LIVE CHAT
    // =============================================
    
    match /chats/{chatId} {
      allow create, read, update: if true;
      allow delete: if request.auth != null;
      
      match /messages/{messageId} {
        allow read: if true;
        allow create: if request.resource.data.sender == 'client' || request.auth != null;
        allow update, delete: if request.auth != null;
      }
    }
    
    // =============================================
    // ⭐ REVIEWS
    // =============================================
    
    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if true;  // Anyone can submit a review
      allow update, delete: if request.auth != null;
    }
    
    // =============================================
    // 🎯 CRM & ADMIN COLLECTIONS
    // =============================================
    
    match /crm_columns/{columnId} {
      allow read, write: if request.auth != null;
    }
    
    match /personal_promocodes/{promoId} {
      allow read, write: if request.auth != null;
    }
    
    match /daily_stats/{dateId} {
      allow read: if request.auth != null;
      allow create, update: if true;
    }
  }
}
```

---

## 🚀 **DEPLOYMENT STEPS**

### **Option 1: Deploy via Firebase CLI (Recommended)**
```bash
# Navigate to project directory
cd /workspaces/latiao-club

# Deploy Firestore rules only
firebase deploy --only firestore:rules
```

### **Option 2: Deploy via Firebase Console**
1. Go to: https://console.firebase.google.com
2. Select your project: **latiao-club**
3. Navigate to: **Firestore Database** → **Rules** tab
4. **Copy-paste the entire code block above**
5. Click **Publish**

---

## ✅ **VERIFICATION CHECKLIST**

### **Test 1: Check Rules in Firebase Console**
1. Go to Firestore Rules editor
2. Look for this line:
   ```javascript
   match /site_visits/{visitId} {
     allow create: if true;  // ✅ Must be "if true" (not "if request.auth != null")
   ```

### **Test 2: Test Write from Browser Console**
Open site and run in browser DevTools console:
```javascript
// Check if tracking script runs without errors
window.trackVisit()

// Should log: "📊 Visit tracked: mobile device" (or desktop/tablet)
// Should NOT show: "Missing or insufficient permissions"
```

### **Test 3: Check Firestore Database**
1. Go to Firebase Console → Firestore Database
2. Look for collection: `site_visits`
3. Should see new documents appearing with:
   - ✅ `deviceType` field
   - ✅ `timestamp` field
   - ✅ `page` field

### **Test 4: Check Browser Console for Errors**
Open DevTools → Console, look for:
- ❌ **BAD:** `FirebaseError: Missing or insufficient permissions`
- ✅ **GOOD:** `📊 Visit tracked: mobile device`

---

## 🐛 **TROUBLESHOOTING**

### **Still Getting Permission Error After Deploy?**

**Possible Causes:**

#### 1. **Rules Not Deployed**
```bash
# Re-deploy rules
firebase deploy --only firestore:rules

# Verify deployment success
# Should show: "✔ Deploy complete!"
```

#### 2. **Browser Cache**
- Hard refresh: `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)
- Clear site data: DevTools → Application → Clear Storage → Clear site data

#### 3. **Wrong Project Selected**
```bash
# Check active Firebase project
firebase projects:list

# Switch to correct project if needed
firebase use latiao-club
```

#### 4. **Firestore Indexes Missing**
- Go to Firebase Console → Firestore → Indexes
- Check if any indexes are in "Building" state
- Wait for them to finish

---

## 📊 **EXPECTED BEHAVIOR**

### **Before Fix:**
```
❌ FirebaseError: Missing or insufficient permissions
   at site_visits/{visitId}
```

### **After Fix:**
```
✅ 📊 Visit tracked: mobile device
✅ sessionStorage: visit_logged = 'true'
✅ Firestore: New document created in site_visits collection
```

---

## 🔥 **KEY SECURITY POINTS**

✅ **Unauthenticated users CAN:**
- CREATE documents in `site_visits` (track their visit)
- CREATE documents in `orders` (place orders)
- CREATE messages in `chats` (send messages)

❌ **Unauthenticated users CANNOT:**
- READ other users' visits from `site_visits`
- UPDATE or DELETE any `site_visits` documents
- WRITE to `admin_settings` (admin-only)

🔒 **Admins (authenticated) CAN:**
- READ all documents in `site_visits` (for analytics dashboard)
- UPDATE/DELETE documents in `site_visits`
- Full access to `orders`, `settings`, `admin_settings`

---

## 💡 **WHY THIS WORKS**

The rule `allow create: if true;` means:
- **ANY client** (authenticated or not) can create a new document
- **No conditions** need to be met
- **No authentication** required
- Perfect for tracking anonymous visitors

Alternative (more restrictive) would be:
```javascript
allow create: if request.auth != null;  // ❌ Would require login - BAD for tracking
```

---

## 📈 **AFTER SUCCESSFUL DEPLOYMENT**

You should see in Admin Panel → Statistics:
```
💻 Пристрої користувачів
━━━━━━━━━━━━━━━━━━━━━━━
📱 Телефон    +1  |  ████████░░  67%
💻 Комп'ютер  +1  |  ███░░░░░░░  28%
━━━━━━━━━━━━━━━━━━━━━━━
```

**Real-time updates as visitors browse your site!** 🔥
