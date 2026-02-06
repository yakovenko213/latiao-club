# 📁 Archive Functionality for Review Requests

## 🎯 Overview

The Archive functionality has been added to the **Review Requests (Відгуки)** section to help keep the main order list clean and focused on active, pending review requests.

---

## ✨ Features

### 1. **Manual Archive**
- Archive individual orders with a single click
- Confirmation prompt before archiving: "Перенести це замовлення в архів?"
- Archive button appears on each order row (both waiting and reviewed orders)
- Instant UI update after archiving (real-time listener)

### 2. **Archive View Toggle**
- Button: **"Показати архів"** / **"Показати активні"**
- Located at the top of the Review Requests tab
- Toggle between:
  - **Normal View**: Shows only non-archived orders (default)
  - **Archive View**: Shows only archived orders

### 3. **Restore from Archive**
- When in Archive View, orders show a **"Відновити"** (Restore) button
- Confirmation prompt before restoring
- Restores order back to active list
- Real-time UI update

### 4. **Bulk Archive**
- Button: **"Архівувати всі опрацьовані"**
- Automatically finds and archives orders that match criteria:
  - ✅ Orders that already have a review (reviewedOrderIds)
  - ✅ Orders older than 30 days (from completedAt/updatedAt/createdAt)
- Shows confirmation dialog with:
  - Total count of orders to archive
  - Breakdown: reviewed vs. old orders
- Progress indicator during bulk operation
- Success toast notification with statistics

---

## 📊 Firestore Schema

### New Fields Added to `orders` Collection:

| Field | Type | Description |
|-------|------|-------------|
| `isArchived` | `boolean` | `true` if order is archived, `false` or `undefined` if active |
| `archivedAt` | `timestamp` | Server timestamp when order was archived |

### Query Behavior:

**Normal View:**
```javascript
where('status', 'in', ['completed', 'delivered', 'Доставлено', 'Виконано'])
orderBy('createdAt', 'desc')
// Filter in JavaScript: !order.isArchived
```

**Archive View:**
```javascript
where('status', 'in', ['completed', 'delivered', 'Доставлено', 'Виконано'])
where('isArchived', '==', true)
orderBy('createdAt', 'desc')
```

---

## 🔧 Implementation Details

### JavaScript Functions (admin-reviews-module.js)

#### 1. **archiveOrder(orderId, event)**
- Archives a single order
- Updates Firestore: `{isArchived: true, archivedAt: serverTimestamp()}`
- Shows success toast notification
- Auto-refreshes via real-time listener

#### 2. **restoreOrder(orderId, event)**
- Restores order from archive
- Updates Firestore: `{isArchived: false, archivedAt: null}`
- Shows success toast notification
- Auto-refreshes via real-time listener

#### 3. **bulkArchiveOrders()**
- Finds orders matching archive criteria:
  - Has review (`reviewedOrderIds.has(order.id)`)
  - Older than 30 days
- Batch processes all matched orders
- Shows progress spinner during operation
- Returns statistics: `${successCount} archived, ${errorCount} failed`

#### 4. **toggleArchiveView()**
- Toggles `showArchivedOrders` state variable
- Calls `loadReviewRequests()` to re-query with new filter
- Updates button UI via `updateArchiveToggleUI()`

#### 5. **updateArchiveToggleUI()**
- Updates toggle button appearance based on current view
- Normal view: Gray button with "Показати архів"
- Archive view: Blue button with "Показати активні"

### State Management

```javascript
let showArchivedOrders = false  // Global state: false = normal, true = archive view
```

### Real-time Updates

The `onSnapshot` listener automatically filters results based on `showArchivedOrders`:

```javascript
snapshot.forEach(doc => {
  const orderData = doc.data()
  if (showArchivedOrders) {
    // Archive view: show only archived
    if (orderData.isArchived === true) {
      deliveredOrders.push({ id: doc.id, ...orderData })
    }
  } else {
    // Normal view: exclude archived
    if (!orderData.isArchived) {
      deliveredOrders.push({ id: doc.id, ...orderData })
    }
  }
})
```

---

## 🎨 UI Components (index.html)

### Archive Control Bar

Located at the top of `#review-requests-content`:

```html
<div class="flex items-center justify-between gap-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-200">
  <div class="flex items-center gap-3">
    <!-- Archive Toggle Button -->
    <button id="archive-toggle-btn" onclick="toggleArchiveView()" ...>
      <i data-lucide="archive"></i>
      <span>Показати архів</span>
    </button>
    
    <!-- Info Text -->
    <div class="text-sm text-gray-600">
      <i data-lucide="info"></i>
      <span>Архів допомагає тримати список чистим</span>
    </div>
  </div>
  
  <!-- Bulk Archive Button -->
  <button id="bulk-archive-btn" onclick="bulkArchiveOrders()" ...>
    <i data-lucide="package-check"></i>
    <span>Архівувати всі опрацьовані</span>
  </button>
</div>
```

