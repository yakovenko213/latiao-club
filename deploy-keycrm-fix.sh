#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
# KeyCRM Integration Fix - Deployment Script
# ═══════════════════════════════════════════════════════════════════════════════

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔗 KeyCRM Integration Fix - Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Change to project directory
cd /workspaces/latiao-club

echo "📋 Changes to be deployed:"
echo "  ✅ Fixed payment status check for COD orders"
echo "  ✅ Added comprehensive logging for debugging"
echo "  ✅ Enhanced error handling"
echo ""

echo "🚀 Starting deployment..."
echo ""

# Deploy Cloud Functions (CRITICAL FIX)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Deploying Cloud Functions..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
firebase deploy --only functions

if [ $? -eq 0 ]; then
  echo "✅ Cloud Functions deployed successfully"
else
  echo "❌ Cloud Functions deployment failed"
  echo "⚠️  If you see '409 HTTP Error', wait 5-10 minutes and run this script again"
  exit 1
fi

echo ""

# Deploy Hosting (Improved Logging)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Deploying Hosting..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
firebase deploy --only hosting

if [ $? -eq 0 ]; then
  echo "✅ Hosting deployed successfully"
else
  echo "❌ Hosting deployment failed"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DEPLOYMENT COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next Steps:"
echo "  1. Test COD order: https://latiao-snack.com.ua/checkout.html"
echo "  2. Check browser console (F12) for KeyCRM sync logs"
echo "  3. Verify orders appear in KeyCRM admin panel"
echo ""
echo "📖 Full documentation: KEYCRM_INTEGRATION_FIX.md"
echo ""
