#!/bin/bash
# ===========================================
# Add cache-clear.js to all HTML files
# ===========================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}📦 Adding cache-clear.js to HTML files${NC}"
echo ""

# Public site main pages
PUBLIC_FILES=(
    "public-site/product.html"
    "public-site/cart.html"
    "public-site/checkout.html"
    "public-site/auth.html"
    "public-site/thank-you.html"
)

for file in "${PUBLIC_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${YELLOW}⚠️  Skipping (not found): $file${NC}"
        continue
    fi
    
    # Check if already has cache-clear.js
    if grep -q "cache-clear.js" "$file"; then
        echo -e "${BLUE}✓ Already has cache-clear.js: $file${NC}"
        continue
    fi
    
    echo -e "${YELLOW}Processing: $file${NC}"
    
    # Find first </head> tag and insert before it
    # Create temp file with insertion
    awk '
    /<\/head>/ && !inserted {
        print "  <!-- Force Cache Clear - CRITICAL: Must be FIRST! -->"
        print "  <script src=\"./js/cache-clear.js?v=0\"></script>"
        print "  "
        inserted = 1
    }
    { print }
    ' "$file" > "${file}.tmp"
    
    mv "${file}.tmp" "$file"
    
    echo -e "${GREEN}✅ Added cache-clear.js to: $file${NC}"
done

echo ""
echo -e "${GREEN}🎉 Done!${NC}"
echo -e "${YELLOW}Now run: bash scripts/cache-bust.sh${NC}"
