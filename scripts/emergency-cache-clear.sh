#!/bin/bash
# ===========================================
# Emergency Cache Clear Script
# ===========================================
# Use this for immediate cache clearing across all visitors
# This will force ALL users to reload everything
# ===========================================

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${RED}⚠️  EMERGENCY CACHE CLEAR${NC}"
echo -e "${YELLOW}This will force ALL visitors to reload everything${NC}"
echo ""
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo -e "${YELLOW}Aborted.${NC}"
    exit 0
fi

echo ""
echo -e "${GREEN}🔥 Starting emergency cache clear...${NC}"
echo ""

# 1. Run cache bust
echo -e "${YELLOW}Step 1/3: Running cache bust...${NC}"
bash "$(dirname "$0")/cache-bust.sh"

echo ""
# 2. Commit changes
echo -e "${YELLOW}Step 2/3: Committing changes...${NC}"
git add .
git commit -m "🔥 Emergency cache clear: $(date +%Y-%m-%d_%H:%M:%S)" || true

echo ""
# 3. Deploy immediately
echo -e "${YELLOW}Step 3/3: Deploying to Firebase...${NC}"
firebase deploy --only hosting

echo ""
echo -e "${GREEN}✅ Emergency cache clear complete!${NC}"
echo -e "${GREEN}All visitors will get the new version on next page load.${NC}"
echo ""
echo -e "${YELLOW}To verify:${NC}"
echo "  curl -I https://latiao-snack.com.ua"
echo "  curl -I https://office-connect.latiao-snack.com.ua"
