# 🌶️ Pepper Hunt Game - Debug Checklist

## Issue: Peppers Not Appearing on Website

This document contains comprehensive debugging steps to diagnose and fix the issue.

---

## ✅ Changes Made

### 1. **Admin Panel Toggle (Task 1)**
   - **File:** `admin-site/index.html`
   - **Function:** `togglePeppersGame()`
   - **Changes:**
     - ✅ Changed from `updateDoc()` to `setDoc()` with `{ merge: true }` to handle non-existent documents
     - ✅ Added console logging: `🌶️ [ADMIN] Saving game status:`
     - ✅ Added confirmation logging after save: `✅ [ADMIN] Game status saved to Firestore`
     - ✅ Added error logging: `❌ [ADMIN] Error toggling game:`

### 2. **Frontend Firestore Subscription (Task 2)**
   - **File:** `public-site/js/pepper-hunt-game.js`
   - **Changes:**
     - ✅ Added comprehensive logging to `checkGameStatus()`
     - ✅ Added NEW `setupGameStatusListener()` with real-time Firestore listener
     - ✅ Added `onSnapshot` import from Firestore
     - ✅ Enhanced `init()` with detailed step-by-step logging
     - ✅ Auto-reload page when game is enabled remotely

### 3. **Randomization & Placement (Task 3)**
   - **File:** `public-site/js/pepper-hunt-game.js`
   - **Changes:**
     - ✅ Added detailed logging to `initializeRandomProducts()`
     - ✅ Added fallback products if database is empty
     - ✅ Added logging to `shouldShowPepper()` to debug visibility logic
   - **File:** `public-site/js/pepper-renderer.js`
   - **Changes:**
     - ✅ Enhanced `insertPepperInto()` with step-by-step logging
   - **File:** `public-site/js/pepper-placer.js`
   - **Changes:**
     - ✅ Enhanced `initializePage()` with comprehensive logging
     - ✅ Added game enablement check before placement
     - ✅ Enhanced `placeHomepagePeppers()` with detailed logging and error handling
     - ✅ Updated `waitForElement()` with logging and error callback support

### 4. **CSS Visibility (Task 4)**
   - **File:** `public-site/js/pepper-renderer.js`
   - **Changes:**
     - ✅ Increased `z-index` from `100` to `9999 !important`
     - ✅ Added `display: inline-block !important`
     - ✅ Added `opacity: 1 !important`
     - ✅ Added `visibility: visible !important`

---

## 🔍 Step-by-Step Debugging Guide

### Step 1: Verify Admin Toggle Works

1. **Open Admin Panel** → Navigate to "Peppers Game" section
2. **Toggle the game ON**
3. **Open Browser Console** (F12)
4. **Look for these logs:**
   ```
   🌶️ [ADMIN] Saving game status: true
   ✅ [ADMIN] Game status saved to Firestore: true
   ```

**✓ PASS:** You see both log messages  
**✗ FAIL:** You see error messages → Check Firestore permissions

---

### Step 2: Verify Frontend Receives Game Status

1. **Open any website page** (e.g., homepage)
2. **Open Browser Console** (F12)
3. **Look for initialization sequence:**
   ```
   ═══════════════════════════════════════
   🌶️ PEPPER HUNT - INITIALIZATION START
   ═══════════════════════════════════════
   ✅ [INIT] Firebase App ready
   🔌 [INIT] Getting Firestore instance...
   ✅ [INIT] Firestore connected
   ✅ [INIT] Game instance found
   🎮 [INIT] Initializing game with Firestore...
   🔍 [STATUS] Checking game status in Firestore...
   📄 [STATUS] Fetching document: settings/peppersGameConfig
   ✅ [STATUS] Game status from DB: { isEnabled: true, ... }
   ✅ [INIT] Game is ENABLED and ready
   ```

**✓ PASS:** You see `isEnabled: true`  
**✗ FAIL:** You see `isEnabled: false` → Check admin toggle OR run setup-pepper-hunt.html  
**✗ FAIL:** Document doesn't exist → Run setup-pepper-hunt.html

---

### Step 3: Verify Random Products Initialization

