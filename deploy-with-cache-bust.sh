#!/bin/bash

# 🚀 ATOMIC DEPLOY SCRIPT WITH CACHE BUSTING
# This script ensures clean deployment with cache invalidation

echo "🔥 ================================"
echo "🔥 ATOMIC DEPLOY WITH CACHE BUST"
echo "🔥 ================================"
echo ""

# Step 1: Update version to force new ETag
echo "📝 Step 1: Updating version..."
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S UTC")
VERSION="2.1.$((RANDOM % 100))"

# Update version in admin-site/index.html
sed -i "s/const ADMIN_PANEL_VERSION = .*/const ADMIN_PANEL_VERSION = '$VERSION-CACHE-BUST'/" admin-site/index.html
sed -i "s/const BUILD_DATE = .*/const BUILD_DATE = '$TIMESTAMP'/" admin-site/index.html

echo "   ✅ Version updated to: $VERSION-CACHE-BUST"
echo "   ✅ Build date: $TIMESTAMP"
echo ""

# Step 2: Clear local Firebase cache
echo "🗑️  Step 2: Clearing local Firebase cache..."
rm -rf .firebase/hosting.* 2>/dev/null
echo "   ✅ Local cache cleared"
echo ""

# Step 3: Deploy with force flag
echo "🚀 Step 3: Deploying to Firebase..."
firebase deploy --only hosting:admin-store-latio --force
DEPLOY_STATUS=$?

if [ $DEPLOY_STATUS -eq 0 ]; then
  echo ""
  echo "✅ ================================"
  echo "✅ DEPLOYMENT SUCCESSFUL!"
  echo "✅ ================================"
  echo ""
  echo "🔍 Verification:"
  echo "   Version deployed: $VERSION-CACHE-BUST"
  echo "   Timestamp: $TIMESTAMP"
  echo ""
  echo "🌐 URLs to check:"
  echo "   Default: https://admin-store-latio.web.app"
  echo "   Custom:  https://office-connect.latiao-snack.com.ua"
  echo ""
  echo "⚠️  IMPORTANT: Clear browser cache or use Incognito mode!"
  echo "   Windows/Linux: Ctrl + Shift + R"
  echo "   Mac: Cmd + Shift + R"
  echo ""
  
  # Verify deployment
  echo "🧪 Testing live deployment..."
  sleep 3
  LIVE_VERSION=$(curl -s https://office-connect.latiao-snack.com.ua | grep -o "ADMIN_PANEL_VERSION = '[^']*" | cut -d"'" -f2)
  
  if [ -n "$LIVE_VERSION" ]; then
    echo "   Live version detected: $LIVE_VERSION"
    
    if [[ "$LIVE_VERSION" == "$VERSION-CACHE-BUST" ]]; then
      echo "   ✅ PERFECT! New version is live!"
    else
      echo "   ⚠️  Old version detected. CDN cache may take up to 1 hour to update."
      echo "   💡 Use Incognito mode to bypass cache immediately."
    fi
  else
    echo "   ⚠️  Could not detect version. Check manually."
  fi
  
else
  echo ""
  echo "❌ ================================"
  echo "❌ DEPLOYMENT FAILED"
  echo "❌ ================================"
  echo ""
  echo "Please check errors above and try again."
  exit 1
fi

echo ""
echo "📚 Next steps:"
echo "   1. Open https://office-connect.latiao-snack.com.ua in Incognito mode"
echo "   2. Press F12 → Console"
echo "   3. Look for: 🚀 ADMIN PANEL VERSION: $VERSION-CACHE-BUST"
echo "   4. Test the {review_link} placeholder in SMS templates"
echo ""
