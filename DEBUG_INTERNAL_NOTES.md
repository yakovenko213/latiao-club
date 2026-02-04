# 🐛 Debug Guide: Internal Notes System

## ✅ Fixes Applied

### 1. **Order ID Reference** ✓
- Added global variable `currentOrderId` declaration
- Set in `loadInternalNotes(orderId)` function
- Verified at the start of `postInternalNote()`
- Added extensive logging: `console.log("Saving comment to order:", currentOrderId)`

### 2. **Firestore Pathing** ✓
- Document reference: `const orderRef = doc(db, 'orders', orderId)`
- Collection name: **'orders'** (verify this matches your Firestore collection)
- Path logging: `console.log("Order reference path:", orderRef.path)`

### 3. **Atomic Update** ✓
- Using `arrayUnion` correctly: `await updateDoc(orderRef, { internal_notes: arrayUnion(newNote) })`
- Creates the array if it doesn't exist
- Prevents duplicates and race conditions

### 4. **State Refresh** ✓
- Input cleared immediately: `input.value = ''`
- Fetches updated document after save
- Re-renders notes with `renderInternalNotes(notes)`
- Verifies the note was saved by searching for its ID

---

## 🔍 Detailed Debugging Steps

### Step 1: Open Browser Console
1. Open Admin Panel
2. Press `F12` or `Ctrl+Shift+I` (Windows/Linux) / `Cmd+Option+I` (Mac)
3. Go to "Console" tab

### Step 2: Open an Order Modal
When you click on an order, you should see:
```
🔍 Modal Opened for Order: [ORDER_ID]
📋 Opening order details: {...}
📥 loadInternalNotes called with orderId: [ORDER_ID]
✅ currentOrderId set to: [ORDER_ID]
🔍 Creating Firestore reference for orders collection...
📄 Order reference path: orders/[ORDER_ID]
📡 Fetching order document from Firestore...
✅ Order found! Retrieved X existing notes: [...]
```

**❌ If you see:**
- `⚠️ Order document not found in Firestore` → Check if collection name is correct
- `🚫 PERMISSION DENIED` → Fix Firestore security rules (see below)

### Step 3: Try Adding a Comment
Type something in the textarea and click "Додати". You should see:
```
🚀 Saving comment to order: [ORDER_ID]
📊 Current user: {...}
🗄️ Database reference: {...}
📝 Comment text: "Your text here"
👤 Admin name: [EMAIL_OR_NAME]
📦 New note object: {...}
🔍 Creating Firestore reference for collection 'orders', doc: [ORDER_ID]
📄 Order reference created: orders/[ORDER_ID]
💾 Attempting to update Firestore with arrayUnion...
✅ Internal note added successfully to Firestore!
🧹 Input cleared
🔄 Fetching updated order document...
📊 Retrieved X notes from Firestore: [...]
✅ VERIFIED: Our note was successfully saved!
🎨 Notes re-rendered in UI
```

---

## ❌ Common Errors & Solutions

### Error 0: "postInternalNote is not defined" ⚠️ MOST COMMON
**Cause:** The `dashboard.js` file is not loaded in the HTML

**Symptoms:**
- Clicking "Додати" button does nothing
- Console shows: `Uncaught ReferenceError: postInternalNote is not defined`
- Network tab doesn't show `dashboard.js` request

**Solution:**
Ensure this line exists in `index.html` (after admin.js):
```html
<!-- Dashboard Logic (Orders, Modal, Internal Notes) -->
<script type="module" src="/js/dashboard.js"></script>
```

**Verification:**
```javascript
// In browser console:
console.log(typeof window.postInternalNote); // Should be "function"
console.log(typeof window.deleteInternalNote); // Should be "function"
console.log(typeof window.openOrderModal); // Should be "function"
```

**If still not working:**
1. Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. Check Network tab - dashboard.js should load with 200 status
3. Clear browser cache and reload

### Error 1: "No current order ID set"
**Cause:** `currentOrderId` is not being set when modal opens

**Check:**
```javascript
// In console:
console.log(window.currentOrderId);
```

**Solution:**
- Ensure `loadInternalNotes(orderId)` is called in `openOrderModal()`
- Check that `orderId` parameter is not undefined

### Error 2: "permission-denied"
**Cause:** Firestore security rules block the operation

