# 🤖 CRM Automation System - Complete Guide

## Overview

Система автоматизації CRM дозволяє автоматично переміщувати картки покинутих кошиків між колонками Kanban на основі часових тригерів. Це зменшує ручну роботу і забезпечує послідовний follow-up з клієнтами.

---

## 🎯 Features

### 1. **Initial Capture Delay**
- Встановіть затримку перед тим, як новий покинутий кошик з'явиться в CRM
- Приклад: "Чекати 5 хвилин після створення кошика, потім додати в колонку 'Новий лід'"

### 2. **Status Transition Rules**
- Створіть необмежену кількість правил переходу між статусами
- Кожне правило визначає:
  - **From Status**: З якої колонки переміщувати
  - **To Status**: В яку колонку переміщувати
  - **Wait Time**: Скільки часу чекати перед переміщенням

### 3. **Automatic Execution**
- Автоматизація запускається кожні 5 хвилин
- Також запускається при завантаженні сторінки CRM
- Можна запустити вручну через кнопку "Тестувати"

### 4. **Visual Indicators**
- Картки, переміщені автоматично, мають фіолетовий бейдж "Auto"
- Підсвічуються фіолетовою рамкою для легкої ідентифікації
- Зберігають причину автоматичного переміщення

---

## 🛠️ Setup Instructions

### Step 1: Open Automation Settings

1. Відкрийте **Admin Panel** → **Незавершені замовлення** → **CRM**
2. Натисніть кнопку **"⚙️ Налаштування колонок"** (фіолетова кнопка)
3. Відкриється модальне вікно автоматизації

### Step 2: Configure Initial Capture

**Purpose:** Визначте, коли покинуті кошики стають видимими в CRM.

**Settings:**
- **Затримка**: Число (1, 5, 10, 30, etc.)
- **Одиниця**: Хвилин / Годин / Днів
- **Цільова колонка**: Виберіть початкову колонку (зазвичай "Новий лід")

**Example:**
```
Затримка: 5
Одиниця: Хвилин
Цільова колонка: Новий лід

Result: Кошики з'являться в "Новий лід" через 5 хвилин після створення
```

**Note:** Ця функція поки не реалізована на рівні checkout (всі кошики створюються з `crm_status: 'new_lead'` одразу). Готуйтеся до майбутнього апдейту.

### Step 3: Add Transition Rules

**Purpose:** Автоматично переміщувати картки між етапами воронки.

**How to Add Rules:**
1. Натисніть **"➕ Додати правило"**
2. Заповніть поля:
   - **Зі статусу**: Поточна колонка картки
   - **До статусу**: Колонка, куди перемістити
   - **Час очікування**: Число + одиниця часу

**Example Rules:**

#### Rule 1: New Lead → Follow-up
```
Зі статусу: Новий лід
До статусу: Контакт встановлено
Час очікування: 2 Години

Logic: Якщо картка в "Новий лід" більше 2 годин, перемістити в "Контакт встановлено"
```

#### Rule 2: Follow-up → Cold Lead
```
Зі статусу: Контакт встановлено
До статусу: Не зацікавлений
Час очікування: 3 Дні

Logic: Якщо картка в "Контакт встановлено" більше 3 днів, перемістити в "Не зацікавлений"
```

#### Rule 3: Negotiation → Hot Lead
```
Зі статусу: Переговори
До статусу: Готовий замовити
Час очікування: 1 Дні

Logic: Якщо картка в "Переговори" більше 1 дня, перемістити в "Готовий замовити"
```

### Step 4: Save & Activate

1. Натисніть **"💾 Зберегти"**
2. Налаштування збережуться в Firestore (`settings/crm_automation`)
3. Автоматизація активується автоматично
4. Таймер запускається кожні 5 хвилин

---

## 🧪 Testing Automation

### Manual Test
1. Відкрийте модальне вікно автоматизації
2. Натисніть **"▶️ Тестувати"**
3. Автоматизація запуститься негайно
4. Перевірте консоль браузера для логів

### Console Output
```javascript
🤖 Running CRM automation...
🔄 Auto-moving cart abc123 from "new_lead" to "contacted"
🔄 Auto-moving cart xyz789 from "contacted" to "not_interested"
✅ Automation complete: 2 carts updated
```

### Visual Verification
- Перевірте картки з фіолетовим бейджем "Auto"
- Наведіть курсор на бейдж, щоб побачити причину переміщення
- Картки повинні бути в нових колонках

