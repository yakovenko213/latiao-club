# 🔄 Cache-Busting Strategy - Force Fresh Updates

## ⚡ Problem: Users See Old Cached Versions
## ✅ Solution: Multi-Layer Cache Control

---

## 1️⃣ Firebase.json - Optimized Cache Headers

### Current Issue:
- HTML files cached for 1 hour
- Users see old versions after deploy

### Solution: Smart Cache Strategy

**Update your `/firebase.json` with this configuration:**

```json
{
  "hosting": [
    {
      "target": "main",
      "public": "public-site",
      "cleanUrls": true,
      "trailingSlash": false,
      "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ],
      "headers": [
        {
          "source": "**/*.@(jpg|jpeg|gif|png|svg|webp|ico)",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "public, max-age=31536000, immutable"
            }
          ]
        },
        {
          "source": "**/*.@(woff|woff2|ttf|eot)",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "public, max-age=31536000, immutable"
            }
          ]
        },
        {
          "source": "**/*.@(js|css)",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "public, max-age=31536000, immutable"
            },
            {
              "key": "Vary",
              "value": "Accept-Encoding"
            }
          ]
        },
        {
          "source": "**/*.html",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "no-cache, no-store, must-revalidate"
            },
            {
              "key": "Pragma",
              "value": "no-cache"
            },
            {
              "key": "Expires",
              "value": "0"
            }
          ]
        },
        {
          "source": "/",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "no-cache, no-store, must-revalidate"
            }
          ]
        },
        {
          "source": "/service-worker.js",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "no-cache, no-store, must-revalidate"
            }
          ]
        },
        {
          "source": "**",
          "headers": [
            {
              "key": "X-Content-Type-Options",
              "value": "nosniff"
            },
            {
              "key": "X-Frame-Options",
              "value": "SAMEORIGIN"
            }
          ]
        }
      ]
    },
    {
      "target": "adminpanel",
      "public": "functions/private",
      "cleanUrls": false,
      "trailingSlash": false,
      "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ],
      "headers": [
        {
          "source": "**/*.@(js|css|html)",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "no-cache, no-store, must-revalidate"
            },
            {
              "key": "Pragma",
              "value": "no-cache"
            },
            {
              "key": "Expires",
              "value": "0"
            }
          ]
        },
        {
          "source": "**/*.@(jpg|jpeg|gif|png|svg|webp|ico)",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "public, max-age=86400"
            }
          ]
        },
        {
          "source": "**",
          "headers": [
            {
              "key": "X-Content-Type-Options",
              "value": "nosniff"
            },
            {
              "key": "X-Frame-Options",
              "value": "DENY"
            }
          ]
        }
      ]
    },
    {
      "site": "admin-store-latio",
      "public": "admin-site",
      "cleanUrls": false,
      "trailingSlash": false,
      "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ],
      "headers": [
        {
          "source": "**/*.@(js|css|html)",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "no-cache, no-store, must-revalidate"
            }
          ]
        },
        {
          "source": "**/*.@(jpg|jpeg|gif|png|svg|webp|ico)",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "public, max-age=86400"
            }
          ]
        }
      ]
    }
  ],
  "functions": [
    {
      "codebase": "default",
      "source": "functions",
      "ignore": [
        "node_modules",
        ".git",
        "firebase-debug.log",
        "firebase-debug.*.log",
        "*.local"
      ]
    }
  ],
  "firestore": {
    "rules": "firestore.rules"
  },
  "storage": {
    "rules": "storage.rules"
  }
}
```

---

## 2️⃣ Automatic Cache-Busting with Version Hashes

### Strategy: Add Build Hash to Filenames

**Option A: Build Script with Timestamp**

Create `/scripts/build-with-hash.js`:

