# 🔧 Manual Troubleshooting Commands

## 1️⃣ Check What's ACTUALLY in admin-site/index.html (before deploy)
```bash
# Search for new code keyword
grep -n "review_link\|PERSONALIZED-REVIEWS" admin-site/index.html

# Get version
grep "ADMIN_PANEL_VERSION" admin-site/index.html

# Count file size
ls -lh admin-site/index.html
```

## 2️⃣ Clear Firebase Local Cache
```bash
# Delete Firebase hosting cache
rm -rf .firebase/hosting.*

# Delete all Firebase cache
rm -rf .firebase/
```

## 3️⃣ Check Firebase Targets
```bash
# List all hosting sites
firebase hosting:sites:list

# Check current project
firebase projects:list

# Check .firebaserc
cat .firebaserc
```

## 4️⃣ Deploy with Force Flag
```bash
# Force redeploy (ignores cache)
firebase deploy --only hosting:admin-store-latio --force

# Deploy with debug output
firebase deploy --only hosting:admin-store-latio --debug
```

## 5️⃣ Verify What's on Live Site
```bash
# Check version on live site
curl -s https://office-connect.latiao-snack.com.ua | grep "ADMIN_PANEL_VERSION"

# Check if review_link exists
curl -s https://office-connect.latiao-snack.com.ua | grep "review_link"

# Check cache headers
curl -sI https://office-connect.latiao-snack.com.ua | grep -i cache

# Check ETag (unique file hash)
curl -sI https://office-connect.latiao-snack.com.ua | grep -i etag
```

## 6️⃣ Compare Local vs Live
```bash
# Local version
grep "ADMIN_PANEL_VERSION" admin-site/index.html

# Live version  
curl -s https://office-connect.latiao-snack.com.ua | grep "ADMIN_PANEL_VERSION"

# Should match!
```

## 7️⃣ Test with Timestamp Parameter (bypass cache)
```bash
# Add random query parameter to bypass CDN cache
https://office-connect.latiao-snack.com.ua/?nocache=12345

# Or use curl with no-cache header
curl -H "Cache-Control: no-cache" https://office-connect.latiao-snack.com.ua | grep "ADMIN_PANEL_VERSION"
```

## 8️⃣ Atomic Single-Line Deploy (Windows PowerShell)
```powershell
# PowerShell
Remove-Item -Recurse -Force .firebase -ErrorAction SilentlyContinue; firebase deploy --only hosting:admin-store-latio --force

# One-liner with version update (PowerShell)
(Get-Content admin-site/index.html) -replace 'ADMIN_PANEL_VERSION = .*', "ADMIN_PANEL_VERSION = '2.1.$(Get-Random -Maximum 999)'" | Set-Content admin-site/index.html; firebase deploy --only hosting:admin-store-latio --force
```

## 9️⃣ Atomic Single-Line Deploy (Mac/Linux Bash)
```bash
# Bash
rm -rf .firebase/ && firebase deploy --only hosting:admin-store-latio --force

# One-liner with version bump
sed -i "s/ADMIN_PANEL_VERSION = .*/ADMIN_PANEL_VERSION = '2.1.$RANDOM'/" admin-site/index.html && rm -rf .firebase/ && firebase deploy --only hosting:admin-store-latio --force
```

## 🔟 Nuclear Option - Complete Clean Deploy
```bash
#!/bin/bash
# This GUARANTEES fresh deployment

# 1. Logout and login again
firebase logout
firebase login

# 2. Clear ALL caches
rm -rf .firebase/
rm -rf node_modules/.cache/
rm -rf ~/.cache/firebase/

# 3. Update version with timestamp
TIMESTAMP=$(date +%s)
sed -i "s/ADMIN_PANEL_VERSION = .*/ADMIN_PANEL_VERSION = '2.1.$TIMESTAMP'/" admin-site/index.html

# 4. Deploy with force
firebase deploy --only hosting:admin-store-latio --force --debug

# 5. Verify
echo "Checking deployment..."
sleep 5
curl -s https://office-connect.latiao-snack.com.ua | grep "ADMIN_PANEL_VERSION"
```

## ⚡ Quick Deploy Aliases (add to ~/.bashrc or ~/.zshrc)
```bash
# Add these to your shell config
alias fbd='firebase deploy --only hosting:admin-store-latio --force'
alias fbdc='rm -rf .firebase/ && firebase deploy --only hosting:admin-store-latio --force'
alias fbv='curl -s https://office-connect.latiao-snack.com.ua | grep "ADMIN_PANEL_VERSION"'
alias fbcheck='./verify-deployment.sh'

# Then just run:
# fbd      → Quick deploy with force
# fbdc     → Deploy with cache clear
# fbv      → Check live version
# fbcheck  → Full verification
```

## 🎯 Most Common Issue Solutions

### Issue: "I deployed but nothing changed"
**Solution**:
```bash
# Clear browser cache (Ctrl+Shift+R) OR use this:
https://office-connect.latiao-snack.com.ua/?v=$(date +%s)
```

### Issue: "Local file is updated but live site is old"
**Solution**:
```bash
# Check if they actually match
diff <(grep "ADMIN_PANEL_VERSION" admin-site/index.html) \
     <(curl -s https://office-connect.latiao-snack.com.ua | grep "ADMIN_PANEL_VERSION")

# If different, force redeploy
firebase deploy --only hosting:admin-store-latio --force
```

### Issue: "CDN cache won't clear"
**Solution**:
```bash
# Change version number to force new ETag
sed -i "s/2.1.0/2.1.1/" admin-site/index.html
firebase deploy --only hosting:admin-store-latio --force

# Then test with:
curl -H "Cache-Control: no-cache" https://office-connect.latiao-snack.com.ua | grep version
```

### Issue: "Wrong folder being deployed"
**Solution**:
```bash
# Check firebase.json
cat firebase.json | grep -A 3 "admin-store-latio"

# Should show:
# "site": "admin-store-latio",
# "public": "admin-site",

# If wrong, edit firebase.json and redeploy
```

## 📋 Pre-Deploy Checklist

Before EVERY deploy:
- [ ] Code changes saved in admin-site/index.html
- [ ] Version number updated (optional but recommended)
- [ ] Run: `grep "new_feature_keyword" admin-site/index.html` (verify code exists)
- [ ] Clear local cache: `rm -rf .firebase/`
- [ ] Deploy: `firebase deploy --only hosting:admin-store-latio --force`
- [ ] Wait 10 seconds for propagation
- [ ] Verify: `curl -s https://office-connect.latiao-snack.com.ua | grep "new_feature_keyword"`
- [ ] Open in Incognito mode
- [ ] Check Console for version number

## 🚨 Emergency Commands

If NOTHING works:
```bash
# 1. Create a new test change
echo "<!-- TEST CHANGE $(date) -->" >> admin-site/index.html

# 2. Clear everything
rm -rf .firebase/
firebase logout
firebase login

# 3. Force deploy
firebase deploy --only hosting:admin-store-latio --force --debug

# 4. Verify immediately
curl -s https://office-connect.latiao-snack.com.ua | grep "TEST CHANGE"

# 5. If found, remove test comment
sed -i '/TEST CHANGE/d' admin-site/index.html
```
