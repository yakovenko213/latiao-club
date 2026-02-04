#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# 🔒 FIREBASE SECURITY - CODE OBFUSCATION BUILD SCRIPT
# ═══════════════════════════════════════════════════════════════════════
# 
# This script minifies and obfuscates JavaScript files to make them
# harder to read and reverse engineer.
# 
# USAGE:
#   1. Install Terser: npm install --save-dev terser
#   2. Make executable: chmod +x build-obfuscate.sh
#   3. Run before deploy: ./build-obfuscate.sh
#   4. Deploy: firebase deploy --only hosting
# 
# SECURITY BENEFITS:
#   - Reduces file size by ~70%
#   - Obfuscates variable and function names
#   - Makes code harder to read and steal
#   - Removes comments and whitespace
# 
# ⚠️  WARNING: This does NOT make your API keys secret!
#    Real security comes from domain restrictions and App Check.
#    See FIREBASE_SECURITY_COMPLETE_GUIDE.md for full setup.
# 
# @version 1.0.0
# @created 2026-02-04
# ═══════════════════════════════════════════════════════════════════════

set -e  # Exit on error

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🔒 FIREBASE SECURITY - CODE OBFUSCATION                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# ═══════════════════════════════════════════════════════════════════
# 🔍 CHECK DEPENDENCIES
# ═══════════════════════════════════════════════════════════════════

if ! command -v npx &> /dev/null; then
    echo "❌ Error: Node.js and npm are required"
    echo "   Install from: https://nodejs.org/"
    exit 1
fi

if ! npm list terser &> /dev/null; then
    echo "⚠️  Terser not found. Installing..."
    npm install --save-dev terser
fi

# ═══════════════════════════════════════════════════════════════════
# 📁 SETUP DIRECTORIES
# ═══════════════════════════════════════════════════════════════════

echo "📁 Creating output directories..."
mkdir -p public-site/dist/js
echo "   ✅ public-site/dist/js/"

# ═══════════════════════════════════════════════════════════════════
# 🔨 OBFUSCATION SETTINGS
# ═══════════════════════════════════════════════════════════════════

TERSER_OPTIONS="--compress --mangle --module"

# Compression options:
# --compress: Remove dead code, optimize expressions
# --mangle: Shorten variable/function names (a,b,c instead of descriptive names)
# --module: Support ES6 modules (import/export)

# ═══════════════════════════════════════════════════════════════════
# 🔒 OBFUSCATE CRITICAL FILES
# ═══════════════════════════════════════════════════════════════════

echo ""
echo "🔒 Obfuscating JavaScript files..."
echo ""

# Counter for stats
total_files=0
total_original_size=0
total_minified_size=0

# Function to obfuscate a file
obfuscate_file() {
    local input=$1
    local output=$2
    
    if [ ! -f "$input" ]; then
        echo "   ⚠️  Skipping $input (not found)"
        return
    fi
    
    # Get original size
    original_size=$(wc -c < "$input")
    
    # Obfuscate
    npx terser "$input" $TERSER_OPTIONS --output "$output" 2>/dev/null
    
    # Get minified size
    minified_size=$(wc -c < "$output")
    
    # Calculate reduction
    reduction=$((100 - (minified_size * 100 / original_size)))
    
    # Update totals
    ((total_files++))
    total_original_size=$((total_original_size + original_size))
    total_minified_size=$((total_minified_size + minified_size))
    
    # Format sizes for display
    original_kb=$(echo "scale=1; $original_size / 1024" | bc)
    minified_kb=$(echo "scale=1; $minified_size / 1024" | bc)
    
    echo "   ✅ $(basename $input)"
    echo "      ${original_kb}KB → ${minified_kb}KB (-${reduction}%)"
}

# ═══════════════════════════════════════════════════════════════════
# 🔥 FIREBASE CONFIGURATION FILES (PRIORITY 1 - HIGHEST SECURITY)
# ═══════════════════════════════════════════════════════════════════

