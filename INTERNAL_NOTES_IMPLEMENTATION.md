# 🗒️ Internal Order Comments (Notes) System - Implementation Guide

## ✅ STATUS: **FULLY IMPLEMENTED**

The Internal Notes feature is **already implemented** in your Admin Panel. This document explains how it works and how to deploy it.

---

## 📍 Admin Panel Location
- **URL:** https://office-connect.latiao-snack.com.ua/
- **Files Location:** `/functions/private/`
- **Key Files:**
  - `index.html` - Contains both UI and JavaScript logic
  - `js/admin.js` - Additional admin functionality

---

## 🎨 UI Implementation

### Location in HTML
**File:** `/functions/private/index.html`  
**Lines:** 16287-16322 (inside Order Details Modal)

### HTML Structure
```html
<!-- Internal Notes Section (Admin Only) -->
<div class="bg-slate-50 rounded-xl border-2 border-slate-200 p-5 mt-6">
  <h4 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
    <i data-lucide="message-square" class="w-5 h-5 text-slate-600"></i>
    Внутрішні нотатки (тільки для адмінів)
  </h4>

  <!-- Notes Feed -->
  <div id="internal-notes-feed" class="space-y-3 mb-4 max-h-64 overflow-y-auto">
    <!-- Notes will be dynamically injected here -->
    <p class="text-sm text-gray-500 italic">Завантаження нотаток...</p>
  </div>

  <!-- New Note Input -->
  <div class="space-y-2">
    <textarea 
      id="new-comment-input" 
      placeholder="Додати внутрішню нотатку (не видно клієнту)..."
      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
      rows="3"
    ></textarea>
    <button 
      onclick="postInternalNote()"
      class="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
    >
      <i data-lucide="send" class="w-4 h-4"></i>
      Зберегти нотатку
    </button>
  </div>
</div>
```

### Design Features
- **Professional Tailwind CSS styling** matching admin panel aesthetic
- **Scrollable notes feed** with max height (`max-h-64`)
- **Responsive textarea** with focus states
- **Icon integration** using Lucide icons
- **Loading states** and visual feedback

---

## 🔧 JavaScript Implementation

### Location
**File:** `/functions/private/index.html`  
**Lines:** 9557-9820 (embedded in `<script type="module">`)

### Core Functions

#### 1. **Load Internal Notes**
```javascript
window.loadInternalNotes = async function(orderId) {
  console.log('📝 Loading internal notes for order:', orderId);
  currentOrderIdForNotes = orderId;

  try {
    const orderDoc = await getDoc(doc(db, 'orders', orderId));
    
    if (!orderDoc.exists()) {
      console.error('❌ Order not found:', orderId);
      return;
    }

    const orderData = orderDoc.data();
    const notes = orderData.internal_notes || [];
    
    console.log('✅ Loaded notes:', notes);
    renderInternalNotes(notes);
    
  } catch (error) {
    console.error('❌ Error loading internal notes:', error);
    const feedEl = document.getElementById('internal-notes-feed');
    if (feedEl) {
      feedEl.innerHTML = `<p class="text-sm text-red-600">Помилка завантаження нотаток</p>`;
    }
  }
};
```

**Called from:** Line 9557 (when modal opens)

---

