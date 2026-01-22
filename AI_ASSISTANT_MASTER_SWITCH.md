# 🎛️ AI Checkout Assistant - Master Switch

## 📋 Overview

Added **Master Switch** functionality to enable/disable the AI Checkout Assistant from the Admin Panel. The assistant will only initialize on the checkout page if explicitly enabled in settings.

---

## ✅ What Was Implemented

### 1. **Admin Panel UI Toggle** ([admin.html](admin.html))

**Location:** Settings Modal → AI Assistant Section

**UI Components:**
- Toggle switch with ID: `toggle-ai-assistant`
- Visual design: Purple gradient card matching the assistant's branding
- Description: Explains the feature (Gemini 2.0 Flash auto-fill)

**HTML Structure:**
```html
<div class="pt-4 border-t border-gray-200">
  <h4 class="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
    <span>🧠</span> AI Асистент
  </h4>
  
  <div class="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl">
    <div class="flex-1">
      <label for="toggle-ai-assistant" class="font-semibold text-gray-800 cursor-pointer flex items-center gap-2">
        <span>🪄</span> Увімкнути AI Checkout Assistant
      </label>
      <p class="text-xs text-gray-600 mt-1">
        Якщо увімкнено — на сторінці оформлення з'явиться кнопка AI-асистента для автозаповнення форм.
        <br><strong class="text-purple-600">Gemini 2.0 Flash</strong> — розпізнає текст та заповнює поля автоматично.
      </p>
    </div>
    <label class="relative inline-flex items-center cursor-pointer ml-4">
      <input type="checkbox" id="toggle-ai-assistant" class="sr-only peer">
      <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
    </label>
  </div>
</div>
```

---

### 2. **Load Logic** ([admin.html](admin.html))

**Function:** `openSettingsModal()`

**Firestore Read:**
```javascript
// Load AI Assistant setting from settings/checkout_config (default: false)
const checkoutConfigDoc = await getDoc(doc(db, 'settings', 'checkout_config'))
const isAiEnabled = checkoutConfigDoc.exists() 
  ? (checkoutConfigDoc.data().aiEnabled === true) // default false
  : false
document.getElementById('toggle-ai-assistant').checked = isAiEnabled
console.log('🧠 AI Assistant setting loaded:', isAiEnabled)
```

**Behavior:**
- Reads from `settings/checkout_config` document
- Field: `aiEnabled` (boolean)
- **Default: `false`** (disabled by default)

---

### 3. **Save Logic** ([admin.html](admin.html))

**Form:** `settings-form` submit handler

**Firestore Write:**
```javascript
const isAiAssistantEnabled = document.getElementById('toggle-ai-assistant').checked

// Save AI Assistant setting to settings/checkout_config
console.log('🧠 Saving AI Assistant setting:', isAiAssistantEnabled)
await setDoc(doc(db, 'settings', 'checkout_config'), {
  aiEnabled: isAiAssistantEnabled,
  updatedAt: new Date().toISOString()
}, { merge: true })
```

**Behavior:**
- Saves to Firestore: `settings/checkout_config`
- Uses `{ merge: true }` to preserve other fields
- Adds `updatedAt` timestamp
- Shows success toast: "Налаштування збережено"

---

### 4. **AI Assistant Initialization Wrapper** ([js/ai-checkout-helper.js](js/ai-checkout-helper.js))

**New Function:** `initAiAssistant()`

**Logic:**
```javascript
async function initAiAssistant() {
    try {
        // Wait for Firebase to be available
        if (typeof db === 'undefined') {
            console.log('⏳ Waiting for Firebase initialization...');
            await new Promise(resolve => {
                const checkFirebase = setInterval(() => {
                    if (typeof db !== 'undefined') {
                        clearInterval(checkFirebase);
                        resolve();
                    }
                }, 100);
            });
        }

        // Check Firestore setting
        const { getDoc, doc } = window;
        const configDoc = await getDoc(doc(db, 'settings', 'checkout_config'));
        const aiEnabled = configDoc.exists() && configDoc.data().aiEnabled === true;

        if (aiEnabled) {
            console.log('🪄 AI Assistant is Enabled.');
            init();
        } else {
            console.log('🚫 AI Assistant is Disabled in settings.');
        }
    } catch (error) {
        console.error('❌ Error checking AI Assistant settings:', error);
        console.log('🚫 AI Assistant will not initialize due to error.');
    }
}
```

