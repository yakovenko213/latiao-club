# 🎯 CRM Kanban Board - Visual Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      ADMIN PANEL - Покинуті кошики              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┬────────────────┐                              │
│  │ 📋 Список   │ 🎯 CRM Tracking│  ← View Toggle Tabs          │
│  └─────────────┴────────────────┘                              │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Stats Bar:  Нові: 12 | Контактовано: 8 | В роботі: 5    │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ 🆕 Нові   │  │📨 Контакт│  │💬 В роботі│  │✅ Завершено│   │
│  ├──────────┤  ├──────────┤  ├──────────┤  ├──────────┤      │
│  │          │  │          │  │          │  │          │      │
│  │ ┌──────┐ │  │ ┌──────┐ │  │ ┌──────┐ │  │ ┌──────┐ │      │
│  │ │Card 1│ │  │ │Card 4│ │  │ │Card 7│ │  │ │Card 9│ │      │
│  │ └──────┘ │  │ └──────┘ │  │ └──────┘ │  │ └──────┘ │      │
│  │ ┌──────┐ │  │ ┌──────┐ │  │ ┌──────┐ │  │          │      │
│  │ │Card 2│ │  │ │Card 5│ │  │ │Card 8│ │  │          │      │
│  │ └──────┘ │  │ └──────┘ │  │ └──────┘ │  │          │      │
│  │ ┌──────┐ │  │ ┌──────┐ │  │          │  │          │      │
│  │ │Card 3│ │  │ │Card 6│ │  │          │  │          │      │
│  │ └──────┘ │  │ └──────┘ │  │          │  │          │      │
│  │          │  │          │  │          │  │          │      │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
│       ↑             ↑             ↑             ↑             │
│       └─────────────┴─────────────┴─────────────┘             │
│              Drag-and-Drop between columns                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Kanban Card Structure

```
┌─────────────────────────────────────┐
│  👤 Іван Петренко        2 год тому │  ← Customer + Time
├─────────────────────────────────────┤
│  📞 +380501234567                   │  ← Phone
├─────────────────────────────────────┤
│  🛒 Суперечний Філадельфія +2      │  ← Cart Summary
│  3 шт                               │  ← Item Count
├─────────────────────────────────────┤
│  Сума: ₴1250                        │  ← Total
├─────────────────────────────────────┤
│  [ 📨 SMS ] [✅ Замовлення] [ 👁️ ] │  ← Quick Actions
└─────────────────────────────────────┘
```

## Data Flow

```
┌──────────────────┐
│  User Action     │
│  (Drag Card)     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  SortableJS      │
│  onEnd Event     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  updateDoc()     │
│  Firestore       │
│  {               │
│    crm_status:   │
│    "contacted"   │
│  }               │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  onSnapshot()    │
│  Listener        │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  renderKanban    │
│  Cards()         │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  DOM Updated     │
│  (All Tabs)      │
└──────────────────┘
```

## Tech Stack

```
Frontend:
┌─────────────────────────────────────┐
│  HTML5 + Tailwind CSS               │
│  ├─ Tabs (List / Kanban)            │
│  ├─ 4 Kanban Columns                │
│  ├─ Stats Bar                       │
│  └─ Interactive Cards               │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  JavaScript (Vanilla ES6+)          │
│  ├─ switchAbandonedCartsView()      │
│  ├─ initializeKanban()              │
│  ├─ renderKanbanCards()             │
│  ├─ createKanbanCard()              │
│  └─ initializeKanbanDragDrop()      │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Libraries                          │
│  ├─ SortableJS 1.15.0 (Drag-Drop)  │
│  ├─ Lucide Icons (UI Icons)         │
│  └─ Firebase SDK 10.7.1             │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Firebase Firestore                 │
│  Collection: abandoned_carts        │
│  {                                  │
│    customer: { ... },               │
│    items: [ ... ],                  │
│    total: 1250,                     │
│    crm_status: "new" | "contacted"  │
│                | "in-progress"      │
│                | "completed"        │
│  }                                  │
└─────────────────────────────────────┘
```

## File Structure

```
latiao-club/
├── admin-site/
│   ├── index.html  ← Modified (Kanban HTML)
│   └── js/
│       └── admin.js  ← Modified (Kanban Functions)
│
├── CRM_KANBAN_QUICKSTART.md  ← Technical Docs
├── CRM_KANBAN_DELIVERY.md    ← Implementation Summary
├── CRM_KANBAN_DEPLOY.md      ← Deployment Guide
└── test-kanban-deployment.sh ← Test Script
```

## User Workflow

```
┌─────────────────────────────────────────────────────────┐
│                   Abandoned Cart Journey                │
└─────────────────────────────────────────────────────────┘

1. Cart Abandoned (Customer leaves site)
          ↓
   ┌──────────────┐
   │  🆕 Нові     │  ← Card appears in "New" column
   └──────────────┘
          ↓
2. Admin sends SMS (clicks 📨 button)
          ↓
   Drag card to ↓
   ┌──────────────┐
   │ 📨 Контактов │  ← "Contacted" column
   └──────────────┘
          ↓
3. Customer responds (WhatsApp/SMS/Call)
          ↓
   Drag card to ↓
   ┌──────────────┐
   │ 💬 В роботі  │  ← "In Progress" column
   └──────────────┘
          ↓
4. Close deal:
   Option A: Convert to order (click ✅ Замовлення)
          ↓
   Card DELETED (auto) + Order created
   
   Option B: Customer declines
          ↓
   Drag card to ↓
   ┌──────────────┐
   │ ✅ Завершено │  ← "Completed" column (Lost)
   └──────────────┘
```

