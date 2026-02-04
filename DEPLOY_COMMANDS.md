# 🚀 Quick Deployment Commands - No Cache Issues

## ⚡ Usage

### Standard Deployment (Recommended)
```bash
npm run deploy:admin        # Deploy admin panel with version update
npm run deploy:main         # Deploy main site with version update
npm run deploy              # Deploy all sites with version update
```

### Clean Deployment (Full Cache Clear)
```bash
npm run deploy:clean:admin  # Admin panel - clears local cache
npm run deploy:clean:main   # Main site - clears local cache
npm run deploy:clean        # All sites - clears local cache
```

### Manual Version Update Only
```bash
npm run version             # Updates version numbers in HTML files
```

---

## 📋 What Happens

### When you run `npm run deploy:admin`:
1. ✅ Updates version numbers in HTML files (`?v=1707062400000`)
2. ✅ Deploys to Firebase Hosting
3. ✅ Invalidates CDN cache automatically
4. ✅ Users see new version immediately (no Ctrl+F5 needed)

---

## 🎯 Files Created

- ✅ `/scripts/update-version.js` - Auto-updates version numbers
- ✅ `/scripts/deploy.sh` - Clean deployment script
- ✅ `package.json` - Updated with new commands
- ✅ `CACHE_BUSTING_STRATEGY.md` - Full documentation

---

## 📝 Before First Use

Run once to set up:
```bash
chmod +x scripts/deploy.sh
```

---

## 🔍 Verify It Works

After deployment:

1. **Check version.json** (auto-created):
```bash
curl https://office-connect.latiao-snack.com.ua/version.json
```

2. **Check HTML has version params**:
```bash
curl https://office-connect.latiao-snack.com.ua/ | grep "?v="
```

3. **Check cache headers**:
```bash
curl -I https://office-connect.latiao-snack.com.ua/
# Should see: Cache-Control: no-cache, no-store, must-revalidate
```

---

## 🎯 Expected Results

| Before | After |
|--------|-------|
| Users see old version | Users see new version immediately |
| Need Ctrl+F5 to refresh | Automatic refresh on page load |
| Cache issues | No cache issues |
| Manual version updates | Automatic version updates |

---

## 🐛 Troubleshooting

### If users still see old version:

1. **Hard refresh**: Ctrl+Shift+R
2. **Clear browser cache**: F12 → Application → Clear storage
3. **Check deployment status**:
```bash
firebase hosting:releases:list
```

4. **Verify version updated**:
```bash
curl https://office-connect.latiao-snack.com.ua/version.json
```

---

## 📞 Quick Help

**Deploy admin panel:**
```bash
npm run deploy:admin
```

**Full clean deploy:**
```bash
npm run deploy:clean:admin
```

**Check what will be deployed:**
```bash
firebase deploy --only hosting:adminpanel --dry-run
```

---

**Created:** February 4, 2026  
**Status:** Ready to Use ✅
