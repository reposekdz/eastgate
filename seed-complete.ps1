Write-Host "🌱 EastGate Hotel - Complete Database Seed" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  node_modules not found. Running npm install..." -ForegroundColor Yellow
    npm install
}

# Run the complete seed
Write-Host "🔄 Running complete database seed..." -ForegroundColor Cyan
npx tsx prisma/seed-complete.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Database seeded successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 You can now login with any of the test accounts" -ForegroundColor Cyan
    Write-Host "   Run: npm run dev" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Seed failed. Check the error above." -ForegroundColor Red
    Write-Host ""
}

Read-Host "Press Enter to exit"
