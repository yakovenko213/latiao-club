# 🚀 Quick Reference: Internal Notes System

**Admin Panel:** https://office-connect.latiao-snack.com.ua/  
**Status:** ✅ Live & Deployed

---

## 📍 Розташування коду

```plaintext
/functions/private/
  ├── admin.html         (Line ~9577: Functions, Line ~16025: UI)
  └── js/
      └── admin.js       (Line 20: arrayRemove import)
```

---

## 🎯 Основні функції

### 1️⃣ Завантаження нотаток

```javascript
await loadInternalNotes(orderId);
```

**Де викликається:** Автоматично при відкритті Order Details modal (line ~9568)

### 2️⃣ Додавання нотатки

```javascript
window.postInternalNote()
```

**Де:** При кліку на кнопку "Зберегти нотатку"  
**UI:** Textarea `#new-comment-input`

### 3️⃣ Видалення нотатки

```javascript
window.deleteInternalNote(noteId)
```

**Де:** При кліку на trash icon у кожній нотатці

---

## 🗄️ База даних

**Firestore Collection:** `orders`  
**Field:** `internal_notes` (array)

```javascript
{
  id: "note_1738612345000",
  text: "Текст нотатки",
  author: "Admin",
  createdAt: Timestamp
}
```

---

## 🔧 Firestore Operations

### Додавання

```javascript
await updateDoc(orderRef, {
  internal_notes: arrayUnion(newNote)
});
```

### Видалення

```javascript
await updateDoc(orderRef, {
  internal_notes: arrayRemove(noteToDelete)
});
```

---

## 🎨 UI Elements

| ID | Тип | Опис |
|----|-----|------|
| `#internal-notes-feed` | div | Контейнер для списку нотаток |
| `#new-comment-input` | textarea | Поле вводу нової нотатки |

---

## 🚨 Як відлагоджувати

### Console logs

```javascript
console.log('📝 Loading internal notes for order:', orderId);
console.log('✅ Loaded notes:', notes);
console.log('💬 postInternalNote called');
console.log('✅ Note saved successfully');
console.log('🗑️ Deleting note:', noteId);
```

### Перевірка в DevTools

1. F12 → Console
2. Відкрити Order Details
3. Шукати `📝 Loading internal notes`

---

## ⚡ Швидкі команди

### Deploy

```bash
cd /workspaces/latiao-club
firebase deploy --only functions
```

**URL після deploy:**  
https://adminpanel-6bhm4jhyba-uc.a.run.app

### Rollback (якщо потрібно)

```bash
git revert HEAD
firebase deploy --only functions
```

---

## 📋 Чеклист перевірки

- [ ] Відкрити https://office-connect.latiao-snack.com.ua/
- [ ] Авторизуватись як адмін
- [ ] Відкрити будь-яке замовлення
- [ ] Прокрутити до секції "Внутрішні нотатки"
- [ ] Додати нову нотатку
- [ ] Перевірити, що нотатка збереглась у Firestore
- [ ] Видалити нотатку через trash icon
- [ ] Перевірити Console logs (F12)

---

## 🔗 Корисні посилання

- [Firestore arrayUnion](https://firebase.google.com/docs/firestore/manage-data/add-data#update_elements_in_an_array)
- [Firestore arrayRemove](https://firebase.google.com/docs/firestore/manage-data/add-data#remove_elements_from_an_array)
- [Lucide Icons](https://lucide.dev/)

---

**Повна документація:** [INTERNAL_NOTES_OFFICE_CONNECT.md](./INTERNAL_NOTES_OFFICE_CONNECT.md)