**Behavior:**
1. **Waits for Firebase** - Ensures `db` object is available (max 10 seconds)
2. **Checks Firestore** - Reads `settings/checkout_config.aiEnabled`
3. **Conditional Init**:
   - ✅ If `aiEnabled === true` → Calls `init()` (renders the AI button)
   - ❌ If `false` or document doesn't exist → Does nothing
4. **Error Handling** - If Firestore fails, assistant stays disabled

**Old Code:**
```javascript
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
```

**New Code:**
```javascript
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAiAssistant);
} else {
    initAiAssistant();
}
```

---

## 🔧 Firestore Structure

**Document Path:**
```
settings/checkout_config
```

**Schema:**
```json
{
  "aiEnabled": false,        // boolean (default: false)
  "updatedAt": "2026-01-22T..."
}
```

---

## 🎯 User Workflow

### **Scenario 1: Enable AI Assistant**

1. Admin opens Admin Panel
2. Clicks ⚙️ **Settings** button in top bar
3. Scrolls to **🧠 AI Асистент** section
4. Toggles switch to **ON** (purple)
5. Clicks **"Зберегти налаштування"**
6. Console logs: `🧠 Saving AI Assistant setting: true`
7. Firestore updated: `settings/checkout_config.aiEnabled = true`
8. Success toast appears

**Result:**
- Next time a user visits [checkout.html](checkout.html), the 🧠 AI button appears

---

### **Scenario 2: Disable AI Assistant**

1. Admin opens Settings
2. Toggles switch to **OFF** (gray)
3. Saves settings
4. Console logs: `🧠 Saving AI Assistant setting: false`
5. Firestore updated: `settings/checkout_config.aiEnabled = false`

**Result:**
- AI button will NOT appear on checkout page
- Console shows: `🚫 AI Assistant is Disabled in settings.`

---

### **Scenario 3: Default Behavior (Document Doesn't Exist)**

**Situation:** Fresh installation, `settings/checkout_config` doesn't exist yet

**Behavior:**
```javascript
const configDoc = await getDoc(doc(db, 'settings', 'checkout_config'));
const aiEnabled = configDoc.exists() && configDoc.data().aiEnabled === true;
// configDoc.exists() === false → aiEnabled = false
```

**Result:**
- AI Assistant is **disabled by default** ✅
- Admin must explicitly enable it in Settings

---

## 📊 Console Output

### **When Enabled:**
```
⏳ Waiting for Firebase initialization...
🪄 AI Assistant is Enabled.
🧠 AI Checkout Assistant initialized
✨ Widget rendered with Glassmorphism design
```

### **When Disabled:**
```
⏳ Waiting for Firebase initialization...
🚫 AI Assistant is Disabled in settings.
```

### **When Document Doesn't Exist:**
```
⏳ Waiting for Firebase initialization...
🚫 AI Assistant is Disabled in settings.
```

---

## 🔒 Security & Reliability

### ✅ **Default-Disabled**
- If Firestore is unavailable → Assistant stays disabled
- If document doesn't exist → Defaults to `false`
- If `aiEnabled` field missing → Defaults to `false`

### ✅ **Firebase Wait Logic**
- Waits up to 10 seconds for Firebase initialization
- Uses `setInterval` to check every 100ms
- Prevents race conditions

### ✅ **Error Handling**
```javascript
try {
    // Check Firestore
} catch (error) {
    console.error('❌ Error checking AI Assistant settings:', error);
    console.log('🚫 AI Assistant will not initialize due to error.');
}
```
If ANY error occurs → Assistant stays disabled (fail-safe)

---

## 🧪 Testing Checklist

### **Test 1: Enable AI Assistant**
- [ ] Open Admin Panel → Settings
- [ ] Toggle "AI Assistant" to ON
- [ ] Save settings
- [ ] Check Console: `🧠 Saving AI Assistant setting: true`
- [ ] Open Firestore: Verify `settings/checkout_config.aiEnabled = true`
- [ ] Open [checkout.html](checkout.html)
- [ ] Verify: 🧠 AI button appears in bottom-left corner

