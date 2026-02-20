# =====================================
# Deploy Analytics Fix to Production
# =====================================

Write-Host "`n🚀 DEPLOYING ANALYTICS FIX TO PRODUCTION" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Deploy Firestore Rules
Write-Host "📋 Step 1: Deploying Firestore Rules..." -ForegroundColor Yellow
firebase deploy --only firestore:rules
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Firestore rules deployment failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Firestore rules deployed`n" -ForegroundColor Green

# Step 2: Deploy Admin Panel (Hosting)
Write-Host "📋 Step 2: Deploying Admin Panel..." -ForegroundColor Yellow
firebase deploy --only hosting:admin-store-latio
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Admin panel deployment failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Admin panel deployed`n" -ForegroundColor Green

# Step 3: Deploy Public Site (if changes were made to firebase-init.js)
Write-Host "📋 Step 3: Deploying Public Site..." -ForegroundColor Yellow
firebase deploy --only hosting:store-latio
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Public site deployment failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Public site deployed`n" -ForegroundColor Green

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🎉 DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Open your admin panel in browser"
Write-Host "2. Open DevTools (F12) and check Console"
Write-Host "3. Navigate to '❤️ Обране клієнтів' section"
Write-Host "4. Look for production mode confirmation and analytics data"
Write-Host "`n💡 If you see 'No data', add products to favorites on public site`n"

Write-Host "🔗 URLs:" -ForegroundColor Cyan
Write-Host "Admin Panel: https://admin.latiao.club (or your admin domain)"
Write-Host "Public Site: https://latiao.club (or your public domain)"
Write-Host "`n"
