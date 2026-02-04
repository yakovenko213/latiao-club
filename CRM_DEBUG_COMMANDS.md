# 🚀 CRM Debug Quick Reference

## Testing in Browser Console

### 1. Check Current Status Distribution
```javascript
// See how many carts have/don't have crm_status
const db = firebase.firestore();
db.collection('abandoned_carts').get().then(snapshot => {
    let withStatus = 0;
    let withoutStatus = 0;
    let byStatus = {};
    
    snapshot.forEach(doc => {
        const status = doc.data().crm_status;
        if (status) {
            withStatus++;
            byStatus[status] = (byStatus[status] || 0) + 1;
        } else {
            withoutStatus++;
        }
    });
    
    console.log('📊 CART STATUS REPORT:');
    console.log('✅ With crm_status:', withStatus);
    console.log('❌ Without crm_status:', withoutStatus);
    console.log('📈 Distribution:', byStatus);
});
```

---

### 2. Force Migration (Manual Alternative)
```javascript
// Manually update all carts without crm_status
const db = firebase.firestore();
const batch = db.batch();

db.collection('abandoned_carts').get().then(snapshot => {
    let count = 0;
    
    snapshot.forEach(doc => {
        if (!doc.data().crm_status) {
            const ref = db.collection('abandoned_carts').doc(doc.id);
            batch.update(ref, {
                crm_status: 'new_lead',
                updated_at: firebase.firestore.FieldValue.serverTimestamp()
            });
            count++;
        }
    });
    
    if (count > 0) {
        batch.commit().then(() => {
            console.log(`✅ Updated ${count} carts`);
        });
    } else {
        console.log('✅ All carts already have crm_status');
    }
});
```

---

### 3. View Specific Cart Details
```javascript
// Replace CART_ID with actual cart ID from console logs
db.collection('abandoned_carts').doc('CART_ID').get().then(doc => {
    if (doc.exists) {
        console.log('🛒 Cart Data:', doc.data());
        console.log('Status:', doc.data().crm_status || '❌ MISSING');
    } else {
        console.log('❌ Cart not found');
    }
});
```

---

### 4. Check CRM Columns
```javascript
// See all available columns
db.collection('crm_columns').orderBy('order').get().then(snapshot => {
    console.log('📋 CRM COLUMNS:');
    snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`  ${data.order + 1}. ${data.name} (${doc.id})`);
    });
    console.log(`\nTotal columns: ${snapshot.size}`);
});
```

---

### 5. Create Default Columns (If Missing)
```javascript
// Run setup script to create all default columns
const columns = [
    { id: 'new_lead', name: 'Новий лід', color: '#3b82f6', order: 0 },
    { id: 'contacted', name: 'Контакт встановлено', color: '#8b5cf6', order: 1 },
    { id: 'negotiation', name: 'Переговори', color: '#f59e0b', order: 2 },
    { id: 'ready_to_order', name: 'Готовий замовити', color: '#06b6d4', order: 3 },
    { id: 'converted', name: 'Конверсія', color: '#10b981', order: 4 },
    { id: 'not_interested', name: 'Не зацікавлений', color: '#ef4444', order: 5 }
];

Promise.all(columns.map(col => 
    db.collection('crm_columns').doc(col.id).set({
        name: col.name,
        description: '',
        color: col.color,
        order: col.order,
        created_at: new Date()
    })
)).then(() => {
    console.log('✅ All columns created');
    window.crmModule.renderCrmBoard();
});
```

---

### 6. Refresh CRM Board
```javascript
// Force re-render of CRM board
window.crmModule.renderCrmBoard();
```

---

### 7. Manual Cart Status Update
```javascript
// Move specific cart to different column
db.collection('abandoned_carts').doc('CART_ID').update({
    crm_status: 'contacted',  // or: new_lead, negotiation, ready_to_order, converted, not_interested
    updated_at: firebase.firestore.FieldValue.serverTimestamp()
}).then(() => console.log('✅ Status updated'));
```

---

## Expected Console Output (Normal Operation)

### On CRM Tab Load:
```
🎯 Initializing CRM Kanban Module...
📋 Loaded CRM columns: 6
📡 Setting up real-time listener for ALL abandoned carts...
✅ CRM Module initialized successfully
```

### On Real-time Update:
```
🔄 Real-time update: Cart data changed
📦 Total documents received: 25
⚠️ Cart without crm_status (defaulting to "new_lead"): abc123xyz
⚠️ Cart without crm_status (defaulting to "new_lead"): def456uvw
🛒 Total CRM carts loaded: 25
📊 Carts by status: { new_lead: 18, contacted: 4, negotiation: 2, converted: 1 }
```

### On Column Render:
```
📋 Loading cards for column: "Новий лід" (new_lead)
   ├─ Cards found: 18
   └─ Total value: 12450 ₴
📋 Loading cards for column: "Контакт встановлено" (contacted)
   ├─ Cards found: 4
   └─ Total value: 2800 ₴
```

---

## Troubleshooting Quick Checks

### ❌ No cards visible
```javascript
// 1. Check if carts exist
db.collection('abandoned_carts').get().then(s => console.log('Total carts:', s.size));

// 2. Check if columns exist
db.collection('crm_columns').get().then(s => console.log('Total columns:', s.size));

// 3. Run migration via UI or console
window.crmModule.migrateCartsWithoutStatus();
```

### ❌ Permission errors
```javascript
// Test read permission
db.collection('abandoned_carts').limit(1).get()
    .then(() => console.log('✅ Can read carts'))
    .catch(e => console.error('❌ Permission error:', e));

db.collection('crm_columns').limit(1).get()
    .then(() => console.log('✅ Can read columns'))
    .catch(e => console.error('❌ Permission error:', e));
```

### ❌ Real-time sync not working
```javascript
// Check if listener is active
console.log('Listeners:', {
    columns: typeof unsubscribeColumns,
    carts: typeof unsubscribeCarts
});

// Force reconnect
window.crmModule.cleanup();
window.crmModule.initCRM();
```

---

## Migration Button Not Showing?

If the orange "Міграція" button is not visible:

1. **Hard refresh:** `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)
2. **Clear cache:** Open DevTools → Application → Clear Storage → Clear site data
3. **Check deployment:** Verify latest code deployed via Firebase Console

---

## Success Indicators

✅ **All Working Correctly When:**
- Console shows column count > 0
- Console shows cart count matching database
- All carts visible on board (no empty columns when carts exist)
- Drag & drop updates Firestore
- New carts from checkout appear instantly
- No red errors in console

---

## One-Line Commands

```javascript
// Quick status check
db.collection('abandoned_carts').get().then(s => s.forEach(d => console.log(d.id, d.data().crm_status || '❌ MISSING')));

// Quick fix all
db.collection('abandoned_carts').get().then(s => Promise.all(s.docs.filter(d => !d.data().crm_status).map(d => d.ref.update({crm_status: 'new_lead'}))));

// Count by status
db.collection('abandoned_carts').get().then(s => console.log(s.docs.reduce((acc, d) => ({...acc, [d.data().crm_status || 'missing']: (acc[d.data().crm_status || 'missing'] || 0) + 1}), {})));
```

---

**Last Updated:** 2026-02-04  
**Module Version:** 2.0 (with fallback logic + migration)
