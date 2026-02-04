# 🎯 SEO Canonical Tags - Quick Reference

> **Copy-paste ready snippets** for adding canonical tags to all pages.

---

## 📝 Static Canonical Tags (Recommended for Static Pages)

### Homepage (`index.html`)

Add this in `<head>` section after domain-redirect.js:

```html
<!-- 🎯 SEO: Canonical Tag -->
<link rel="canonical" href="https://latiao-snack.com.ua/">
```

### Cart Page (`cart.html`)

```html
<!-- 🎯 SEO: Canonical Tag -->
<link rel="canonical" href="https://latiao-snack.com.ua/cart">
```

### Checkout Page (`checkout.html`)

```html
<!-- 🎯 SEO: Canonical Tag -->
<link rel="canonical" href="https://latiao-snack.com.ua/checkout">
```

---

## 🔄 Dynamic Canonical Tags (For Dynamic URLs)

### Category Pages (`category.html`)

Add this script in `<head>` section:

```html
<!-- 🎯 SEO: Dynamic Canonical Tag for Category Pages -->
<script>
  (function() {
    'use strict';
    const PRODUCTION_DOMAIN = 'latiao-snack.com.ua';
    const currentPath = window.location.pathname; // e.g., /category/spicy-snacks
    const canonicalUrl = 'https://' + PRODUCTION_DOMAIN + currentPath;
    
    const link = document.createElement('link');
    link.rel = 'canonical';
    link.href = canonicalUrl;
    document.head.appendChild(link);
  })();
</script>
```

### Product Pages (`product.html`)

```html
<!-- 🎯 SEO: Dynamic Canonical Tag for Product Pages -->
<script>
  (function() {
    'use strict';
    const PRODUCTION_DOMAIN = 'latiao-snack.com.ua';
    const currentPath = window.location.pathname; // e.g., /product/spicy-latiao
    const canonicalUrl = 'https://' + PRODUCTION_DOMAIN + currentPath;
    
    const link = document.createElement('link');
    link.rel = 'canonical';
    link.href = canonicalUrl;
    document.head.appendChild(link);
  })();
</script>
```

---

## 🛠️ Unified Dynamic Canonical Script (All Pages)

If you want **one script for all pages**, use this universal version:

### Create `/public-site/js/canonical-tag.js`

```javascript
/**
 * SEO CANONICAL TAG GENERATOR
 * Automatically creates canonical tag for current page
 */

(function() {
  'use strict';
  
  const PRODUCTION_DOMAIN = 'latiao-snack.com.ua';
  
  // Build canonical URL (no query parameters for canonical)
  const canonicalUrl = 'https://' + PRODUCTION_DOMAIN + window.location.pathname;
  
  // Create link element
  const link = document.createElement('link');
  link.rel = 'canonical';
  link.href = canonicalUrl;
  
  // Insert into head
  document.head.appendChild(link);
  
  // Debug log (development mode only)
  if (window.__consoleMode === 'development') {
    console.log('[Canonical Tag] Created:', canonicalUrl);
  }
})();
```

### Then add to all HTML pages:

```html
<!-- ⚡ CONSOLE SILENCER - Must be first to catch all logs -->
<script src="./js/console-silencer.js"></script>

<!-- 🔀 DOMAIN REDIRECT - Redirect Firebase domains to primary domain -->
<script src="./js/domain-redirect.js"></script>

<!-- 🎯 SEO: Canonical Tag Generator -->
<script src="./js/canonical-tag.js"></script>
```

**Benefit:** One file → All pages get canonical tags automatically.

---

## 📋 Full Integration Example

### Example: `index.html` with all SEO optimizations

```html
<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Latiao Snack — Гострі снеки з Китаю</title>
  
  <!-- ⚡ CONSOLE SILENCER - Must be first to catch all logs -->
  <script src="./js/console-silencer.js"></script>
  
  <!-- 🔀 DOMAIN REDIRECT - Redirect Firebase domains to primary domain -->
  <script src="./js/domain-redirect.js"></script>
  
  <!-- 🎯 SEO: Canonical Tag -->
  <link rel="canonical" href="https://latiao-snack.com.ua/">
  
  <!-- Meta descriptions for SEO -->
  <meta name="description" content="Купуйте оригінальні гострі снеки Latiao з Китаю. Швидка доставка по Україні.">
  <meta name="keywords" content="latiao, гострі снеки, китайські снеки, купити latiao">
  
  <!-- Open Graph for social sharing -->
  <meta property="og:title" content="Latiao Snack — Гострі снеки з Китаю">
  <meta property="og:description" content="Купуйте оригінальні гострі снеки Latiao з Китаю">
  <meta property="og:url" content="https://latiao-snack.com.ua/">
  <meta property="og:type" content="website">
  
  <!-- Rest of head... -->
</head>
<body>
  <!-- Content -->
</body>
</html>
```

