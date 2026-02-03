#!/bin/bash

# 🚀 NUCLEAR RE-DEPLOY SCRIPT
# This script performs a COMPLETE reset and redeploy
# Use this when: "I updated code but live site doesn't change"

set -e  # Exit on first error

echo "🔥🔥🔥 ========================================= 🔥🔥🔥"
echo "🔥  NUCLEAR RE-DEPLOY INITIATED (2.2.0 BUILD)"
echo "🔥🔥🔥 ========================================= 🔥🔥🔥"
echo ""

TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S UTC")
VERSION_MAJOR="2"
VERSION_MINOR="2"
VERSION_PATCH=$((RANDOM % 100))
FULL_VERSION="$VERSION_MAJOR.$VERSION_MINOR.$VERSION_PATCH"

echo "📋 PHASE 1: Pre-deployment Analysis"
echo "===================================="
echo ""

# 1. Verify local code
echo "✅ Step 1: Checking local admin-site/index.html..."
if [ ! -f "admin-site/index.html" ]; then
    echo "   ❌ ERROR: admin-site/index.html not found!"
    exit 1
fi

FILE_SIZE=$(du -h admin-site/index.html | cut -f1)
echo "   ✅ File exists: $FILE_SIZE"

# Verify new code exists
if grep -q "review_link" admin-site/index.html; then
    echo "   ✅ Code contains 'review_link' (PERSONALIZED REVIEWS FEATURE)"
else
    echo "   ⚠️  WARNING: 'review_link' not found in admin-site/index.html"
fi

# 2. Verify Firebase config
echo ""
echo "✅ Step 2: Checking firebase.json..."
if grep -q "admin-store-latio" firebase.json && grep -q '"public": "admin-site"' firebase.json; then
    echo "   ✅ Firebase targets admin-store-latio → admin-site"
else
    echo "   ❌ ERROR: firebase.json misconfigured!"
    exit 1
fi

# 3. Verify Firebase project
echo ""
echo "✅ Step 3: Verifying Firebase project..."
ACTIVE_PROJECT=$(firebase use 2>&1 | grep -o 'my-magazin-81c96' || echo "NOTSET")
if [ "$ACTIVE_PROJECT" == "my-magazin-81c96" ]; then
    echo "   ✅ Active project: my-magazin-81c96"
else
    echo "   ⚠️  Setting project to my-magazin-81c96..."
    firebase use my-magazin-81c96
fi

echo ""
echo "📋 PHASE 2: Cache & Build Cleanup"
echo "=================================="
echo ""

# 4. Delete Firebase local cache
echo "✅ Step 4: Deleting Firebase local cache (.firebase/)..."
if [ -d ".firebase" ]; then
    rm -rf .firebase/
    echo "   ✅ Deleted: .firebase/"
else
    echo "   ℹ️  .firebase/ doesn't exist (already clean)"
fi

# 5. Delete Next.js cache (if exists)
echo ""
echo "✅ Step 5: Cleaning build cache..."
if [ -d ".next" ]; then
    rm -rf .next/
    echo "   ✅ Deleted: .next/ (Next.js cache)"
fi

if [ -d "dist" ]; then
    rm -rf dist/
    echo "   ✅ Deleted: dist/ (Vite build)"
fi

if [ -d "build" ]; then
    rm -rf build/
    echo "   ✅ Deleted: build/"
fi

echo ""
echo "📋 PHASE 3: Version Update (Force New ETag)"
echo "=========================================="
echo ""

# 6. Update version to force new deployment
echo "✅ Step 6: Updating version numbers..."
echo "   Old version pattern will be replaced with: $FULL_VERSION"

# For admin-site/index.html
if grep -q "ADMIN_PANEL_VERSION" admin-site/index.html; then
    sed -i "s/const ADMIN_PANEL_VERSION = .*/const ADMIN_PANEL_VERSION = '$FULL_VERSION-NUCLEAR'/" admin-site/index.html
    sed -i "s/const BUILD_DATE = .*/const BUILD_DATE = '$TIMESTAMP'/" admin-site/index.html
    echo "   ✅ Updated admin-site/index.html"
else
    echo "   ⚠️  Could not find version string in admin-site/index.html"
fi

# Verify version was updated
DEPLOYED_VERSION=$(grep "ADMIN_PANEL_VERSION" admin-site/index.html | head -1 | grep -o "'[^']*'" | tr -d "'")
echo "   → New version: $DEPLOYED_VERSION"

echo ""
echo "📋 PHASE 4: Firebase Deploy"
echo "==========================="
echo ""

