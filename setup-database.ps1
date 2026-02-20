# EastGate Hotel - Database Setup Script (Windows)
# Run this script in PowerShell as Administrator

Write-Host "🏨 EastGate Hotel - Database Setup" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check if PostgreSQL is installed
Write-Host "Checking PostgreSQL installation..." -ForegroundColor Yellow
try {
    $pgVersion = psql --version
    Write-Host "✅ PostgreSQL is installed" -ForegroundColor Green
} catch {
    Write-Host "⚠️  PostgreSQL not found in PATH. Make sure it's installed." -ForegroundColor Yellow
}

# Check if .env file exists
if (!(Test-Path ".env")) {
    Write-Host "Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ .env file created. Please update it with your database credentials." -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Edit .env file and set your DATABASE_URL" -ForegroundColor Yellow
    Write-Host "Example: DATABASE_URL='postgresql://postgres:password@localhost:5432/eastgate_hotel'" -ForegroundColor Cyan
    Write-Host ""
    $continue = Read-Host "Press Enter after updating .env file, or type 'exit' to quit"
    if ($continue -eq "exit") {
        exit 0
    }
}

# Install dependencies
Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green

# Generate Prisma Client
Write-Host ""
Write-Host "Generating Prisma Client..." -ForegroundColor Yellow
npm run db:generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate Prisma Client" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Prisma Client generated" -ForegroundColor Green

# Push database schema
Write-Host ""
Write-Host "Pushing database schema..." -ForegroundColor Yellow
npm run db:push
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to push database schema" -ForegroundColor Red
    Write-Host "Please check your DATABASE_URL in .env file" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Database schema created" -ForegroundColor Green

# Seed database
Write-Host ""
Write-Host "Seeding database with initial data..." -ForegroundColor Yellow
npm run db:seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to seed database" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Database seeded successfully" -ForegroundColor Green

# Success message
Write-Host ""
Write-Host "🎉 Setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run 'npm run dev' to start the development server" -ForegroundColor White
Write-Host "2. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host "3. Login with:" -ForegroundColor White
Write-Host "   - Super Admin: eastgate@gmail.com / 2026" -ForegroundColor Yellow
Write-Host "   - Manager: manager@eastgate.rw / manager123" -ForegroundColor Yellow
Write-Host "   - Branch Manager (Kigali): jp@eastgate.rw / jp123" -ForegroundColor Yellow
Write-Host ""
Write-Host "To view database: npm run db:studio" -ForegroundColor Cyan
Write-Host ""
