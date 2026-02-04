# 🚀 Quick Deployment Guide - Admin Panel (Office Connect)

## 📍 Your Admin Panel
- **URL:** https://office-connect.latiao-snack.com.ua/
- **Files:** `/functions/private/`
- **Target:** `adminpanel`

---

## ⚡ Quick Deploy Commands

### Deploy ONLY Admin Panel (Recommended)
```bash
firebase deploy --only hosting:adminpanel
```

**Deploys:**
- `/functions/private/index.html`
- `/functions/private/js/admin.js`
- All files in `/functions/private/` directory

**Time:** ~30 seconds  
**URL:** https://office-connect.latiao-snack.com.ua/

---

### Deploy All Hosting Sites
```bash
firebase deploy --only hosting
```

**Deploys:**
1. Main store (public-site) → latiao-snack.com.ua
2. Admin store (admin-site) → admin-store-latio.web.app
3. Admin panel (functions/private) → office-connect.latiao-snack.com.ua

**Time:** ~1-2 minutes

---

### Full Deployment (Everything)
```bash
firebase deploy
```

**Deploys:**
- All hosting sites
- Cloud Functions
- Firestore rules
- Storage rules

**Time:** ~3-5 minutes

---

## 🔍 Verify Deployment

### Check Target Configuration
```bash
firebase target:apply hosting adminpanel office-connect-latiao-snack
```

### View Current Targets
```bash
firebase target
```

Expected output:
```
[ hosting ]
Resource Directory Targets
adminpanel functions/private [office-connect-latiao-snack]
```

---

## 🎯 Internal Notes Feature

### After Deployment - Test Steps

1. **Login:** https://office-connect.latiao-snack.com.ua/
2. **Open Order:** Click any order in "Замовлення" section
3. **Scroll Down:** Find "Внутрішні нотатки (тільки для адмінів)"
4. **Add Note:** Type text and click "Зберегти нотатку"
5. **Verify:** Note appears with timestamp

---

## 📝 Firebase.json Configuration

Current config in `/firebase.json`:

```json
{
  "target": "adminpanel",
  "public": "functions/private",
  "cleanUrls": false,
  "trailingSlash": false,
  "headers": [
    {
      "source": "**/*.@(js|css|html)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache, no-store, must-revalidate"
        }
      ]
    }
  ]
}
```

**Important:** Cache is disabled so admins always see latest updates.

---

## 🔄 Deployment Workflow

### Making Changes to Admin Panel

1. **Edit Files:**
   - `/functions/private/index.html`
   - `/functions/private/js/admin.js`

2. **Save Changes:**
   - `Ctrl+S` in VS Code

3. **Deploy:**
   ```bash
   firebase deploy --only hosting:adminpanel
   ```

4. **Clear Browser Cache:**
   - `Ctrl+Shift+R` (hard refresh)
   - Or `Ctrl+F5`

5. **Test:**
   - Open admin panel
   - Verify changes applied

---

## 🐛 Troubleshooting

### Issue: "No hosting targets found"
**Fix:**
```bash
firebase target:apply hosting adminpanel office-connect-latiao-snack
```

---

### Issue: "Site does not exist"
**Fix:**
Verify site exists:
```bash
firebase hosting:sites:list
```

If missing, create:
```bash
firebase hosting:sites:create office-connect-latiao-snack
```

---

### Issue: Changes not visible after deployment
**Fix 1:** Hard refresh browser
```
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

**Fix 2:** Clear site data
1. Open DevTools (`F12`)
2. Go to "Application" tab
3. Click "Clear site data"
4. Reload page

**Fix 3:** Check deployment status
```bash
firebase hosting:channel:list
```

---

## 📊 Deployment History

View recent deployments:
```bash
firebase hosting:releases:list
```

Rollback to previous version:
```bash
firebase hosting:channel:deploy [channel-id]
```

---

## ⚙️ Advanced Options

### Deploy with cache busting
```bash
# Already configured in firebase.json
# No-cache headers prevent stale files
```

### Deploy specific file
```bash
# Not possible with Firebase Hosting
# Always deploys entire directory
# Use --only hosting:adminpanel for minimal impact
```

### Preview before deploy (CI/CD)
```bash
firebase hosting:channel:deploy preview
```

---

## 📦 What Gets Deployed

### `/functions/private/` directory:
```
functions/private/
├── index.html          → Main admin panel
├── admin-clean.html    → Backup/alternative
├── admin-promos.html   → Promo management
├── js/
│   ├── admin.js        → Core admin logic
│   └── admin-chat.js   → Chat functionality
└── images/             → Admin assets
```

---

## 🎯 Summary

**Most Common Command:**
```bash
firebase deploy --only hosting:adminpanel
```

**Result:** Updates https://office-connect.latiao-snack.com.ua/

**Time:** ~30 seconds

**Next Step:** Hard refresh browser (`Ctrl+Shift+R`)

---

## 📞 Need Help?

**Check logs:**
```bash
firebase hosting:channel:list --json
```

**Verify configuration:**
```bash
cat firebase.json | grep -A 20 '"target": "adminpanel"'
```

**Test locally first:**
```bash
firebase serve --only hosting:adminpanel
```
Then open: http://localhost:5000

---

**Document Updated:** February 4, 2026  
**Version:** 1.0