```javascript
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BUILD_VERSION = Date.now(); // or use git commit hash

function generateFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('md5');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex').substring(0, 8);
}

function updateHtmlReferences(htmlPath, jsFiles, cssFiles) {
  let html = fs.readFileSync(htmlPath, 'utf8');
  
  // Update JS references
  jsFiles.forEach(({ original, hashed }) => {
    const regex = new RegExp(original, 'g');
    html = html.replace(regex, hashed);
  });
  
  // Update CSS references
  cssFiles.forEach(({ original, hashed }) => {
    const regex = new RegExp(original, 'g');
    html = html.replace(regex, hashed);
  });
  
  fs.writeFileSync(htmlPath, html);
  console.log(`✅ Updated: ${htmlPath}`);
}

// Main Site
const mainJsPath = './public-site/js/main.js';
const mainCssPath = './public-site/css/style.css';

if (fs.existsSync(mainJsPath)) {
  const jsHash = generateFileHash(mainJsPath);
  const newJsName = `main.${jsHash}.js`;
  const newJsPath = `./public-site/js/${newJsName}`;
  
  fs.copyFileSync(mainJsPath, newJsPath);
  console.log(`✅ Created: ${newJsName}`);
  
  // Update index.html
  updateHtmlReferences('./public-site/index.html', [
    { original: 'js/main.js', hashed: `js/${newJsName}` }
  ], []);
}

// Admin Panel
const adminJsPath = './functions/private/js/admin.js';

if (fs.existsSync(adminJsPath)) {
  const jsHash = generateFileHash(adminJsPath);
  const newJsName = `admin.${jsHash}.js`;
  const newJsPath = `./functions/private/js/${newJsName}`;
  
  fs.copyFileSync(adminJsPath, newJsPath);
  console.log(`✅ Created: ${newJsName}`);
  
  // Update index.html
  updateHtmlReferences('./functions/private/index.html', [
    { original: '/js/admin.js', hashed: `/js/${newJsName}` }
  ], []);
}

console.log('✅ Build complete with cache-busting hashes!');
```

**Add to package.json:**
```json
{
  "scripts": {
    "prebuild": "node scripts/build-with-hash.js",
    "deploy": "npm run prebuild && firebase deploy --only hosting",
    "deploy:admin": "npm run prebuild && firebase deploy --only hosting:adminpanel",
    "deploy:main": "npm run prebuild && firebase deploy --only hosting:main"
  }
}
```

**Usage:**
```bash
npm run deploy:admin  # Builds with hash + deploys admin panel
npm run deploy:main   # Builds with hash + deploys main site
npm run deploy        # Builds with hash + deploys all
```

---

### Option B: Simple Query Parameter Versioning

**Easier approach without build tools:**

Create `/scripts/update-version.js`:

```javascript
const fs = require('fs');

const VERSION = Date.now();

function updateVersionInFile(filePath, assetType) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Update JS files
  if (assetType === 'js') {
    content = content.replace(
      /src="([^"]+\.js)"/g,
      (match, p1) => {
        if (p1.includes('?v=')) {
          return `src="${p1.split('?')[0]}?v=${VERSION}"`;
        }
        return `src="${p1}?v=${VERSION}"`;
      }
    );
    
    content = content.replace(
      /from '([^']+\.js)'/g,
      (match, p1) => {
        if (p1.includes('?v=')) {
          return `from '${p1.split('?')[0]}?v=${VERSION}'`;
        }
        return `from '${p1}?v=${VERSION}'`;
      }
    );
  }
  
  // Update CSS files
  content = content.replace(
    /href="([^"]+\.css)"/g,
    (match, p1) => {
      if (p1.includes('?v=')) {
        return `href="${p1.split('?')[0]}?v=${VERSION}"`;
      }
      return `href="${p1}?v=${VERSION}"`;
    }
  );
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ Updated version to ${VERSION} in ${filePath}`);
}

// Update main site
updateVersionInFile('./public-site/index.html', 'js');

// Update admin panel
updateVersionInFile('./functions/private/index.html', 'js');

console.log(`✅ All files updated to version: ${VERSION}`);
```

**Add to package.json:**
```json
{
  "scripts": {
    "version": "node scripts/update-version.js",
    "predeploy": "npm run version",
    "deploy": "firebase deploy --only hosting",
    "deploy:admin": "firebase deploy --only hosting:adminpanel",
    "deploy:main": "firebase deploy --only hosting:main"
  }
}
```

**Manual Update in HTML:**

```html
<!-- Before -->
<script type="module" src="/js/admin.js"></script>
<link rel="stylesheet" href="/css/style.css">

