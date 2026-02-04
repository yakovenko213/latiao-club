# 🔍 CRM Kanban Debug Guide

## Problem: Cards Not Appearing in CRM Columns

### Root Causes Identified & Fixed

#### ✅ **1. Query Filter Too Restrictive**
**Problem:** Original query used `where('crm_status', '!=', null)` which excluded ALL documents without the `crm_status` field.

**Solution:** Changed query to load ALL abandoned carts:
```javascript
// ❌ OLD (excluded carts without crm_status)
const cartsQuery = query(
    cartsRef,
    where('crm_status', '!=', null),
    orderBy('crm_status'),
    orderBy('updated_at', 'desc')
);

// ✅ NEW (loads ALL carts)
const cartsQuery = query(
    cartsRef,
    orderBy('updated_at', 'desc')
);
```

---

#### ✅ **2. Missing crm_status Field**
**Problem:** Existing abandoned carts created before CRM implementation don't have the `crm_status` field.

**Solution:** Added fallback logic to assign default status:
```javascript
currentCarts = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        // FALLBACK: If no crm_status, default to 'new_lead'
        crm_status: data.crm_status || 'new_lead'
    };
});
```

---

#### ✅ **3. Status Value Mismatch**
**Problem:** Fallback used `'new'` but actual column ID is `'new_lead'`.

**Solution:** Updated fallback to use correct column ID:
```javascript
crm_status: data.crm_status || 'new_lead'  // Matches first column ID
```

---

#### ✅ **4. Missing Default Column**
**Problem:** If database has no columns at all, cards have nowhere to appear.

**Solution:** Auto-create default column on first load:
```javascript
if (currentColumns.length === 0) {
    console.warn('⚠️ No CRM columns found. Creating default "new_lead" column...');
    await setDoc(firestoreDoc(db, 'crm_columns', 'new_lead'), {
        name: 'Новий лід',
        description: 'Нові покинуті кошики, потребують першого контакту',
        color: '#3b82f6',
        order: 0,
        created_at: new Date()
    });
}
```

---

## 🛠️ Migration Tool

### Purpose
The **"Міграція"** button permanently adds `crm_status: 'new_lead'` to all abandoned carts that don't have this field.

### When to Use
- **First time setup:** After implementing CRM, run migration to make existing carts visible
- **After data import:** If you bulk-imported old cart data without crm_status
- **Troubleshooting:** If cards still don't appear after checking logs

### How It Works
1. Scans ALL documents in `abandoned_carts` collection
2. Identifies carts without `crm_status` field
3. Updates each cart with:
   ```javascript
   {
       crm_status: 'new_lead',
       updated_at: serverTimestamp()
   }
   ```
4. Shows success/error count
5. Automatically refreshes board to display newly visible carts

### Usage
1. Open Admin Panel → Незавершені замовлення → CRM
2. Click **"Міграція"** button (orange button in header)
3. Confirm migration in popup dialog
4. Wait for completion message
5. Verify carts now appear in "Новий лід" column

---

## 📊 Debug Console Logs

### What to Look For

#### **1. Column Loading**
```
📋 Loaded CRM columns: 6
```
- **Expected:** Number should match your column count
- **If 0:** Default column will be auto-created
- **If undefined:** Check Firestore permissions for `crm_columns` collection

#### **2. Real-time Listener**
```
📡 Setting up real-time listener for ALL abandoned carts...
🔄 Real-time update: Cart data changed
📦 Total documents received: 25
```
- **Expected:** Shows all carts, not just those with crm_status
- **If 0:** Check `abandoned_carts` collection exists and has data

#### **3. Fallback Warnings**
```
⚠️ Cart without crm_status (defaulting to "new_lead"): abc123xyz
```
- **Expected:** Shows for old carts without crm_status
- **These carts will still appear** on the board (in memory)
- **Run migration** to permanently update database

#### **4. Cart Distribution**
```
🛒 Total CRM carts loaded: 25
📊 Carts by status: {
    new_lead: 18,
    contacted: 4,
    negotiation: 2,
    converted: 1
}
```
- **Expected:** Shows how carts are distributed across columns
- **Check:** All status IDs should match existing column IDs

#### **5. Per-Column Rendering**
```
📋 Loading cards for column: "Новий лід" (new_lead)
   ├─ Cards found: 18
   └─ Total value: 12450 ₴
```
- **Expected:** Shows for each column
- **If 0 cards:** Check if column ID matches cart crm_status values

---

## 🧪 Testing Checklist

