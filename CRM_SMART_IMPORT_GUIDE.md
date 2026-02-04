# 🎯 Smart Import & Manual Transfer - Complete Guide

## Overview

Система **Smart Import** дозволяє гнучко контролювати, коли покинуті кошики з'являються в CRM. Комбінує автоматичні правила з можливістю ручного переносу.

---

## 🚀 Features

### 1. **Smart Import (Automatic)**
- Кошики з'являються в CRM лише після налаштованої затримки
- Затримка береться з `settings/crm_automation` → `initialDelay`
- Автоматично призначається цільова колонка
- Працює в фоні без втручання адміністратора

### 2. **Manual Transfer (On-Demand)**
- Адміністратор вручну вибирає, коли і куди перенести кошик
- Обходить будь-які затримки - миттєве відображення
- Можна вибрати будь-яку колонку Kanban
- Позначка "Manually Transferred" для відстеження

### 3. **Visual Indicators**
- **Auto Badge** (🤖 фіолетовий): Картка переміщена автоматизацією
- **Manual Badge** (👤 зелений): Картка передана вручну
- Різні кольори рамок для легкої ідентифікації

---

## 📋 How It Works

### Automatic Flow (Smart Import)

```
Cart Created
    ↓
Wait for initialDelay
    ↓
Check: currentTime - createdAt >= delay?
    ↓ YES
Show in CRM (targetColumn)
    ↓ NO
Don't show yet (invisible)
```

**Example:**
```javascript
// Settings in Firestore
{
  initialDelay: {
    value: 5,
    unit: 'minutes',
    targetColumn: 'new_lead'
  }
}

// Result:
// Cart created at 10:00
// Cart appears in CRM at 10:05 in "Новий лід" column
```

### Manual Transfer Flow

```
Admin opens cart details
    ↓
Clicks "Передати в CRM"
    ↓
Selects target column
    ↓
Clicks "Передати"
    ↓
Cart marked: manually_transferred = true
    ↓
Instantly appears in CRM (bypasses delay)
```

---

## 🛠️ Setup Instructions

### Step 1: Configure Automation Settings

1. Open **CRM** → **⚙️ Налаштування**
2. Set **Initial Delay**:
   - Value: `5` (example)
   - Unit: `Хвилин`
   - Target Column: `Новий лід`
3. Click **💾 Зберегти**

### Step 2: Test Smart Import

1. Create a test cart on public site
2. Wait for configured delay (e.g., 5 minutes)
3. Open CRM tab
4. Cart should appear in target column

### Step 3: Test Manual Transfer

1. Go to **Покинуті кошики**
2. Click **👁️ Переглянути** on any cart
3. Scroll to bottom → Click **Передати в CRM**
4. Select column → Click **✅ Передати**
5. Go to CRM tab → Cart should appear instantly

---

## 💻 Technical Implementation

### Code Changes

#### 1. **Smart Import Logic** (`crm-module.js`)

```javascript
// Load automation settings
let automationSettings = null;
const settingsRef = firestoreDoc(db, 'settings', 'crm_automation');
const settingsSnap = await getDoc(settingsRef);
if (settingsSnap.exists()) {
    automationSettings = settingsSnap.data();
}

// Filter carts based on delay
currentCarts = snapshot.docs.map(doc => {
    const data = doc.data();
    const createdAt = data.created_at.toDate();
    const cartAgeMs = now - createdAt;
    
    // Check if cart has crm_status
    if (!data.crm_status && !data.manually_transferred) {
        // Apply initial delay rule
        if (automationSettings && automationSettings.initialDelay) {
            const delayMs = convertToMs(
                automationSettings.initialDelay.value,
                automationSettings.initialDelay.unit
            );
            
            if (cartAgeMs < delayMs) {
                // Too young, don't show
                return null;
            } else {
                // Show with target column
                crmStatus = automationSettings.initialDelay.targetColumn;
            }
        }
    }
    
    // Manually transferred always show
    if (data.manually_transferred) {
        shouldShow = true;
    }
    
    return shouldShow ? { ...data, crm_status: crmStatus } : null;
}).filter(cart => cart !== null);
```

#### 2. **Manual Transfer Function**

```javascript
export async function openManualTransferModal(cartId) {
    // Show modal with column selector
    const columnsOptions = currentColumns.map(col => 
        `<option value="${col.id}">${col.name}</option>`
    ).join('');
    
    // Modal HTML with dropdown
    const modalHTML = `...`;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

export async function confirmManualTransfer(cartId) {
    const selectedColumn = document.getElementById('transfer-column-select').value;
    
    const cartRef = firestoreDoc(db, 'abandoned_carts', cartId);
    await updateDoc(cartRef, {
        crm_status: selectedColumn,
        manually_transferred: true,
        transferred_at: serverTimestamp(),
        updated_at: serverTimestamp()
    });
    
    // Board updates automatically via onSnapshot
}
```