echo "🔥 Priority 1: Firebase Configuration"
obfuscate_file "public-site/js/firebase-config.js" "public-site/dist/js/firebase-config.min.js"
obfuscate_file "public-site/js/firebase-init.js" "public-site/dist/js/firebase-init.min.js"

# ═══════════════════════════════════════════════════════════════════
# 💬 CHAT & COMMUNICATION (PRIORITY 2)
# ═══════════════════════════════════════════════════════════════════

echo ""
echo "💬 Priority 2: Chat & Communication"
obfuscate_file "public-site/js/chat-widget.js" "public-site/dist/js/chat-widget.min.js"

# ═══════════════════════════════════════════════════════════════════
# 🛒 CHECKOUT & PAYMENT (PRIORITY 3)
# ═══════════════════════════════════════════════════════════════════

echo ""
echo "🛒 Priority 3: Checkout & Payment"
obfuscate_file "public-site/js/checkout.js" "public-site/dist/js/checkout.min.js"
obfuscate_file "public-site/js/cart.js" "public-site/dist/js/cart.min.js"

# ═══════════════════════════════════════════════════════════════════
# 📦 PRODUCT & CATALOG (PRIORITY 4)
# ═══════════════════════════════════════════════════════════════════

echo ""
echo "📦 Priority 4: Product & Catalog"
obfuscate_file "public-site/js/category.js" "public-site/dist/js/category.min.js"
obfuscate_file "public-site/js/product.js" "public-site/dist/js/product.min.js"
obfuscate_file "public-site/js/product-cache-manager.js" "public-site/dist/js/product-cache-manager.min.js"

# ═══════════════════════════════════════════════════════════════════
# 🎨 UI & LAYOUT (PRIORITY 5)
# ═══════════════════════════════════════════════════════════════════

echo ""
echo "🎨 Priority 5: UI & Layout"
obfuscate_file "public-site/js/layout.js" "public-site/dist/js/layout.min.js"
obfuscate_file "public-site/js/maintenance-check.js" "public-site/dist/js/maintenance-check.min.js"

# ═══════════════════════════════════════════════════════════════════
# 📊 STATISTICS
# ═══════════════════════════════════════════════════════════════════

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  📊 OBFUSCATION STATISTICS                                ║"
echo "╚════════════════════════════════════════════════════════════╝"

# Calculate totals
total_reduction=$((100 - (total_minified_size * 100 / total_original_size)))
total_original_kb=$(echo "scale=1; $total_original_size / 1024" | bc)
total_minified_kb=$(echo "scale=1; $total_minified_size / 1024" | bc)
total_saved_kb=$(echo "scale=1; ($total_original_size - $total_minified_size) / 1024" | bc)

echo ""
echo "   Files processed:    $total_files"
echo "   Original size:      ${total_original_kb} KB"
echo "   Minified size:      ${total_minified_kb} KB"
echo "   Size reduction:     ${total_saved_kb} KB (-${total_reduction}%)"
echo ""

# ═══════════════════════════════════════════════════════════════════
# ⚠️  IMPORTANT REMINDERS
# ═══════════════════════════════════════════════════════════════════

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  ⚠️  NEXT STEPS                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "   1. ⚠️  Update HTML files to use .min.js versions"
echo "      Example: <script src=\"./dist/js/firebase-config.min.js\">"
echo ""
echo "   2. ⚠️  Set up domain restrictions in Google Cloud Console"
echo "      See: FIREBASE_SECURITY_COMPLETE_GUIDE.md (Task 1)"
echo ""
echo "   3. ⚠️  Enable Firebase App Check"
echo "      See: FIREBASE_SECURITY_COMPLETE_GUIDE.md (Task 2)"
echo ""
echo "   4. ✅ Deploy to Firebase Hosting"
echo "      Command: firebase deploy --only hosting"
echo ""

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  ✅ OBFUSCATION COMPLETE!                                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
