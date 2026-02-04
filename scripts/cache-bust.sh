#!/bin/bash
# ===========================================
# Cache Busting Script for Latiao Snack
# ===========================================
# This script automatically updates version numbers
# in HTML files before deployment to force browser cache refresh
# ===========================================

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Cache Busting Script Started${NC}"
echo ""

# Generate timestamp version (milliseconds since epoch)
VERSION=$(date +%s%3N)
DATE_VERSION=$(date +%Y%m%d-%H%M%S)

echo -e "${YELLOW}📅 Version: ${VERSION}${NC}"
echo -e "${YELLOW}📅 Date Version: ${DATE_VERSION}${NC}"
echo ""

# ===========================================
# Function to update version in HTML files
# ===========================================
update_versions() {
    local file=$1
    local temp_file="${file}.tmp"
    
    echo -e "${BLUE}  Processing: ${file}${NC}"
    
    # Use sed to replace version parameters
    # Matches patterns like ?v=123456 or ?v=3010 and replaces with new version
    sed -E "s/(\.(js|css))\?v=[0-9]+/\1?v=${VERSION}/g" "$file" > "$temp_file"
    
    # Replace the original file
    mv "$temp_file" "$file"
    
    echo -e "${GREEN}  ✅ Updated: ${file}${NC}"
}

# ===========================================
# Function to update cache-clear.js version
# ===========================================
update_cache_clear() {
    local file=$1
    local temp_file="${file}.tmp"
    
    if [ -f "$file" ]; then
        echo -e "${BLUE}  Processing: ${file}${NC}"
        
        # Replace CURRENT_VERSION value (both %VERSION% placeholder and existing version)
        sed -E "s/(const CURRENT_VERSION = ')[^']+(')/\1${VERSION}\2/g" "$file" > "$temp_file"
        mv "$temp_file" "$file"
        
        echo -e "${GREEN}  ✅ Updated: ${file}${NC}"
    fi
}

# ===========================================
# Update PUBLIC SITE files
# ===========================================
echo -e "${BLUE}📦 Updating PUBLIC SITE (latiao-snack.com.ua)${NC}"
echo ""

PUBLIC_HTML_FILES=(
    "public-site/index.html"
    "public-site/product.html"
    "public-site/dashboard.html"
    "public-site/checkout.html"
    "public-site/cart.html"
    "public-site/auth.html"
)

for file in "${PUBLIC_HTML_FILES[@]}"; do
    if [ -f "$file" ]; then
        update_versions "$file"
    else
        echo -e "${YELLOW}  ⚠️  File not found: ${file}${NC}"
    fi
done

echo ""

# ===========================================
# Update ADMIN SITE files
# ===========================================
echo -e "${BLUE}📦 Updating ADMIN SITE (office-connect.latiao-snack.com.ua)${NC}"
echo ""

ADMIN_HTML_FILES=(
    "admin-site/index.html"
)

for file in "${ADMIN_HTML_FILES[@]}"; do
    if [ -f "$file" ]; then
        update_versions "$file"
    else
        echo -e "${YELLOW}  ⚠️  File not found: ${file}${NC}"
    fi
done

echo ""

# ===========================================
# Update cache-clear.js files
# ===========================================
echo -e "${BLUE}🔄 Updating cache-clear.js files${NC}"
echo ""

update_cache_clear "public-site/js/cache-clear.js"
update_cache_clear "admin-site/js/cache-clear.js"

echo ""

# ===========================================
# Create version info file
# ===========================================
echo -e "${BLUE}📝 Creating version info file${NC}"

cat > public-site/version.json << EOF
{
  "version": "${VERSION}",
  "date": "${DATE_VERSION}",
  "deployed": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "commit": "$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
}
EOF

cat > admin-site/version.json << EOF
{
  "version": "${VERSION}",
  "date": "${DATE_VERSION}",
  "deployed": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "commit": "$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
}
EOF

echo -e "${GREEN}✅ Version files created${NC}"
echo ""

# ===========================================
# Summary
# ===========================================
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Cache Busting Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${YELLOW}Version: ${VERSION}${NC}"
echo -e "${YELLOW}Ready for deployment with: firebase deploy${NC}"
echo ""
