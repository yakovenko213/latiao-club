# 🚨 BULLETPROOF UTM TRACKING - TESTING INSTRUCTIONS

**Date:** 04.02.2026  
**Version:** 2.0 - Maximum Visibility Edition

---

## 🎯 WHAT'S DIFFERENT IN v2.0

### **1. localStorage Instead of sessionStorage**
- More persistent (survives browser restarts)
- Survives 30 days (vs session-only)

### **2. ALERT Notifications**
- Visual confirmation when UTM is detected
- Alert before order submission with UTM data

### **3. Color-Coded Console Logs**
- Orange headers for URL checking
- Green for successful capture
- Red for Firestore save
- Purple for data construction
- Table displays for easy reading

### **4. Emergency Pause Before Save**
- Alert that pauses execution before Firestore write
- Gives you time to verify console data

---

## 📋 STEP-BY-STEP TESTING

### **STEP 1: Test UTM Capture (Homepage)**

1. **Open browser console** (Press F12)
2. **Clear console** (Click trash icon or press Ctrl+L)
3. **Visit with UTM:**
   ```
   https://latiao-snack.com.ua/?utm_source=facebook&utm_medium=cpc&utm_campaign=test_campaign
   ```

4. **WHAT YOU SHOULD SEE:**

   **A. Alert Popup:**
   ```
   🎯 UTM DETECTED!
   
   Source: facebook
   
   Check console (F12) for full details.
   ```
   ✅ **Click OK** on the alert

   **B. Console Output:**
   ```
   🎯 UTM TRACKER v2.0 LOADING...
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🔍 CHECKING URL FOR UTM PARAMETERS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   📄 Full URL: https://latiao-snack.com.ua/?utm_source=facebook&utm_medium=cpc&utm_campaign=test_campaign
   🔗 Query String: ?utm_source=facebook&utm_medium=cpc&utm_campaign=test_campaign
   
   ✅ FOUND UTM_SOURCE: facebook
   ✅ FOUND UTM_MEDIUM: cpc
   ✅ FOUND UTM_CAMPAIGN: test_campaign
   
   📊 UTM PARAMETERS DETECTED:
   ┌─────────────────┬──────────────────┐
   │ utm_source      │ facebook         │
   │ utm_medium      │ cpc              │
   │ utm_campaign    │ test_campaign    │
   └─────────────────┴──────────────────┘
   
   💾 SAVED TO LOCALSTORAGE:
   {
     utm_source: "facebook",
     utm_medium: "cpc",
     utm_campaign: "test_campaign",
     timestamp: 1738665000000,
     capturedAt: "2026-02-04T10:30:00.000Z",
     landingPage: "https://latiao-snack.com.ua/?utm_source=..."
   }
   
   ✅ UTM TRACKER v2.0 READY
   ```

5. **VERIFY IN CONSOLE:**
   ```javascript
   UTMTracker.debug()
   ```
   
   **Expected:**
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🐛 UTM TRACKER DEBUG
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📄 Current URL: https://latiao-snack.com.ua/?utm_source=facebook...
   📂 localStorage key: latiao_utm_data
   📊 Stored Data:
   ┌─────────────────┬──────────────────┐
   │ utm_source      │ facebook         │
   │ utm_medium      │ cpc              │
   │ utm_campaign    │ test_campaign    │
   └─────────────────┴──────────────────┘
   ```

---

### **STEP 2: Verify Persistence (Navigate to Checkout)**

1. **Navigate to checkout page** (click cart, go to checkout)
2. **URL will NOT have UTM parameters** - this is expected
3. **Console should show:**
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🔍 CHECKING URL FOR UTM PARAMETERS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📄 Full URL: https://latiao-snack.com.ua/checkout.html
   ℹ️ No UTM parameters in URL (Organic traffic)
   ```

4. **BUT... data is still in localStorage!**
   ```javascript
   UTMTracker.debug()
   ```
   
   **Expected:**
   ```
   📊 Stored Data:
   ┌─────────────────┬──────────────────┐
   │ utm_source      │ facebook         │  ← STILL THERE!
   │ utm_medium      │ cpc              │
   │ utm_campaign    │ test_campaign    │
   └─────────────────┴──────────────────┘
   ```

