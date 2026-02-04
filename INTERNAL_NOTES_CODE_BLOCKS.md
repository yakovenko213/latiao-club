# 🎯 Internal Notes - Ready-to-Use Code Blocks

## ✅ Status: **ALREADY IMPLEMENTED**

Your admin panel already has this feature! This document shows the exact code blocks if you need to reference or modify them.

---

## 📄 Part 1: HTML Code Block

### Location: `/functions/private/index.html` (Lines 16287-16322)

**Where to place:** Inside Order Details Modal, after the Order Items Table section.

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

**Key CSS Classes (Tailwind):**
- `bg-slate-50` - Light gray background
- `rounded-xl` - Rounded corners
- `border-2 border-slate-200` - Gray border
- `max-h-64 overflow-y-auto` - Scrollable list
- `focus:ring-2 focus:ring-blue-500` - Blue focus ring on textarea
- `bg-blue-600 hover:bg-blue-700` - Blue button with hover effect

---

## 📜 Part 2: JavaScript Code Blocks

### Location: `/functions/private/index.html` (Inside `<script type="module">`)

---

### 2.1 Global Variable (Line 9588)

```javascript
// ============================================
// INTERNAL NOTES SYSTEM (ADMIN ONLY)
// ============================================

// Global variable to track current order ID for notes
let currentOrderIdForNotes = null;
```

---

### 2.2 Load Notes Function (Lines 9590-9614)

```javascript
// Load internal notes for a specific order
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

**Firebase Functions Used:**
- `getDoc()` - Fetches order document
- `doc(db, 'orders', orderId)` - Creates document reference

---

### 2.3 Render Notes Function (Lines 9617-9682)

```javascript
// Render internal notes in the feed
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

**Key Features:**
- Sorts notes by timestamp (newest first)
- Formats dates in Ukrainian locale
- XSS protection via `escapeHtml()`
- Delete button visible on hover
- Lucide icons for visual appeal

---

### 2.4 Save Note Function (Lines 9685-9758)

```javascript
// Post a new internal note
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

**Firebase Functions Used:**
- `updateDoc()` - Updates Firestore document
- `arrayUnion(newNote)` - Adds note to array (prevents duplicates)
- `serverTimestamp()` - Server-side timestamp for consistency

**User Experience Features:**
- Button shows loading spinner during save
- Textarea cleared after successful save
- Success toast notification (auto-dismiss after 3s)
- Error alerts for failures

---

### 2.5 Delete Note Function (Lines 9761-9820)

```javascript
// Delete an internal note
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

**Firebase Functions Used:**
- `arrayRemove(noteToDelete)` - Removes exact note object from array

**Important:** Must pass the **entire note object** to `arrayRemove()`, not just the ID. This is a Firestore requirement for array operations.

---

### 2.6 Helper Function (Lines 9823-9827)

```javascript
// Helper function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
```

**Purpose:** Prevents XSS attacks by escaping user-input HTML characters.

---

### 2.7 Integration in Modal Opening (Line 9557)

```javascript
// Inside window.openOrderModal() function (around line 9500-9570)

// ============================================
// TTN (TRACKING NUMBER) SECTION
// ============================================
const ttnInput = document.getElementById('order-ttn-input')
// ... (other TTN setup code) ...

// Store current order ID globally for save function
window.currentEditingOrderId = orderId

// ... (TTN configuration continues) ...

// ============================================
// LOAD INTERNAL NOTES
// ============================================
await loadInternalNotes(orderId);

// Show modal
const modal = document.getElementById('order-details-modal')
modal.classList.remove('hidden')
modal.classList.add('flex')

// Reinitialize Lucide icons in modal
setTimeout(() => lucide.createIcons(), 50)
```

**Key Point:** `loadInternalNotes(orderId)` is called **after** setting up the modal but **before** showing it to the user.

---

### 2.8 Integration in Modal Closing (Lines 9574-9581)

```javascript
// Close Order Modal
window.closeOrderModal = function () {
  const modal = document.getElementById('order-details-modal')
  modal.classList.add('hidden')
  modal.classList.remove('flex')
  // Clear the editing order ID
  window.currentEditingOrderId = null
}
```

**Key Point:** Clears `currentEditingOrderId` to prevent stale data issues.

---

## 🔧 Required Firebase Imports

**Location:** Top of `<script type="module">` tag (around line 240)

```javascript
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getFirestore, 
    collection, 
    doc, 
    getDocs, 
    getDoc, 
    updateDoc, 
    deleteDoc, 
    addDoc, 
    setDoc,
    query, 
    where, 
    orderBy, 
    limit, 
    serverTimestamp,    // ← Required for note timestamps
    onSnapshot,
    writeBatch,
    increment,
    arrayUnion,         // ← Required for adding notes
    arrayRemove         // ← Required for deleting notes
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
```

**Critical Imports for Notes Feature:**
- `getDoc` - Fetch order document
- `updateDoc` - Update order document
- `arrayUnion` - Add note to array
- `arrayRemove` - Remove note from array
- `serverTimestamp` - Server-side timestamp

---

## 💾 Firestore Data Structure

### Collection: `orders`
### Document ID: `{orderId}`
### Field: `internal_notes` (Array of Objects)