## Real-Time Sync

```
Tab 1 (Admin A)         Tab 2 (Admin B)
┌──────────────┐        ┌──────────────┐
│   Нові       │        │   Нові       │
│  ┌────────┐  │        │  ┌────────┐  │
│  │ Card 1 │  │        │  │ Card 1 │  │
│  └────────┘  │        │  └────────┘  │
└──────────────┘        └──────────────┘
       │
       │ Admin A drags Card 1
       │ to "Контактовано"
       ↓
  updateDoc(crm_status: "contacted")
       │
       ↓
┌──────────────────────────────┐
│  Firestore Database          │
│  crm_status: "contacted"     │
└──────────────────────────────┘
       │
       │ onSnapshot detects change
       ↓
┌──────────────┐        ┌──────────────┐
│ Контактовано │        │ Контактовано │
│  ┌────────┐  │        │  ┌────────┐  │
│  │ Card 1 │◄─┼────────┼─►│ Card 1 │  │  ← Both tabs update!
│  └────────┘  │        │  └────────┘  │
└──────────────┘        └──────────────┘
```

## Quick Actions Flow

```
Card Quick Actions:
┌─────────────────────────────────────┐
│  [ 📨 SMS ] [✅ Замовлення] [ 👁️ ] │
└─────┬─────────┬──────────────┬──────┘
      │         │              │
      ▼         ▼              ▼
┌──────────┐ ┌────────────┐ ┌────────┐
│   SMS    │ │  Convert   │ │  View  │
│  Modal   │ │  to Order  │ │ Details│
└──────────┘ └────────────┘ └────────┘
      │              │            │
      ▼              ▼            ▼
  Send SMS     Create order   Show modal
      │              │
      ▼              ▼
  Move to     Delete cart
"Contacted"   (auto-removed
              from Kanban)
```

## Performance

```
Firestore Operations:

List View (Traditional):
  - getDocs(): 1 read on load
  - Manual refresh: Click button
  
Kanban View (Real-Time):
  - onSnapshot(): 1 initial read + live updates
  - Active only when Kanban open
  - Auto-unsubscribes on view switch
  
Card Drag:
  - updateDoc(): 1 write per drag
  - No additional reads (onSnapshot handles)
  
7-Day Filter:
  - Limits query size
  - Only recent carts loaded
```

## CSS Classes

```
View Toggle:
  .abandoned-carts-view-mode
  .hidden

Kanban Structure:
  .kanban-column
  .kanban-column-header
  .kanban-cards
  .kanban-count
  .kanban-card

SortableJS States:
  .sortable-ghost    ← Placeholder during drag
  .sortable-chosen   ← Card being dragged
  .sortable-drag     ← Card in motion

Animations:
  .animate-fade-in
  .animate-slide-up
  .transition-all
```

## Firestore Schema Extension

```
Before (Old):
{
  customer: { fullName, phone },
  items: [ ... ],
  total: 1250,
  updatedAt: Timestamp,
  archived: false
}

After (With CRM):
{
  customer: { fullName, phone },
  items: [ ... ],
  total: 1250,
  updatedAt: Timestamp,
  archived: false,
  crm_status: "new" ← NEW FIELD
}
```

## Function Call Hierarchy

```
User clicks "🎯 CRM Tracking" tab
  ↓
switchAbandonedCartsView('kanban')
  ├─ Hide list view
  ├─ Show Kanban view
  ├─ Update tab styling
  └─ initializeKanban()
      ├─ initializeKanbanDragDrop()
      │   └─ new Sortable(...) × 4 columns
      │       └─ onEnd: updateDoc()
      └─ onSnapshot(query, callback)
          └─ renderKanbanCards(docs)
              ├─ Clear all columns
              ├─ Loop docs
              │   └─ createKanbanCard(phone, cart)
              │       └─ Return HTML string
              ├─ Insert cards into columns
              └─ Update stats/counters
```

## Testing Matrix

```
✅ Unit Tests (Automated):
  - HTML structure verification
  - JavaScript function checks
  - CSS class validation
  - Library dependency checks

✅ Integration Tests (Manual):
  - View toggle (List ↔ Kanban)
  - Drag-and-drop functionality
  - Firestore updates
  - Real-time synchronization
  - Quick action buttons
  - Toast notifications

✅ Performance Tests:
  - Firestore read/write counts
  - UI responsiveness
  - Multi-tab behavior
  - Memory leaks (listener cleanup)

✅ Browser Compatibility:
  - Chrome (Desktop/Mobile)
  - Firefox (Desktop/Mobile)
  - Safari (Desktop/iOS)
  - Edge (Desktop)
```

## Success Metrics

```
KPI Dashboard:

Recovery Rate:
  Before: X% converted
  After:  Y% converted
  Goal:   +15% improvement

Response Time:
  Before: X hours to first contact
  After:  Y hours to first contact
  Goal:   <2 hours

Completion Rate:
  Cards moving from Нові → Завершено
  Goal:   >60% completion rate

Admin Engagement:
  Kanban view usage
  Cards moved per day
  Goal:   Daily active usage
```

---

## Summary

**Implementation:** CRM Kanban Board with 4-column workflow, drag-and-drop, and real-time sync

**Tech:** Vanilla JS + SortableJS + Firestore onSnapshot

**Impact:** Visual workflow → Higher cart recovery rate

**Status:** ✅ PRODUCTION READY

**Deploy:** `firebase deploy --only hosting`

---

*Visual diagrams provided for clarity. See CRM_KANBAN_QUICKSTART.md for technical details.*
