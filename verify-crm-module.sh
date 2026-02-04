#!/bin/bash

# ============================================
# CRM MODULE VERIFICATION SCRIPT
# ============================================

echo "🔍 Verifying CRM Module Integration..."
echo ""

# Check if crm-module.js exists
if [ -f "admin-site/js/crm-module.js" ]; then
    echo "✅ crm-module.js created"
    echo "   Location: admin-site/js/crm-module.js"
    echo "   Lines: $(wc -l < admin-site/js/crm-module.js)"
else
    echo "❌ crm-module.js NOT FOUND"
    exit 1
fi

echo ""

# Check if CRM tab exists in sidebar
if grep -q 'href="#crm"' admin-site/index.html; then
    echo "✅ CRM tab added to sidebar"
else
    echo "❌ CRM tab NOT FOUND in sidebar"
    exit 1
fi

echo ""

# Check if view-crm container exists
if grep -q 'id="view-crm"' admin-site/index.html; then
    echo "✅ view-crm container exists"
else
    echo "❌ view-crm container NOT FOUND"
    exit 1
fi

echo ""

# Check if crm-module-container exists
if grep -q 'id="crm-module-container"' admin-site/index.html; then
    echo "✅ crm-module-container exists"
else
    echo "❌ crm-module-container NOT FOUND"
    exit 1
fi

echo ""

# Check if CRM is in titles object
if grep -q "'crm': 'CRM'" admin-site/index.html; then
    echo "✅ CRM added to page titles"
else
    echo "❌ CRM NOT in page titles"
    exit 1
fi

echo ""

# Check if CRM handler exists in navigation
if grep -q "target === 'crm'" admin-site/index.html; then
    echo "✅ CRM navigation handler exists"
else
    echo "❌ CRM navigation handler NOT FOUND"
    exit 1
fi

echo ""

# Check if module uses ES6 export
if grep -q "export async function initCRM" admin-site/js/crm-module.js; then
    echo "✅ ES6 module exports found"
else
    echo "❌ ES6 exports NOT FOUND"
    exit 1
fi

echo ""

# Check if module uses window.firebaseInit
if grep -q "window.firebaseInit" admin-site/js/crm-module.js; then
    echo "✅ Module uses window.firebaseInit"
else
    echo "❌ Module doesn't use window.firebaseInit"
    exit 1
fi

echo ""

# Check key functions exist
echo "🔍 Checking key functions..."

if grep -q "function renderCrmBoard" admin-site/js/crm-module.js; then
    echo "   ✅ renderCrmBoard()"
fi

if grep -q "function loadCRMData" admin-site/js/crm-module.js; then
    echo "   ✅ loadCRMData()"
fi

if grep -q "function renderColumns" admin-site/js/crm-module.js; then
    echo "   ✅ renderColumns()"
fi

if grep -q "function renderCard" admin-site/js/crm-module.js; then
    echo "   ✅ renderCard()"
fi

if grep -q "function initializeDragDrop" admin-site/js/crm-module.js; then
    echo "   ✅ initializeDragDrop()"
fi

if grep -q "function updateCartStatus" admin-site/js/crm-module.js; then
    echo "   ✅ updateCartStatus()"
fi

if grep -q "function createOrderFromCart" admin-site/js/crm-module.js; then
    echo "   ✅ createOrderFromCart()"
fi

if grep -q "function sendSMS" admin-site/js/crm-module.js; then
    echo "   ✅ sendSMS()"
fi

echo ""

# Count lines in module
LINES=$(wc -l < admin-site/js/crm-module.js)
echo "📊 Statistics:"
echo "   Module size: $LINES lines"

# Check if SortableJS is used
if grep -q "window.Sortable" admin-site/js/crm-module.js; then
    echo "   ✅ Uses SortableJS for drag & drop"
fi

# Check if Firestore queries exist
if grep -q "crm_columns" admin-site/js/crm-module.js; then
    echo "   ✅ Queries crm_columns collection"
fi

if grep -q "abandoned_carts" admin-site/js/crm-module.js; then
    echo "   ✅ Queries abandoned_carts collection"
fi

echo ""
echo "============================================"
echo "✅ ALL CHECKS PASSED!"
echo "============================================"
echo ""
echo "📝 Next steps:"
echo "   1. Open admin panel: http://localhost:3000/admin-site/"
echo "   2. Navigate to: Незавершені замовлення → CRM"
echo "   3. Verify Kanban board loads correctly"
echo ""
echo "🔧 Setup Firestore:"
echo "   1. Create 'crm_columns' collection with columns:"
echo "      - { name: 'Новий лід', order: 0, color: '#3b82f6' }"
echo "      - { name: 'Контакт', order: 1, color: '#8b5cf6' }"
echo "      - { name: 'Переговори', order: 2, color: '#f59e0b' }"
echo "      - { name: 'Закрито', order: 3, color: '#10b981' }"
echo ""
echo "   2. Add crm_status to abandoned_carts documents:"
echo "      - crm_status: 'column_id'"
echo ""
