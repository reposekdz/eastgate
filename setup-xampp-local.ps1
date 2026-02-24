# Eastgate Hotel Management System - XAMPP Local Setup Script
# Run this script to set up the database locally with XAMPP MySQL

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Eastgate - XAMPP Local Database Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check for npm/node
Write-Host "[1/6] Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>&1
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js is not installed" -ForegroundColor Red
    exit 1
}

# Check for XAMPP MySQL
Write-Host ""
Write-Host "[2/6] Checking XAMPP MySQL..." -ForegroundColor Yellow

$mysqlPath = $null
$possiblePaths = @(
    "C:\xampp\mysql\bin\mysql.exe",
    "C:\xampp\mysql\bin\mysql",
    "C:\xampp\1.8.3\mysql\bin\mysql.exe",
    "C:\Program Files\xampp\mysql\bin\mysql.exe"
)

foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $mysqlPath = $path
        break
    }
}

if ($null -eq $mysqlPath) {
    Write-Host "WARNING: Could not find XAMPP MySQL. Attempting anyway..." -ForegroundColor Yellow
} else {
    Write-Host "Found MySQL at: $mysqlPath" -ForegroundColor Green
    
    # Try to connect
    $testConn = & $mysqlPath -u root -e "SELECT 1;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SUCCESS: Connected to MySQL!" -ForegroundColor Green
        
        # Create database
        Write-Host ""
        Write-Host "[3/6] Creating database 'eastgate'..." -ForegroundColor Yellow
        & $mysqlPath -u root -e "CREATE DATABASE IF NOT EXISTS eastgate CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "SUCCESS: Database created!" -ForegroundColor Green
        }
    } else {
        Write-Host "WARNING: Could not connect to MySQL. Please ensure XAMPP MySQL is running." -ForegroundColor Yellow
        Write-Host "Start XAMPP Control Panel and click Start on MySQL." -ForegroundColor Yellow
    }
}

# Install dependencies if needed
Write-Host ""
Write-Host "[4/6] Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: npm install failed" -ForegroundColor Red
    exit 1
}
Write-Host "SUCCESS: Dependencies installed!" -ForegroundColor Green

# Generate Prisma Client
Write-Host ""
Write-Host "[5/6] Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Prisma generate had issues, continuing..." -ForegroundColor Yellow
} else {
    Write-Host "SUCCESS: Prisma Client generated!" -ForegroundColor Green
}

# Run migration
Write-Host ""
Write-Host "[6/6] Running database migration..." -ForegroundColor Yellow
npx prisma db push --force-reset
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Migration had issues" -ForegroundColor Yellow
} else {
    Write-Host "SUCCESS: Database tables created!" -ForegroundColor Green
}

# Seed database
Write-Host ""
Write-Host "Seeding database..." -ForegroundColor Yellow
npx tsx prisma/seed.ts
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Seeding had issues" -ForegroundColor Yellow
} else {
    Write-Host "SUCCESS: Database seeded!" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SETUP COMPLETE!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start the application, run:" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "Then open: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "LOGIN CREDENTIALS (password: 2026):" -ForegroundColor Yellow
Write-Host "======================================"
Write-Host "Super Admin:    admin@eastgates.com" -ForegroundColor White
Write-Host "Super Manager: manager@eastgates.com" -ForegroundColor White
Write-Host "--------------------------------------"
Write-Host "Branch Managers:"
Write-Host "  Kigali:    manager.kigali@eastgates.com" -ForegroundColor White
Write-Host "  Ngoma:     manager.ngoma@eastgates.com" -ForegroundColor White
Write-Host "  Kirehe:    manager.kirehe@eastgates.com" -ForegroundColor White
Write-Host "  Gatsibo:   manager.gatsibo@eastgates.com" -ForegroundColor White
Write-Host "--------------------------------------"
Write-Host "Staff:"
Write-Host "  Reception: reception.kigali@eastgates.com" -ForegroundColor White
Write-Host "  Waiter:    waiter.kigali@eastgates.com" -ForegroundColor White
Write-Host "  Chef:      chef.kigali@eastgates.com" -ForegroundColor White
Write-Host "========================================"
Write-Host ""

# Ask to start dev server
$startDev = Read-Host "Start development server now? (y/n)"
if ($startDev -eq 'y' -or $startDev -eq 'Y') {
    Write-Host "Starting dev server..." -ForegroundColor Cyan
    npm run dev
}