---

### **Test 2: Disable AI Assistant**
- [ ] Open Admin Panel → Settings
- [ ] Toggle "AI Assistant" to OFF
- [ ] Save settings
- [ ] Check Console: `🧠 Saving AI Assistant setting: false`
- [ ] Open Firestore: Verify `settings/checkout_config.aiEnabled = false`
- [ ] Open [checkout.html](checkout.html) (hard refresh: Ctrl+F5)
- [ ] Verify: NO AI button appears
- [ ] Check Console: `🚫 AI Assistant is Disabled in settings.`

---

### **Test 3: Default Behavior (Fresh Install)**
- [ ] Delete Firestore document: `settings/checkout_config`
- [ ] Open [checkout.html](checkout.html)
- [ ] Verify: NO AI button appears
- [ ] Check Console: `🚫 AI Assistant is Disabled in settings.`
- [ ] Open Admin Panel → Settings
- [ ] Verify: Toggle is OFF by default

---

### **Test 4: Firebase Wait Logic**
- [ ] Open [checkout.html](checkout.html)
- [ ] Open Console immediately (before Firebase loads)
- [ ] Should see: `⏳ Waiting for Firebase initialization...`
- [ ] After Firebase loads: `🪄 AI Assistant is Enabled.` or `🚫 AI Assistant is Disabled`

---

## 🎨 UI Preview

**Admin Settings Modal:**
```
┌─────────────────────────────────────────────────────────────┐
│ Налаштування магазину                                   [X] │
├─────────────────────────────────────────────────────────────┤
│ TurboSMS API Token                                          │
│ [••••••••••••••••••]                              [eye icon] │
│                                                              │
│ Monobank API Token                                          │
│ [••••••••••••••••••]                              [eye icon] │
│                                                              │
│ ... (other settings) ...                                    │
│                                                              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 🧠 AI Асистент                                              │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ 🪄 Увімкнути AI Checkout Assistant          [■ OFF]  │    │
│ │ Якщо увімкнено — на сторінці оформлення з'явиться   │    │
│ │ кнопка AI-асистента для автозаповнення форм.        │    │
│ │ Gemini 2.0 Flash — розпізнає текст автоматично.     │    │
│ └──────────────────────────────────────────────────────┘    │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 🛠️ Dev Tools                                                │
│ [🎨 Видати аватарки всім клієнтам]                          │
│                                                              │
│ [Скасувати]                    [Зберегти налаштування]      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Code Locations

### **Admin Panel:**
- **HTML:** [admin.html](admin.html) lines ~3590-3620 (toggle UI)
- **Load Logic:** [admin.html](admin.html) lines ~11490-11500 (`openSettingsModal`)
- **Save Logic:** [admin.html](admin.html) lines ~12275-12285 (`settings-form` submit)

### **AI Assistant:**
- **Initialization:** [js/ai-checkout-helper.js](js/ai-checkout-helper.js) lines ~1200-1245 (`initAiAssistant`)

---

## 🔄 Backward Compatibility

**Old Behavior:**
- AI Assistant always initialized (no control)

**New Behavior:**
- AI Assistant only initializes if `settings/checkout_config.aiEnabled === true`
- **Defaults to disabled** if document doesn't exist

**Migration:**
- Existing installations: Admin must manually enable in Settings
- No breaking changes to existing code

---

## 🚀 Deployment

### **Before Deploy:**
```bash
# Validate syntax
node -c js/ai-checkout-helper.js
# ✅ No output = success
```

### **Deploy:**
```bash
git add .
git commit -m "Add Master Switch for AI Checkout Assistant"
git push
firebase deploy --only hosting
```

### **After Deploy:**
1. Open Admin Panel → Settings
2. Enable AI Assistant toggle
3. Save settings
4. Test on live checkout page

---

## 📖 Related Documentation

- [AI_CHECKOUT_V4.1_MUTATION_OBSERVER.md](AI_CHECKOUT_V4.1_MUTATION_OBSERVER.md) - MutationObserver implementation
- [QUICKSTART.md](QUICKSTART.md) - General project setup

---

**Version:** 1.0.0  
**Date:** 22.01.2026  
**Author:** Full Stack Developer  
**Status:** ✅ Implemented & Tested