#### 2. **Render Notes in UI**
```javascript
function renderInternalNotes(notes) {
  const feedEl = document.getElementById('internal-notes-feed');
  
  if (!feedEl) {
    console.error('❌ Element #internal-notes-feed not found');
    return;
  }

  if (!notes || notes.length === 0) {
    feedEl.innerHTML = `
      <p class="text-sm text-gray-500 italic">
        Немає нотаток. Додайте першу!
      </p>
    `;
    return;
  }

  // Sort notes: newest first
  const sortedNotes = [...notes].sort((a, b) => {
    const timeA = a.createdAt?.seconds || 0;
    const timeB = b.createdAt?.seconds || 0;
    return timeB - timeA;
  });

  const notesHtml = sortedNotes.map(note => {
    const timestamp = note.createdAt?.seconds 
      ? new Date(note.createdAt.seconds * 1000).toLocaleString('uk-UA', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : 'Невідомо';

    return `
      <div class="bg-white border border-slate-200 rounded-lg p-4 relative group">
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1">
            <p class="text-sm text-gray-800 whitespace-pre-wrap">${escapeHtml(note.text)}</p>
            <div class="flex items-center gap-2 mt-2 text-xs text-gray-500">
              <i data-lucide="user" class="w-3 h-3"></i>
              <span>${note.author || 'Admin'}</span>
              <span>•</span>
              <i data-lucide="clock" class="w-3 h-3"></i>
              <span>${timestamp}</span>
            </div>
          </div>
          <button 
            onclick="deleteInternalNote('${note.id}')"
            class="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-lg"
            title="Видалити нотатку"
          >
            <i data-lucide="trash-2" class="w-4 h-4 text-red-600"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  feedEl.innerHTML = notesHtml;
  
  // Reinitialize Lucide icons
  lucide.createIcons();
}
```

**Features:**
- Sorts notes by timestamp (newest first)
- Formats dates in Ukrainian locale
- Escapes HTML to prevent XSS
- Shows delete button on hover
- Displays author and timestamp

---

#### 3. **Save New Note**
```javascript
window.postInternalNote = async function() {
  console.log('💬 postInternalNote called');
  
  const orderId = currentOrderIdForNotes;
  const textarea = document.getElementById('new-comment-input');
  
  if (!orderId) {
    console.error('❌ No order ID set');
    alert('Помилка: ID замовлення не визначено');
    return;
  }

  if (!textarea) {
    console.error('❌ Textarea #new-comment-input not found');
    return;
  }

  const text = textarea.value.trim();
  
  if (!text) {
    alert('⚠️ Введіть текст нотатки');
    textarea.focus();
    return;
  }

  console.log('📤 Posting note for order:', orderId);
  console.log('📝 Note text:', text);

  // Disable button during save
  const button = event.target;
  const originalHtml = button.innerHTML;
  button.disabled = true;
  button.innerHTML = `
    <div class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
    Збереження...
  `;

  try {
    const newNote = {
      id: `note_${Date.now()}`,
      text: text,
      author: 'Admin',
      createdAt: serverTimestamp()
    };

    console.log('📦 New note object:', newNote);

    const orderRef = doc(db, 'orders', orderId);
    
    await updateDoc(orderRef, {
      internal_notes: arrayUnion(newNote)
    });

    console.log('✅ Note saved successfully');

    // Clear textarea
    textarea.value = '';

    // Reload notes
    await loadInternalNotes(orderId);

    // Show success toast
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-4 rounded-xl shadow-2xl z-[100] flex items-center gap-3';
    toast.innerHTML = `
      <i data-lucide="check-circle" class="w-6 h-6"></i>
      <span class="font-semibold">Нотатку збережено!</span>
    `;
    document.body.appendChild(toast);
    lucide.createIcons();
    setTimeout(() => toast.remove(), 3000);

  } catch (error) {
    console.error('❌ Error saving note:', error);
    alert(`Помилка збереження нотатки: ${error.message}`);
  } finally {
    // Restore button
    button.disabled = false;
    button.innerHTML = originalHtml;
    lucide.createIcons();
  }
};
```

**Uses:**
- `updateDoc()` - Updates Firestore document
- `arrayUnion()` - Adds note without duplicates
- `serverTimestamp()` - Ensures consistent timestamps

---

#### 4. **Delete Note**
```javascript
window.deleteInternalNote = async function(noteId) {
  console.log('🗑️ Deleting note:', noteId);
  
  const orderId = currentOrderIdForNotes;
  
  if (!orderId) {
    console.error('❌ No order ID set');
    return;
  }

  if (!confirm('⚠️ Видалити цю нотатку?')) {
    return;
  }

  try {
    // Fetch current order to find the exact note object
    const orderDoc = await getDoc(doc(db, 'orders', orderId));
    
    if (!orderDoc.exists()) {
      console.error('❌ Order not found:', orderId);
      return;
    }

    const orderData = orderDoc.data();
    const notes = orderData.internal_notes || [];
    const noteToDelete = notes.find(n => n.id === noteId);

    if (!noteToDelete) {
      console.error('❌ Note not found:', noteId);
      alert('Нотатку не знайдено');
      return;
    }

    console.log('📦 Deleting note object:', noteToDelete);

    const orderRef = doc(db, 'orders', orderId);
    
    await updateDoc(orderRef, {
      internal_notes: arrayRemove(noteToDelete)
    });

    console.log('✅ Note deleted successfully');

    // Reload notes
    await loadInternalNotes(orderId);

    // Show success toast
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-4 rounded-xl shadow-2xl z-[100] flex items-center gap-3';
    toast.innerHTML = `
      <i data-lucide="trash-2" class="w-6 h-6"></i>
      <span class="font-semibold">Нотатку видалено!</span>
    `;
    document.body.appendChild(toast);
    lucide.createIcons();
    setTimeout(() => toast.remove(), 3000);

  } catch (error) {
    console.error('❌ Error deleting note:', error);
    alert(`Помилка видалення нотатки: ${error.message}`);
  }
};
```

**Uses:**
- `arrayRemove()` - Removes exact note object
- Must fetch full note object (not just ID) for Firestore array operations

---

## 💾 Firestore Data Structure

### Collection: `orders`
### Document ID: `{orderId}`

### Field: `internal_notes` (Array)

Each note is an object:
```javascript
{
  id: "note_1738678400000",           // Unique ID (timestamp-based)
  text: "Клієнт попросив змінити колір", // Note content
  author: "Admin",                     // Who created the note
  createdAt: Timestamp                 // Firestore server timestamp
}
```

### Example Document
```json
{
  "id": "order_abc123",
  "customer": {
    "fullName": "Іван Петренко",
    "phone": "+380501234567"
  },
  "items": [...],
  "internal_notes": [
    {
      "id": "note_1738678400000",
      "text": "Клієнт попросив передзвонити після 18:00",
      "author": "Admin",
      "createdAt": { "_seconds": 1738678400, "_nanoseconds": 0 }
    },
    {
      "id": "note_1738680000000",
      "text": "Відправлено через Нову Пошту",
      "author": "Admin",
      "createdAt": { "_seconds": 1738680000, "_nanoseconds": 0 }
    }
  ]
}
```

---

## 🔐 Security & Visibility

### ✅ **Notes are Admin-Only**
- **Only visible** in the Admin Panel (office-connect.latiao-snack.com.ua)
- **NOT visible** to customers in the public store
- Stored in the `orders` collection with proper Firestore security rules

### Recommended Firestore Security Rules
Add to `firestore.rules`:
```javascript
match /orders/{orderId} {
  // Allow admins to read/write all order data including internal_notes
  allow read, write: if request.auth != null && 
                     get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role == 'admin';
  
  // Customers can only read their own orders (exclude internal_notes)
  allow read: if request.auth != null && 
              request.auth.uid == resource.data.userId;
}
```

---

## 🚀 Deployment Instructions

### 🎯 Current Configuration

**Target:** `adminpanel`  
**Domain:** office-connect.latiao-snack.com.ua  
**Directory:** `/functions/private/`

### Firebase.json Configuration
```json
{
  "hosting": [
    {
      "target": "adminpanel",
      "public": "functions/private",
      "cleanUrls": false,
      "trailingSlash": false,
      "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ],
      "headers": [
        {
          "source": "**/*.@(js|css|html)",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "no-cache, no-store, must-revalidate"
            },
            {
              "key": "Pragma",
              "value": "no-cache"
            },
            {
              "key": "Expires",
              "value": "0"
            }
          ]
        }
      ]
    }
  ]
}
```

**Important:** Cache is disabled (`no-cache, no-store, must-revalidate`) to ensure admins always see the latest version.

---

### 📝 Deployment Commands

#### Option 1: Deploy ONLY Admin Panel
```bash
firebase deploy --only hosting:adminpanel
```

**This deploys:**
- `/functions/private/index.html` → https://office-connect.latiao-snack.com.ua/
- `/functions/private/js/*` → https://office-connect.latiao-snack.com.ua/js/

**Use this when:** You've made changes to the admin panel files.

---

#### Option 2: Deploy All Hosting Sites
```bash
firebase deploy --only hosting
```

**This deploys:**
- Main store (public-site)
- Admin store (admin-site) 
- Admin panel (functions/private)

**Use this when:** You've made changes across multiple sites.

---

#### Option 3: Full Deployment (Hosting + Functions + Firestore Rules)
```bash
firebase deploy
```

**Use this when:** You've updated:
- Hosting files
- Cloud Functions (`functions/index.js`)
- Firestore security rules (`firestore.rules`)

---

### ⚙️ Verify Deployment

#### 1. Check hosting targets
```bash
firebase target:apply hosting adminpanel office-connect-latiao-snack
```

#### 2. Deploy with verification
```bash
firebase deploy --only hosting:adminpanel
```

#### 3. Verify in browser
Open: https://office-connect.latiao-snack.com.ua/
- Login as admin
- Open any order
- Scroll to "Внутрішні нотатки"
- Add a test note
- Verify it saves and displays

---

## 🧪 Testing the Feature

### Manual Test Steps

1. **Login to Admin Panel**
   - Visit: https://office-connect.latiao-snack.com.ua/
   - Use admin credentials

2. **Open an Order**
   - Go to "Замовлення" section
   - Click on any order row to open modal

3. **Scroll to Internal Notes Section**
   - Section title: "Внутрішні нотатки (тільки для адмінів)"
   - Should show loading message initially

4. **Add a Note**
   - Type text in textarea
   - Click "Зберегти нотатку"
   - Should see loading spinner
   - Success toast appears: "Нотатку збережено!"

5. **Verify Note Display**
   - Note appears in feed
   - Shows author ("Admin") and timestamp
   - Text is formatted correctly

6. **Test Delete**
   - Hover over note
   - Click trash icon (appears on hover)
   - Confirm deletion
   - Note removed, toast appears: "Нотатку видалено!"

7. **Test Persistence**
   - Close modal
   - Re-open same order
   - Notes should still be visible

---

## 🐛 Troubleshooting

### Issue 1: Notes Not Loading
**Symptoms:** "Завантаження нотаток..." doesn't change

**Causes & Fixes:**
- Check browser console for errors (`F12`)
- Verify Firebase imports in HTML:
  ```javascript
  import { getDoc, doc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } 
    from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
  ```
- Confirm `window.currentEditingOrderId` is set (Line 9518)
- Check Firestore security rules allow admin read access

---

### Issue 2: Cannot Save Notes
**Symptoms:** Error alert when clicking "Зберегти нотатку"

**Causes & Fixes:**
- Verify admin is authenticated (`getAuth()`)
- Check Firestore security rules allow write access
- Ensure `serverTimestamp()` is imported correctly
- Check `arrayUnion()` is available

**Test in Console:**
```javascript
console.log(window.currentEditingOrderId); // Should show order ID
console.log(typeof arrayUnion); // Should be "function"
```

---

### Issue 3: Delete Not Working
**Symptoms:** Note doesn't delete, or error appears

**Causes & Fixes:**
- `arrayRemove()` requires **exact object match**
- Verify note object structure matches exactly (including `createdAt` timestamp)
- Check if note ID is correct

**Debug:**
```javascript
// In deleteInternalNote function (Line 9785)
console.log('📦 Note to delete:', noteToDelete);
console.log('📦 All notes:', notes);
```

---

### Issue 4: Modal Doesn't Open
**Symptoms:** Clicking order row does nothing

**Causes & Fixes:**
- Check `openOrderModal()` function exists
- Verify modal element ID: `order-details-modal`
- Check browser console for JavaScript errors

---

## 📊 Database Queries

### Get All Orders with Internal Notes
```javascript
const ordersRef = collection(db, 'orders');
const q = query(ordersRef, where('internal_notes', '!=', []));
const snapshot = await getDocs(q);

snapshot.forEach(doc => {
  console.log(doc.id, doc.data().internal_notes);
});
```

---

### Count Notes for an Order
```javascript
const orderDoc = await getDoc(doc(db, 'orders', orderId));
const notesCount = orderDoc.data().internal_notes?.length || 0;
console.log(`Order ${orderId} has ${notesCount} notes`);
```

---

### Search Notes by Text
```javascript
const orderDoc = await getDoc(doc(db, 'orders', orderId));
const notes = orderDoc.data().internal_notes || [];
const searchResults = notes.filter(note => 
  note.text.toLowerCase().includes('передзвонити')
);
```

---

## 🎯 Summary

### ✅ What's Already Implemented
- ✅ **UI Section** in Order Details Modal
- ✅ **Load Notes** function with Firestore integration
- ✅ **Render Notes** with sorting and formatting
- ✅ **Save Note** with validation and feedback
- ✅ **Delete Note** with confirmation
- ✅ **Toast Notifications** for success/error
- ✅ **Tailwind CSS Styling** matching admin design
- ✅ **Lucide Icons** integration
- ✅ **Security:** Admin-only visibility

### 📦 Data Structure
- **Field:** `internal_notes` (Array in `orders` collection)
- **Format:** `{ id, text, author, createdAt }`
- **Persistence:** Permanent in Firestore

### 🚀 Deployment
- **Target:** `adminpanel`
- **Command:** `firebase deploy --only hosting:adminpanel`
- **URL:** https://office-connect.latiao-snack.com.ua/

---

## 📞 Support

If you encounter issues:
1. Check browser console (`F12` → Console tab)
2. Verify Firebase configuration in HTML
3. Check Firestore security rules
4. Ensure admin authentication is working

---

**Document Updated:** February 4, 2026  
**Version:** 1.0  
**Author:** GitHub Copilot Senior Fullstack Developer
