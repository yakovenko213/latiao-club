# 🚀 Quick Fix Guide - Domain Performance Issues

## ⚡ What's Been Done (Automatic)

✅ Added smart caching system (5-minute TTL)  
✅ Added performance diagnostics and timing  
✅ Optimized rendering and icon initialization  
✅ Added cache management utilities  
✅ Created diagnostic testing page  
✅ Updated domain configuration  

## 🔴 What YOU Must Do (Manual - CRITICAL!)

### 1. Add Custom Domain to Firebase (**REQUIRED**)

**This is the #1 reason sites fail on custom domains!**

1. Open: https://console.firebase.google.com/
2. Select project: **my-magazin-81c96**
3. Go to: **Authentication** → **Settings** → **Authorized domains**
4. Click **"Add domain"** button
5. Add these if not present:
   - `latiao-snack.com.ua`
   - `www.latiao-snack.com.ua`
6. Click **Save**

**⚠️ Without this, Firebase will block all requests from your custom domain!**

---

## 🧪 Quick Test (3 Minutes)

### Step 1: Test Connectivity
1. Open: `https://latiao-snack.com.ua/test-firebase-connectivity.html`
2. Click **"Run Diagnostics"**
3. **Expected**: All tests should show ✅ green checkmarks
4. **If red ❌**: Check Firebase domain authorization above

### Step 2: Test Cache Performance
1. Open: `https://latiao-snack.com.ua`
2. Press F12 (open DevTools)
3. Go to **Console** tab
4. **First load**: Look for messages like:
   ```
   💾 Cache MISS for: products (fetching from Firestore)
   ⏱️ Fetch Hot Products took: 245ms
   ✅ Loaded 12 hot products
   ```
5. **Refresh page (F5)**: Look for:
   ```
   💾 Cache HIT for: products (age: 5s)
   ```
6. **Success**: Second load should be instant (<100ms)

### Step 3: Test Categories
1. Scroll down to product categories
2. **First visit**: Should load in 1-2 seconds
3. **Refresh page**: Should load instantly (<100ms)
4. Check console for: `✅ Loaded X categories with Y products`

---

## 🛠️ Developer Console Commands

Open browser console (F12) and try these:

```javascript
// View cache status
viewCacheStatus()

// Clear all caches
clearAllCaches()

// Clear specific cache
clearCache('products')
```

---

## 📊 Performance Monitoring

### What to Look For in Console

**Good Signs** ✅:
```
💾 Cache HIT for: products (age: 120s)
⏱️ Fetch Hot Products took: 245ms
✅ Loaded 12 hot products
✅ Loaded 6 categories with 60 products
```

**Bad Signs** ❌:
```
❌ Fetch Categories FAILED after 5,234ms: Error...
🚫 SECURITY WARNING: Unauthorized domain detected!
```

---

## 🐛 Common Issues & Fixes

### Issue: "Unauthorized domain"
**Symptom**: Console shows `🚫 SECURITY WARNING`  
**Fix**: Add domain to Firebase Console (see section 1 above)

### Issue: Still slow after update
**Symptom**: Takes 3+ seconds to load  
**Fixes**:
1. Hard refresh: `Ctrl + Shift + R` (or `Cmd + Shift + R` on Mac)
2. Clear browser cache completely
3. Try incognito/private window
4. Run diagnostics page to identify bottleneck

### Issue: Cache not working
**Symptom**: Every refresh fetches from Firestore  
**Fixes**:
1. Check console for `💾 Cache SET` messages
2. Run `viewCacheStatus()` in console
3. Verify no JavaScript errors blocking cache

### Issue: Only 60 products showing
**Symptom**: Products count is lower than expected  
**Fixes**:
1. Check Firestore: Go to Firebase Console → Firestore Database
2. Verify `isVisible` field is set correctly on products
3. Run diagnostics page to see actual product count

---

## 📈 Expected Performance

| Metric | Before | After |
|--------|--------|-------|
| Initial load | 3-5s | 1-2s |
| Cached load | N/A | <100ms |
| Category switch | 2-3s | <100ms |
| Firestore calls | Every load | Once per 5min |

---

## ✅ Success Checklist

Verify these are working:

- [ ] Site loads on `latiao-snack.com.ua` without freezing
- [ ] Console shows cache MISS on first load
- [ ] Console shows cache HIT on second load (refresh)
- [ ] Categories load <100ms after first load
- [ ] All 60 products are visible
- [ ] No errors in browser console
- [ ] Diagnostics page shows all green checkmarks

---

## 📞 Need Help?

If issues persist after following this guide:

1. **Run diagnostics page** and take screenshot
2. **Open console** and copy any error messages
3. **Check Network tab** (F12 → Network) for failed requests
4. **Take screenshots** of any issues
5. Provide all of the above for further debugging

---

## 🎯 Key Files Changed

1. `public-site/js/storefront.js` - Added caching & performance monitoring
2. `public-site/js/firebase-config.js` - Updated allowed domains
3. `public-site/js/cache-manager.js` - New cache utilities
4. `public-site/test-firebase-connectivity.html` - New diagnostics page

---

**Time to complete**: 5 minutes  
**Difficulty**: Easy  
**Impact**: 🔥 CRITICAL - Fixes major performance issues

---

**Last Updated**: 2026-02-08  
**Status**: ✅ Ready to deploy