<!-- After (update version on each deploy) -->
<script type="module" src="/js/admin.js?v=1707062400000"></script>
<link rel="stylesheet" href="/css/style.css?v=1707062400000">
```

---

## 3️⃣ Service Worker Update Strategy

### Check if You Have a Service Worker:

```bash
# Search for service worker files
find . -name "service-worker.js" -o -name "sw.js"
```

### If Service Worker Exists:

**Create `/public-site/service-worker.js`:**

```javascript
const CACHE_VERSION = 'v1707062400000'; // Update on each deploy
const CACHE_NAME = `latiao-cache-${CACHE_VERSION}`;

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/main.js',
  '/images/logo.png'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  // Skip waiting to activate immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating new service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  
  // Take control of all pages immediately
  return self.clients.claim();
});

// Fetch event - network first, then cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone response
        const responseToCache = response.clone();
        
        // Update cache
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(event.request);
      })
  );
});

// Listen for skip waiting message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
```

**Update Registration in HTML:**

```html
<!-- public-site/index.html -->
<script>
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('✅ SW registered:', registration);
        
        // Check for updates every 5 minutes
        setInterval(() => {
          registration.update();
        }, 5 * 60 * 1000);
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New SW installed, show update prompt
              if (confirm('Доступна нова версія сайту. Оновити зараз?')) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              }
            }
          });
        });
        
        // Listen for controller change (new SW activated)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        });
      })
      .catch((error) => {
        console.error('❌ SW registration failed:', error);
      });
  });
}
</script>
```

### Force Update on Page Load:

```javascript
// Add to main.js or inline script
async function checkForUpdates() {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    
    if (registration) {
      // Force check for updates
      await registration.update();
      
      // If there's a waiting worker, activate it immediately
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    }
  }
}

// Check on page load
window.addEventListener('load', checkForUpdates);
```

---

## 4️⃣ Firebase CDN Cache Clearing

### Clean Deploy Commands:

#### Option 1: Standard Deploy (Usually Sufficient)
```bash
firebase deploy --only hosting
```
Firebase automatically invalidates CDN cache when deploying new content.

#### Option 2: Force Full Cache Bust
```bash
# Clear hosting cache explicitly
firebase hosting:channel:delete live  # Dangerous - deletes live channel
firebase hosting:channel:deploy live  # Redeploy to live

# Better approach: Deploy with --force
firebase deploy --only hosting --force
```

#### Option 3: Complete Clean Deploy
```bash
# 1. Clear local Firebase cache
rm -rf .firebase/

# 2. Update version in files
node scripts/update-version.js

# 3. Deploy
firebase deploy --only hosting --force

# 4. Verify deployment
firebase hosting:releases:list
```

#### Option 4: Targeted Cache Clear (Best)
```bash
# Admin Panel
firebase deploy --only hosting:adminpanel

# Main Site
firebase deploy --only hosting:main

# All hosting
firebase deploy --only hosting
```

---

## 5️⃣ Complete Deployment Workflow

**Create `/scripts/deploy.sh`:**

```bash
#!/bin/bash

echo "🚀 Starting deployment with cache-busting..."

# 1. Update version numbers
echo "📝 Updating version numbers..."
node scripts/update-version.js

# 2. Clear local cache
echo "🧹 Clearing local cache..."
rm -rf .firebase/

# 3. Deploy to Firebase
echo "☁️  Deploying to Firebase..."
firebase deploy --only hosting --force

# 4. Verify deployment
echo "✅ Verifying deployment..."
firebase hosting:releases:list --limit 1

