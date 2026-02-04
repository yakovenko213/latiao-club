# 🐛 UTM TRACKING DEBUG GUIDE

**Date:** 04.02.2026  
**Status:** FIXED with Enhanced Debugging

---

## 🔥 CRITICAL FIXES APPLIED

### **Issue #1: Script Loading Order** ❌ → ✅
**Problem:** `utm-tracker.js` was loaded at the BOTTOM of checkout.html, AFTER the checkout form logic.

**Fix:**
```html
<!-- BEFORE (Wrong) -->
<script type="module">
  // Checkout logic runs first
  const utm = window.UTMTracker.getUTMForOrder(); // ❌ UTMTracker not defined yet!
</script>
<script src="js/utm-tracker.js"></script> <!-- Loads too late -->

<!-- AFTER (Fixed) -->
<script src="js/utm-tracker.js"></script> <!-- ✅ Loads FIRST -->
<script type="module">
  // Now checkout logic can access UTMTracker
  const utm = window.UTMTracker.getUTMForOrder(); // ✅ Works!
</script>
```

**Location:** `/public-site/checkout.html` (line ~907)

---

### **Issue #2: Missing Debug Logs** ❌ → ✅
**Problem:** No visibility into what was happening at each step.

**Fix:** Added comprehensive console.log statements:

1. **UTM Capture** (`utm-tracker.js`):
   ```javascript
   console.log('🔍 [UTM] Checking URL for UTM parameters:', window.location.href);
   console.log('✅ [UTM] Found utm_source:', value);
   console.log('✅ [UTM] Data saved to storage:', dataToStore);
   ```

2. **Order Creation** (`checkout.html`):
   ```javascript
   console.log('═══════════════════════════════════════════');
   console.log('🎯 [UTM DEBUG] Starting UTM capture for order');
   console.log('📦 [UTM] UTM data retrieved:', utmData);
   console.log('🎯 [UTM DEBUG] Final UTM data for order:', utmData);
   console.log('═══════════════════════════════════════════');
   ```

---

### **Issue #3: No Fallback Mechanism** ❌ → ✅
**Problem:** If `window.UTMTracker` wasn't loaded, order would fail silently.

**Fix:** Added fallback to read directly from storage:
```javascript
if (typeof window.UTMTracker === 'undefined') {
  console.error('❌ [UTM] UTMTracker not found! Falling back to manual storage check...');
  const storedData = sessionStorage.getItem('latiao_utm_data');
  // ... parse and use
}
```

---

## 🧪 TESTING PROCEDURE

### **Step 1: Test UTM Capture**

1. Open browser console (F12)
2. Visit: `https://latiao-snack.com.ua/?utm_source=facebook&utm_medium=cpc&utm_campaign=test_campaign`
3. **Expected Console Output:**
   ```
   🚀 [UTM] UTM Tracker initialized
   📄 [UTM] Current page: /
   🔍 [UTM] Checking URL for UTM parameters: https://latiao-snack.com.ua/?utm_source=facebook...
   ✅ [UTM] Found utm_source: facebook
   ✅ [UTM] Found utm_medium: cpc
   ✅ [UTM] Found utm_campaign: test_campaign
   ✅ [UTM] Data saved to storage: {utm_source: "facebook", utm_medium: "cpc", ...}
   💾 [UTM] sessionStorage check: {"utm_source":"facebook",...}
   🎯 [UTM] New UTM campaign detected and saved: {...}
   ```

4. **Verify Storage:**
   ```javascript
   // In console:
   UTMTracker.debug()
   ```
   Expected output:
   ```
   === UTM DEBUG ===
   Current URL: https://latiao-snack.com.ua/?utm_source=facebook...
   Stored UTM: {utm_source: "facebook", utm_medium: "cpc", ...}
   Order format: {source: "facebook", medium: "cpc", ...}
   ================
   ```

---

### **Step 2: Test Cross-Page Persistence**

1. After landing with UTM (Step 1)
2. Navigate to checkout WITHOUT UTM in URL: `https://latiao-snack.com.ua/checkout.html`
3. **Expected Console Output:**
   ```
   🚀 [UTM] UTM Tracker initialized
   ℹ️ [UTM] No UTM parameters detected (organic traffic)
   📊 [UTM] Using previously stored UTM data: {utm_source: "facebook", ...}
   🕒 [UTM] Captured 2 minutes ago
   ```

