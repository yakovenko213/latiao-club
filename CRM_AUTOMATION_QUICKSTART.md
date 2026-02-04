# 🚀 CRM Automation Quick Start

## 1️⃣ Open Settings
Admin Panel → CRM → ⚙️ **Налаштування колонок**

---

## 2️⃣ Configure Rules

### Example Configuration:

**Initial Capture:**
- Затримка: `5` хвилин
- Цільова колонка: `Новий лід`

**Transition Rules:**

| # | From | To | Wait Time |
|---|------|----|----|
| 1 | Новий лід | Контакт встановлено | 2 години |
| 2 | Контакт встановлено | Не зацікавлений | 3 дні |
| 3 | Переговори | Готовий замовити | 1 день |

---

## 3️⃣ Save & Test

1. Click **💾 Зберегти**
2. Click **▶️ Тестувати** to run immediately
3. Check for purple "Auto" badges on cards

---

## 🎯 How It Works

```
Cart created → Wait 2 hours → Auto-move to "Контакт встановлено"
                ↓
         No action for 3 days
                ↓
         Auto-move to "Не зацікавлений"
```

---

## 📊 Visual Indicators

**Auto-Updated Card:**
- 🟣 Purple border
- 🤖 "Auto" badge
- Hover for reason: "Auto-moved after 2 hours"

---

## 🔧 Console Commands

```javascript
// Manual run
window.crmModule.runCrmAutomation();

// Check settings
db.collection('settings').doc('crm_automation').get().then(d => console.log(d.data()));

// Count auto-updated
currentCarts.filter(c => c.auto_updated).length
```

---

## ⏱️ Automation Schedule

- **Auto-runs:** Every 5 minutes
- **On page load:** When CRM tab opens
- **Manual:** Click "Тестувати" button

---

## ✅ Quick Checklist

- [ ] Settings saved in Firestore
- [ ] At least one rule configured
- [ ] "enabled: true" in settings
- [ ] Timer shows in console
- [ ] Test run successful
- [ ] Cards show "Auto" badge

---

## 🚨 Common Issues

| Problem | Solution |
|---------|----------|
| Rules not applying | Check wait time hasn't passed yet |
| No auto-updates | Verify `enabled: true` in settings |
| Timer not running | Refresh CRM page |
| Cards immediately move | Increase wait time |

---

## 📖 Full Documentation

See [CRM_AUTOMATION_GUIDE.md](./CRM_AUTOMATION_GUIDE.md) for complete details.

---

**Status:** ✅ Deployed  
**URL:** https://admin-store-latio.web.app  
**Last Updated:** 2026-02-04
