# ==========================================
# Eastgate Hotel Manager Setup Script (PowerShell)
# ==========================================
# This script sets up the complete manager system
# with MySQL database and all configurations for Windows

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Eastgate Hotel Manager System Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if MySQL is installed (including XAMPP)
Write-Host "Checking MySQL installation..." -ForegroundColor Yellow
$mysqlPath = Get-Command mysql -ErrorAction SilentlyContinue

if (-not $mysqlPath) {
    # Check common XAMPP locations
    $xamppPaths = @(
        "C:\xampp\mysql\bin\mysql.exe",
        "C:\XAMPP\mysql\bin\mysql.exe"
    )
    
    foreach ($path in $xamppPaths) {
        if (Test-Path $path) {
            $env:Path += ";" + (Split-Path $path)
            $mysqlPath = $path
            Write-Host "OK Found XAMPP MySQL at $path" -ForegroundColor Green
            break
        }
    }
    
    if (-not $mysqlPath) {
        Write-Host "X MySQL is not installed" -ForegroundColor Red
        Write-Host "Please install MySQL 8.0+ or XAMPP first"
        Write-Host "Download XAMPP from: https://www.apachefriends.org/"
        exit 1
    }
} else {
    Write-Host "OK MySQL is installed" -ForegroundColor Green
}

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
$nodePath = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodePath) {
    Write-Host "X Node.js is not installed" -ForegroundColor Red
    Write-Host "Please install Node.js 18+ first"
    Write-Host "Download from: https://nodejs.org/"
    exit 1
}
$nodeVersion = node -v
Write-Host "OK Node.js $nodeVersion is installed" -ForegroundColor Green

# Install dependencies
Write-Host ""
Write-Host "Installing Node.js dependencies..." -ForegroundColor Yellow
npm install
Write-Host "OK Dependencies installed" -ForegroundColor Green

# Create .env file if it doesn't exist
if (-not (Test-Path .env)) {
    Write-Host ""
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    
    # Generate random secret
    $bytes = New-Object Byte[] 32
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $secret = [Convert]::ToBase64String($bytes)
    
    $envContent = Get-Content .env -Raw
    $envContent = $envContent -replace 'your-secret-key-here-change-in-production', $secret
    Set-Content -Path .env -Value $envContent
    
    Write-Host "OK .env file created" -ForegroundColor Green
    Write-Host "WARNING: Please update DATABASE_URL in .env with your MySQL credentials" -ForegroundColor Yellow
} else {
    Write-Host "WARNING: .env file already exists, skipping..." -ForegroundColor Yellow
}

# Set up MySQL database
Write-Host ""
$setupDb = Read-Host "Do you want to set up the MySQL database now? (y/n)"
if ($setupDb -eq "y" -or $setupDb -eq "Y") {
    Write-Host "Setting up MySQL database..." -ForegroundColor Yellow
    
    $mysqlPassword = Read-Host "Enter MySQL root password" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($mysqlPassword)
    $plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    
    # Test MySQL connection
    try {
        $testConnection = "SELECT 1;" | mysql -u root -p"$plainPassword" 2>&1
        Write-Host "OK MySQL connection successful" -ForegroundColor Green
        
        # Run setup script on existing database
        Get-Content scripts/setup-mysql.sql | mysql -u root -p"$plainPassword" eastgate_hotel
        Write-Host "OK Tables verified" -ForegroundColor Green
        
        # Update .env with database URL
        $dbUrl = "mysql://eastgate_admin:Change_This_Password_123!@localhost:3306/eastgate_hotel"
        $envContent = Get-Content .env -Raw
        $envContent = $envContent -replace 'DATABASE_URL=.*', "DATABASE_URL=`"$dbUrl`""
        Set-Content -Path .env -Value $envContent
        
        Write-Host "OK .env updated with database URL" -ForegroundColor Green
        Write-Host "WARNING: IMPORTANT - Change the database password in .env for production!" -ForegroundColor Yellow
    } catch {
        Write-Host "X Failed to connect to MySQL" -ForegroundColor Red
        Write-Host "Please check your MySQL root password and try again"
        exit 1
    }
}

# Generate Prisma client
Write-Host ""
Write-Host "Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate
Write-Host "OK Prisma client generated" -ForegroundColor Green

# Run migrations
Write-Host ""
$runMigrations = Read-Host "Do you want to run database migrations? (y/n)"
if ($runMigrations -eq "y" -or $runMigrations -eq "Y") {
    Write-Host "Running database migrations..." -ForegroundColor Yellow
    npx prisma db push
    Write-Host "OK Migrations completed" -ForegroundColor Green
}

# Seed database
Write-Host ""
$seedDb = Read-Host "Do you want to seed the database with initial data? (y/n)"
if ($seedDb -eq "y" -or $seedDb -eq "Y") {
    Write-Host "Seeding database..." -ForegroundColor Yellow
    npm run db:seed
    Write-Host "OK Database seeded" -ForegroundColor Green
}

# Summary
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "OK Setup completed successfully!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Review and update .env file with your settings"
Write-Host "2. Change the default database password for production"
Write-Host "3. Start the development server: npm run dev"
Write-Host "4. Access the application at: http://localhost:3000"
Write-Host ""
Write-Host "Manager Login Credentials (from seed):"
Write-Host "  Email: manager@eastgate.com"
Write-Host "  Password: manager123"
Write-Host ""
Write-Host "For more information, see MANAGER_GUIDE.md"
Write-Host "==========================================" -ForegroundColor Cyan
