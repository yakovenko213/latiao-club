#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Clean Deployment with Cache-Busting...${NC}\n"

# Step 1: Update version numbers
echo -e "${YELLOW}📝 Step 1: Updating version numbers...${NC}"
if [ -f "scripts/update-version.js" ]; then
  node scripts/update-version.js
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Version updated successfully${NC}\n"
  else
    echo -e "${RED}❌ Version update failed${NC}"
    exit 1
  fi
else
  echo -e "${RED}❌ scripts/update-version.js not found${NC}"
  exit 1
fi

# Step 2: Clear local Firebase cache
echo -e "${YELLOW}🧹 Step 2: Clearing local Firebase cache...${NC}"
if [ -d ".firebase" ]; then
  rm -rf .firebase/
  echo -e "${GREEN}✅ Cache cleared${NC}\n"
else
  echo -e "${YELLOW}⚠️  No cache to clear${NC}\n"
fi

# Step 3: Determine what to deploy
if [ -z "$1" ]; then
  TARGET="hosting"
  DESCRIPTION="All hosting sites"
else
  TARGET="hosting:$1"
  DESCRIPTION="$1 site"
fi

# Step 4: Deploy to Firebase
echo -e "${YELLOW}☁️  Step 3: Deploying ${DESCRIPTION} to Firebase...${NC}"
firebase deploy --only "$TARGET" --force

if [ $? -eq 0 ]; then
  echo -e "\n${GREEN}✅ Deployment successful!${NC}"
else
  echo -e "\n${RED}❌ Deployment failed${NC}"
  exit 1
fi

# Step 5: Verify deployment
echo -e "\n${YELLOW}🔍 Step 4: Verifying deployment...${NC}"
firebase hosting:releases:list --limit 1

# Step 6: Success message
echo -e "\n${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Users will see the new version on next page load${NC}"
echo -e "${YELLOW}💡 Remind users to press Ctrl+Shift+R if issues persist${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Optional: Open browser to test
if command -v open &> /dev/null; then
  read -p "Open site in browser? (y/n): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ "$1" == "adminpanel" ]; then
      open "https://office-connect.latiao-snack.com.ua"
    elif [ "$1" == "main" ]; then
      open "https://latiao-snack.com.ua"
    elif [ "$1" == "admin-store-latio" ]; then
      open "https://admin-store-latio.web.app"
    fi
  fi
fi

exit 0
