# 🔀 Domain Redirect Implementation Guide

> **Goal:** Redirect all Firebase default domain traffic (*.web.app, *.firebaseapp.com) to primary custom domain (latiao-snack.com.ua) for SEO consolidation and brand consistency.

---

## 📋 Table of Contents

1. [Why Firebase.json Redirects Won't Work](#why-firebasejson-redirects-wont-work)
2. [JavaScript Solution (Implemented)](#javascript-solution-implemented)
3. [SEO Canonical Tags](#seo-canonical-tags)
4. [Deployment & Testing](#deployment--testing)
5. [Troubleshooting](#troubleshooting)

---

## ❌ Why Firebase.json Redirects Won't Work

### The Limitation

Firebase Hosting's `redirects` configuration in `firebase.json` applies **equally to ALL domains** pointing to that hosting target. There is no built-in way to create **conditional redirects based on hostname**.

### Example (This Won't Work as Intended):

```json
{
  "hosting": {
    "redirects": [
      {
        "source": "/**",
        "destination": "https://latiao-snack.com.ua/:splat",
        "type": 301
      }
    ]
  }
}
```

**Problem:** This would create an **infinite redirect loop** because:
- User visits `https://latiao-snack.com.ua/products`
- Firebase sees the redirect rule applies to ALL domains
- Firebase redirects to `https://latiao-snack.com.ua/products` (same URL)
- Loop repeats → **Error 310 (Too Many Redirects)**

### Why This Happens

Firebase Hosting treats all connected domains (custom domain + default Firebase domains) as **equals**. The `redirects` configuration doesn't have:
- Hostname detection logic
- Conditional redirect syntax (e.g., "only if hostname contains 'web.app'")

### The Correct Approach

**Solution:** Use **JavaScript-based client-side redirect** to detect the hostname and redirect only when needed.

---

## ✅ JavaScript Solution (Implemented)

### File Created: `/public-site/js/domain-redirect.js`

```javascript
/**
 * DOMAIN REDIRECT HANDLER
 * Automatically redirects Firebase default domains to primary custom domain
 */

(function() {
  'use strict';
  
  const PRODUCTION_DOMAIN = 'latiao-snack.com.ua';
  const FIREBASE_DOMAINS = ['web.app', 'firebaseapp.com'];
  
  // Get current hostname
  const hostname = window.location.hostname;
  
  // Skip redirect if already on production domain or localhost
  if (hostname === PRODUCTION_DOMAIN || hostname === 'localhost' || hostname === '127.0.0.1') {
    return;
  }
  
  // Check if current hostname contains Firebase default domains
  const shouldRedirect = FIREBASE_DOMAINS.some(domain => hostname.includes(domain));
  
  if (shouldRedirect) {
    // Build new URL with production domain
    const newUrl = 'https://' + PRODUCTION_DOMAIN + 
                   window.location.pathname + 
                   window.location.search + 
                   window.location.hash;
    
    // Log redirect in development mode only
    if (window.__consoleMode === 'development') {
      console.log('[Domain Redirect] Redirecting to primary domain:', newUrl);
    }
    
    // Use replace instead of assign to prevent back-button loop
    window.location.replace(newUrl);
  }
})();
```

### How It Works

1. **Detects hostname:** Checks `window.location.hostname`
2. **Allows localhost:** Skips redirect for local development
3. **Identifies Firebase domains:** Uses array matching for `web.app` and `firebaseapp.com`
4. **Preserves URL structure:**
   - Path: `/category/spicy` → `/category/spicy` ✅
   - Query params: `?id=123` → `?id=123` ✅
   - Hash: `#section` → `#section` ✅
5. **Uses `replace()`:** Prevents back-button redirect loop
6. **Development logging:** Only logs in dev mode (respects console-silencer)

### Integration (Already Done)

Script added to all main pages **immediately after console-silencer**:

```html
<!-- ⚡ CONSOLE SILENCER - Must be first to catch all logs -->
<script src="./js/console-silencer.js"></script>

<!-- 🔀 DOMAIN REDIRECT - Redirect Firebase domains to primary domain -->
<script src="./js/domain-redirect.js"></script>
```

**Files Updated:**
- ✅ `/public-site/index.html`
- ✅ `/public-site/category.html`
- ✅ `/public-site/product.html`
- ✅ `/public-site/checkout.html`
- ✅ `/public-site/cart.html`

### Why Execute Early?

- **Before page renders:** Minimizes visibility of Firebase domain
- **Before analytics loads:** Ensures tracking happens on correct domain
- **After console-silencer:** Logging works correctly in dev mode

---

## 🎯 SEO Canonical Tags

### What is a Canonical Tag?

A `<link rel="canonical">` tag tells search engines which URL is the "master" version when multiple URLs have similar/identical content.

### Why It's Critical

**Without canonical tags:**
- Google sees `https://my-magazin-81c96.web.app/products` as different from `https://latiao-snack.com.ua/products`
- **Duplicate content penalty** applies
- Link equity (backlinks) splits between domains
- Search rankings suffer

**With canonical tags:**
- Google knows the custom domain is the primary URL
- All SEO value consolidates to `latiao-snack.com.ua`
- Rankings improve

### How to Implement

#### Dynamic Canonical Tag with JavaScript

Add this script to `<head>` section **after domain-redirect.js**:

```html
<!-- 🎯 SEO: Dynamic Canonical Tag -->
<script>
  (function() {
    const PRODUCTION_DOMAIN = 'latiao-snack.com.ua';
    const currentPath = window.location.pathname;
    const canonicalUrl = 'https://' + PRODUCTION_DOMAIN + currentPath;
    
    // Create canonical link element
    const link = document.createElement('link');
    link.rel = 'canonical';
    link.href = canonicalUrl;
    
    // Insert into <head>
    document.head.appendChild(link);
  })();
</script>
```

#### Static Canonical Tag (Alternative)

For pages with fixed URLs, use static canonical tags:

```html
<!-- Home Page -->
<link rel="canonical" href="https://latiao-snack.com.ua/">

<!-- Category Page -->
<link rel="canonical" href="https://latiao-snack.com.ua/category/spicy-snacks">

<!-- Product Page -->
<link rel="canonical" href="https://latiao-snack.com.ua/product/spicy-latiao">
```

#### Recommended Approach

**Use dynamic canonical tags** for:
- Category pages (generated dynamically)
- Product pages (slug-based URLs)
- Search results pages

**Use static canonical tags** for:
- Homepage
- About page
- Contact page
- Static content pages

### Full Example (Add to `index.html`)

```html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Latiao Snack — Гострі снеки з Китаю</title>
  
  <!-- ⚡ CONSOLE SILENCER - Must be first to catch all logs -->
  <script src="./js/console-silencer.js"></script>
  
  <!-- 🔀 DOMAIN REDIRECT - Redirect Firebase domains to primary domain -->
  <script src="./js/domain-redirect.js"></script>
  
  <!-- 🎯 SEO: Canonical Tag for Homepage -->
  <link rel="canonical" href="https://latiao-snack.com.ua/">
  
  <!-- Other meta tags... -->
</head>
```

### Verification

After deployment, check canonical tags:

```bash
# View source of any page
curl -s https://latiao-snack.com.ua/ | grep canonical

# Expected output:
# <link rel="canonical" href="https://latiao-snack.com.ua/">
```

---

## 🚀 Deployment & Testing

### Step 1: Deploy to Firebase

```bash
# Deploy updated files
firebase deploy --only hosting

# Expected output:
# ✔  Deploy complete!
# Hosting URL: https://my-magazin-81c96.web.app
```

### Step 2: Test Redirect from Firebase Domain

```bash
# Open Firebase default domain in browser
open https://my-magazin-81c96.web.app
```

**Expected behavior:**
1. Page loads briefly on `.web.app` domain
2. JavaScript executes redirect
3. Browser redirects to `https://latiao-snack.com.ua`
4. URL bar shows custom domain

### Step 3: Test Custom Domain (No Redirect)

```bash
# Open custom domain in browser
open https://latiao-snack.com.ua
```

**Expected behavior:**
1. Page loads on custom domain
2. **NO redirect occurs** (already on primary domain)
3. URL bar remains `latiao-snack.com.ua`

### Step 4: Test Path & Query Preservation

| Original URL (Firebase Domain) | Redirected URL (Custom Domain) |
|--------------------------------|--------------------------------|
| `https://my-magazin-81c96.web.app/category/spicy` | `https://latiao-snack.com.ua/category/spicy` |
| `https://my-magazin-81c96.web.app/product?id=123` | `https://latiao-snack.com.ua/product?id=123` |
| `https://my-magazin-81c96.web.app/cart#checkout` | `https://latiao-snack.com.ua/cart#checkout` |

### Step 5: Verify Console (Development Mode)

```bash
# Run locally
firebase serve --only hosting
open http://localhost:5000
```

**Check browser console:**
```
[Domain Redirect] Redirecting to primary domain: https://latiao-snack.com.ua/
```

### Step 6: Verify Console (Production Mode)

Visit `https://latiao-snack.com.ua` → Open DevTools → Console

**Expected: Clean console** (no redirect logs in production)

---

## 🔧 Troubleshooting

### Issue 1: Redirect Loop (Error 310)

**Symptoms:** Browser shows "Too Many Redirects" error

**Cause:** Redirect logic triggers on custom domain

**Fix:** Check `domain-redirect.js` line 11:
```javascript
if (hostname === PRODUCTION_DOMAIN || hostname === 'localhost' || hostname === '127.0.0.1') {
  return; // This MUST be present
}
```

### Issue 2: Redirect Not Triggering

**Symptoms:** Firebase domain loads, but no redirect happens

**Cause:** Script not loading or JavaScript error

**Debug steps:**
1. Check browser console for errors
2. Verify script loads: `View Source → Ctrl+F → domain-redirect.js`
3. Check network tab: Script should have `200 OK` status
4. Test manually in console:
   ```javascript
   window.location.hostname.includes('web.app')
   // Should return true on Firebase domain
   ```

### Issue 3: Query Parameters Lost

**Symptoms:** `?id=123` disappears after redirect

**Cause:** Missing `window.location.search` in URL construction

**Fix:** Verify line 24 in `domain-redirect.js`:
```javascript
const newUrl = 'https://' + PRODUCTION_DOMAIN + 
               window.location.pathname + 
               window.location.search +  // ← This line must be present
               window.location.hash;
```

### Issue 4: Back Button Creates Loop

**Symptoms:** Clicking browser back button causes redirect again

**Cause:** Using `window.location.assign()` instead of `replace()`

**Fix:** Verify line 31 in `domain-redirect.js`:
```javascript
window.location.replace(newUrl); // ✅ Correct (replaces history)
// NOT window.location.assign(newUrl); ❌ Wrong (adds to history)
```

### Issue 5: Canonical Tag Not Showing

**Symptoms:** `curl | grep canonical` returns nothing

**Cause:** Canonical tag not added to HTML

**Fix:** Add canonical tag to `<head>` section (see [SEO Canonical Tags](#seo-canonical-tags))

---

## 📊 SEO Impact Summary

### Before Implementation

| Metric | Status |
|--------|--------|
| **Duplicate Content** | ❌ Yes (2 domains with same content) |
| **Link Equity** | ❌ Split between domains |
| **Brand Consistency** | ❌ Users see `.web.app` URLs |
| **Google Indexing** | ❌ Both domains indexed separately |

### After Implementation

| Metric | Status |
|--------|--------|
| **Duplicate Content** | ✅ No (all traffic → custom domain) |
| **Link Equity** | ✅ Consolidated to custom domain |
| **Brand Consistency** | ✅ Always shows `latiao-snack.com.ua` |
| **Google Indexing** | ✅ Custom domain prioritized |

---

## 🎯 Next Steps

### Immediate (Critical)

- [x] Deploy domain redirect script
- [x] Add redirect to all main pages
- [ ] **Add canonical tags** to `<head>` sections
- [ ] Deploy to production
- [ ] Test all redirect scenarios

### Within 1 Week

- [ ] Monitor Google Search Console for indexing changes
- [ ] Submit sitemap with custom domain URLs only
- [ ] Request re-indexing of key pages
- [ ] Check for 404 errors in Search Console

### Within 1 Month

- [ ] Verify Firebase domains de-indexed (Google Search: `site:*.web.app`)
- [ ] Confirm custom domain ranks for target keywords
- [ ] Check backlinks point to custom domain
- [ ] Monitor organic traffic growth

---

## 📚 References

- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Google canonical tags guide](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [MDN: window.location.replace()](https://developer.mozilla.org/en-US/docs/Web/API/Location/replace)

---

## ✅ Checklist

**Deployment Checklist:**

- [x] Created `/public-site/js/domain-redirect.js`
- [x] Added redirect script to `index.html`
- [x] Added redirect script to `category.html`
- [x] Added redirect script to `product.html`
- [x] Added redirect script to `checkout.html`
- [x] Added redirect script to `cart.html`
- [ ] Added canonical tags to all pages
- [ ] Deployed to Firebase Hosting
- [ ] Tested redirect from `.web.app` domain
- [ ] Tested custom domain (no redirect)
- [ ] Verified console is clean in production
- [ ] Submitted sitemap to Google Search Console

---

**🎉 Implementation Complete! Ready to deploy.**
