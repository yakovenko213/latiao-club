#!/bin/bash
# REVIEW SYSTEM IMPLEMENTATION CHECKLIST
# This script helps verify that the personalized review system is properly set up
# Usage: bash check-review-system.sh

echo "🔍 PERSONALIZED REVIEW SYSTEM - IMPLEMENTATION CHECKLIST"
echo "========================================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0
SUCCESS=0

check() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✅${NC} $2"
    ((SUCCESS++))
  else
    echo -e "${RED}❌${NC} $2 - File not found: $1"
    ((ERRORS++))
  fi
}

warn() {
  echo -e "${YELLOW}⚠️${NC} $1"
  ((WARNINGS++))
}

echo "📦 FRONTEND FILES"
echo "---------------"
check "./public-site/review-personalized.html" "Review page with modal (review-personalized.html)"
check "./public-site/js/review-system.js" "Review system utilities (js/review-system.js)"
echo ""

echo "📖 DOCUMENTATION"
echo "---------------"
check "./public-site/REVIEW_SYSTEM_COMPLETE.md" "Complete documentation (REVIEW_SYSTEM_COMPLETE.md)"
check "./public-site/REVIEW_QUICKSTART.md" "Quick start guide (REVIEW_QUICKSTART.md)"
echo ""

echo "🔧 BACKEND INTEGRATION"
echo "--------------------"
if grep -q "generateReviewLink\|review_link\|orderId" admin-site/index.html 2>/dev/null; then
  echo -e "${GREEN}✅${NC} Admin panel has review link generation (review_link in index.html)"
  ((SUCCESS++))
else
  echo -e "${RED}❌${NC} Admin panel missing review link generation"
  ((ERRORS++))
fi

if grep -q "replaceTemplateTags" admin-site/index.html 2>/dev/null; then
  echo -e "${GREEN}✅${NC} Admin panel has template tag replacement function"
  ((SUCCESS++))
else
  echo -e "${RED}❌${NC} Admin panel missing template tag replacement function"
  ((ERRORS++))
fi

if grep -q "sendReviewRequest" admin-site/index.html 2>/dev/null; then
  echo -e "${GREEN}✅${NC} Admin panel has sendReviewRequest function"
  ((SUCCESS++))
else
  echo -e "${RED}❌${NC} Admin panel missing sendReviewRequest function"
  ((ERRORS++))
fi

if grep -q "checkAutoReviewRequests" admin-site/index.html 2>/dev/null; then
  echo -e "${GREEN}✅${NC} Admin panel has automatic review request checking"
  ((SUCCESS++))
else
  echo -e "${YELLOW}⚠️${NC} Admin panel missing automatic review request checking (optional)"
  ((WARNINGS++))
fi
echo ""

echo "🔐 FIRESTORE SETUP"
echo "-----------------"
if [ -f "firestore.rules" ]; then
  if grep -q "reviews" firestore.rules 2>/dev/null; then
    echo -e "${GREEN}✅${NC} Firestore rules include reviews collection"
    ((SUCCESS++))
  else
    warn "Firestore rules may not have reviews collection configured"
  fi
else
  warn "firestore.rules file not found - please verify Firestore security rules"
fi

if [ -f "firestore.indexes.json" ]; then
  if grep -q "reviews" firestore.indexes.json 2>/dev/null; then
    echo -e "${GREEN}✅${NC} Firestore indexes include reviews collection"
    ((SUCCESS++))
  else
    warn "Firestore indexes may not have reviews collection configured"
  fi
else
  warn "firestore.indexes.json file not found - please verify Firestore indexes"
fi
echo ""

echo "🌐 DOMAIN/URL CONFIGURATION"
echo "-------------------------"
if grep -q "latiao-snack.com.ua" public-site/review-personalized.html 2>/dev/null; then
  echo -e "${GREEN}✅${NC} Review page configured for latiao-snack.com.ua"
  ((SUCCESS++))
else
  warn "Review page domain may not be configured correctly"
fi

if grep -q "latiao-snack.com.ua" public-site/js/review-system.js 2>/dev/null; then
  echo -e "${GREEN}✅${NC} Review system utilities configured for latiao-snack.com.ua"
  ((SUCCESS++))
else
  warn "Review utilities domain may not be configured correctly"
fi

if grep -q "latiao-snack.com.ua/review" admin-site/index.html 2>/dev/null; then
  echo -e "${GREEN}✅${NC} Admin panel generates correct review URLs"
  ((SUCCESS++))
else
  warn "Admin panel may not generate correct review URLs"
fi
echo ""

echo "📱 FIRESTORE CONFIG"
echo "------------------"
if [ -f "admin-site/index.html" ]; then
  if grep -q "firebaseConfig\|apiKey" admin-site/index.html 2>/dev/null; then
    echo -e "${GREEN}✅${NC} Firebase configuration present in admin panel"
    ((SUCCESS++))
  fi
fi

if [ -f "public-site/review-personalized.html" ]; then
  if grep -q "firebaseConfig\|my-magazin-81c96" public-site/review-personalized.html 2>/dev/null; then
    echo -e "${GREEN}✅${NC} Firebase configuration present in review page"
    ((SUCCESS++))
  else
    echo -e "${RED}❌${NC} Firebase configuration missing in review page"
    ((ERRORS++))
  fi
