# =====================================
# Favorites Analytics Diagnostic Tool
# =====================================

Write-Host "`n🔍 FAVORITES ANALYTICS DIAGNOSTICS" -ForegroundColor Cyan
Write-Host "====================================`n" -ForegroundColor Cyan

# Install Firebase CLI if not present
$firebaseCli = Get-Command firebase -ErrorAction SilentlyContinue
if (-not $firebaseCli) {
    Write-Host "❌ Firebase CLI not found. Install with: npm install -g firebase-tools" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Firebase CLI found: $($firebaseCli.Version)" -ForegroundColor Green

# Check Firebase project
Write-Host "`n📋 Checking Firebase Project..." -ForegroundColor Yellow
$projectInfo = firebase projects:list 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Connected to Firebase" -ForegroundColor Green
} else {
    Write-Host "❌ Not logged in to Firebase" -ForegroundColor Red
    Write-Host "Run: firebase login" -ForegroundColor Yellow
    exit 1
}

# Check current project
Write-Host "`n📋 Current Project:" -ForegroundColor Yellow
firebase use

# Check Firestore rules
Write-Host "`n📋 Checking Firestore Rules..." -ForegroundColor Yellow
if (Test-Path "firestore.rules") {
    $rules = Get-Content "firestore.rules" -Raw
    if ($rules -match "analytics_favorites.*\{[^}]*allow read, write: if true") {
        Write-Host "✅ Firestore rules look correct for analytics_favorites" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Firestore rules may need updating" -ForegroundColor Yellow
        Write-Host "Expected: allow read, write: if true;" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ firestore.rules not found in current directory" -ForegroundColor Red
}

# Check hosting config
Write-Host "`n📋 Checking Firebase Hosting Config..." -ForegroundColor Yellow
if (Test-Path "firebase.json") {
    $config = Get-Content "firebase.json" -Raw | ConvertFrom-Json
    $adminSite = $config.hosting | Where-Object { $_.site -eq "admin-store-latio" }
    $publicSite = $config.hosting | Where-Object { $_.site -eq "store-latio" }
    
    if ($adminSite) {
        Write-Host "✅ Admin site configured: admin-store-latio → $($adminSite.public)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Admin site not found in firebase.json" -ForegroundColor Yellow
    }
    
    if ($publicSite) {
        Write-Host "✅ Public site configured: store-latio → $($publicSite.public)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Public site not found in firebase.json" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ firebase.json not found in current directory" -ForegroundColor Red
}

# Check admin panel file
Write-Host "`n📋 Checking Admin Panel Files..." -ForegroundColor Yellow
if (Test-Path "admin-site/index.html") {
    $adminHtml = Get-Content "admin-site/index.html" -Raw
    if ($adminHtml -match "loadFavoritesAnalytics") {
        Write-Host "✅ loadFavoritesAnalytics function found" -ForegroundColor Green
    } else {
        Write-Host "❌ loadFavoritesAnalytics function not found" -ForegroundColor Red
    }
    
    if ($adminHtml -match "onSnapshot.*analytics_favorites") {
        Write-Host "✅ Real-time listener (onSnapshot) found" -ForegroundColor Green
    } else {
        Write-Host "❌ onSnapshot listener not found" -ForegroundColor Red
    }
} else {
    Write-Host "❌ admin-site/index.html not found" -ForegroundColor Red
}

# Check public site tracking
Write-Host "`n📋 Checking Public Site Tracking..." -ForegroundColor Yellow
$trackingFiles = @("public-site/index.html", "public-site/category.html", "public-site/product.html")
$trackingFound = 0
foreach ($file in $trackingFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        if ($content -match "trackFavoriteAnalytics|trackProductFavoriteAnalytics") {
            Write-Host "✅ Tracking function found in $file" -ForegroundColor Green
            $trackingFound++
        } else {
            Write-Host "⚠️  Tracking function not found in $file" -ForegroundColor Yellow
        }
    }
}

if ($trackingFound -eq 3) {
    Write-Host "✅ All tracking functions present" -ForegroundColor Green
} else {
    Write-Host "⚠️  Some tracking functions missing ($trackingFound/3)" -ForegroundColor Yellow
}

# Summary
Write-Host "`n====================================`n" -ForegroundColor Cyan
Write-Host "📊 DIAGNOSTIC SUMMARY" -ForegroundColor Cyan
Write-Host "====================================`n" -ForegroundColor Cyan

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Run: ./deploy-analytics-fix.ps1"
Write-Host "2. Open admin panel in browser"
Write-Host "3. Open DevTools (F12) → Console"
Write-Host "4. Navigate to '❤️ Обране клієнтів'"
Write-Host "5. Check console for detailed logs"
Write-Host "`n"

Write-Host "If you see errors:" -ForegroundColor Yellow
Write-Host "• Permission denied → Run: firebase deploy --only firestore:rules"
Write-Host "• Index required → Click link in console to create index"
Write-Host "• No data → Add favorites on public site to test"
Write-Host "`n"
