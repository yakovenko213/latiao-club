# CRM Notes - Quick Reference

## 🚀 How to Use

### 1. View Cart Details
```
Click ⋮ on any CRM card → Opens details modal
```

### 2. Add a Note
```
1. Open cart details
2. Scroll to "Нотатки адміністратора"
3. Type your note
4. Click "Додати нотатку"
```

### 3. See Notes Count
```
Yellow badge [📄 3] on card = 3 notes
```

---

## 🎯 Key Features

✅ **Full Cart Details:**
- Customer: Name, Phone, Telegram
- Items: List with prices
- Total amount
- Creation time

✅ **Notes System:**
- Unlimited notes per cart
- Chronological history
- Ukrainian timestamps
- Never overwrites old notes

✅ **Visual Indicators:**
- Badge shows note count
- Only appears if notes exist

---

## 📊 Data Structure

```javascript
// Firestore: abandoned_carts/{id}
{
  notes_history: [
    {
      text: "Your note",
      timestamp: Firestore.Timestamp,
      adminName: "Admin"
    }
  ]
}
```

---

## 🎨 UI Components

### Modal Sections:
1. **Customer Info** (Blue) - Name, phone, telegram, date
2. **Items List** (Gray) - Products with prices
3. **Notes** (Yellow) - History + Add new

### Buttons:
- **Закрити** - Close modal
- **Створити замовлення** - Create order from cart
- **Додати нотатку** - Save note (with spinner)

---

## 🔧 Functions

### Main Functions:
```javascript
openCardDetails(cartId)    // Opens modal
closeCardDetails()         // Closes modal
addNote(cartId)           // Saves note to Firestore
createOrderFromDetails()  // Creates order
renderNotesHistory(arr)   // Renders notes list
```

### Firebase Operations:
```javascript
// Add note (atomic operation)
updateDoc(cartRef, {
  notes_history: arrayUnion(newNote)
});
```

---

## 🧪 Quick Test

1. Open admin panel
2. Go to CRM Kanban
3. Click ⋮ on card
4. Add note: "Test 123"
5. See ✅ success toast
6. Check badge count updated

---

## 📝 Example Use Cases

### Sales Team:
- "Клієнт запитував про доставку"
- "Відправлено SMS з пропозицією"
- "Погодився на замовлення"

### Support:
- "Скарга на якість товару"
- "Повернення товару - обробити"
- "VIP клієнт - особлива увага"

### Management:
- "Перенести в високий пріоритет"
- "Потрібна додаткова знижка"
- "Зв'язатися завтра о 10:00"

---

## ⚡ Performance

- **arrayUnion:** Atomic, no race conditions
- **Local cache:** Instant UI updates
- **Real-time:** Auto-syncs via onSnapshot
- **Optimized:** Only re-renders notes section

---

## 🔮 Coming Soon

- [ ] Admin name from auth
- [ ] Delete note feature
- [ ] Edit note feature
- [ ] Note templates
- [ ] Search by note content
- [ ] @mentions

---

**Full Documentation:** [CRM_NOTES_DELIVERY.md](./CRM_NOTES_DELIVERY.md)