echo "🎉 Deployment complete!"
echo "📌 Users will see the new version on next page load"
echo "💡 Remind users to press Ctrl+Shift+R if issues persist"
```

**Make executable:**
```bash
chmod +x scripts/deploy.sh
```

**Usage:**
```bash
./scripts/deploy.sh
```

---

## 6️⃣ User Notification System

**Add Update Banner to Your Site:**

```html
<!-- Add to index.html -->
<div id="update-banner" style="display: none;">
  <div style="position: fixed; top: 0; left: 0; right: 0; background: #ff6b00; color: white; padding: 12px; text-align: center; z-index: 9999;">
    <span>🎉 Доступна нова версія сайту!</span>
    <button onclick="location.reload(true)" style="margin-left: 12px; background: white; color: #ff6b00; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold;">
      Оновити зараз
    </button>
    <button onclick="document.getElementById('update-banner').style.display='none'" style="margin-left: 8px; background: transparent; color: white; border: 1px solid white; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
      Пізніше
    </button>
  </div>
</div>

<script>
// Check for updates every 5 minutes
const CURRENT_VERSION = '1707062400000'; // Update this on each deploy

function checkForUpdate() {
  fetch('/version.json?t=' + Date.now())
    .then(res => res.json())
    .then(data => {
      if (data.version !== CURRENT_VERSION) {
        document.getElementById('update-banner').style.display = 'block';
      }
    })
    .catch(err => console.log('Version check failed:', err));
}

setInterval(checkForUpdate, 5 * 60 * 1000); // Every 5 minutes
checkForUpdate(); // Check on load
</script>
```

**Create `/public-site/version.json`:**
```json
{
  "version": "1707062400000",
  "updated": "2026-02-04T12:00:00Z"
}
```

---

## 7️⃣ Testing Cache-Busting

### Test Checklist:

```bash
# 1. Deploy with cache-busting
./scripts/deploy.sh

# 2. Open site in incognito/private mode
open -a "Google Chrome" --args --incognito https://latiao-snack.com.ua

# 3. Check response headers
curl -I https://latiao-snack.com.ua/index.html

# Expected headers:
# Cache-Control: no-cache, no-store, must-revalidate
# Pragma: no-cache
# Expires: 0

# 4. Check JS file version
curl https://latiao-snack.com.ua/js/main.js?v=1707062400000
```

### Browser DevTools Check:
1. Open DevTools (F12)
2. Network tab
3. Disable cache checkbox ✅
4. Refresh page
5. Check each file's status:
   - 200 = Fresh from server ✅
   - 304 = Not modified (cached) ❌

---

## 8️⃣ Quick Reference Commands

```bash
# Standard deploy with cache-busting
npm run version && firebase deploy --only hosting:adminpanel

# Full clean deploy
rm -rf .firebase/ && npm run version && firebase deploy --only hosting --force

# Check current deployment
firebase hosting:releases:list

# View hosting URLs
firebase hosting:sites:list

# Test locally first
firebase serve --only hosting:adminpanel
```

---

## 9️⃣ Automated CI/CD (GitHub Actions)

**Create `.github/workflows/deploy.yml`:**

```yaml
name: Deploy to Firebase

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Update version
        run: node scripts/update-version.js
      
      - name: Deploy to Firebase
        uses: w9jds/firebase-action@master
        with:
          args: deploy --only hosting --force
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
      
      - name: Notify success
        run: echo "✅ Deployed successfully!"
```

**Get Firebase token:**
```bash
firebase login:ci
# Copy the token and add to GitHub Secrets as FIREBASE_TOKEN
```

---

## 🎯 Summary

### What This Solves:

✅ **HTML files**: Never cached (always fresh)  
✅ **JS/CSS files**: Long cache but versioned  
✅ **Images**: Long cache (immutable)  
✅ **Service Worker**: Auto-updates  
✅ **CDN Cache**: Cleared on deploy  

### After Implementation:

- Users see updates **immediately** (no Ctrl+F5 needed)
- Repeat visitors load **fast** (assets cached)
- Deployments **invalidate** old cache automatically
- Service Worker **prompts** for updates

### Deploy Command:

```bash
npm run version && firebase deploy --only hosting:adminpanel
```

---

**Created:** February 4, 2026  
**Version:** 1.0  
**Status:** Production Ready ✅
