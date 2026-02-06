# 📑 Tab-Based Archive System - Implementation Guide

## 🎯 Overview

The Review Requests section now features a **clean tab-based navigation** system for managing Active and Archived orders. This provides a more intuitive, organized workspace compared to the previous toggle button approach.

---

## ✨ Key Features

### 1. **Tab Navigation**
- **📥 Активні** - Shows active orders (default view)
- **📁 Архів** - Shows archived orders
- Clean, modern design with active state highlighting
- Counter badges show real-time order counts

### 2. **Visual Design**
- **Active Tab**: Orange background (`bg-orange-100 text-orange-700`) with border accent
- **Archive Tab**: Blue background when active (`bg-blue-100 text-blue-700`)
- **Inactive tabs**: Gray neutral styling
- Smooth transitions and hover effects

### 3. **Smart Counter Badges**
- Shows total count of orders in each category
- Updates in real-time when orders are archived/restored
- Queries ALL completed orders for accurate counts

### 4. **Context-Aware Actions**
- **Active View**:
  - "В архів" button (orange) for each order
  - "Архівувати всі опрацьовані" bulk button visible
- **Archive View**:
  - "Відновити" button (blue) for each order
  - Bulk archive button hidden

### 5. **Instant Feedback**
- Toast notification: "Замовлення переміщено в архів"
- Toast notification: "Замовлення відновлено"
- Real-time UI updates via Firebase onSnapshot

---

## 🎨 UI Components

### Tab Navigation Bar

```html
<div class="flex items-center justify-between gap-4 bg-white rounded-xl border border-gray-200 overflow-hidden">
  <div class="flex items-stretch">
    <!-- Active Tab -->
    <button 
      id="review-active-tab"
      onclick="switchReviewArchiveTab('active')" 
      class="flex items-center gap-2 px-6 py-4 bg-orange-100 text-orange-700 font-semibold border-b-4 border-orange-500 transition-all hover:bg-orange-50"
      type="button">
      <i data-lucide="inbox" class="w-4 h-4"></i>
      <span>📥 Активні</span>
      <span id="active-orders-count" class="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-orange-200 text-orange-900 rounded-full text-xs font-bold">0</span>
    </button>
    
    <!-- Archive Tab -->
    <button 
      id="review-archive-tab"
      onclick="switchReviewArchiveTab('archive')" 
      class="flex items-center gap-2 px-6 py-4 bg-gray-50 text-gray-500 font-medium border-b-4 border-transparent transition-all hover:bg-gray-100"
      type="button">
      <i data-lucide="archive" class="w-4 h-4"></i>
      <span>📁 Архів</span>
      <span id="archived-orders-count" class="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-gray-200 text-gray-600 rounded-full text-xs font-bold">0</span>
    </button>
  </div>
  
  <!-- Bulk Archive Button -->
  <button 
    id="bulk-archive-btn"
    onclick="bulkArchiveOrders()" 
    class="inline-flex items-center gap-2 px-4 py-2 mx-4 bg-orange-500 text-white hover:bg-orange-600 rounded-lg font-medium text-sm transition-all"
    type="button">
    <i data-lucide="package-check" class="w-4 h-4"></i>
    <span>Архівувати всі опрацьовані</span>
  </button>
</div>
```

### Action Buttons

**Active View - "В архів" Button:**
```javascript
<button 
  onclick="archiveOrder('${order.id}', event)" 
  class="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition-colors border border-orange-300"
  type="button"
  title="Перемістити в архів">
  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <polyline points="21 8 21 21 3 21 3 8"></polyline>
    <rect x="1" y="3" width="22" height="5"></rect>
    <line x1="10" y1="12" x2="14" y2="12"></line>
  </svg>
  В архів
</button>
```

**Archive View - "Відновити" Button:**
```javascript
<button 
  onclick="restoreOrder('${order.id}', event)" 
  class="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors border border-blue-300"
  type="button"
  title="Відновити з архіву">
  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <polyline points="9 14 4 9 9 4"></polyline>
    <path d="M20 20v-7a4 4 0 0 0-4-4H4"></path>
  </svg>
  Відновити
</button>
```

---

## 🔧 JavaScript Implementation

### State Management

```javascript
let currentView = 'active'  // 'active' or 'archive'
```

### Core Functions

#### 1. switchReviewArchiveTab(view)
```javascript
window.switchReviewArchiveTab = function(view) {
  if (view !== 'active' && view !== 'archive') {
    console.error('Invalid view:', view)
    return
  }
  
  currentView = view
  console.log(`📑 Switched to ${view} view`)
  
  // Reload data with new filter
  loadReviewRequests()
}
```

