# EastGate Hotel - Prisma Fix Script
# Run this to fix Prisma generation issues on Windows

Write-Host "Stopping any running Node processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "Removing Prisma cache..." -ForegroundColor Yellow
$prismaPath = "node_modules\.prisma"
if (Test-Path $prismaPath) {
    Remove-Item -Path $prismaPath -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "Removing Prisma client..." -ForegroundColor Yellow
$clientPath = "node_modules\.prisma\client"
if (Test-Path $clientPath) {
    Remove-Item -Path $clientPath -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "Generating Prisma client..." -ForegroundColor Green
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "Prisma generated successfully!" -ForegroundColor Green
    
    Write-Host "Pushing schema to database..." -ForegroundColor Green
    npx prisma db push
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Database schema pushed successfully!" -ForegroundColor Green
    } else {
        Write-Host "Failed to push database schema" -ForegroundColor Red
    }
} else {
    Write-Host "Failed to generate Prisma client" -ForegroundColor Red
}