# 7. Deploy with FORCE flag
echo "✅ Step 7: Deploying to Firebase..."
echo "   Command: firebase deploy --only hosting:admin-store-latio --force"
echo ""

firebase deploy --only hosting:admin-store-latio --force

DEPLOY_EXIT=$?
if [ $DEPLOY_EXIT -ne 0 ]; then
    echo ""
    echo "❌ Deployment failed with exit code: $DEPLOY_EXIT"
    exit $DEPLOY_EXIT
fi

echo ""
echo "📋 PHASE 5: Post-Deployment Verification"
echo "========================================"
echo ""

# 8. Wait for CDN propagation
echo "✅ Step 8: Waiting for CDN propagation (10 seconds)..."
sleep 10

# 9. Verify live deployment
echo ""
echo "✅ Step 9: Verifying live deployment..."

# Check version on live site
LIVE_VERSION=$(curl -s https://office-connect.latiao-snack.com.ua 2>&1 | grep -o "ADMIN_PANEL_VERSION = '[^']*'" | grep -o "'[^']*'" | tr -d "'" || echo "NOT_FOUND")

if [ -z "$LIVE_VERSION" ] || [ "$LIVE_VERSION" == "NOT_FOUND" ]; then
    echo "   ⚠️  Could not detect version on live site"
    echo "   💡 This might be due to CDN caching"
else
    echo "   Live version detected: $LIVE_VERSION"
fi

# Check if review_link code is present
REVIEW_LINK_LIVE=$(curl -s https://office-connect.latiao-snack.com.ua 2>&1 | grep -c "review_link" || echo "0")

if [ "$REVIEW_LINK_LIVE" -gt "0" ]; then
    echo "   ✅ Code 'review_link' found on live site ($REVIEW_LINK_LIVE times)"
else
    echo "   ⚠️  Code 'review_link' not detected yet (might be cached)"
fi

# Check cache headers
echo ""
echo "✅ Step 10: Checking CDN cache status..."
CACHE_STATUS=$(curl -sI https://office-connect.latiao-snack.com.ua 2>&1 | grep -i "x-cache:" || echo "UNKNOWN")
ETAG=$(curl -sI https://office-connect.latiao-snack.com.ua 2>&1 | grep -i "etag:" || echo "UNKNOWN")

echo "   $CACHE_STATUS"
echo "   $ETAG"

echo ""
echo "🔥🔥🔥 ========================================= 🔥🔥🔥"
echo "🔥  NUCLEAR RE-DEPLOY COMPLETED SUCCESSFULLY!"
echo "🔥🔥🔥 ========================================= 🔥🔥🔥"
echo ""

echo "📊 DEPLOYMENT SUMMARY:"
echo "   ✅ Version deployed: $FULL_VERSION-NUCLEAR"
echo "   ✅ Build timestamp: $TIMESTAMP"
echo "   ✅ Deployed to: admin-store-latio"
echo "   ✅ Custom domain: office-connect.latiao-snack.com.ua"
echo "   ✅ Default URL: https://admin-store-latio.web.app"
echo ""

echo "⚠️  IMPORTANT NEXT STEPS:"
echo "   1. Open https://office-connect.latiao-snack.com.ua in INCOGNITO MODE"
echo "      (Press Ctrl+Shift+N on Windows/Linux or Cmd+Shift+N on Mac)"
echo ""
echo "   2. Clear browser cache if still seeing old version:"
echo "      - Settings → Privacy → Clear browsing data"
echo "      - Select: Cached images and files"
echo "      - Click: Clear data"
echo ""
echo "   3. Hard refresh the page:"
echo "      - Windows/Linux: Ctrl+Shift+R"
echo "      - Mac: Cmd+Shift+R"
echo ""
echo "   4. Open DevTools Console (F12) and verify:"
echo "      - Should see: 🚀 ADMIN PANEL VERSION: $FULL_VERSION-NUCLEAR"
echo ""
echo "   5. If still seeing old version after 15 minutes:"
echo "      - Check if CDN cache is stuck: $CACHE_STATUS"
echo "      - Contact Firebase support or clear Cloudflare cache"
echo ""

echo "📚 For debugging, run:"
echo "   # Check local file"
echo "   grep 'ADMIN_PANEL_VERSION' admin-site/index.html"
echo ""
echo "   # Check live site"
echo "   curl -s https://office-connect.latiao-snack.com.ua | grep 'ADMIN_PANEL_VERSION'"
echo ""
echo "   # Run full verification script"
echo "   ./verify-deployment.sh"
echo ""