**Check Firestore Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /orders/{orderId} {
      // Allow admins to read/write
      allow read, write: if request.auth != null && isAdmin(request.auth.uid);
      
      // Or allow all authenticated users (for testing):
      allow read, write: if request.auth != null;
    }
  }
}
```

**Quick Fix for Testing (NOT for production):**
```javascript
match /orders/{orderId} {
  allow read, write: if true; // WARNING: Insecure!
}
```

### Error 3: "Order not found"
**Cause:** Wrong collection name or order doesn't exist

**Check:**
1. Open Firestore Console
2. Verify collection name is exactly `orders` (case-sensitive)
3. Verify the order ID exists in that collection

**Test Query:**
```javascript
// In browser console:
const orderRef = doc(db, 'orders', 'YOUR_ORDER_ID_HERE');
const orderDoc = await getDoc(orderRef);
console.log('Exists:', orderDoc.exists());
console.log('Data:', orderDoc.data());
```

### Error 4: "Cannot read property 'value' of null"
**Cause:** HTML elements not found

**Check:**
```javascript
// In console:
console.log(document.getElementById('new-comment-input'));
console.log(document.getElementById('post-comment-btn'));
```

**Solution:** Ensure modal HTML is loaded and IDs match

### Error 5: "updateDoc is not a function"
**Cause:** Import issue

**Check:**
```javascript
// In console:
console.log(typeof updateDoc); // Should be "function"
console.log(typeof arrayUnion); // Should be "function"
```

**Solution:** Verify imports at top of dashboard.js

---

## 🧪 Manual Testing Script

Run this in the browser console after opening an order modal:

```javascript
// Test 1: Check variables
console.log("currentOrderId:", currentOrderId);
console.log("db:", db);
console.log("currentUser:", currentUser);

// Test 2: Check DOM elements
const input = document.getElementById('new-comment-input');
const btn = document.getElementById('post-comment-btn');
console.log("Input element:", input);
console.log("Button element:", btn);

// Test 3: Check Firestore access
const testOrderRef = doc(db, 'orders', currentOrderId);
console.log("Order reference:", testOrderRef);

try {
  const testDoc = await getDoc(testOrderRef);
  console.log("✅ Can read order:", testDoc.exists());
  console.log("Order data:", testDoc.data());
} catch (error) {
  console.error("❌ Cannot read order:", error);
}

// Test 4: Try adding a test note manually
try {
  await updateDoc(testOrderRef, {
    internal_notes: arrayUnion({
      id: 'test_' + Date.now(),
      text: 'Test note from console',
      timestamp: serverTimestamp(),
      author: 'Console Test'
    })
  });
  console.log("✅ Test note added successfully!");
} catch (error) {
  console.error("❌ Failed to add test note:", error);
}
```

---

## 🔧 Firestore Security Rules (Production-Ready)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is admin
    function isAdmin(uid) {
      return get(/databases/$(database)/documents/admins/$(uid)).data.role == 'admin';
    }
    
    // Orders collection
    match /orders/{orderId} {
      // Allow authenticated users to read their own orders
      allow read: if request.auth != null && 
                     request.auth.uid == resource.data.userId;
      
      // Allow admins to read all orders
      allow read: if request.auth != null && isAdmin(request.auth.uid);
      
      // Allow admins to update internal_notes field
      allow update: if request.auth != null && 
                       isAdmin(request.auth.uid) &&
                       request.resource.data.diff(resource.data)
                         .affectedKeys()
                         .hasOnly(['internal_notes']);
      
      // Allow system to create orders
      allow create: if request.auth != null;
    }
  }
}
```

---

## 📊 Verify Data in Firestore Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database**
4. Navigate to **orders** collection
5. Click on any order document
6. Look for `internal_notes` array field
7. Each note should have: `id`, `text`, `timestamp`, `author`

---

## 🎯 Success Checklist

After applying fixes, verify:

- [ ] Console shows "✅ currentOrderId set to: [ORDER_ID]" when modal opens
- [ ] Console shows "🚀 Saving comment to order: [ORDER_ID]" when clicking button
- [ ] Console shows "✅ Internal note added successfully to Firestore!"
- [ ] Console shows "✅ VERIFIED: Our note was successfully saved!"
- [ ] Input field clears after submitting
- [ ] New comment appears in the feed immediately
- [ ] After page refresh, comments persist
- [ ] Alert shows "✅ Нотатка успішно додана!"
- [ ] No red errors in console

---

## 🚀 Quick Test Command

Paste this in console after opening an order modal:

```javascript
// Quick test
document.getElementById('new-comment-input').value = 'Test note ' + Date.now();
postInternalNote();
```

Watch the console for detailed logs!

---

## 📝 Key Changes Made

### File: `/admin-site/js/dashboard.js`

1. **Added global variable**:
```javascript
let currentOrderId = null; // Line ~83
```

2. **Enhanced `postInternalNote()` function**:
- Added detailed logging at every step
- Added verification that note was saved
- Better error messages with error codes
- Success alert after save

3. **Enhanced `loadInternalNotes()` function**:
- Added detailed logging
- Added permission error detection
- Better error handling

---

## 🆘 Still Not Working?

If none of the above helps, provide:

1. **Console logs** when clicking "Додати"
2. **Firestore collection name** (is it really 'orders'?)
3. **Firebase Authentication status** (is user logged in?)
4. **Firestore rules** (copy & paste)
5. **Network tab** errors (F12 → Network → filter by "firestore")

Contact developer with this information for further debugging.