**Purpose:** Switch between Active and Archive views  
**Triggers:** Re-queries Firestore with appropriate filter  
**Updates:** Tab styling, table content, action buttons

#### 2. updateArchiveTabsUI()
```javascript
function updateArchiveTabsUI() {
  const activeTab = document.getElementById('review-active-tab')
  const archiveTab = document.getElementById('review-archive-tab')
  const bulkArchiveBtn = document.getElementById('bulk-archive-btn')
  
  if (!activeTab || !archiveTab) return
  
  if (currentView === 'active') {
    // Style Active tab as selected
    activeTab.className = 'flex items-center gap-2 px-6 py-4 bg-orange-100 text-orange-700 font-semibold border-b-4 border-orange-500 transition-all hover:bg-orange-50'
    archiveTab.className = 'flex items-center gap-2 px-6 py-4 bg-gray-50 text-gray-500 font-medium border-b-4 border-transparent transition-all hover:bg-gray-100'
    
    // Show bulk archive button
    if (bulkArchiveBtn) bulkArchiveBtn.classList.remove('hidden')
  } else {
    // Style Archive tab as selected
    activeTab.className = 'flex items-center gap-2 px-6 py-4 bg-gray-50 text-gray-500 font-medium border-b-4 border-transparent transition-all hover:bg-gray-100'
    archiveTab.className = 'flex items-center gap-2 px-6 py-4 bg-blue-100 text-blue-700 font-semibold border-b-4 border-blue-500 transition-all hover:bg-blue-50'
    
    // Hide bulk archive button
    if (bulkArchiveBtn) bulkArchiveBtn.classList.add('hidden')
  }
  
  lucide.createIcons()
}
```

**Purpose:** Update tab visual state and show/hide bulk button  
**Called:** After every view switch or data reload

#### 3. updateArchiveCounters()
```javascript
async function updateArchiveCounters() {
  try {
    // Query ALL completed orders to get accurate counts
    const allOrdersQuery = query(
      collection(db, 'orders'),
      where('status', 'in', ['completed', 'delivered', 'Доставлено', 'Виконано'])
    )
    
    const snapshot = await getDocs(allOrdersQuery)
    
    let activeCount = 0
    let archivedCount = 0
    
    snapshot.forEach(doc => {
      const orderData = doc.data()
      if (orderData.isArchived === true) {
        archivedCount++
      } else {
        activeCount++
      }
    })
    
    const activeCountEl = document.getElementById('active-orders-count')
    const archivedCountEl = document.getElementById('archived-orders-count')
    
    if (activeCountEl) activeCountEl.textContent = activeCount
    if (archivedCountEl) archivedCountEl.textContent = archivedCount
    
    console.log(`📊 Tab counters updated: ${activeCount} active, ${archivedCount} archived`)
    
  } catch (error) {
    console.error('Error updating archive counters:', error)
  }
}
```

**Purpose:** Query ALL orders to get accurate counts for tab badges  
**Performance:** Separate query ensures counters are always accurate  
**Called:** After table updates via `updateReviewRequestsCounts()`

---

## 🔄 Data Flow

### Tab Switch Flow:
```
User clicks tab
    ↓
switchReviewArchiveTab(view)
    ↓
Set currentView = 'active' or 'archive'
    ↓
loadReviewRequests()
    ↓
Query Firestore with appropriate filter:
  - Active: where isArchived != true
  - Archive: where isArchived == true
    ↓
Update deliveredOrders array
    ↓
renderReviewRequests() → Render tables
    ↓
updateReviewRequestsCounts() → Update counters
    ↓
updateArchiveCounters() → Query ALL orders for badge counts
    ↓
updateArchiveTabsUI() → Update tab styling
```

### Archive/Restore Flow:
```
User clicks "В архів" or "Відновити"
    ↓
Confirmation prompt
    ↓
archiveOrder() or restoreOrder()
    ↓
updateDoc(orderRef, { isArchived: true/false })
    ↓
Toast notification: "Замовлення переміщено в архів" / "Замовлення відновлено"
    ↓
Firebase onSnapshot listener triggers
    ↓
Automatic re-render (real-time update)
```

---

## 🎯 Use Cases

### Use Case 1: Browse Active Orders (Default)
1. Admin opens Review Requests tab
2. **Active tab is selected by default**
3. Badge shows count: "📥 Активні (15)"
4. Table displays only non-archived orders
5. Each order has "В архів" button

### Use Case 2: Archive Single Order
1. Admin clicks "В архів" on an order
2. Confirmation: "Перенести це замовлення в архів?"
3. Clicks OK
4. Toast: "Замовлення переміщено в архів" ✅
5. Order disappears from Active tab instantly
6. Counter updates: "📥 Активні (14)"

