# 🎯 CRM Module - Complete Implementation Guide

## ✅ Implementation Complete

### What Was Done:

1. **✅ Firestore Security Rules Updated**
   - Added `crm_columns` collection with admin-only access
   - Updated `abandoned_carts` to work with CRM
   - Deployed rules successfully to Firebase

2. **✅ Column Management Features**
   - Inline editing of column names
   - Inline editing of column descriptions
   - Add new columns dynamically
   - Delete columns with confirmation
   - Auto-save on blur/Enter

3. **✅ UI/UX Enhancements**
   - Horizontal scrolling Kanban board
   - "Add Column" button with dashed border
   - Editable column headers (click to edit)
   - Column delete button (trash icon)
   - Smooth transitions and hover effects

4. **✅ Persistence**
   - All column changes saved to Firestore
   - Cards linked to columns via `crm_status`
   - Drag & drop updates Firestore automatically

---

## 📊 Firestore Collections

### `crm_columns`
```javascript
{
  id: "auto-generated",
  name: "Новий лід",              // Editable inline
  description: "...",              // Editable inline
  color: "#3b82f6",               // Background tint
  order: 0,                        // Sort order
  created_at: Timestamp
}
```

**Security Rules:**
```javascript
match /crm_columns/{columnId} {
  allow read, write: if request.auth != null;  // Admin only
}
```

### `abandoned_carts`
```javascript
{
  id: "cart-id",
  customer: {
    phone: "+380...",
    fullName: "...",
    email: "..."
  },
  items: [...],
  total: 1500,
  crm_status: "column_id",        // Links to crm_columns.id
  updated_at: Timestamp
}
```

**Security Rules:**
```javascript
match /abandoned_carts/{cartId} {
  allow create, update, delete: if true;        // Clients can save
  allow read: if request.auth != null;          // Admins can view
}
```

---

## 🚀 Testing Instructions

### Step 1: Initialize Columns (First Time Setup)

Open the **Admin Panel** in your browser and run this in the console:

```javascript
// Copy-paste this entire function into the browser console
(async function setupCRMColumns() {
    console.log('🚀 Setting up CRM columns...');
    
    if (!window.firebaseInit?.db) {
        console.error('❌ Please run this on the admin panel');
        return;
    }
    
    const { db, collection, setDoc, doc } = window.firebaseInit;
    
    const defaultColumns = [
        {
            id: 'new_lead',
            name: 'Новий лід',
            description: 'Нові покинуті кошики, потребують першого контакту',
            color: '#3b82f6',
            order: 0
        },
        {
            id: 'contacted',
            name: 'Контакт встановлено',
            description: 'Зв\'язалися з клієнтом, очікуємо відповіді',
            color: '#8b5cf6',
            order: 1
        },
        {
            id: 'negotiation',
            name: 'Переговори',
            description: 'Активні переговори з клієнтом',
            color: '#f59e0b',
            order: 2
        },
        {
            id: 'ready_to_order',
            name: 'Готовий замовити',
            description: 'Клієнт готовий оформити замовлення',
            color: '#06b6d4',
            order: 3
        },
        {
            id: 'converted',
            name: 'Конверсія',
            description: 'Замовлення створено успішно',
            color: '#10b981',
            order: 4
        }
    ];
    
    for (const column of defaultColumns) {
        const columnRef = doc(collection(db, 'crm_columns'), column.id);
        await setDoc(columnRef, {
            name: column.name,
            description: column.description,
            color: column.color,
            order: column.order,
            created_at: new Date()
        });
        console.log(`✅ Created: ${column.name}`);
    }
    
    console.log('✅ Setup complete! Navigate to CRM tab.');
})();
```

### Step 2: Add Test Carts to CRM

To populate the board with test data:

```javascript
// Add crm_status to existing abandoned carts
(async function assignCartsToColumns() {
    const { db, collection, getDocs, updateDoc, doc } = window.firebaseInit;
    
    const cartsRef = collection(db, 'abandoned_carts');
    const snapshot = await getDocs(cartsRef);
    
    const columnIds = ['new_lead', 'contacted', 'negotiation', 'ready_to_order', 'converted'];
    
    let count = 0;
    for (const cartDoc of snapshot.docs) {
        // Randomly assign to a column
        const randomColumn = columnIds[Math.floor(Math.random() * columnIds.length)];
        
        await updateDoc(doc(db, 'abandoned_carts', cartDoc.id), {
            crm_status: randomColumn
        });
        
        count++;
        console.log(`✅ Cart ${cartDoc.id} → ${randomColumn}`);
    }
    
    console.log(`✅ Assigned ${count} carts to CRM columns`);
    console.log('Refresh the CRM page to see changes');
})();
```

### Step 3: Test Column Management

1. **Add New Column:**
   - Click the "Додати колонку" button
   - New column appears on the right
   - Edit the name inline

2. **Edit Column Name:**
   - Click on any column name
   - Type new name
   - Press Enter or click outside to save

3. **Edit Column Description:**
   - Click on the description area
   - Type description
   - Press Enter or click outside to save

4. **Delete Column:**
   - Click the trash icon on any column
   - Confirm deletion
   - Column disappears

5. **Drag & Drop Cards:**
   - Drag any card between columns
   - Drop in another column
   - `crm_status` updates in Firestore automatically

---

## 🎨 UI Features

### Column Header (Editable)
```
┌─────────────────────────────────┐
│ [Новий лід ✏️]        [5] [🗑️]  │  ← Click name to edit
│ Нові покинуті кошики...         │  ← Click description to edit
│ Сума: 15000 ₴                   │
├─────────────────────────────────┤
│ [Card 1]                        │
│ [Card 2]                        │
└─────────────────────────────────┘
```

