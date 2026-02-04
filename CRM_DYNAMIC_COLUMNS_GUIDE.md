# 🎯 CRM Dynamic Kanban Columns - Quick Reference

## ✨ Overview
Your CRM system now has **fully dynamic columns** stored in Firestore. Add, edit, and delete workflow stages without touching code!

---

## 🗄️ Firestore Structure

### Collection: `crm_columns`
Each document represents one Kanban column:

```javascript
{
  id: "new",                    // Unique column ID
  title: "Нові",                // Display title
  emoji: "🆕",                   // Column icon
  description: "Щойно покинули кошик",  // Subtitle
  order: 1                      // Sort order
}
```

### Default Columns (Auto-created on first load):
1. **new** → Нові 🆕
2. **contacted** → СМС Відправлено 📨  
3. **in-progress** → В роботі 💬
4. **completed** → Завершено ✅

---

## 🚀 How to Use

### 1️⃣ Add New Column
1. Click the **"+ Додати колонку"** button at the end of the board
2. Edit modal opens automatically
3. Set:
   - **Title:** Column name (e.g., "Очікування оплати")
   - **Emoji:** Icon (e.g., "💳")
   - **Description:** Brief explanation (optional)
4. Click **Зберегти**

**Firestore Action:** Creates new document in `crm_columns`

---

### 2️⃣ Edit Column
1. Hover over column header
2. Click the **⋮** (three dots) menu button
3. Select **Редагувати**
4. Modify title, emoji, or description
5. Click **Зберегти**

**Firestore Action:** Updates document in `crm_columns`

---

### 3️⃣ Delete Column
1. Click **⋮** menu on column header
2. Select **Видалити**
3. System checks if column is empty
4. Confirm deletion

**Safety Check:** Cannot delete columns with cards inside!

---

### 4️⃣ Drag & Drop Cards
- Works seamlessly with ALL columns (even custom ones)
- Dragging a card updates its `crm_status` field in Firestore
- Real-time sync across all users

---

## 🎨 Color Schemes
The system automatically cycles through 8 beautiful color schemes:
1. Gray (default)
2. Blue
3. Amber
4. Green
5. Purple
6. Pink
7. Indigo
8. Red

**Each column gets its unique color based on order!**

---

## 🔧 Technical Details

### Key Functions (crm.js):

```javascript
// Initialize system (loads columns & carts)
initializeKanban()

// Ensure defaults exist
ensureDefaultColumns()

// Load columns from Firestore
loadColumns()

// Real-time listener for columns
setupColumnsListener()

// Real-time listener for carts
setupCartsListener()

// Render columns dynamically
renderColumns()

// Column management
addNewColumn()
editColumn(columnId)
saveColumnEdit()
deleteColumn(columnId)
```

### HTML Structure:

```html
<!-- Dynamic container -->
<div id="kanban-board-container" class="flex gap-6 overflow-x-auto">
  <!-- Columns rendered here by renderColumns() -->
</div>

<!-- Edit modal -->
<div id="column-edit-modal">
  <!-- Edit form -->
</div>
```

---

## 📊 How Abandoned Carts Are Assigned

1. Cart created → `crm_status: null` (or first column ID)
2. User drags card → `crm_status` updates to new column ID
3. renderKanbanCards() reads `crm_status` and places card in correct column

**Example:**
```javascript
{
  phone: "+380123456789",
  crm_status: "contacted",  // ← Determines column placement
  items: [...],
  total: 500
}
```

---

## 🛡️ Safety Features

✅ **Empty Check:** Cannot delete columns with cards  
✅ **Confirmation:** Delete requires user confirmation  
✅ **Real-time Sync:** All users see changes instantly  
✅ **Default Fallback:** New carts go to first column if no status  
✅ **Error Handling:** Toast notifications for all actions  

---

## 🎯 Use Cases

### Scenario 1: Adding Payment Stage
```
1. Click "+ Додати колонку"
2. Title: "Очікування оплати"
3. Emoji: "💳"
4. Description: "Клієнт отримав реквізити"
5. Save!
```

### Scenario 2: Renaming Stage
```
1. Click ⋮ on "СМС Відправлено"
2. Change to "Контактовано" 
3. Update emoji to "📞"
4. Save!
```

### Scenario 3: Removing Old Stage
```
1. Move all cards out of column
2. Click ⋮ → Видалити
3. Confirm deletion
4. Column disappears from board
```

---

## 🔥 Pro Tips

💡 **Unlimited Columns:** Add as many stages as you need  
💡 **Emoji Power:** Use creative emojis for visual appeal  
💡 **Horizontal Scroll:** Board scrolls smoothly for many columns  
💡 **Real-time:** Changes visible to all team members instantly  
💡 **No Downtime:** Add/edit columns while system is running  

---

## 📦 Deployment

```bash
# Deploy changes
firebase deploy --only hosting:admin-store-latio

# Test URL
https://office-connect.latiao-snack.com.ua/crm.html
```

---

## 🆘 Troubleshooting

### Columns not appearing?
- Check browser console for Firestore errors
- Verify `crm_columns` collection exists
- Run `ensureDefaultColumns()` manually

### Can't delete column?
- Move all cards to another column first
- System prevents deleting non-empty columns

### Drag & drop not working?
- Check if SortableJS is loaded
- Verify `initializeKanbanDragDrop()` is called after `renderColumns()`

---

## 📚 Related Files

- `/admin-site/crm.html` - Page structure + edit modal
- `/admin-site/js/crm.js` - All dynamic column logic
- Firestore collections:
  - `crm_columns` - Column definitions
  - `abandoned_carts` - Cart data with `crm_status`

---

**Built with ❤️ for flexible CRM workflows!**