### Use Case 3: View Archived Orders
1. Admin clicks "📁 Архів" tab
2. Tab turns blue (active state)
3. Badge shows: "📁 Архів (8)"
4. Table shows only archived orders
5. Each order has "Відновити" button
6. Bulk archive button is hidden

### Use Case 4: Restore from Archive
1. In Archive tab, admin clicks "Відновити"
2. Confirmation: "Відновити це замовлення з архіву?"
3. Clicks OK
4. Toast: "Замовлення відновлено" ✅
5. Order disappears from Archive tab
6. Counters update: "📁 Архів (7)", "📥 Активні (15)"

### Use Case 5: Bulk Archive Old Orders
1. In Active tab, click "Архівувати всі опрацьовані"
2. Dialog shows: "Знайдено 10 замовлень для архівування..."
3. Confirms bulk operation
4. Progress spinner
5. Toast: "Архівовано: 10 замовлень" ✅
6. Counters update automatically

---

## 📋 Testing Checklist

### Tab Navigation:
- [ ] Active tab selected by default on page load
- [ ] Click Archive tab → tab turns blue
- [ ] Click Active tab → tab turns orange
- [ ] Counter badges show correct numbers
- [ ] Lucide icons render correctly

### Active View:
- [ ] Shows only non-archived orders
- [ ] "В архів" button visible on each row
- [ ] "Архівувати всі опрацьовані" button visible
- [ ] Archive action works with confirmation
- [ ] Toast notification appears after archiving

### Archive View:
- [ ] Shows only archived orders
- [ ] "Відновити" button visible on each row
- [ ] Bulk archive button is hidden
- [ ] Restore action works with confirmation
- [ ] Toast notification appears after restoring

### Real-Time Updates:
- [ ] Archiving order removes it from Active view instantly
- [ ] Restoring order removes it from Archive view instantly
- [ ] Counters update after any action
- [ ] Multiple admin sessions stay in sync

### Performance:
- [ ] Tab switch is fast (<500ms)
- [ ] Counter updates don't block UI
- [ ] No console errors
- [ ] Lucide icons re-render correctly after updates

---

## 🔍 Console Logging

Look for these emoji markers in browser console:

```javascript
console.log('📑 Switched to active view')
console.log('📑 Switched to archive view')
console.log('📊 Tab counters updated: 15 active, 8 archived')
console.log('📁 Archiving order:', orderId)
console.log('✅ Order archived successfully')
console.log('📤 Restoring order:', orderId)
console.log('✅ Order restored successfully')
```

---

## 🎨 Styling Reference

### Active Tab (Selected):
```css
bg-orange-100 text-orange-700 font-semibold border-b-4 border-orange-500
```

### Archive Tab (Selected):
```css
bg-blue-100 text-blue-700 font-semibold border-b-4 border-blue-500
```

### Inactive Tab:
```css
bg-gray-50 text-gray-500 font-medium border-b-4 border-transparent
```

### Counter Badge (Active Tab):
```css
bg-orange-200 text-orange-900
```

### Counter Badge (Archive Tab):
```css
bg-gray-200 text-gray-600
```

### "В архів" Button:
```css
text-orange-600 hover:text-orange-800 hover:bg-orange-50 border-orange-300
```

### "Відновити" Button:
```css
text-blue-600 hover:text-blue-800 hover:bg-blue-50 border-blue-300
```

---

## 💡 Key Improvements vs. Toggle Button

| Aspect | Previous (Toggle) | Current (Tabs) |
|--------|------------------|----------------|
| **Clarity** | Not immediately visible which view is active | Clear visual indication with colored tabs |
| **Counters** | Not visible | Always visible with real-time updates |
| **UX** | 2 clicks to switch back and forth | 1 click to switch views |
| **Visual Hierarchy** | Button blended with other controls | Prominent tab navigation |
| **Context** | Needed to remember button state | Current view always obvious |
| **Button Text** | Changed dynamically ("Показати архів" ↔ "Показати активні") | Fixed labels with state styling |

---

## 🚀 Deployment

No additional configuration required beyond original archive implementation:

1. ✅ HTML changes deployed to hosting
2. ✅ JavaScript changes deployed to hosting
3. ✅ Firestore index already created (from previous archive implementation)

---

## 🔗 Related Files

- **Module**: `/admin-site/js/admin-reviews-module.js` (3,743 lines)
- **HTML**: `/admin-site/index.html` (Review Requests section)
- **Previous Guide**: `ARCHIVE_FUNCTIONALITY_GUIDE.md`
- **Original Summary**: `ARCHIVE_IMPLEMENTATION_SUMMARY.md`

---

**Last Updated:** 2026-02-06  
**Version:** 2.0 (Tab-Based Navigation)  
**Author:** Senior Frontend Developer
