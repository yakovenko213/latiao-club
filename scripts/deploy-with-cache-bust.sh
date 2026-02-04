#!/bin/bash
# ===========================================
# Complete Deployment Script with Cache Busting
# ===========================================
# This script:
# 1. Runs cache busting to update version numbers
# 2. Commits changes to git (optional)
# 3. Deploys to Firebase hosting
# ===========================================

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Latiao Snack - Complete Deployment  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# ===========================================
# Step 1: Run Cache Busting
# ===========================================
echo -e "${YELLOW}[1/3] Running cache busting...${NC}"
bash scripts/cache-bust.sh

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Cache busting failed!${NC}"
    exit 1
fi

echo ""

# ===========================================
# Step 2: Git Commit (Optional)
# ===========================================
echo -e "${YELLOW}[2/3] Git operations...${NC}"

read -p "Commit changes to git? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter commit message: " COMMIT_MSG
    
    if [ -z "$COMMIT_MSG" ]; then
        COMMIT_MSG="Cache bust: $(date +%Y-%m-%d-%H:%M:%S)"
    fi
    
    git add .
    git commit -m "$COMMIT_MSG" || echo "Nothing to commit"
    
    read -p "Push to GitHub? (y/n) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git push
        echo -e "${GREEN}✅ Pushed to GitHub${NC}"
    fi
fi

echo ""

# ===========================================
# Step 3: Firebase Deploy
# ===========================================
echo -e "${YELLOW}[3/3] Deploying to Firebase...${NC}"
echo ""

echo "Select deployment target:"
echo "1) Public site only (latiao-snack.com.ua)"
echo "2) Admin site only (office-connect.latiao-snack.com.ua)"
echo "3) Both sites"
echo ""
read -p "Enter choice (1-3): " -n 1 -r
echo ""

case $REPLY in
    1)
        echo -e "${BLUE}Deploying PUBLIC SITE...${NC}"
        firebase deploy --only hosting:main
        ;;
    2)
        echo -e "${BLUE}Deploying ADMIN SITE...${NC}"
        firebase deploy --only hosting:admin-store-latio
        ;;
    3)
        echo -e "${BLUE}Deploying BOTH SITES...${NC}"
        firebase deploy --only hosting
        ;;
    *)
        echo -e "${RED}Invalid choice. Exiting.${NC}"
        exit 1
        ;;
esac

echo ""

# ===========================================
# Success Message
# ===========================================
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     ✅ Deployment Complete! 🚀        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}🌐 Public Site: https://latiao-snack.com.ua${NC}"
echo -e "${YELLOW}🔧 Admin Site: https://office-connect.latiao-snack.com.ua${NC}"
echo ""
echo -e "${BLUE}💡 Tip: Users will now see the latest version immediately!${NC}"
echo -e "${BLUE}💡 If issues persist, advise users to hard refresh (Ctrl+Shift+R)${NC}"
echo ""