#### 3. **Visual Indicators**

```javascript
// Manual badge in renderCard()
const manualBadge = cart.manually_transferred 
    ? `<div class="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded" title="Переданий в CRM вручну">
          <i data-lucide="user-check" class="w-3 h-3"></i>
          <span>Manual</span>
       </div>`
    : '';

// Green border for manual cards
<div class="... ${cart.manually_transferred ? 'ring-2 ring-green-200' : ''}">
```

#### 4. **UI Integration** (`index.html`)

```html
<!-- In abandoned cart details modal -->
<button onclick="window.crmModule.openManualTransferModal('${phone}')" 
    class="... bg-green-500 hover:bg-green-600 ...">
    <span>Передати в CRM</span>
</button>

<!-- In abandoned carts table -->
<button onclick="window.crmModule.openManualTransferModal('${phone}')" 
    title="Передати в CRM">
    <i data-lucide="send" class="w-4 h-4"></i>
    <span>CRM</span>
</button>
```

---

## 🎨 Visual Guide

### Card Appearance Indicators

#### **Normal Cart (Automatic)**
```
┌─────────────────────────┐
│ Іван Петренко          │
│ 📞 +380501234567       │
│ 💬 @ivan_petrenko      │
│ 🛒 3 товари            │
│ ⏰ 2 год тому          │
│ ₴ 1,250                │
└─────────────────────────┘
```

#### **Auto-Updated Cart**
```
┌─────────────────────────┐ 🟣 Purple ring
│ Іван Петренко          │
│ 📞 +380501234567       │
│ 🤖 Auto                │ ← Badge
│ 🛒 3 товари            │
│ ₴ 1,250                │
└─────────────────────────┘
```

#### **Manually Transferred Cart**
```
┌─────────────────────────┐ 🟢 Green ring
│ Марія Коваль           │
│ 📞 +380509876543       │
│ 👤 Manual              │ ← Badge
│ 🛒 5 товарів           │
│ ₴ 2,100                │
└─────────────────────────┘
```

---

## 📊 Data Structure

### Firestore: `abandoned_carts` Document

```javascript
{
  id: '380501234567',
  customer: { fullName, phone, telegram },
  items: [...],
  total: 1250,
  
  // Timestamps
  created_at: Timestamp('2026-02-04 10:00'),
  updated_at: Timestamp('2026-02-04 10:05'),
  
  // CRM fields
  crm_status: 'new_lead',          // Column ID
  
  // Transfer tracking
  manually_transferred: false,      // true if manually sent to CRM
  transferred_at: Timestamp,        // When manually transferred
  
  // Auto-update tracking
  auto_updated: false,              // true if auto-moved
  auto_update_reason: 'Auto-moved after 2 hours'
}
```

### Firestore: `settings/crm_automation` Document

```javascript
{
  enabled: true,
  
  initialDelay: {
    value: 5,
    unit: 'minutes',              // 'minutes' | 'hours' | 'days'
    targetColumn: 'new_lead'       // Column ID
  },
  
  transitionRules: [...]
}
```

---

## 🧪 Testing Scenarios

### Test 1: Smart Import with Delay

**Setup:**
- initialDelay: 5 minutes
- targetColumn: 'new_lead'

**Steps:**
1. Create cart on public site at 10:00
2. Open CRM immediately → Cart NOT visible
3. Wait 5 minutes
4. Refresh CRM at 10:05 → Cart appears in "Новий лід"

**Expected Result:** ✅ Cart delayed, then appears automatically

---

### Test 2: Manual Transfer (Bypass Delay)

**Setup:**
- Same delay as Test 1

**Steps:**
1. Create cart at 10:00
2. Open CRM at 10:01 → Cart not visible (< 5 min)
3. Go to "Покинуті кошики" → Click "👁️ Переглянути"
4. Click "Передати в CRM" → Select "Переговори"
5. Go back to CRM → Cart visible immediately in "Переговори"

**Expected Result:** ✅ Delay bypassed, instant visibility

---

### Test 3: Visual Indicators

**Setup:**
- One auto cart (new_lead)
- One manual cart (negotiation)

**Expected:**
- Auto cart: Purple ring, 🤖 Auto badge
- Manual cart: Green ring, 👤 Manual badge

---

## 🚨 Troubleshooting

### Issue: Cart Not Appearing After Delay

