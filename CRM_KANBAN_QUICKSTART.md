# 🎯 CRM Kanban Board - Quick Reference

## Overview
Професійна CRM-система відстеження покинутих кошиків з Kanban-дошкою, драг-енд-дроп та real-time оновленнями.

## 🚀 Features Implemented

### 1. **Dual View Mode**
- 📋 **List View** (Default): Traditional table view
- 🎯 **CRM Tracking View**: Kanban board with 4 columns

### 2. **Kanban Columns**
```
🆕 Нові → 📨 Контактовано → 💬 В роботі → ✅ Завершено
```

| Column | Status | Description |
|--------|--------|-------------|
| 🆕 Нові | `new` | Щойно покинули кошик |
| 📨 Контактовано | `contacted` | Надіслано SMS/Push нагадування |
| 💬 В роботі | `in-progress` | Активне спілкування з клієнтом |
| ✅ Завершено | `completed` | Конвертовано в замовлення або втрачено |

### 3. **Drag-and-Drop**
- Powered by **SortableJS** (already loaded)
- Real-time Firestore updates on card drop
- Visual feedback during drag (scale, shadow, rotation)
- Automatic revert on error

### 4. **Real-Time Updates**
- Uses Firestore `onSnapshot` listener
- Instant sync across all admin tabs
- Auto-refresh when card status changes

### 5. **Kanban Cards**
Each card displays:
- 👤 Customer name
- 📞 Phone number
- 🛒 Cart summary (items count + first item name)
- 💰 Total amount
- ⏰ Time since abandonment
- 🔘 Quick actions (SMS, Convert to Order, View Details)

### 6. **Statistics Bar**
Top stats bar shows real-time counts for each column:
```
Нові: 12 | Контактовано: 8 | В роботі: 5 | Завершено: 23
```

---

## 📂 Files Modified

### 1. `/admin-site/index.html`
**Changes:**
- Added tab navigation (List/Kanban toggle)
- Wrapped existing table in `#abandoned-carts-list-view`
- Added `#abandoned-carts-kanban-view` section with 4 columns
- Stats bar with counters
- Kanban card containers (`#kanban-column-new`, etc.)

**Key Elements:**
```html
<!-- Tabs -->
<button id="tab-list-view" onclick="switchAbandonedCartsView('list')">
<button id="tab-kanban-view" onclick="switchAbandonedCartsView('kanban')">

<!-- Kanban View -->
<div id="abandoned-carts-kanban-view" class="hidden">
  <div id="kanban-column-new" data-status="new"></div>
  <div id="kanban-column-contacted" data-status="contacted"></div>
  <div id="kanban-column-in-progress" data-status="in-progress"></div>
  <div id="kanban-column-completed" data-status="completed"></div>
</div>
```

### 2. `/admin-site/js/admin.js`
**New Functions:**

#### `switchAbandonedCartsView(view)`
Switches between 'list' and 'kanban' views. Updates tabs, shows/hides containers.

```javascript
window.switchAbandonedCartsView('kanban'); // Switch to Kanban
```

#### `initializeKanban()`
- Sets up SortableJS for drag-and-drop
- Creates Firestore real-time listener with `onSnapshot`
- Filters carts from last 7 days

#### `renderKanbanCards(docs)`
- Clears all columns
- Loops through Firestore documents
- Creates cards with `createKanbanCard()`
- Updates stats counters

#### `createKanbanCard(phone, cart)`
Returns HTML string for a single Kanban card with:
- Customer info
- Time calculation
- Quick action buttons

#### `initializeKanbanDragDrop()`
Sets up SortableJS on all 4 columns:
```javascript
new Sortable(column, {
  group: 'kanban',
  animation: 200,
  onEnd: async (evt) => {
    // Update Firestore with new status
    await updateDoc(doc(db, 'abandoned_carts', cartId), {
      crm_status: newStatus,
      updatedAt: serverTimestamp()
    });
  }
});
```

#### Helper Functions
- `getStatusLabel(status)` - Ukrainian labels
- `showQuickToast(message, type)` - Toast notifications

---

## 🗄️ Firestore Schema Changes

### New Field: `crm_status`
Added to `abandoned_carts` collection:

```javascript
{
  customer: { ... },
  items: [ ... ],
  total: 1250,
  updatedAt: Timestamp,
  
  // NEW FIELD
  crm_status: "new" | "contacted" | "in-progress" | "completed"
}
```