---

### **STEP 3: Test Order Submission**

1. **Fill out checkout form** (name, phone, address, etc.)
2. **Click "Place Order" button**
3. **Console will explode with logs!** 📢

   **A. First Section - UTM Capture:**
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🎯 STEP 7: CAPTURING UTM DATA FOR ORDER
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   ✅ UTMTracker is available
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📦 PREPARING UTM DATA FOR ORDER
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   📦 RETRIEVED FROM LOCALSTORAGE:
   ┌─────────────────┬──────────────────┐
   │ utm_source      │ facebook         │
   │ utm_medium      │ cpc              │
   │ utm_campaign    │ test_campaign    │
   └─────────────────┴──────────────────┘
   
   ✅ UTM DATA READY FOR FIRESTORE:
   ┌──────────────┬────────────────────────────┐
   │ source       │ facebook                    │
   │ medium       │ cpc                         │
   │ campaign     │ test_campaign               │
   │ content      │ null                        │
   │ term         │ null                        │
   │ landingPage  │ https://latiao-snack.com... │
   │ capturedAt   │ 2026-02-04T10:30:00.000Z    │
   └──────────────┴────────────────────────────┘
   ```

   **B. Alert Popup:**
   ```
   ✅ UTM Data Ready!
   
   Source: facebook
   Medium: cpc
   
   This will be saved with your order.
   ```
   ✅ **Click OK**

   **C. Second Alert (Critical):**
   ```
   ⚠️ CHECK CONSOLE NOW!
   
   About to save order to Firestore.
   Press OK after checking console logs (F12).
   ```
   
   **D. BEFORE clicking OK, CHECK CONSOLE:**
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🚨 FINAL DATA TO FIRESTORE - LAST CHANCE TO VERIFY!
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   Order ID: ABC123XYZ
   
   Full Order Data:
   {
     "customer": {...},
     "delivery": {...},
     "items": [...],
     "utm_data": {                    ← ✅ VERIFY THIS IS HERE!
       "source": "facebook",
       "medium": "cpc",
       "campaign": "test_campaign",
       "content": null,
       "term": null,
       "landingPage": "https://...",
       "capturedAt": "2026-02-04T10:30:00.000Z"
     }
   }
   
   CRITICAL CHECK - utm_data field:
   ┌──────────────┬────────────────────────────┐
   │ source       │ facebook                    │  ← ✅ CHECK THIS!
   │ medium       │ cpc                         │
   │ campaign     │ test_campaign               │
   └──────────────┴────────────────────────────┘
   
   Field name: utm_data
   Field value type: object                      ← ✅ MUST BE "object"
   Field value: {source: "facebook", medium: "cpc", ...}
   ```

4. **✅ VERIFY THESE CRITICAL POINTS:**
   - [ ] `utm_data` field exists in Full Order Data
   - [ ] `source` = "facebook" (not "organic")
   - [ ] Field value type = "object" (not "string")
   - [ ] All UTM values are present in the table

5. **If everything looks good, click OK on alert**

6. **Final console output:**
   ```
   📤 WRITING TO FIRESTORE NOW...
   ✅ ORDER SAVED TO FIRESTORE SUCCESSFULLY!
   Order ID: ABC123XYZ
   ```

---

### **STEP 4: Verify in Firebase Console**

1. **Open Firebase Console** → Firestore Database
2. **Navigate to:** `orders` collection
3. **Find your order** (use the Order ID from console)
4. **Verify structure:**
   ```
   orders/ABC123XYZ
   ├── customer: {...}
   ├── delivery: {...}
   ├── items: [...]
   └── utm_data: {           ← ✅ MUST BE HERE!
         source: "facebook"
         medium: "cpc"
         campaign: "test_campaign"
         content: null
         term: null
         landingPage: "https://..."
         capturedAt: "2026-02-04T10:30:00.000Z"
       }
   ```

---

### **STEP 5: Verify in Admin Panel**

1. **Open admin panel**
2. **Navigate to Orders**
3. **Click on your test order**
4. **Scroll to customer info section**
5. **Look for "Джерело 🎯" line**

   **Expected:**
   ```
   Джерело 🎯
   [facebook] [cpc] [test_campaign]
   ```

   **If it says "🌿 Органічно" → PROBLEM!**