**Look for these logs in console:**
```
🎲 [RANDOM] Initializing random products for dynamic peppers...
📦 [RANDOM] Fetching products from Firestore...
✅ [RANDOM] Found X products in database
🎉 [RANDOM] Random products saved to localStorage: [...]
```

**Check localStorage:**
```javascript
// In browser console:
localStorage.getItem('pepperhunt_random_products')
// Should return: ["product-id-1", "product-id-2", "product-id-3"]
```

**✓ PASS:** 3 product IDs are saved  
**✗ FAIL:** Empty or null → Products collection might be empty, using fallback

---

### Step 4: Verify Pepper Placement

**On Homepage, look for:**
```
🚀 [PLACER] Starting pepper placement initialization...
📍 [PLACER] Current path: /
🎯 [PLACER] Detected page type: homepage
✅ [PLACER] Game and Renderer are ready
✅ [PLACER] Game is enabled, placing peppers...
🏠 [PLACER] Placing homepage peppers...
🏠 [PLACE #1] Attempting to place homepage pepper in FAQ...
⏳ [WAIT] Waiting for element: .accordion-content
✅ [WAIT] Element found: .accordion-content
✅ [PLACE #1] FAQ section found, searching for target answer...
🔍 [PLACE #1] Found X FAQ answer paragraphs
✅ [PLACE #1] Target FAQ answer found!
🔍 [PEPPER #1] Checking if should show...
✅ [PEPPER #1] Should show (fixed location)
🎉 [PLACE #1] Pepper #1 successfully placed in FAQ!
```

**✓ PASS:** You see "successfully placed"  
**✗ FAIL:** Placement blocked → Check logs to see where it stopped

---

### Step 5: Visual Verification

1. **Open homepage**
2. **Navigate to FAQ section**
3. **Expand "Чи можна латяо дітям?" question**
4. **Look for floating pepper emoji** 🌶️

**Visual Check:**
- Pepper should be visible
- Pepper should float/animate
- Pepper should glow on hover
- Pepper should be clickable

**✓ PASS:** Pepper is visible and animated  
**✗ FAIL:** Not visible → Check console for CSS issues or z-index conflicts

---

## 🐛 Common Issues & Solutions

### Issue 1: "Game is currently disabled"
**Cause:** Admin toggle is OFF or document doesn't exist  
**Solution:**
1. Run `/setup-pepper-hunt.html` to create config document
2. Go to Admin Panel → Toggle game ON
3. Refresh website page

---

### Issue 2: "Config document does not exist"
**Cause:** Firestore document not created  
**Solution:**
```
Open: /public-site/setup-pepper-hunt.html
Click: "Enable Game Now"
```

---

### Issue 3: Peppers placed but not visible
**Cause:** Z-index or CSS conflict  
**Solution:**
1. Inspect element in browser DevTools
2. Check computed styles for `.chili-pepper`
3. Verify z-index is 9999
4. Check if parent element has `overflow: hidden`

**Quick fix in console:**
```javascript
document.querySelectorAll('.chili-pepper').forEach(p => {
  p.style.zIndex = '99999';
  p.style.display = 'inline-block';
  p.style.opacity = '1';
  p.style.visibility = 'visible';
});
```

---

### Issue 4: Real-time listener not working
**Cause:** onSnapshot might not be imported correctly  
**Check:**
```javascript
// In console:
window.pepperHuntGame.isEnabled
// Should return: true or false
```

**Manual refresh:**
```javascript
await window.pepperHuntGame.checkGameStatus();
console.log(window.pepperHuntGame.isEnabled);
```

---

### Issue 5: Random products empty
**Cause:** Products collection is empty in Firestore  
**Fallback:** System automatically uses:
```javascript
['latiao-classic-original', 'latiao-spicy-fire', 'latiao-bbq-flavor']
```

**Manual override:**
```javascript
window.pepperHuntGame.randomProductIds = ['your-product-1', 'your-product-2', 'your-product-3'];
localStorage.setItem('pepperhunt_random_products', JSON.stringify(window.pepperHuntGame.randomProductIds));
```

---

## 📊 Quick Diagnostic Commands

Run these in browser console:

```javascript
// Check if game is initialized
console.log('Game:', !!window.pepperHuntGame);
console.log('Renderer:', !!window.pepperRenderer);
console.log('Placer:', !!window.pepperPlacer);

// Check game status
console.log('Enabled:', window.pepperHuntGame?.isEnabled);
console.log('Progress:', window.pepperHuntGame?.getProgress());

// Check random products
console.log('Random Products:', window.pepperHuntGame?.randomProductIds);

// Check localStorage
console.log('LS Progress:', localStorage.getItem('pepperhunt_progress'));
console.log('LS Products:', localStorage.getItem('pepperhunt_random_products'));

// Force re-check game status
await window.pepperHuntGame.checkGameStatus();

// Manually trigger placement
window.pepperPlacer.initializePage();
```

---

## 🧪 Testing Scenarios

### Test 1: Fresh User (No localStorage)
1. Clear localStorage
2. Reload page
3. Should see initialization logs
4. Should assign 3 random products
5. Peppers should appear

### Test 2: Returning User (Has Progress)
1. Keep localStorage with progress
2. Reload page
3. Should NOT show already-found peppers
4. Should show remaining peppers only

### Test 3: Toggle Game Off/On
1. Turn game OFF in admin
2. Reload website → No peppers
3. Turn game ON in admin
4. Wait 1-2 seconds OR reload → Peppers appear

### Test 4: Dynamic Product Peppers
1. Note the 3 random product IDs in console
2. Visit those product pages
3. Should see peppers in tabs/sections
4. Visit other products → No peppers

---

## 🔧 Emergency Reset

If everything is broken, run this in console:

```javascript
// Reset game completely
localStorage.removeItem('pepperhunt_progress');
localStorage.removeItem('pepperhunt_random_products');
window.location.reload();
```

---

## 📝 Log Interpretation Guide

### Good Sequence:
```
🌶️ PEPPER HUNT - INITIALIZATION START
✅ Firebase connected
✅ Game enabled
✅ Renderer created
🚀 PLACER starting
✅ Pepper placed
```

### Bad Sequence (Game Disabled):
```
🌶️ PEPPER HUNT - INITIALIZATION START
✅ Firebase connected
⚠️ Game is disabled
(stops here)
```

### Bad Sequence (Config Missing):
```
🔍 [STATUS] Checking game status
⚠️ [STATUS] Config document does not exist!
💡 [STATUS] Run setup-pepper-hunt.html
```

---

## 🎯 Success Criteria

✅ Admin toggle saves to Firestore  
✅ Website reads isEnabled: true  
✅ 3 random products assigned  
✅ Peppers placed on correct pages  
✅ Peppers visible and animated  
✅ Click interaction works  
✅ Progress saved to localStorage  
✅ Real-time listener responds to admin changes

---

## 📞 Next Steps

If all logs show success but peppers still not visible:

1. **Check page-specific issues:**
   - FAQ might be hidden/collapsed
   - Accordion might need to be opened
   - Content might load dynamically after placement

2. **Verify element selectors:**
   - `.accordion-content` might not exist
   - FAQ structure might have changed
   - Selectors in pepper-placer.js might need updating

3. **Manual placement test:**
   ```javascript
   // Create pepper manually
   const pepper = window.pepperRenderer.createPepper(1, false);
   document.body.appendChild(pepper);
   // Should see pepper at top of page
   ```

---

## 🌟 Final Verification

Run this comprehensive check:

```javascript
const diagnostics = {
  gameExists: !!window.pepperHuntGame,
  rendererExists: !!window.pepperRenderer,
  placerExists: !!window.pepperPlacer,
  gameEnabled: window.pepperHuntGame?.isEnabled,
  randomProducts: window.pepperHuntGame?.randomProductIds,
  progress: window.pepperHuntGame?.getProgress(),
  localStorage: {
    progress: localStorage.getItem('pepperhunt_progress'),
    products: localStorage.getItem('pepperhunt_random_products')
  },
  visiblePeppers: document.querySelectorAll('.chili-pepper').length
};

console.table(diagnostics);
```

All values should be populated and `gameEnabled` should be `true`.

---

**Updated:** Feb 11, 2026  
**All debugging enhancements applied and ready for testing! 🚀**