---

## 📊 How It Works

### Architecture

```
┌─────────────────────────────────────────┐
│  CRM Module Initialization              │
│  ↓                                      │
│  startAutomationTimer()                 │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Timer runs every 5 minutes             │
│  ↓                                      │
│  runCrmAutomation()                     │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Load automation settings               │
│  from Firestore                         │
│  (settings/crm_automation)              │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  For each cart in currentCarts:         │
│   1. Check cart.crm_status              │
│   2. Calculate time since updated_at    │
│   3. Compare with rule.waitTime         │
│   4. If match → updateDoc()             │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Update cart in Firestore:              │
│   - crm_status: rule.toStatus           │
│   - auto_updated: true                  │
│   - auto_update_reason: "..."           │
│   - updated_at: serverTimestamp()       │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Real-time listener (onSnapshot)        │
│  ↓                                      │
│  Re-render board with updated data      │
└─────────────────────────────────────────┘
```

### Logic Flow

```javascript
// Pseudo-code
for (const cart of currentCarts) {
    const timeSinceUpdate = now - cart.updated_at;
    
    for (const rule of transitionRules) {
        if (cart.crm_status === rule.fromStatus) {
            const waitTimeMs = convertToMs(rule.waitTime.value, rule.waitTime.unit);
            
            if (timeSinceUpdate >= waitTimeMs) {
                // Move cart to new status
                updateCart(cart.id, {
                    crm_status: rule.toStatus,
                    auto_updated: true
                });
                break; // Only apply first matching rule
            }
        }
    }
}
```

### Time Conversion

```javascript
const conversions = {
    minutes: 60 * 1000,           // 60,000 ms
    hours: 60 * 60 * 1000,        // 3,600,000 ms
    days: 24 * 60 * 60 * 1000     // 86,400,000 ms
};
```

---

## 🎨 Visual Indicators

### Auto-Updated Badge

**Normal Card:**
```
┌─────────────────────────┐
│ Іван Петренко          │
│ 📞 +380501234567       │
│ 💬 @ivan_petrenko      │
└─────────────────────────┘
```

**Auto-Updated Card:**
```
┌─────────────────────────┐ 🟣 Purple border
│ Іван Петренко          │
│ 📞 +380501234567       │
│ 💬 @ivan_petrenko      │
│ 🤖 Auto                │ ← Badge
└─────────────────────────┘
```

**Badge Tooltip:**
```
Hover over "Auto" badge:
"Auto-moved after 2 hours"
```

---

## 📂 Data Structure

### Firestore Document: `settings/crm_automation`

```javascript
{
  enabled: true,
  
  // Initial capture settings
  initialDelay: {
    value: 5,
    unit: 'minutes',
    targetColumn: 'new_lead'
  },
  
  // Transition rules
  transitionRules: [
    {
      fromStatus: 'new_lead',
      toStatus: 'contacted',
      waitTime: {
        value: 2,
        unit: 'hours'
      }
    },
    {
      fromStatus: 'contacted',
      toStatus: 'not_interested',
      waitTime: {
        value: 3,
        unit: 'days'
      }
    }
  ],
  
  updated_at: Timestamp
}
```

### Cart Document with Auto-Update

```javascript
{
  id: 'abc123xyz',
  customer: {...},
  items: [...],
  total: 1250,
  
  // CRM fields
  crm_status: 'contacted',        // New status
  
  // Auto-update tracking
  auto_updated: true,              // Flag
  auto_update_reason: 'Auto-moved after 2 hours',
  
  created_at: Timestamp,
  updated_at: Timestamp            // Updated on move
}
```

---

## 🚨 Troubleshooting

### Issue: Automation Not Running

**Check 1: Settings Exist**
```javascript
// Run in browser console
db.collection('settings').doc('crm_automation').get().then(doc => {
    if (doc.exists) {
        console.log('✅ Settings exist:', doc.data());
    } else {
        console.log('❌ No settings found');
    }
});
```

**Check 2: Timer Active**
```javascript
// Check console for:
"⏰ Automation timer started (runs every 5 minutes)"
```

**Check 3: Enabled Flag**
```javascript
// Settings must have enabled: true
{
  enabled: true,  // ← Must be true
  ...
}
```

---

### Issue: Rules Not Applying

