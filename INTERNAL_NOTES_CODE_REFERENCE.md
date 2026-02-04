# 📍 Internal Notes - Code Location Reference

## 🎯 Quick Navigation

### File Structure
```
/workspaces/latiao-club/
└── functions/
    └── private/
        ├── index.html          ← Main file (16,625 lines)
        └── js/
            └── admin.js        ← Additional logic
```

---

## 📄 index.html - Key Sections

### 1️⃣ **UI Section (HTML)**
**Lines:** 16287-16322  
**Location:** Inside Order Details Modal

```html
<!-- Internal Notes Section (Admin Only) -->
<div class="bg-slate-50 rounded-xl border-2 border-slate-200 p-5 mt-6">
  <h4 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
    <i data-lucide="message-square" class="w-5 h-5 text-slate-600"></i>
    Внутрішні нотатки (тільки для адмінів)
  </h4>

  <!-- Notes Feed -->
  <div id="internal-notes-feed" class="space-y-3 mb-4 max-h-64 overflow-y-auto">
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

**Key Elements:**
- `#internal-notes-feed` - Container for notes list
- `#new-comment-input` - Textarea for new note
- `postInternalNote()` - Button onClick handler

---

### 2️⃣ **JavaScript Logic**
**Lines:** 9557-9820  
**Location:** Inside `<script type="module">` tag

#### A. Global Variable (Line 9588)
```javascript
let currentOrderIdForNotes = null;
```

#### B. Load Notes Function (Lines 9590-9614)
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

#### C. Render Function (Lines 9617-9682)
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

#### D. Save Note Function (Lines 9685-9758)
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

    const orderRef = doc(db, 'orders', orderId);
    
    await updateDoc(orderRef, {
      internal_notes: arrayUnion(newNote)
    });

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

#### E. Delete Note Function (Lines 9761-9820)
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

    const orderRef = doc(db, 'orders', orderId);
    
    await updateDoc(orderRef, {
      internal_notes: arrayRemove(noteToDelete)
    });

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

#### F. Helper Function (Lines 9823-9827)
```javascript
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
```

---

### 3️⃣ **Modal Opening Logic**
**Line:** 9557  
**Function:** Loads notes when modal opens

```javascript
// Inside openOrderModal() function
window.currentEditingOrderId = orderId  // Line 9518

// ... (other modal setup) ...

// LOAD INTERNAL NOTES
await loadInternalNotes(orderId);  // Line 9557

// Show modal
const modal = document.getElementById('order-details-modal')
modal.classList.remove('hidden')
modal.classList.add('flex')
```

---

### 4️⃣ **Modal Closing Logic**
**Lines:** 9574-9581  
**Function:** Cleans up when modal closes

```javascript
window.closeOrderModal = function () {
  const modal = document.getElementById('order-details-modal')
  modal.classList.add('hidden')
  modal.classList.remove('flex')
  // Clear the editing order ID
  window.currentEditingOrderId = null
}
```

---

## 🗺️ Visual DOM Structure

```
#order-details-modal
└── .bg-white.rounded-2xl
    ├── Header (Order ID, Date)
    ├── Body (.p-6)
    │   ├── Customer Info Grid
    │   ├── TTN Section
    │   ├── Payment Details
    │   ├── Order Items Table
    │   └── Internal Notes Section ← HERE
    │       └── .bg-slate-50.rounded-xl
    │           ├── <h4> Title + Icon
    │           ├── #internal-notes-feed
    │           │   └── (dynamically rendered notes)
    │           └── New Note Form
    │               ├── #new-comment-input (textarea)
    │               └── <button onclick="postInternalNote()">
    └── Footer (Total, Buttons)
```

---

## 🔗 Function Call Flow

```
User clicks order row
  ↓
openOrderModal(orderId) called
  ↓
window.currentEditingOrderId = orderId
  ↓
loadInternalNotes(orderId)
  ↓
getDoc(db, 'orders', orderId)
  ↓
renderInternalNotes(notes)
  ↓
DOM updated with notes list
  ↓
Modal shown
```

---

## ✍️ Add Note Flow

```
User types in #new-comment-input
  ↓
User clicks "Зберегти нотатку"
  ↓
postInternalNote() called
  ↓
Validate: orderId exists, text not empty
  ↓
Create note object: { id, text, author, createdAt }
  ↓
updateDoc(orderRef, { internal_notes: arrayUnion(newNote) })
  ↓
Clear textarea
  ↓
loadInternalNotes(orderId) - refresh list
  ↓
Show success toast
```

---

## 🗑️ Delete Note Flow

```
User hovers over note
  ↓
Delete button appears
  ↓
User clicks trash icon
  ↓
deleteInternalNote(noteId) called
  ↓
Confirm deletion dialog
  ↓
Fetch order document
  ↓
Find exact note object by ID
  ↓
updateDoc(orderRef, { internal_notes: arrayRemove(noteToDelete) })
  ↓
loadInternalNotes(orderId) - refresh list
  ↓
Show success toast
```

---

## 📦 Firebase Imports

**Location:** Top of `<script type="module">` (Lines ~240)

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
    serverTimestamp,
    onSnapshot,
    writeBatch,
    increment,
    arrayUnion,    // ← Used for adding notes
    arrayRemove    // ← Used for deleting notes
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
```

---

## 🎯 Key DOM IDs

| ID | Purpose | Type |
|---|---|---|
| `#order-details-modal` | Main modal container | `<div>` |
| `#internal-notes-feed` | Notes list container | `<div>` |
| `#new-comment-input` | Note text input | `<textarea>` |
| `window.currentEditingOrderId` | Current order ID | Global var |
| `currentOrderIdForNotes` | Backup order ID | Global var |

---

## 🔍 Search/Find Commands

**Find UI Section:**
```
Search in index.html: "Внутрішні нотатки"
Line: 16292
```

**Find Load Function:**
```
Search in index.html: "window.loadInternalNotes"
Line: 9590
```

**Find Save Function:**
```
Search in index.html: "window.postInternalNote"
Line: 9685
```

**Find Delete Function:**
```
Search in index.html: "window.deleteInternalNote"
Line: 9761
```

---

## 📝 Customization Points

### Change Note Colors
**Line:** 16287
```html
<div class="bg-slate-50 rounded-xl border-2 border-slate-200 p-5 mt-6">
```
Change `bg-slate-50` and `border-slate-200` to your preferred Tailwind colors.

---

### Change Button Color
**Line:** 16310
```html
class="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
```
Change `bg-blue-600 hover:bg-blue-700` to match your brand.

---

### Change Author Name
**Line:** 9723
```javascript
author: 'Admin',
```
Change to dynamic: `author: currentUser.displayName || 'Admin'`

---

### Add Character Counter
Add below textarea (Line ~16308):
```html
<div class="text-xs text-gray-500 text-right">
  <span id="char-count">0</span>/500 символів
</div>

<script>
const textarea = document.getElementById('new-comment-input');
textarea.addEventListener('input', (e) => {
  document.getElementById('char-count').textContent = e.target.value.length;
});
</script>
```

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Modal opens when clicking order
- [ ] "Внутрішні нотатки" section visible
- [ ] Existing notes load correctly
- [ ] Can add new note
- [ ] Success toast appears after save
- [ ] Note appears in list immediately
- [ ] Can delete note with confirmation
- [ ] Timestamp shows correct time
- [ ] No console errors
- [ ] Works on mobile/tablet

---

**Document Updated:** February 4, 2026  
**Version:** 1.0