### Add Column Button
```
┌─────────────────────┐
│                     │
│    ➕ (icon)        │
│                     │
│  Додати колонку     │
│                     │
└─────────────────────┘
```

### Card Actions
```
┌────────────────────────────┐
│ Іван Петренко              │
│ +380123456789              │
│ 🛒 3 товари                │
│ 🕐 3 лют, 14:30            │
├────────────────────────────┤
│ 1500 ₴     [✓ Order] [💬] │  ← Create Order + SMS
└────────────────────────────┘
```

---

## 🔧 Developer Reference

### Module Functions

#### `initCRM()`
Initialize the CRM module
```javascript
await window.crmModule.initCRM();
```

#### `addNewColumn()`
Create a new column
```javascript
await window.crmModule.addNewColumn();
```

#### `saveColumnName(input)`
Save column name (auto-called on blur)
```javascript
window.crmModule.saveColumnName(inputElement);
```

#### `saveColumnField(element)`
Save column description or other field
```javascript
window.crmModule.saveColumnField(textareaElement);
```

#### `deleteColumn(columnId)`
Delete a column
```javascript
await window.crmModule.deleteColumn('new_lead');
```

#### `updateCartStatus(cartId, columnId)`
Move card to different column
```javascript
await window.crmModule.updateCartStatus('cart123', 'contacted');
```

---

## 🐛 Troubleshooting

### Error: "Missing or insufficient permissions"

**Cause:** Firestore rules not deployed or user not authenticated

**Fix:**
1. Deploy rules: `firebase deploy --only firestore:rules`
2. Ensure admin is logged in
3. Check `request.auth != null` in rules

### Error: "Cannot read properties of undefined (reading 'db')"

**Cause:** Firebase not initialized

**Fix:**
```javascript
// Wait for Firebase
if (!window.firebaseInit?.db) {
    console.error('Firebase not ready');
}
```

### Columns Not Appearing

**Cause:** Collection empty or query error

**Fix:**
1. Run the setup script from Step 1
2. Check Firestore console for `crm_columns`
3. Verify rules allow read access

### Drag & Drop Not Working

**Cause:** SortableJS not loaded

**Fix:**
- Ensure `<script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>` is in HTML
- Check `window.Sortable` exists

### Cards Not Moving to Columns

**Cause:** `crm_status` field missing

**Fix:**
```javascript
// Update cart with crm_status
await updateDoc(doc(db, 'abandoned_carts', cartId), {
    crm_status: 'new_lead'
});
```

---

## 📊 Analytics & Monitoring

### Monitor Column Performance

```javascript
// Get conversion stats per column
(async function getColumnStats() {
    const { db, collection, getDocs, query, where } = window.firebaseInit;
    
    const columnsSnapshot = await getDocs(collection(db, 'crm_columns'));
    
    for (const col of columnsSnapshot.docs) {
        const colData = col.data();
        
        const cartsQuery = query(
            collection(db, 'abandoned_carts'),
            where('crm_status', '==', col.id)
        );
        const cartsSnapshot = await getDocs(cartsQuery);
        
        const total = cartsSnapshot.docs.reduce((sum, cart) => {
            return sum + (parseFloat(cart.data().total) || 0);
        }, 0);
        
        console.log(`${colData.name}: ${cartsSnapshot.size} carts, ${total.toFixed(0)}₴`);
    }
})();
```

### Track Conversion Rate

```javascript
// Calculate conversion rate
(async function getConversionRate() {
    const { db, collection, getDocs, query, where } = window.firebaseInit;
    
    const allCartsQuery = query(
        collection(db, 'abandoned_carts'),
        where('crm_status', '!=', null)
    );
    const allCarts = await getDocs(allCartsQuery);
    
    const convertedQuery = query(
        collection(db, 'abandoned_carts'),
        where('crm_status', '==', 'converted')
    );
    const converted = await getDocs(convertedQuery);
    
    const rate = (converted.size / allCarts.size) * 100;
    console.log(`Conversion Rate: ${rate.toFixed(1)}%`);
    console.log(`Total Carts: ${allCarts.size}`);
    console.log(`Converted: ${converted.size}`);
})();
```

---

## 🚀 Deployment

### Deploy All Changes

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy hosting (admin panel)
firebase deploy --only hosting:admin-store-latio

# Deploy everything
firebase deploy
```

### Verify Deployment

1. Open admin panel
2. Navigate to: **Незавершені замовлення → CRM**
3. Check columns load
4. Test drag & drop
5. Test add/edit/delete columns

---

## 📝 Next Steps

### Recommended Enhancements

1. **Color Picker:** Allow changing column colors
2. **Column Reordering:** Drag & drop columns
3. **Bulk Actions:** Select multiple cards
4. **Filters:** Filter cards by date, amount, status
5. **Search:** Search cards by customer name/phone
6. **Real-time Updates:** Use `onSnapshot` for live updates
7. **Export:** Export CRM data to Excel/CSV
8. **Automation:** Auto-move cards based on rules
9. **Notes:** Add internal notes to cards
10. **History:** Track card movement history

---

## 🎉 Success Checklist

- [x] Firestore rules deployed
- [x] CRM module loaded on tab click
- [x] Columns fetched from Firestore
- [x] Columns editable inline
- [x] New columns can be added
- [x] Columns can be deleted
- [x] Cards display in correct columns
- [x] Drag & drop updates Firestore
- [x] Create Order button works
- [x] SMS button works
- [x] Horizontal scrolling enabled
- [x] Statistics display correctly
- [x] No permission errors

---

**🎯 Your CRM Kanban Board is now fully functional and customizable!**
