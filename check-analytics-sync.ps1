# =====================================
# Analytics Sync - Pre-Deployment Check
# =====================================

Write-Host "`n🔍 ANALYTICS SYNC - PRE-DEPLOYMENT CHECK" -ForegroundColor Cyan
Write-Host "=========================================`n" -ForegroundColor Cyan

$allChecks = @()

# Check 1: Files exist
Write-Host "📋 Checking file modifications..." -ForegroundColor Yellow
$files = @(
    "public-site/index.html",
    "public-site/category.html",
    "public-site/product.html"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        if ($content -match "\u2764\ufe0f Heart clicked for ID") {
            Write-Host "  ✅ $file - Debug logging added" -ForegroundColor Green
            $allChecks += $true
        } else {
            Write-Host "  ❌ $file - Debug logging NOT found" -ForegroundColor Red
            $allChecks += $false
        }
        
        if ($content -match "async \(\) => \{[\s\S]*?analytics_favorites") {
            Write-Host "  ✅ $file - Immediate sync code found" -ForegroundColor Green
            $allChecks += $true
        } else {
            Write-Host "  ❌ $file - Immediate sync code NOT found" -ForegroundColor Red
            $allChecks += $false
        }
    } else {
        Write-Host "  ❌ $file - File not found!" -ForegroundColor Red
        $allChecks += $false
    }
}

# Check 2: Firebase rules
Write-Host "`n📋 Checking Firestore rules..." -ForegroundColor Yellow
if (Test-Path "firestore.rules") {
    $rules = Get-Content "firestore.rules" -Raw
    if ($rules -match "analytics_favorites.*\{[^}]*allow read, write: if true") {
        Write-Host "  ✅ analytics_favorites rules found" -ForegroundColor Green
        $allChecks += $true
    } else {
        Write-Host "  ⚠️  analytics_favorites rules may need verification" -ForegroundColor Yellow
        $allChecks += $false
    }
} else {
    Write-Host "  ❌ firestore.rules not found" -ForegroundColor Red
    $allChecks += $false
}

# Check 3: Firebase imports in category.html
Write-Host "`n📋 Checking Firebase imports..." -ForegroundColor Yellow
$categoryHtml = Get-Content "public-site/category.html" -Raw
if ($categoryHtml -match "import.*doc.*setDoc.*increment.*serverTimestamp") {
    Write-Host "  ✅ category.html - All Firebase functions imported" -ForegroundColor Green
    $allChecks += $true
} else {
    Write-Host "  ❌ category.html - Missing Firebase imports" -ForegroundColor Red
    $allChecks += $false
}

$productHtml = Get-Content "public-site/product.html" -Raw
if ($productHtml -match "import.*doc.*setDoc.*increment.*serverTimestamp") {
    Write-Host "  ✅ product.html - All Firebase functions imported" -ForegroundColor Green
    $allChecks += $true
} else {
    Write-Host "  ❌ product.html - Missing Firebase imports" -ForegroundColor Red
    $allChecks += $false
}

# Summary
Write-Host "`n=========================================`n" -ForegroundColor Cyan
$passedChecks = ($allChecks | Where-Object { $_ -eq $true }).Count
$totalChecks = $allChecks.Count

if ($passedChecks -eq $totalChecks) {
    Write-Host "✅ ALL CHECKS PASSED ($passedChecks/$totalChecks)" -ForegroundColor Green
    Write-Host "`n🚀 Ready to deploy!`n" -ForegroundColor Green
    Write-Host "Run: " -NoNewline
    Write-Host "firebase deploy --only hosting" -ForegroundColor Yellow
} else {
    Write-Host "⚠️  SOME CHECKS FAILED ($passedChecks/$totalChecks)" -ForegroundColor Yellow
    Write-Host "`n📝 Review the failed checks above before deploying.`n" -ForegroundColor Yellow
}

Write-Host "`n📚 For detailed testing instructions, see:" -ForegroundColor Cyan
Write-Host "   ANALYTICS_SYNC_TESTING.md`n" -ForegroundColor White