**Debug Logs:**
```javascript
// Console output during automation run:
🤖 Running CRM automation... 
ℹ️ No carts needed automation

// This means:
1. No carts match rule criteria
2. Not enough time has passed
3. Rules might be misconfigured
```

**Manual Check:**
```javascript
// Check specific cart
const cart = currentCarts.find(c => c.id === 'CART_ID');
const now = new Date();
const updatedAt = cart.updated_at.toDate();
const diffMs = now - updatedAt;
const diffHours = diffMs / (60 * 60 * 1000);

console.log('Hours since update:', diffHours);
console.log('Current status:', cart.crm_status);
console.log('Should move if:', diffHours >= RULE_WAIT_HOURS);
```

---

### Issue: Cards Immediately Move

**Cause:** Wait time is too short (e.g., 1 minute)

**Solution:** Increase wait time in rules
- Use hours instead of minutes for most rules
- Use days for cold lead detection

**Recommended Wait Times:**
- New → Contacted: 2-6 hours
- Contacted → Cold: 2-3 days
- Negotiation → Ready: 1-2 days

---

## 📈 Best Practices

### 1. **Gradual Escalation**
Don't immediately move to "Not Interested". Use intermediate steps:
```
New Lead → [2 hours] → 
Follow-up Needed → [1 day] → 
Second Attempt → [2 days] → 
Cold Lead
```

### 2. **Preserve Manual Moves**
If admin manually moves a card, `updated_at` is refreshed, resetting automation timer.

### 3. **Test Before Production**
- Create test carts with old timestamps
- Run automation manually
- Verify moves are correct
- Adjust wait times based on results

### 4. **Monitor Auto-Updates**
Check how many carts are being auto-moved:
```javascript
const autoUpdatedCarts = currentCarts.filter(cart => cart.auto_updated);
console.log('Auto-updated carts:', autoUpdatedCarts.length);
```

### 5. **Clear Auto-Updated Flag**
After admin reviews, clear the flag:
```javascript
db.collection('abandoned_carts').doc('CART_ID').update({
    auto_updated: false
});
```

---

## 🔄 Future Enhancements

### Planned Features:
1. **Conditional Rules**: Only move if certain conditions met (e.g., cart value > 1000)
2. **Notification Triggers**: Send SMS/email when cart auto-moves
3. **Business Hours**: Only run automation during work hours
4. **Pause/Resume**: Temporarily disable specific rules
5. **Rule Priority**: Set execution order for overlapping rules
6. **Analytics**: Track automation effectiveness

---

## 📋 Quick Reference

### Console Commands

```javascript
// View current settings
db.collection('settings').doc('crm_automation').get().then(d => console.table(d.data()));

// Manual automation run
window.crmModule.runCrmAutomation();

// Stop automation timer
clearInterval(window.automationTimer);

// Restart automation
window.crmModule.startAutomationTimer();

// Count auto-updated carts
currentCarts.filter(c => c.auto_updated).length
```

### Keyboard Shortcuts

- **Open Settings**: Click ⚙️ button
- **Add Rule**: Alt + R (when modal open)
- **Save**: Enter (when focused on input)
- **Close Modal**: Escape

---

## ✅ Success Criteria

Your automation is working correctly when:

1. ✅ Console shows: `⏰ Automation timer started`
2. ✅ Settings saved in Firestore (`settings/crm_automation`)
3. ✅ Timer runs every 5 minutes
4. ✅ Auto-updated carts show purple badge
5. ✅ Cards move to correct columns after wait time
6. ✅ No errors in console
7. ✅ Manual test moves cards correctly

---

## 🎉 Example Use Cases

### Use Case 1: E-commerce Store
```
New Lead → [2 hours] → Follow-up
Follow-up → [1 day] → Hot Lead
Hot Lead → [2 days] → Discount Offered
Discount Offered → [3 days] → Cold
```

### Use Case 2: Service Business
```
Inquiry → [4 hours] → Quote Sent
Quote Sent → [2 days] → Follow-up Call
Follow-up Call → [5 days] → Lost Deal
```

### Use Case 3: High-Touch Sales
```
New → [30 minutes] → Assigned
Assigned → [4 hours] → First Contact
First Contact → [1 day] → Demo Scheduled
Demo Scheduled → [3 days] → Proposal Sent
```

---

**Last Updated:** 2026-02-04  
**Version:** 1.0  
**Status:** Production Ready ✅