```javascript
{
  id: "order_abc123",
  customer: {
    fullName: "Іван Петренко",
    phone: "+380501234567"
  },
  items: [...],
  status: "new",
  // ... other order fields ...
  
  internal_notes: [                     // ← Array field
    {
      id: "note_1738678400000",         // Unique ID (timestamp-based)
      text: "Клієнт попросив передзвонити після 18:00",
      author: "Admin",
      createdAt: {                      // Firestore Timestamp
        _seconds: 1738678400,
        _nanoseconds: 0
      }
    },
    {
      id: "note_1738680000000",
      text: "Відправлено через Нову Пошту",
      author: "Admin",
      createdAt: {
        _seconds: 1738680000,
        _nanoseconds: 0
      }
    }
  ]
}
```

**Note Object Structure:**
```typescript
interface InternalNote {
  id: string;              // "note_{timestamp}"
  text: string;            // Note content (user input)
  author: string;          // "Admin" or user display name
  createdAt: Timestamp;    // Firestore server timestamp
}
```

---

## 🎨 Customization Examples

### Change Color Scheme

#### Dark Mode Notes Section
```html
<div class="bg-gray-900 rounded-xl border-2 border-gray-700 p-5 mt-6">
  <h4 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
    <i data-lucide="message-square" class="w-5 h-5 text-gray-400"></i>
    Внутрішні нотатки (тільки для адмінів)
  </h4>
```

#### Purple Theme Button
```html
<button 
  onclick="postInternalNote()"
  class="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
>
  <i data-lucide="send" class="w-4 h-4"></i>
  Зберегти нотатку
</button>
```

---

### Add Character Counter

```html
<div class="space-y-2">
  <textarea 
    id="new-comment-input" 
    placeholder="Додати внутрішню нотатку (не видно клієнту)..."
    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
    rows="3"
    maxlength="500"
    oninput="updateCharCount()"
  ></textarea>
  
  <!-- Character Counter -->
  <div class="flex justify-between items-center text-xs text-gray-500">
    <span>Максимум 500 символів</span>
    <span><span id="char-count">0</span> / 500</span>
  </div>
  
  <button onclick="postInternalNote()" class="...">
    <i data-lucide="send" class="w-4 h-4"></i>
    Зберегти нотатку
  </button>
</div>

<script>
function updateCharCount() {
  const textarea = document.getElementById('new-comment-input');
  const charCount = document.getElementById('char-count');
  if (textarea && charCount) {
    charCount.textContent = textarea.value.length;
    
    // Change color if near limit
    if (textarea.value.length > 450) {
      charCount.classList.add('text-red-600', 'font-bold');
    } else {
      charCount.classList.remove('text-red-600', 'font-bold');
    }
  }
}
</script>
```

---

### Dynamic Author Name

Replace Line 9723:
```javascript
// OLD:
author: 'Admin',

// NEW:
author: auth.currentUser?.displayName || auth.currentUser?.email || 'Admin',
```

**Requires:** Firebase Auth user object (`auth.currentUser`)

---

### Add Note Categories/Tags

```javascript
// In postInternalNote() function, modify newNote object:
const newNote = {
  id: `note_${Date.now()}`,
  text: text,
  author: 'Admin',
  createdAt: serverTimestamp(),
  category: document.getElementById('note-category')?.value || 'general', // ← Add this
  priority: document.getElementById('note-priority')?.value || 'normal'   // ← Add this
};
```

**HTML Addition:**
```html
<div class="space-y-2">
  <!-- Category Selector -->
  <select 
    id="note-category" 
    class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
  >
    <option value="general">Загальне</option>
    <option value="payment">Оплата</option>
    <option value="delivery">Доставка</option>
    <option value="customer">Клієнт</option>
  </select>
  
  <!-- Existing textarea -->
  <textarea id="new-comment-input" ...></textarea>
  
  <!-- Existing button -->
  <button onclick="postInternalNote()" ...>...</button>
</div>
```

---

## 🚀 Deployment Command

**After making any changes:**

```bash
firebase deploy --only hosting:adminpanel
```

**Expected output:**
```
✔ Deploy complete!

Project Console: https://console.firebase.google.com/project/my-magazin-81c96/overview
Hosting URL: https://office-connect.latiao-snack.com.ua
```

**Hard refresh browser:** `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

---

## ✅ Verification Steps

1. **Login:** https://office-connect.latiao-snack.com.ua/
2. **Open Order:** Click any order in "Замовлення"
3. **Scroll Down:** Find "Внутрішні нотатки"
4. **Add Note:** Type text, click "Зберегти нотатку"
5. **Check:** Note appears, toast shows "Нотатку збережено!"
6. **Delete:** Hover over note, click trash icon
7. **Check:** Note removed, toast shows "Нотатку видалено!"

---

## 🔗 Related Documents

- **Full Implementation Guide:** `INTERNAL_NOTES_IMPLEMENTATION.md`
- **Code Location Reference:** `INTERNAL_NOTES_CODE_REFERENCE.md`
- **Deployment Guide:** `DEPLOY_ADMIN_PANEL.md`

---

**Document Created:** February 4, 2026  
**Version:** 1.0  
**Status:** Production Ready ✅
