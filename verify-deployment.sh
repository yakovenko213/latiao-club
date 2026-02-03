#!/bin/bash

echo "🔍 ================================"
echo "🔍 DEPLOYMENT VERIFICATION SCRIPT"
echo "🔍 ================================"
echo ""

echo "1️⃣ Checking LOCAL file (admin-site/index.html):"
echo "   Version:"
grep "ADMIN_PANEL_VERSION" admin-site/index.html | head -1
echo "   Review Link Support:"
grep "review_link" admin-site/index.html | head -1
echo ""

echo "2️⃣ Checking LIVE site (office-connect.latiao-snack.com.ua):"
echo "   Version:"
curl -s https://office-connect.latiao-snack.com.ua | grep "ADMIN_PANEL_VERSION" | head -1
echo "   Review Link Support:"
curl -s https://office-connect.latiao-snack.com.ua | grep "review_link" | head -1
echo ""

echo "3️⃣ Checking DEFAULT Firebase URL (admin-store-latio.web.app):"
echo "   Version:"
curl -s https://admin-store-latio.web.app | grep "ADMIN_PANEL_VERSION" | head -1
echo "   Review Link Support:"
curl -s https://admin-store-latio.web.app | grep "review_link" | head -1
echo ""

echo "4️⃣ Firebase Hosting Sites:"
firebase hosting:sites:list
echo ""

echo "5️⃣ Cache Headers from live site:"
curl -sI https://office-connect.latiao-snack.com.ua | grep -i "cache\|etag\|last-modified"
echo ""

echo "✅ Verification complete!"
echo ""
echo "📝 Next steps if version doesn't match:"
echo "   1. Hard refresh browser: Ctrl+Shift+R (Win) or Cmd+Shift+R (Mac)"
echo "   2. Open in Incognito mode"
echo "   3. Clear browser cache completely"
echo "   4. Wait 1 hour for CDN cache to expire (max-age=3600)"
echo "   5. Re-deploy: firebase deploy --only hosting:admin-store-latio"
