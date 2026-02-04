# 📝 Система внутрішніх нотаток - Office Connect Admin Panel

**Статус:** ✅ Реалізовано та інтегровано  
**Панель:** https://office-connect.latiao-snack.com.ua/  
**Директорія:** `/functions/private/`  
**Дата:** 3 лютого 2026

---

## 🎯 Огляд функціоналу

Система внутрішніх нотаток дозволяє адміністраторам додавати **приватні коментарі** до замовлень, які **не видимі клієнтам**. Це інструмент для внутрішньої комунікації команди.

### ✨ Основні можливості

1. ✅ **Додавання нотаток** - Textarea з кнопкою "Зберегти нотатку"
2. ✅ **Перегляд історії** - Список всіх нотаток, відсортованих за датою (новіші зверху)
3. ✅ **Видалення нотаток** - Кнопка з іконкою кошика (з'являється при hover)
4. ✅ **Постійне зберігання** - Дані зберігаються в Firestore
5. ✅ **Real-time оновлення** - Нотатки оновлюються одразу після збереження

---

## 🗄️ Схема бази даних Firestore

### Колекція: `orders`

Нотатки зберігаються як **масив об'єктів** у полі `internal_notes`:

```javascript
{
  id: "order_12345",
  customer: { ... },
  items: [ ... ],
  
  // Нові поля для Internal Notes
  internal_notes: [
    {
      id: "note_1738612345000",           // Унікальний ID (timestamp)
      text: "Клієнт попросив додати...",  // Текст нотатки
      author: "Admin",                     // Автор (завжди "Admin")
      createdAt: Timestamp                 // Firestore Timestamp
    },
    {
      id: "note_1738612399000",
      text: "Перевірити наявність...",
      author: "Admin",
      createdAt: Timestamp
    }
  ]
}
```

---

## 📂 Структура коду

### 1️⃣ **Firebase Imports** - `/functions/private/js/admin.js`

```javascript
import { 
    arrayUnion,    // ✅ Додано для додавання нотаток
    arrayRemove    // ✅ Додано для видалення нотаток
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
```

### 2️⃣ **UI Section** - `/functions/private/admin.html` (line ~16025)

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

### 3️⃣ **JavaScript Functions** - `/functions/private/admin.html` (line ~9577)

#### A. Глобальна змінна

```javascript
let currentOrderIdForNotes = null;
```

#### B. Завантаження нотаток

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

#### C. Рендеринг нотаток

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

  // Сортування: новіші зверху
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
  lucide.createIcons();
}
```

#### D. Збереження нової нотатки

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
    
    // ⚠️ КРИТИЧНО: використовуємо arrayUnion для атомарного додавання
    await updateDoc(orderRef, {
      internal_notes: arrayUnion(newNote)
    });

    console.log('✅ Note saved successfully');

    textarea.value = '';
    await loadInternalNotes(orderId);

    // Success toast
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
    button.disabled = false;
    button.innerHTML = originalHtml;
    lucide.createIcons();
  }
};
```

#### E. Видалення нотатки

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
    
    // ⚠️ КРИТИЧНО: використовуємо arrayRemove для атомарного видалення
    await updateDoc(orderRef, {
      internal_notes: arrayRemove(noteToDelete)
    });

    console.log('✅ Note deleted successfully');

    await loadInternalNotes(orderId);

    // Success toast
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

#### F. Helper функція (HTML escape)

```javascript
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
```

### 4️⃣ **Інтеграція з Order Modal**

У функції, де відкривається модальне вікно замовлення (line ~9563):

```javascript
// Перед показом модального вікна
await loadInternalNotes(orderId);

// Show modal
const modal = document.getElementById('order-details-modal')
modal.classList.remove('hidden')
modal.classList.add('flex')
```

---

## 🚀 Як працювати з системою

### Додавання нотатки

1. Відкрийте Order Details modal
2. Прокрутіть до секції "Внутрішні нотатки"
3. Введіть текст у textarea
4. Натисніть "Зберегти нотатку"
5. Нотатка з'явиться у списку зверху

### Видалення нотатки

1. Наведіть курсор на нотатку
2. Натисніть іконку кошика (червона)
3. Підтвердіть видалення
4. Нотатка буде видалена з бази даних

---

## 🔒 Безпека

### ✅ Що реалізовано

1. **arrayUnion/arrayRemove** - атомарні операції, захист від race conditions
2. **HTML Escape** - захист від XSS-атак
3. **Валідація вводу** - перевірка на порожній текст
4. **Try-Catch блоки** - обробка всіх помилок
5. **Підтвердження видалення** - запобігання випадковим видаленням

### ⚠️ Рекомендації

1. **Firestore Rules** - переконайтеся, що тільки адміни мають доступ до `orders` колекції
2. **Auth перевірка** - функція `loadInternalNotes` має працювати тільки для авторизованих адмінів

---

## 📝 Console Logging

Система має детальне логування:

