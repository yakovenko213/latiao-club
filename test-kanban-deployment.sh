#!/bin/bash

# CRM Kanban Deployment Test Script
# Tests the new Kanban board implementation

echo "🎯 CRM Kanban Board - Deployment Test"
echo "========================================"
echo ""

# Check if files exist
echo "📂 Checking files..."

if [ -f "admin-site/index.html" ]; then
  echo "✅ admin-site/index.html found"
else
  echo "❌ admin-site/index.html NOT FOUND"
  exit 1
fi

if [ -f "admin-site/js/admin.js" ]; then
  echo "✅ admin-site/js/admin.js found"
else
  echo "❌ admin-site/js/admin.js NOT FOUND"
  exit 1
fi

echo ""
echo "🔍 Verifying HTML structure..."

# Check for Kanban view tabs
if grep -q "tab-kanban-view" admin-site/index.html; then
  echo "✅ Kanban tab found"
else
  echo "❌ Kanban tab NOT found"
  exit 1
fi

# Check for Kanban columns
if grep -q "kanban-column-new" admin-site/index.html; then
  echo "✅ Kanban column 'new' found"
else
  echo "❌ Kanban column 'new' NOT found"
  exit 1
fi

if grep -q "kanban-column-contacted" admin-site/index.html; then
  echo "✅ Kanban column 'contacted' found"
else
  echo "❌ Kanban column 'contacted' NOT found"
  exit 1
fi

if grep -q "kanban-column-in-progress" admin-site/index.html; then
  echo "✅ Kanban column 'in-progress' found"
else
  echo "❌ Kanban column 'in-progress' NOT found"
  exit 1
fi

if grep -q "kanban-column-completed" admin-site/index.html; then
  echo "✅ Kanban column 'completed' found"
else
  echo "❌ Kanban column 'completed' NOT found"
  exit 1
fi

# Check for stats bar
if grep -q "kanban-stat-new" admin-site/index.html; then
  echo "✅ Stats bar found"
else
  echo "❌ Stats bar NOT found"
  exit 1
fi

echo ""
echo "🔍 Verifying JavaScript functions..."

# Check for Kanban functions
if grep -q "switchAbandonedCartsView" admin-site/js/admin.js; then
  echo "✅ switchAbandonedCartsView() found"
else
  echo "❌ switchAbandonedCartsView() NOT found"
  exit 1
fi

if grep -q "initializeKanban" admin-site/js/admin.js; then
  echo "✅ initializeKanban() found"
else
  echo "❌ initializeKanban() NOT found"
  exit 1
fi

if grep -q "renderKanbanCards" admin-site/js/admin.js; then
  echo "✅ renderKanbanCards() found"
else
  echo "❌ renderKanbanCards() NOT found"
  exit 1
fi

if grep -q "createKanbanCard" admin-site/js/admin.js; then
  echo "✅ createKanbanCard() found"
else
  echo "❌ createKanbanCard() NOT found"
  exit 1
fi

if grep -q "initializeKanbanDragDrop" admin-site/js/admin.js; then
  echo "✅ initializeKanbanDragDrop() found"
else
  echo "❌ initializeKanbanDragDrop() NOT found"
  exit 1
fi

# Check for onSnapshot usage
if grep -q "onSnapshot" admin-site/js/admin.js; then
  echo "✅ Real-time listener (onSnapshot) found"
else
  echo "❌ Real-time listener (onSnapshot) NOT found"
  exit 1
fi

# Check for SortableJS
if grep -q "new Sortable" admin-site/js/admin.js; then
  echo "✅ SortableJS initialization found"
else
  echo "❌ SortableJS initialization NOT found"
  exit 1
fi

# Check for crm_status field
if grep -q "crm_status" admin-site/js/admin.js; then
  echo "✅ Firestore crm_status field usage found"
else
  echo "❌ Firestore crm_status field NOT found"
  exit 1
fi

echo ""
echo "🔍 Verifying SortableJS library..."

# Check if SortableJS is loaded in HTML
if grep -q "sortablejs" admin-site/index.html; then
  echo "✅ SortableJS CDN link found"
else
  echo "❌ SortableJS CDN link NOT found"
  exit 1
fi

echo ""
echo "🔍 Checking CSS styles..."

# Check for Kanban card styles
if grep -q "kanban-card" admin-site/index.html; then
  echo "✅ Kanban card CSS found"
else
  echo "❌ Kanban card CSS NOT found"
  exit 1
fi

# Check for sortable ghost styles
if grep -q "sortable-ghost" admin-site/index.html; then
  echo "✅ SortableJS ghost CSS found"
else
  echo "❌ SortableJS ghost CSS NOT found"
  exit 1
fi

echo ""
echo "✅ All checks passed!"
echo ""
echo "🚀 Ready to deploy CRM Kanban Board"
echo ""
echo "📋 Manual Testing Checklist:"
echo "  1. Open Admin Panel → Abandoned Carts"
echo "  2. Click '🎯 CRM Tracking' tab"
echo "  3. Verify 4 columns appear"
echo "  4. Check stats bar shows counts"
echo "  5. Try dragging a card between columns"
echo "  6. Verify toast notification appears"
echo "  7. Check Firestore crm_status field updated"
echo "  8. Open 2 browser tabs, verify real-time sync"
echo ""
echo "📚 Documentation: CRM_KANBAN_QUICKSTART.md"
echo ""
