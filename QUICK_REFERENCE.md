# ⚡ QUICK REFERENCE: Deploy & Troubleshoot

## 🚀 How to Deploy (Next Time)

### Option 1: Nuclear Deploy (RECOMMENDED)
```bash
./nuclear-redeploy.sh
```
- ✅ Clears all caches
- ✅ Updates version (forces new ETag)
- ✅ Deploys with --force flag
- ✅ Verifies live deployment
- ⏱️ Takes ~30 seconds

### Option 2: Quick Deploy (Cache Bypass)
```bash
rm -rf .firebase/ && firebase deploy --only hosting:admin-store-latio --force
```
- ✅ Clear & deploy in one command
- ⏱️ Takes ~15 seconds

### Option 3: Standard Deploy
```bash
firebase deploy --only hosting:admin-store-latio
```
- ⚠️ May show old version due to cache
- Only use if you clear browser cache afterward

---

## 🧪 How to Test After Deploy

### Test 1: Incognito Mode (100% reliable)
```
Ctrl+Shift+N → https://office-connect.latiao-snack.com.ua
```

### Test 2: Hard Refresh (95% reliable)
```
Open site → Ctrl+Shift+R (or Cmd+Shift+R on Mac)
```

### Test 3: Check Version in Console
```
F12 → Console → Look for:
🚀 ADMIN PANEL VERSION: X.X.X
```

### Test 4: Verify Version via Command Line
```bash
curl -s https://office-connect.latiao-snack.com.ua | grep "ADMIN_PANEL_VERSION"
```

---

## 🔍 Diagnose Issues

### Problem: "Old version still showing"

```bash
# Step 1: Check local file
grep "ADMIN_PANEL_VERSION" admin-site/index.html

# Step 2: Check live site
curl -s https://office-connect.latiao-snack.com.ua | grep "ADMIN_PANEL_VERSION"

# Step 3: If different → Run nuclear deploy
./nuclear-redeploy.sh

# Step 4: Verify again
curl -s https://office-connect.latiao-snack.com.ua | grep "ADMIN_PANEL_VERSION"
```

### Problem: "Deploy succeeded but nothing changed"

1. **First:** Try browser cache clear
   - Settings → Privacy → Clear browsing data
   - Select: "Cached images and files"
   - Click: Clear

2. **Then:** Try Incognito mode
   - Ctrl+Shift+N
   - Open the site
   - If it works here, cache was the issue

3. **Finally:** Run nuclear deploy
   ```bash
   ./nuclear-redeploy.sh
   ```

---

## 📊 Deployment Paths (Verified Working)

```
Code Location:      admin-site/index.html (you edit here)
Deploy Target:      admin-store-latio (Firebase site)
Public Directory:   admin-site/ (firebase.json)
Live URL:           https://office-connect.latiao-snack.com.ua
Default URL:        https://admin-store-latio.web.app
CDN:                Fastly (cache-ams21048-AMS)
Cache Policy:       max-age=3600 (1 hour)
```

---

## 🗺️ What Each File Does

| File | Purpose | When to Use |
|------|---------|------------|
| `nuclear-redeploy.sh` | Full deploy with cache bust | ✅ ALWAYS USE THIS |
| `verify-deployment.sh` | Check if local matches live | After deploy or debugging |
| `deploy-with-cache-bust.sh` | Alternative cache-bust deploy | Backup option |
| `MANUAL_TROUBLESHOOTING_COMMANDS.md` | All manual commands | When you need details |
| `DEVOPS_AUDIT_COMPLETE.md` | Full technical audit | Understanding the system |

---

## 🎯 The Build Pipeline (For Reference)

```
YOU EDIT: admin-site/index.html
    ↓
YOU RUN: ./nuclear-redeploy.sh
    ↓
FIREBASE: Uploads to admin-store-latio
    ↓
CDN: Fastly clears cache (new ETag)
    ↓
USER: Sees new version in browser
```

---

## ⚡ Pro Tips

### Tip 1: Auto-Version Numbers
```bash
# Update version before deploy
sed -i "s/ADMIN_PANEL_VERSION = .*/ADMIN_PANEL_VERSION = '2.2.$RANDOM'/" admin-site/index.html
./nuclear-redeploy.sh
```

### Tip 2: Test URL Parameter (Bypass CDN)
```
https://office-connect.latiao-snack.com.ua?v=12345
```
(Adds cache-bust parameter)

### Tip 3: Create Shell Alias
```bash
# Add to ~/.bashrc or ~/.zshrc
alias deploy='./nuclear-redeploy.sh'
alias verify='./verify-deployment.sh'

# Then just run:
# deploy
# verify
```

---

## 🚨 Emergency Commands

If nothing works:

```bash
# Full reset (logs out, clears all cache)
firebase logout
firebase login
rm -rf .firebase/ .next/ dist/ build/
./nuclear-redeploy.sh

# Or nuclear option
firebase projects:list  # Verify project
firebase use my-magazin-81c96
firebase deploy --only hosting:admin-store-latio --force --debug
```

---

## 📱 Mobile Testing

After deploy, test on phone:
1. Incognito browser (if available)
2. Private/Safari Private Browsing
3. Different browser app (Chrome vs Safari)
4. Airplane mode ON then OFF (forces cache refresh)

---

## 📊 Key Metrics

| Metric | Value |
|--------|-------|
| Deploy time | ~15 seconds |
| CDN propagation | ~10 seconds |
| Total time | ~25 seconds |
| Cache duration | 3600 seconds (1 hour) |
| Files deployed | 40 files |
| File size (admin-site) | 793KB |

---

## ✅ Pre-Deploy Checklist

- [ ] Changes saved
- [ ] Version updated (run: `sed -i "s/ADMIN_PANEL_VERSION = .*/ADMIN_PANEL_VERSION = '2.2.$RANDOM'/" admin-site/index.html`)
- [ ] Code verified (run: `grep "new_feature" admin-site/index.html`)
- [ ] Ready to deploy (run: `./nuclear-redeploy.sh`)

---

**Last Updated:** 2026-02-03  
**Current Version:** 2.2.31-NUCLEAR  
**Status:** ✅ Working