### Action Buttons in Table Rows

**Waiting for Review Orders:**
- Primary action: "Надіслати запит" (Send SMS)
- Secondary action: "Архівувати" (Normal view) / "Відновити" (Archive view)

**Reviewed Orders:**
- Primary action: "Відгук отримано" (status badge)
- Secondary actions:
  - "Скинути статус" (Reset review status)
  - "Архівувати" / "Відновити"

---

## 📋 Firestore Index Requirements

Add the following composite index to `firestore.indexes.json`:

```json
{
  "collectionGroup": "orders",
  "queryScope": "COLLECTION",
  "fields": [
    {
      "fieldPath": "status",
      "order": "ASCENDING"
    },
    {
      "fieldPath": "isArchived",
      "order": "ASCENDING"
    },
    {
      "fieldPath": "createdAt",
      "order": "DESCENDING"
    }
  ]
}
```

**Deploy the index:**
```bash
firebase deploy --only firestore:indexes
```

---

## 🚀 Deployment Checklist

1. ✅ JavaScript changes deployed to hosting
2. ✅ HTML changes deployed to hosting
3. ✅ Firestore index created (may take a few minutes)
4. ✅ Test archive/restore functionality
5. ✅ Test bulk archive with sample data
6. ✅ Verify real-time updates work correctly

---

## 🧪 Testing Guide

### Manual Archive Test:
1. Go to Admin Panel → Відгуки tab
2. Find any order in "Очікують запиту на відгук" section
3. Click "Архівувати" button
4. Confirm the prompt
5. ✅ Order should immediately disappear from the list

### Archive View Test:
1. Click "Показати архів" button (top of page)
2. ✅ Button should turn blue and say "Показати активні"
3. ✅ Table should now show only archived orders
4. ✅ Each order should have a "Відновити" button

### Restore Test:
1. In Archive View, find an archived order
2. Click "Відновити" button
3. Confirm the prompt
4. ✅ Order should immediately disappear from archive view
5. Switch back to Normal view
6. ✅ Order should now appear in the active list

### Bulk Archive Test:
1. Make sure you have orders that meet criteria:
   - Some with reviews already (in "Відгук отримано" section)
   - Some older than 30 days
2. Click "Архівувати всі опрацьовані" button
3. ✅ Dialog should show count and breakdown
4. Confirm the operation
5. ✅ Progress spinner should appear
6. ✅ Success toast should show statistics
7. ✅ Archived orders should disappear from normal view

---

## 🔍 Console Logging

The implementation includes comprehensive logging:

```javascript
console.log('📁 Archive view toggled: true')
console.log('📁 Archiving order:', orderId)
console.log('✅ Order archived successfully')
console.log('📤 Restoring order:', orderId)
console.log('✅ Order restored successfully')
console.log('📦 Bulk archiving 15 orders...')
console.log('✅ Bulk archive complete: 15 archived, 0 failed')
```

Look for these emoji markers in the browser console for debugging.

---

## 💡 Use Cases

### Use Case 1: Clean Up Old Orders
**Problem:** Order list is cluttered with orders from 2+ months ago  
**Solution:** Click "Архівувати всі опрацьовані" to automatically archive old orders

### Use Case 2: Focus on New Requests
**Problem:** Hard to find new orders that need review requests  
**Solution:** Archive reviewed orders to keep only pending requests visible

### Use Case 3: Temporarily Hide Order
**Problem:** Don't want to see a specific order but don't want to delete it  
**Solution:** Click "Архівувати" on that order, can restore it anytime

### Use Case 4: Review Historical Data
**Problem:** Need to check archived orders from the past  
**Solution:** Click "Показати архів" to switch to archive view

---

## 🛡️ Security & Data Integrity

- ✅ **Non-destructive**: Archiving does NOT delete data
- ✅ **Reversible**: All archived orders can be restored
- ✅ **Firestore rules**: Respect existing security rules
- ✅ **Real-time sync**: Changes are immediately visible across all admin sessions
- ✅ **Error handling**: Failed operations show error messages without breaking UI

---

## 📝 Notes

1. **Archive is NOT delete**: Archived orders remain in Firestore, they're just filtered out from the main view
2. **Bulk archive criteria**: Modify the 30-day threshold in `bulkArchiveOrders()` if needed
3. **Real-time updates**: The UI automatically updates when other admins archive/restore orders
4. **Index creation**: The Firestore index may take 1-5 minutes to build after first deployment

---

## 🔗 Related Files

- **Module**: `/admin-site/js/admin-reviews-module.js`
- **HTML**: `/admin-site/index.html` (Review Requests section)
- **Indexes**: `/firestore.indexes.json`

---

**Last Updated:** 2026-02-06  
**Version:** 1.0  
**Author:** Senior Firebase Developer