---

## 🐞 TROUBLESHOOTING

### **Problem: No alert on landing page**

**Check:**
```javascript
// In console
console.log(window.UTMTracker)
```

**Expected:** Object with methods  
**If undefined:** Script not loaded

**Fix:** Check if `utm-tracker-bulletproof.js` is in `/js/` folder

---

### **Problem: Alert shows but console is empty**

**Check:** Browser might have console filters enabled

**Fix:**
1. Click "All" in console filter dropdown
2. Ensure "Info", "Warnings", "Errors" are all checked
3. Refresh page

---

### **Problem: localStorage shows null**

**Check:**
```javascript
localStorage.getItem('latiao_utm_data')
```

**If null:**
- UTM parameters not in URL
- Or browser has localStorage disabled (incognito mode)

**Fix:**
- Use full URL with ?utm_source=...
- Try regular browser window (not incognito)

---

### **Problem: utm_data shows source: "organic" in Firestore**

**Root Cause:** localStorage was empty when order was created

**Debug Steps:**
1. Clear localStorage: `localStorage.clear()`
2. Start fresh: Visit page with ?utm_source=test
3. Verify alert appears
4. Run `UTMTracker.debug()` to confirm data is stored
5. Then navigate to checkout and place order

---

### **Problem: Admin panel shows "Органічно" but Firestore has utm_data**

**Root Cause:** Admin panel reading wrong field name

**Check in admin panel code:**
```javascript
// Search for: renderUTMData
// Verify it reads: order.utm_data
// NOT: order.utmData or order.utm_source
```

---

## ✅ VERIFICATION CHECKLIST

Before considering UTM working:

- [ ] Alert appears when landing with ?utm_source=...
- [ ] Console shows "✅ FOUND UTM_SOURCE: facebook"
- [ ] Console shows table with UTM parameters
- [ ] `localStorage.getItem('latiao_utm_data')` returns JSON
- [ ] `UTMTracker.debug()` shows correct data
- [ ] Navigating to checkout keeps data in localStorage
- [ ] Order submission shows alert with UTM data
- [ ] Console shows "🚨 FINAL DATA TO FIRESTORE" with correct utm_data
- [ ] Field type is "object" not "string"
- [ ] Firestore document has utm_data field
- [ ] Admin panel shows UTM badges (not "Органічно")

---

## 🎯 EXPECTED CONSOLE OUTPUT SUMMARY

**Landing Page (with UTM):**
- 🎯 UTM TRACKER v2.0 LOADING...
- ✅ FOUND UTM_SOURCE: [value]
- 💾 SAVED TO LOCALSTORAGE
- ✅ UTM TRACKER v2.0 READY

**Checkout Page:**
- 🎯 STEP 7: CAPTURING UTM DATA FOR ORDER
- ✅ UTMTracker is available
- 📦 PREPARING UTM DATA FOR ORDER
- ✅ UTM DATA READY FOR FIRESTORE

**Order Submission:**
- 📋 ORDER DATA OBJECT CONSTRUCTED
- 🚨 FINAL DATA TO FIRESTORE
- CRITICAL CHECK - utm_data field (table)
- Field value type: object
- 📤 WRITING TO FIRESTORE NOW...
- ✅ ORDER SAVED TO FIRESTORE SUCCESSFULLY!

---

## 📞 STILL NOT WORKING?

Run full diagnostic:

```javascript
console.clear();
console.log('=== FULL UTM DIAGNOSTIC ===');
console.log('1. Script loaded:', typeof window.UTMTracker !== 'undefined');
console.log('2. localStorage:', localStorage.getItem('latiao_utm_data'));
console.log('3. Current URL:', window.location.href);
console.log('4. URL has utm_source:', new URLSearchParams(window.location.search).get('utm_source'));
if (window.UTMTracker) {
  console.log('5. Debug output:');
  window.UTMTracker.debug();
}
console.log('========================');
```

Copy entire console output and send for analysis.

---

**Status:** ✅ **Bulletproof with Maximum Visibility**  
**Last Updated:** 04.02.2026