```javascript
console.log('📝 Loading internal notes for order:', orderId);
console.log('✅ Loaded notes:', notes);
console.log('💬 postInternalNote called');
console.log('📤 Posting note for order:', orderId);
console.log('📦 New note object:', newNote);
console.log('✅ Note saved successfully');
console.log('🗑️ Deleting note:', noteId);
console.log('✅ Note deleted successfully');
console.error('❌ Order not found:', orderId);
console.error('❌ Error loading internal notes:', error);
```

---

## 🎨 Дизайн та UX

### Кольорова схема

- **Секція:** Slate фон (`bg-slate-50`) з Slate рамкою (`border-slate-200`)
- **Кнопка:** Blue 600 (`bg-blue-600`)
- **Нотатка:** Біла з Slate рамкою
- **Delete:** Red 600 (`text-red-600`)

### Іконки (Lucide)

- `message-square` - заголовок секції
- `send` - кнопка збереження
- `user` - автор нотатки
- `clock` - час створення
- `trash-2` - видалення

### Анімації

- **Fade-in** для кнопки видалення при hover (`opacity-0` → `opacity-100`)
- **Spinner** під час збереження нотатки
- **Toast notification** після успішних операцій (3 секунди)

---

## 🧪 Тестування

### Перевірка функціоналу

1. ✅ **Створення нотатки**
   ```
   Відкрити замовлення → Додати текст → Зберегти → Перевірити у Firestore
   ```

2. ✅ **Відображення нотаток**
   ```
   Відкрити замовлення → Перевірити, що нотатки завантажились
   ```

3. ✅ **Видалення нотатки**
   ```
   Hover на нотатку → Натиснути trash → Підтвердити → Перевірити у Firestore
   ```

4. ✅ **Порожній список**
   ```
   Відкрити замовлення без нотаток → Перевірити повідомлення "Немає нотаток"
   ```

### Console перевірка

Відкрийте DevTools (F12) і перевірте:

```javascript
// Чи завантажились нотатки?
📝 Loading internal notes for order: <orderId>
✅ Loaded notes: Array(2)

// Чи збереглась нова нотатка?
💬 postInternalNote called
📤 Posting note for order: <orderId>
📦 New note object: { id: "note_1738612345000", ... }
✅ Note saved successfully

// Чи видалилась нотатка?
🗑️ Deleting note: note_1738612345000
📦 Deleting note object: { id: "note_1738612345000", ... }
✅ Note deleted successfully
```

---

## 🚨 Troubleshooting

### Помилка: "postInternalNote is not defined"

**Причина:** Функція не експортована у `window` scope

**Рішення:** ✅ Вже виправлено - функція доступна як `window.postInternalNote`

### Помилка: "Element #internal-notes-feed not found"

**Причина:** UI секція не знайдена в DOM

**Рішення:** Перевірте, що HTML секція додана у модальне вікно

### Нотатки не завантажуються

**Причина:** `loadInternalNotes()` не викликана при відкритті модального вікна

**Рішення:** ✅ Вже виправлено - функція викликається автоматично

### Нотатки не видаляються

**Причина:** `arrayRemove` працює тільки з **точними копіями об'єктів**

**Рішення:** ✅ Вже реалізовано - спочатку fetch повного об'єкта з Firestore

---

## 📦 Deployment

### Крок 1: Збереження змін

```bash
cd /workspaces/latiao-club
git add functions/private/admin.html
git add functions/private/js/admin.js
git add INTERNAL_NOTES_OFFICE_CONNECT.md
git commit -m "✨ Add internal notes system for Office Connect admin panel"
```

### Крок 2: Deploy до Firebase Functions

```bash
firebase deploy --only functions
```

### Крок 3: Перевірка

1. Відкрийте https://office-connect.latiao-snack.com.ua/
2. Авторизуйтеся як адмін
3. Відкрийте Order Details modal
4. Перевірте секцію "Внутрішні нотатки"

---

## 📊 Статистика змін

| Файл | Додано рядків | Змінено | Тип |
|------|---------------|---------|-----|
| `/functions/private/js/admin.js` | 1 | Imports | JavaScript |
| `/functions/private/admin.html` | ~280 | UI + Logic | HTML + JS |
| **Всього** | **~281** | | |

---

## 🎉 Завершення

Система внутрішніх нотаток для Office Connect Admin Panel **повністю готова**!

### ✅ Виконано

- [x] Додано `arrayRemove` у Firestore imports
- [x] Створено UI секцію Internal Notes
- [x] Реалізовано функції `loadInternalNotes()`, `postInternalNote()`, `deleteInternalNote()`
- [x] Інтегровано завантаження нотаток у Order Details modal
- [x] Додано HTML escape для захисту від XSS
- [x] Додано toast notifications
- [x] Створено документацію

---

**Автор:** GitHub Copilot  
**Проект:** Latiao Snack Club CRM  
**Контакт:** https://office-connect.latiao-snack.com.ua/