**Debug Steps:**
```javascript
// 1. Check if cart exists
db.collection('abandoned_carts').doc('PHONE').get().then(doc => {
    console.log('Cart data:', doc.data());
});

// 2. Check cart age
const cart = doc.data();
const createdAt = cart.created_at.toDate();
const now = new Date();
const ageMs = now - createdAt;
const ageMinutes = ageMs / 60000;
console.log('Cart age (minutes):', ageMinutes);

// 3. Check automation settings
db.collection('settings').doc('crm_automation').get().then(doc => {
    console.log('Delay settings:', doc.data().initialDelay);
});
```

**Common Causes:**
- Cart missing `created_at` timestamp
- Delay not elapsed yet
- Automation settings not saved
- Cart already has `crm_status`

---

### Issue: Manual Transfer Not Working

**Checks:**
1. Console errors when clicking button?
2. Modal appears?
3. Columns dropdown populated?
4. Firestore update successful?

**Manual Fix:**
```javascript
// Manually update cart
db.collection('abandoned_carts').doc('PHONE').update({
    crm_status: 'new_lead',
    manually_transferred: true,
    transferred_at: firebase.firestore.FieldValue.serverTimestamp()
});
```

---

### Issue: Badge Not Showing

**Check:**
1. Cart has `manually_transferred: true` in Firestore?
2. Lucide icons initialized? (`lucide.createIcons()`)
3. Hard refresh page (Ctrl+Shift+R)

---

## 📈 Best Practices

### 1. **Delay Duration**
- **Too short** (< 1 min): Most carts appear immediately
- **Too long** (> 30 min): Risk losing hot leads
- **Recommended**: 5-10 minutes

### 2. **Manual Transfer Use Cases**
- Hot lead: Customer called/messaged
- VIP customer: Immediate attention needed
- High-value cart: Priority handling
- Test/demo: Showcase to stakeholders

### 3. **Initial Target Column**
- Use "Новий лід" for cold leads
- Use "Контакт встановлено" if pre-qualified
- Depends on your sales process

### 4. **Monitoring**
```javascript
// Count manual vs auto carts
const manual = currentCarts.filter(c => c.manually_transferred).length;
const auto = currentCarts.filter(c => c.auto_updated).length;
const regular = currentCarts.length - manual - auto;

console.log({manual, auto, regular});
```

---

## 🎯 Use Cases

### Use Case 1: E-commerce Store
**Scenario:** High volume, need filtering

**Setup:**
- initialDelay: 10 minutes
- targetColumn: 'new_lead'

**Workflow:**
1. Most carts auto-appear after 10 min
2. High-value carts (>$500): Manual transfer to "Hot Lead"
3. Returning customers: Manual transfer to "Contacted"

---

### Use Case 2: B2B Sales
**Scenario:** Low volume, high touch

**Setup:**
- initialDelay: 30 minutes (allow time for research)
- targetColumn: 'qualified'

**Workflow:**
1. Cart created → Sales rep gets notification
2. Rep researches company → Decides priority
3. Manual transfer to appropriate column based on potential

---

### Use Case 3: Service Business
**Scenario:** Consultation requests

**Setup:**
- initialDelay: 5 minutes
- targetColumn: 'inquiry'

**Workflow:**
1. Request submitted
2. Admin reviews immediately
3. If serious: Manual transfer to "Consultation Booked"
4. If spam/test: Delete or archive

---

## 🔄 Integration with Automation

**Smart Import + Auto-Transitions:**

```
Manual Transfer → negotiation
       ↓
Auto-move after 2 days
       ↓
ready_to_order
       ↓
Auto-move after 3 days
       ↓
converted OR not_interested
```

**Benefits:**
- Manual control at entry
- Automatic follow-up after
- Consistent pipeline flow

---

## ✅ Success Criteria

Your system works correctly when:

1. ✅ Carts don't appear before delay expires
2. ✅ Manually transferred carts appear instantly
3. ✅ Auto carts show purple badge
4. ✅ Manual carts show green badge
5. ✅ Real-time sync updates board
6. ✅ No duplicate cards
7. ✅ Correct column assignment

---

## 📞 Quick Reference

### Console Commands

```javascript
// Check cart transfer status
db.collection('abandoned_carts').doc('PHONE').get().then(d => {
    const data = d.data();
    console.log({
        crm_status: data.crm_status,
        manually_transferred: data.manually_transferred,
        created_at: data.created_at?.toDate()
    });
});

// Force manual transfer
window.crmModule.openManualTransferModal('PHONE_NUMBER');

// Check how many carts waiting for delay
const waiting = currentCarts.filter(c => !c.crm_status && !c.manually_transferred).length;
```

---

**Last Updated:** 2026-02-04  
**Version:** 1.0  
**Status:** Production Ready ✅