---

### **Step 3: Test Order Creation**

1. Complete checkout form
2. Click "Place Order"
3. **Expected Console Output:**
   ```
   ═══════════════════════════════════════════
   🎯 [UTM DEBUG] Starting UTM capture for order
   ═══════════════════════════════════════════
   ✅ [UTM] UTMTracker is available
   📦 [UTM] getUTMForOrder() called
   📦 [UTM] Retrieved from storage: {utm_source: "facebook", ...}
   ✅ [UTM] Formatted data for order: {source: "facebook", medium: "cpc", ...}
   📦 [UTM] UTM data retrieved: {source: "facebook", medium: "cpc", ...}
   ═══════════════════════════════════════════
   🎯 [UTM DEBUG] Final UTM data for order:
   {
     "source": "facebook",
     "medium": "cpc",
     "campaign": "test_campaign",
     "content": null,
     "term": null,
     "landingPage": "https://latiao-snack.com.ua/?utm_source=...",
     "capturedAt": "2026-02-04T10:30:00.000Z"
   }
   ═══════════════════════════════════════════
   💾 [FIRESTORE] About to save order to Firestore
   📋 [FIRESTORE] Order ID: ABC123XYZ
   🎯 [FIRESTORE] UTM data in order: {source: "facebook", ...}
   ```

---

### **Step 4: Verify in Firestore**

1. Open Firebase Console
2. Navigate to Firestore Database → `orders` collection
3. Open the new order document
4. **Expected Fields:**
   ```javascript
   {
     id: "ABC123XYZ",
     customer: {...},
     utm_data: {
       source: "facebook",
       medium: "cpc",
       campaign: "test_campaign",
       content: null,
       term: null,
       landingPage: "https://latiao-snack.com.ua/?utm_source=...",
       capturedAt: "2026-02-04T10:30:00.000Z"
     }
   }
   ```

---

### **Step 5: Verify in Admin Panel**

1. Open admin panel
2. Navigate to Orders → Click on test order
3. Scroll to customer info section
4. **Expected Display:**
   ```
   Джерело 🎯
   [facebook] [cpc] [test_campaign]
   ```

---

## 🎯 TEST PAGE

**Created:** `/public-site/test-utm-tracking.html`

**Features:**
- Real-time display of UTM parameters
- Shows current URL and parsed UTM
- Displays sessionStorage and localStorage
- Shows order format preview
- One-click test links for different platforms
- Console output viewer
- Debug and clear buttons

**How to Use:**
1. Open: `https://latiao-snack.com.ua/test-utm-tracking.html`
2. Click any test link (Facebook, Instagram, TikTok, Google)
3. Observe real-time updates in all sections
4. Click "Run Full Debug" to see detailed logs
5. Click "Clear All UTM Data" to reset

---

## 🔍 DEBUGGING CHECKLIST

If UTM tracking still shows "Органіка", check:

### **1. Script Loading**
```javascript
// In console on checkout page:
console.log(window.UTMTracker)
// Expected: Object with methods (getUTMData, getUTMForOrder, etc.)
// If undefined: Script not loaded or loaded too late
```

### **2. Storage Check**
```javascript
// In console:
sessionStorage.getItem('latiao_utm_data')
localStorage.getItem('latiao_utm_data')
// Expected: JSON string with UTM data
// If null: Data not captured or expired
```

### **3. URL Check**
```javascript
// In console on landing page:
console.log(window.location.href)
console.log(new URLSearchParams(window.location.search).get('utm_source'))
// Expected: Should show UTM parameters if present in URL
```

### **4. Order Data Check**
```javascript
// Watch console during checkout submit
// Should see:
// "🎯 [UTM DEBUG] Final UTM data for order:"
// followed by JSON with source: "facebook" (or other source)
```

### **5. Firestore Check**
- Open Firebase Console
- Check if `utm_data` field exists in order document
- If missing: Issue with Firestore write
- If present with source: "organic": Issue with capture/storage

---

## 🐞 COMMON ISSUES & SOLUTIONS

### **Issue: "UTMTracker is not defined"**
**Cause:** Script not loaded before use  
**Solution:** Script is now loaded at line 907 in checkout.html (before module scripts)