fi
echo ""

echo "📋 FEATURES"
echo "-----------"
if grep -q "modal\|Modal\|backdrop" public-site/review-personalized.html 2>/dev/null; then
  echo -e "${GREEN}✅${NC} Modal window implementation present"
  ((SUCCESS++))
else
  echo -e "${RED}❌${NC} Modal window implementation missing"
  ((ERRORS++))
fi

if grep -q "star-rating\|rating" public-site/review-personalized.html 2>/dev/null; then
  echo -e "${GREEN}✅${NC} Star rating input present"
  ((SUCCESS++))
else
  echo -e "${RED}❌${NC} Star rating input missing"
  ((ERRORS++))
fi

if grep -q "review-photo\|photo\|upload" public-site/review-personalized.html 2>/dev/null; then
  echo -e "${GREEN}✅${NC} Photo upload feature present"
  ((SUCCESS++))
else
  echo -e "${RED}❌${NC} Photo upload feature missing"
  ((ERRORS++))
fi

if grep -q "products-list\|product-card" public-site/review-personalized.html 2>/dev/null; then
  echo -e "${GREEN}✅${NC} Product display in modal present"
  ((SUCCESS++))
else
  echo -e "${RED}❌${NC} Product display in modal missing"
  ((ERRORS++))
fi

if grep -q "validateReviewForm\|validation" public-site/js/review-system.js 2>/dev/null; then
  echo -e "${GREEN}✅${NC} Form validation function present"
  ((SUCCESS++))
else
  echo -e "${RED}❌${NC} Form validation function missing"
  ((ERRORS++))
fi
echo ""

echo "📊 SMS TEMPLATE SETUP"
echo "-------------------"
if grep -q "{review_link}" admin-site/index.html 2>/dev/null; then
  echo -e "${GREEN}✅${NC} Admin panel supports {review_link} template tag"
  ((SUCCESS++))
else
  warn "Admin panel may not support {review_link} template tag - verify SMS templates"
fi

if grep -q "{customer_name}\|{order_id}\|{product_list}" admin-site/index.html 2>/dev/null; then
  echo -e "${GREEN}✅${NC} Admin panel supports standard template tags"
  ((SUCCESS++))
else
  warn "Admin panel may not support standard template tags"
fi
echo ""

echo "🔄 URL ROUTING"
echo "--------------"
if [ -f "nginx.conf" ] || [ -f "/etc/nginx/sites-available/"* ] 2>/dev/null; then
  if grep -q "/review" nginx.conf 2>/dev/null || grep -q "/review" /etc/nginx/sites-available/* 2>/dev/null; then
    echo -e "${GREEN}✅${NC} URL routing configured for /review path"
    ((SUCCESS++))
  else
    warn "URL routing for /review path not found - configure in nginx/web server"
  fi
else
  warn "Nginx configuration not found - please verify /review route is configured"
fi
echo ""

echo "🧪 FUNCTION AVAILABILITY"
echo "----------------------"
if grep -q "ReviewSystem.generateReviewLink" public-site/js/review-system.js 2>/dev/null; then
  echo -e "${GREEN}✅${NC} ReviewSystem.generateReviewLink() available"
  ((SUCCESS++))
fi

if grep -q "ReviewSystem.validateReviewForm" public-site/js/review-system.js 2>/dev/null; then
  echo -e "${GREEN}✅${NC} ReviewSystem.validateReviewForm() available"
  ((SUCCESS++))
fi

if grep -q "ReviewSystem.replaceSmsTemplateTags" public-site/js/review-system.js 2>/dev/null; then
  echo -e "${GREEN}✅${NC} ReviewSystem.replaceSmsTemplateTags() available"
  ((SUCCESS++))
fi

if grep -q "ReviewSystem.isOrderEligibleForReview" public-site/js/review-system.js 2>/dev/null; then
  echo -e "${GREEN}✅${NC} ReviewSystem.isOrderEligibleForReview() available"
  ((SUCCESS++))
fi
echo ""

echo "========================================================"
echo "📊 SUMMARY"
echo "========================================================"
echo -e "${GREEN}✅ Passed:${NC} $SUCCESS"
if [ $WARNINGS -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Warnings:${NC} $WARNINGS"
fi
if [ $ERRORS -gt 0 ]; then
  echo -e "${RED}❌ Errors:${NC} $ERRORS"
fi
echo ""

if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}✅ SYSTEM IS READY TO DEPLOY!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Configure /review URL route in your web server (nginx/apache)"
  echo "2. Verify Firestore rules allow public reads on orders collection"
  echo "3. Add SMS templates with {review_link} tag in Admin Panel"
  echo "4. Test with a real order: https://latiao-snack.com.ua/review?orderId=TEST_ID"
  echo ""
  exit 0
else
  echo -e "${RED}❌ PLEASE FIX ERRORS ABOVE BEFORE DEPLOYMENT${NC}"
  echo ""
  echo "See REVIEW_SYSTEM_COMPLETE.md for detailed setup instructions"
  echo ""
  exit 1
fi
