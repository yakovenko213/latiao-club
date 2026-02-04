#!/bin/bash

echo "🚀 Deploying Admin Panel with arrayUnion fix..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Firebase deploy
echo -e "${BLUE}📦 Step 1: Deploying to Firebase...${NC}"
firebase deploy --only hosting:admin-store-latio

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo ""
    echo -e "${YELLOW}🔍 Testing checklist:${NC}"
    echo "1. Open https://admin.latiaoclub.com.ua in PRIVATE/INCOGNITO window"
    echo "2. Open browser DevTools (F12)"
    echo "3. Check Console for:"
    echo "   - '✅ Firebase (SYNC) initialized'"
    echo "   - '🔧 arrayUnion available: function'"
    echo "4. Navigate to CRM Kanban (Керування → CRM Kanban)"
    echo "5. Click '⋮' on any cart"
    echo "6. Check for debug logs:"
    echo "   - '🔍 Debug: window.firebaseInit keys: [...]'"
    echo "   - '🔍 Debug: arrayUnion in window.firebaseInit: function'"
    echo "7. Add a note and verify it saves without errors"
    echo ""
    echo -e "${BLUE}Cache busting version: ?v=202602040001${NC}"
else
    echo -e "❌ Deployment failed!"
    exit 1
fi