### **Issue: "No UTM parameters detected" but URL has ?utm_source=...**
**Cause:** URL encoding or parsing issue  
**Solution:** Check if URL is properly formatted, no spaces or special characters

### **Issue: UTM captured on homepage but lost on checkout**
**Cause:** Storage cleared or different domain  
**Solution:** 
- Check if sessionStorage persists across navigation
- Verify both pages are on same domain
- Check browser privacy settings (incognito mode clears sessionStorage)

### **Issue: Shows "Органіка" in admin but Firestore has utm_data**
**Cause:** Admin panel not reading field correctly  
**Solution:** Check renderUTMData() function in admin panel (already fixed in compact UI version)

---

## 📊 DEBUG LOG EXAMPLES

### **Successful UTM Capture:**
```
🚀 [UTM] UTM Tracker initialized
📄 [UTM] Current page: /
🔍 [UTM] Checking URL for UTM parameters: https://latiao-snack.com.ua/?utm_source=facebook&utm_medium=cpc
✅ [UTM] Found utm_source: facebook
✅ [UTM] Found utm_medium: cpc
✅ [UTM] Data saved to storage: {utm_source: "facebook", utm_medium: "cpc", timestamp: 1738665000000, landingPage: "https://..."}
💾 [UTM] sessionStorage check: {"utm_source":"facebook","utm_medium":"cpc",...}
🎯 [UTM] New UTM campaign detected and saved: {utm_source: "facebook", utm_medium: "cpc"}
```

### **Organic Traffic (No UTM):**
```
🚀 [UTM] UTM Tracker initialized
📄 [UTM] Current page: /
🔍 [UTM] Checking URL for UTM parameters: https://latiao-snack.com.ua/
ℹ️ [UTM] No UTM parameters found in URL
ℹ️ [UTM] No UTM parameters detected (organic traffic)
```

### **Stored UTM Used:**
```
🚀 [UTM] UTM Tracker initialized
📄 [UTM] Current page: /checkout.html
🔍 [UTM] Checking URL for UTM parameters: https://latiao-snack.com.ua/checkout.html
ℹ️ [UTM] No UTM parameters found in URL
📊 [UTM] Using previously stored UTM data: {utm_source: "facebook", utm_medium: "cpc", timestamp: 1738665000000}
🕒 [UTM] Captured 5 minutes ago
```

---

## ✅ VERIFICATION CHECKLIST

Before considering UTM tracking as "working":

- [ ] Landing page console shows "UTM campaign detected and saved"
- [ ] sessionStorage contains 'latiao_utm_data' key with JSON
- [ ] localStorage contains 'latiao_utm_data' key with JSON
- [ ] UTMTracker.debug() shows correct data
- [ ] Checkout page console shows "UTM data retrieved" with correct values
- [ ] Firestore order document has utm_data field with correct source
- [ ] Admin panel shows correct UTM badges (not "Органіка")
- [ ] Test with different platforms (Facebook, Instagram, TikTok)
- [ ] Test organic traffic (no UTM) shows "Органіка"
- [ ] Test persistence across page navigation

---

## 🚀 DEPLOYMENT

After verifying locally:

```bash
# Deploy public site with UTM tracking
firebase deploy --only hosting:public

# Deploy admin panel (if changes made)
firebase deploy --only hosting:admin-store-latio
```

---

## 📞 STILL NOT WORKING?

Run this diagnostic in console:

```javascript
// Full diagnostic
console.log('=== UTM DIAGNOSTIC ===');
console.log('1. UTMTracker loaded:', typeof window.UTMTracker !== 'undefined');
console.log('2. sessionStorage:', sessionStorage.getItem('latiao_utm_data'));
console.log('3. localStorage:', localStorage.getItem('latiao_utm_data'));
console.log('4. Current URL:', window.location.href);
console.log('5. URL params:', new URLSearchParams(window.location.search).toString());
if (window.UTMTracker) {
  console.log('6. Order format:', window.UTMTracker.getUTMForOrder());
}
console.log('=====================');
```

Copy the output and review each step to identify where the data flow breaks.

---

**Status:** ✅ **Fixed and Enhanced**  
**Last Updated:** 04.02.2026
