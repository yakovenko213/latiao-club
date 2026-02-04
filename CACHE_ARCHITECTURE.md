# 🎨 Cache Busting System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    FORCE CACHE REFRESH SYSTEM                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  LEVEL 1: HTTP HEADERS (firebase.json)                          │
├─────────────────────────────────────────────────────────────────┤
│  Browser Request: GET /js/app.js                                │
│  Server Response:                                                │
│    ├─ Cache-Control: no-cache, no-store, must-revalidate       │
│    ├─ Pragma: no-cache                                          │
│    └─ Expires: 0                                                │
│                                                                  │
│  ✅ Result: Browser NEVER caches files                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  LEVEL 2: URL VERSIONING (scripts/cache-bust.sh)               │
├─────────────────────────────────────────────────────────────────┤
│  Before Deploy:                                                  │
│    <script src="./js/app.js?v=123"></script>                   │
│                                                                  │
│  After cache-bust.sh:                                           │
│    <script src="./js/app.js?v=1770210807216"></script>         │
│                                                                  │
│  ✅ Result: Browser sees NEW URL = NEW file                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  LEVEL 3: CLIENT-SIDE CLEARING (cache-clear.js)                │
├─────────────────────────────────────────────────────────────────┤
│  On Page Load (FIRST script):                                   │
│    1. Check localStorage('latiao_site_version')                │
│    2. If version changed:                                        │
│       ├─ Save important data (auth, theme)                      │
│       ├─ Clear localStorage                                     │
│       ├─ Clear sessionStorage                                   │
│       ├─ Delete Service Worker cache                            │
│       ├─ Restore important data                                 │
│       └─ Update version                                         │
│                                                                  │
│  ✅ Result: Automatic cache clear on version change            │
└─────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════

                         DEPLOYMENT FLOW

┌─────────────────────────────────────────────────────────────────┐
│  Developer:                                                      │
│    bash scripts/deploy-with-cache-bust.sh                       │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: Generate Version                                        │
│    VERSION=$(date +%s%3N)  # 1770210807216                     │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: Update HTML Files                                       │
│    sed -E "s/\.js\?v=[0-9]+/.js?v=${VERSION}/g"                │
│                                                                  │
│    Before: app.js?v=123                                         │
│    After:  app.js?v=1770210807216                              │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: Update cache-clear.js                                  │
│    sed "s/%VERSION%/${VERSION}/g"                               │
│                                                                  │
│    Before: const CURRENT_VERSION = '%VERSION%';                │
│    After:  const CURRENT_VERSION = '1770210807216';            │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: Create version.json                                    │
│    {                                                             │
│      "version": "1770210807216",                                │
│      "date": "20260204-131327",                                 │
│      "deployed": "2026-02-04T13:13:27Z",                        │
│      "commit": "56d1b8d"                                        │
│    }                                                             │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 5: Git Commit (optional)                                  │
│    git add .                                                     │
│    git commit -m "Cache bust: 20260204-131327"                 │
│    git push                                                      │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 6: Firebase Deploy                                         │
│    firebase deploy --only hosting                                │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────────────┐
│  Firebase Hosting Server                                         │
│    ├─ Serves new files with no-cache headers                   │
│    └─ All URLs have new ?v=VERSION                             │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────────────┐
│  User's Browser                                                  │
│    1. Loads page                                                 │
│    2. Executes cache-clear.js (FIRST!)                         │
│    3. Detects version mismatch                                  │
│    4. Clears all caches                                         │
│    5. Loads new JavaScript files                                │
│                                                                  │
│  ✅ User sees NEW VERSION immediately!                          │
└─────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════

                        FILE STRUCTURE

latiao-club/
├── scripts/
│   ├── cache-bust.sh              # Update versions
│   ├── deploy-with-cache-bust.sh  # Full deployment
│   ├── emergency-cache-clear.sh   # Force refresh NOW
│   └── add-cache-clear.sh         # Add to new HTML files
│
├── public-site/
│   ├── js/
│   │   └── cache-clear.js         # Client-side clearing
│   ├── version.json               # Current version
│   ├── index.html                 # ✅ Has cache-clear.js
│   ├── product.html               # ✅ Has cache-clear.js
│   ├── cart.html                  # ✅ Has cache-clear.js
│   ├── checkout.html              # ✅ Has cache-clear.js
│   ├── auth.html                  # ✅ Has cache-clear.js
│   ├── dashboard.html             # ✅ Has cache-clear.js
│   └── thank-you.html             # ✅ Has cache-clear.js
│
├── admin-site/
│   ├── js/
│   │   └── cache-clear.js         # Admin cache clearing
│   ├── version.json               # Admin version
│   └── index.html                 # ✅ Has cache-clear.js
│
├── firebase.json                  # HTTP cache headers
│
└── Documentation/
    ├── DEPLOYMENT_READY.md        # Full guide
    ├── QUICK_DEPLOY.md            # Quick start
    ├── CACHE_REFRESH_COMPLETE.md  # Summary
    └── CACHE_BUSTING_GUIDE.md     # Technical guide

═══════════════════════════════════════════════════════════════════

                    TROUBLESHOOTING FLOW

User: "I see old version!" 
         │
         ↓
    ┌────────────────────┐
    │ Check cache headers│
    │ curl -I <url>      │
    └────┬───────────────┘
         │
         ├─→ No cache headers? → Re-deploy: bash scripts/deploy-with-cache-bust.sh
         │
         ├─→ Old version in HTML? → Run: bash scripts/cache-bust.sh
         │
         ├─→ cache-clear.js not executed? → Hard refresh: Ctrl+Shift+R
         │
         └─→ Still not working? → EMERGENCY: bash scripts/emergency-cache-clear.sh

═══════════════════════════════════════════════════════════════════

                    MONITORING & VERIFICATION

┌─────────────────────────────────────────────────────────────────┐
│  Check Current Version:                                          │
│    curl https://latiao-snack.com.ua/version.json               │
│                                                                  │
│  Check Cache Headers:                                            │
│    curl -I https://latiao-snack.com.ua/js/app.js              │
│                                                                  │
│  Browser DevTools:                                               │
│    F12 → Network → Reload → Check Headers                      │
│                                                                  │
│  Git History:                                                    │
│    git log --oneline --grep="Cache bust"                       │
└─────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════
```