### Pre-Migration Check
```javascript
// Run in browser console:
const cartsRef = firebase.firestore().collection('abandoned_carts');
cartsRef.get().then(snapshot => {
    let withStatus = 0;
    let withoutStatus = 0;
    
    snapshot.forEach(doc => {
        if (doc.data().crm_status) {
            withStatus++;
        } else {
            withoutStatus++;
        }
    });
    
    console.log('Carts WITH crm_status:', withStatus);
    console.log('Carts WITHOUT crm_status:', withoutStatus);
});
```

### Post-Migration Verification
1. ✅ All carts appear in CRM board
2. ✅ No warning messages in console about missing crm_status
3. ✅ Drag & drop works correctly
4. ✅ New carts from checkout automatically appear in "Новий лід"
5. ✅ Real-time sync updates board without refresh

---

## 🚨 Troubleshooting

### Issue: "No columns found" even after migration
**Cause:** Firestore permissions not allowing read of `crm_columns`

**Solution:**
1. Check `firestore.rules`:
   ```javascript
   match /crm_columns/{columnId} {
       allow read, write: if isAdmin();
   }
   ```
2. Redeploy rules: `firebase deploy --only firestore:rules`
3. Run `setup-crm-columns.js` in console to create columns

---

### Issue: Cards appear but can't drag & drop
**Cause:** SortableJS not initializing or column data-attributes missing

**Solution:**
1. Check browser console for SortableJS errors
2. Verify column divs have `data-column-id` attribute
3. Refresh page to reinitialize drag & drop

---

### Issue: Migration button does nothing
**Cause:** Firebase not fully initialized or permissions error

**Solution:**
1. Check console for error messages
2. Verify admin authentication is active
3. Check browser network tab for failed Firestore requests
4. Try refreshing page and running migration again

---

## 📈 Expected Behavior After Fix

### On Page Load
1. ✅ Shows all columns (or creates default column)
2. ✅ Loads ALL abandoned carts
3. ✅ Applies fallback status to carts without crm_status
4. ✅ Displays carts in correct columns
5. ✅ Shows accurate statistics

### Real-time Updates
1. ✅ New cart created → Instantly appears in "Новий лід"
2. ✅ Cart status updated → Moves to new column automatically
3. ✅ Cart deleted → Disappears from board
4. ✅ No page refresh needed

### Migration Process
1. ✅ Scans all carts in database
2. ✅ Identifies carts without crm_status
3. ✅ Updates each cart with new_lead status
4. ✅ Shows progress in console
5. ✅ Displays success message with counts
6. ✅ Auto-refreshes board to show results

---

## 🎯 Next Steps

1. **Deploy Updated Code:**
   ```bash
   firebase deploy --only hosting:admin-store-latio
   ```

2. **Test in Production:**
   - Open admin panel CRM section
   - Check browser console for debug logs
   - Verify all carts are visible

3. **Run Migration (if needed):**
   - Click "Міграція" button
   - Wait for completion
   - Verify cart counts increase

4. **Monitor Real-time Sync:**
   - Create test cart on public site
   - Verify it appears instantly in CRM
   - Try drag & drop between columns
   - Check Firestore for updated crm_status

---

## 📋 Console Commands for Manual Testing

### Check Cart Status Distribution
```javascript
db.collection('abandoned_carts').get().then(snapshot => {
    const statusCounts = {};
    snapshot.forEach(doc => {
        const status = doc.data().crm_status || 'undefined';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    console.table(statusCounts);
});
```

### Manually Update Single Cart
```javascript
db.collection('abandoned_carts').doc('CART_ID_HERE').update({
    crm_status: 'new_lead',
    updated_at: firebase.firestore.FieldValue.serverTimestamp()
}).then(() => console.log('✅ Updated'));
```

### Force Refresh CRM Board
```javascript
window.crmModule.renderCrmBoard();
```

---

## ✅ Success Criteria

Your CRM is working correctly when:

1. ✅ Console shows: `📋 Loaded CRM columns: X` (X > 0)
2. ✅ Console shows: `🛒 Total CRM carts loaded: Y` (Y = total abandoned carts)
3. ✅ All abandoned carts visible on board
4. ✅ No fallback warnings after migration
5. ✅ Drag & drop updates Firestore
6. ✅ New carts appear instantly
7. ✅ Statistics show correct totals

**If all criteria met:** 🎉 CRM is fully operational!

---

## 📞 Support

If issues persist after following this guide:
1. Check all console logs for errors
2. Verify Firestore permissions in Firebase Console
3. Review composite index status (should be "Enabled")
4. Test with a fresh abandoned cart to verify real-time sync

Last Updated: 2026-02-04