---

## ✅ Verification Commands

### Check Canonical Tag on Live Site

```bash
# Homepage
curl -s https://latiao-snack.com.ua/ | grep -i canonical

# Expected output:
# <link rel="canonical" href="https://latiao-snack.com.ua/">
```

```bash
# Category page
curl -s https://latiao-snack.com.ua/category/spicy | grep -i canonical

# Expected output:
# <link rel="canonical" href="https://latiao-snack.com.ua/category/spicy">
```

### Check in Browser DevTools

1. Open any page on your site
2. Open DevTools (F12)
3. Go to **Elements** tab
4. Expand `<head>` section
5. Look for: `<link rel="canonical" href="https://latiao-snack.com.ua/...">`

### Google Search Console Validation

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Submit a URL for inspection
3. Check "Coverage" section
4. Verify canonical URL is set correctly

---

## 🎯 Deployment Order

### Step 1: Add Canonical Tags

Choose one approach:

**Option A - Static tags (Simple, recommended for beginners):**
- Add `<link rel="canonical">` directly to each HTML file

**Option B - Dynamic script (Advanced, single file):**
- Create `canonical-tag.js`
- Add script tag to all HTML files

### Step 2: Deploy

```bash
# Deploy to Firebase
firebase deploy --only hosting
```

### Step 3: Test

```bash
# Test each page
curl -s https://latiao-snack.com.ua/ | grep canonical
curl -s https://latiao-snack.com.ua/cart | grep canonical
curl -s https://latiao-snack.com.ua/category/spicy | grep canonical
```

### Step 4: Monitor

- Wait 1-2 weeks for Google to re-crawl
- Check Google Search Console for indexing status
- Verify Firebase domains are de-prioritized

---

## 🚨 Common Mistakes to Avoid

### ❌ Wrong: Query Parameters in Canonical

```html
<!-- DON'T DO THIS -->
<link rel="canonical" href="https://latiao-snack.com.ua/product?utm_source=fb">
```

**Why wrong:** Canonical should point to clean URL without tracking params.

**✅ Correct:**
```html
<link rel="canonical" href="https://latiao-snack.com.ua/product">
```

### ❌ Wrong: Relative URLs

```html
<!-- DON'T DO THIS -->
<link rel="canonical" href="/category/spicy">
```

**Why wrong:** Canonical must be absolute URL with protocol and domain.

**✅ Correct:**
```html
<link rel="canonical" href="https://latiao-snack.com.ua/category/spicy">
```

### ❌ Wrong: Multiple Canonical Tags

```html
<!-- DON'T DO THIS -->
<link rel="canonical" href="https://latiao-snack.com.ua/">
<link rel="canonical" href="https://my-magazin-81c96.web.app/">
```

**Why wrong:** Multiple canonicals confuse Google. Use only ONE per page.

**✅ Correct:**
```html
<link rel="canonical" href="https://latiao-snack.com.ua/">
```

---

## 📊 SEO Impact Timeline

| Timeframe | Expected Changes |
|-----------|------------------|
| **Day 1-3** | Google recrawls pages, discovers canonical tags |
| **Week 1-2** | Firebase domains start de-indexing |
| **Week 3-4** | Custom domain becomes primary in search results |
| **Month 2-3** | Link equity fully consolidated, rankings improve |

---

## 🎉 Quick Start (5 Minutes)

### Fastest Implementation (Static Tags)

1. **Edit `index.html`** - Add after domain-redirect.js:
   ```html
   <link rel="canonical" href="https://latiao-snack.com.ua/">
   ```

2. **Edit `cart.html`** - Add after domain-redirect.js:
   ```html
   <link rel="canonical" href="https://latiao-snack.com.ua/cart">
   ```

3. **Edit `checkout.html`** - Add after domain-redirect.js:
   ```html
   <link rel="canonical" href="https://latiao-snack.com.ua/checkout">
   ```

4. **Edit `category.html`** - Add dynamic script (see above)

5. **Edit `product.html`** - Add dynamic script (see above)

6. **Deploy:**
   ```bash
   firebase deploy --only hosting
   ```

7. **Verify:**
   ```bash
   curl -s https://latiao-snack.com.ua/ | grep canonical
   ```

**Done! 🎉 Your SEO is now optimized.**

---

## 📚 Additional Resources

- [Google: Canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Moz: Canonical Tag Guide](https://moz.com/learn/seo/canonicalization)
- [Ahrefs: Canonical Tags Explained](https://ahrefs.com/blog/canonical-tags/)

---

**Ready to implement? Start with the static tags first, then add dynamic scripts for category/product pages.**