**Default Value:** `"new"` (if field doesn't exist)

**Migration:** Existing carts without `crm_status` will appear in "Нові" column automatically.

---

## 🎨 CSS Styling

All Kanban styles already exist in `<style>` section (lines 30-200):

```css
/* Kanban card animations */
.kanban-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.kanban-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.1);
}

/* SortableJS ghost/drag states */
.sortable-ghost { opacity: 0.4; background: #fed7aa; }
.sortable-chosen { transform: rotate(2deg) scale(1.02); }
.sortable-drag { box-shadow: 0 20px 40px rgba(249, 115, 22, 0.3); }
```

---

## 🔧 Usage Instructions

### Switch to Kanban View
1. Open Admin Panel → Abandoned Carts section
2. Click **"🎯 CRM Tracking"** tab
3. Kanban board loads automatically

### Move Cards
1. **Grab** a card (click and hold)
2. **Drag** to another column
3. **Drop** - Firestore updates instantly
4. Toast notification confirms: *"Картку переміщено до..."*

### Quick Actions on Cards
- **📨 SMS** - Send recovery SMS
- **✅ Замовлення** - Convert to order (calls `convertToOrder()`)
- **👁️ View** - Open cart details modal

### View Real-Time Updates
- Open admin panel in 2 browser tabs
- Move a card in Tab 1
- Tab 2 updates automatically (onSnapshot)

---

## 🐛 Troubleshooting

### Cards Not Appearing
**Issue:** Kanban columns empty  
**Fix:** Check Firestore query (7-day filter)
```javascript
// admin.js line ~1595
const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
```

### Drag Not Working
**Issue:** SortableJS not initializing  
**Fix:** Check browser console for errors, ensure SortableJS loaded:
```html
<!-- index.html line 17 -->
<script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>
```

### Firestore Permission Denied
**Issue:** `updateDoc` fails  
**Fix:** Check Firestore rules allow admin writes:
```javascript
// firestore.rules
match /abandoned_carts/{cartId} {
  allow read, write: if request.auth != null;
}
```

### Real-Time Not Updating
**Issue:** Cards don't sync across tabs  
**Fix:** Check `onSnapshot` listener is active:
```javascript
console.log(kanbanUnsubscribe); // Should not be null in Kanban view
```

---

## 📊 Performance Notes

### Real-Time Listener
- **Active only in Kanban view** (stopped when switching to List)
- Queries last 7 days only (not entire collection)
- Unsubscribes automatically on view switch

### Firestore Reads
- **List View:** 1 read per load (getDocs)
- **Kanban View:** 1 initial read + real-time updates (onSnapshot)
- No duplicate reads when dragging (updateDoc only)

---

## 🚀 Future Enhancements

### Possible Additions
1. **Filter by status** - Show only "В роботі" cards
2. **Search** - Find cart by customer name/phone
3. **Archive view** - Separate Kanban for archived carts
4. **Notes field** - Add internal notes per card
5. **SMS history** - Show which messages were sent
6. **Conversion rate** - Calculate % of recovered carts
7. **Bulk actions** - Select multiple cards and move at once

### Code Locations for Enhancements
```javascript
// Add filters
// Location: admin.js after line 1595 (initializeKanban)
const statusFilter = document.getElementById('kanban-status-filter').value;

// Add search
// Location: admin.js after line 1625 (renderKanbanCards)
const searchTerm = document.getElementById('kanban-search').value;

// Add notes
// Location: admin.js in createKanbanCard function (line 1680)
<textarea placeholder="Додати нотатку..." data-cart-id="${phone}"></textarea>
```

---

## ✅ Testing Checklist

- [x] Switch between List and Kanban views
- [x] Drag card from "Нові" to "Контактовано"
- [x] Verify Firestore `crm_status` field updated
- [x] Check toast notification appears
- [x] Open 2 tabs, verify real-time sync
- [x] Click "SMS" button on card
- [x] Click "Замовлення" button - converts to order
- [x] Click "View" button - opens details modal
- [x] Verify stats bar counts update
- [x] Check column badges update
- [x] Test with archived carts toggle

---

## 📝 Code Summary

### HTML Structure
```
Abandoned Carts Section
├── Header (buttons, refresh)
├── Tabs (List/Kanban toggle)
├── List View (existing table)
└── Kanban View
    ├── Stats Bar (4 counters)
    └── Board (4 columns)
        ├── Column: Нові
        ├── Column: Контактовано
        ├── Column: В роботі
        └── Column: Завершено
```

### JavaScript Functions
```
switchAbandonedCartsView(view)
  └─> initializeKanban()
       ├─> initializeKanbanDragDrop() [SortableJS]
       └─> onSnapshot() listener
            └─> renderKanbanCards(docs)
                 ├─> createKanbanCard(phone, cart) [HTML]
                 └─> Update stats/counters
```

### Data Flow
```
User drags card
  └─> SortableJS onEnd event
       └─> updateDoc(crm_status)
            └─> onSnapshot detects change
                 └─> renderKanbanCards()
                      └─> DOM updated (all tabs)
```

---

## 🎓 Key Technologies

| Technology | Purpose | Documentation |
|------------|---------|---------------|
| **Tailwind CSS** | Styling | https://tailwindcss.com |
| **SortableJS** | Drag-and-drop | https://sortablejs.github.io/Sortable/ |
| **Firestore** | Real-time DB | https://firebase.google.com/docs/firestore |
| **Lucide Icons** | Icon set | https://lucide.dev |

---

## 📞 Support

**Contact:** Development Team  
**Last Updated:** 2025-01-25  
**Version:** 1.0.0

---

*This Kanban board improves abandoned cart recovery by visualizing the entire customer journey from abandonment to conversion.*
