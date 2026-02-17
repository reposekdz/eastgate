# Read .env file and set environment variables
if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^([^#=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [System.Environment]::SetEnvironmentVariable($name, $value)
            Write-Host "Loaded env var: $name"
        }
    }
}
else {
    Write-Host ".env file not found!" -ForegroundColor Red
    exit 1
}

# Run the seed command
Write-Host "Running db:seed..."
npx tsx prisma/seed.ts
$envFile = Get-Content .env
foreach ($line in $envFile) {
    if ($line -match "^DATABASE_URL=(.*)") {
        $env:DATABASE_URL = $matches[1].Trim('"')
        break
    }
}
Write-Host "Resetting Database with URL: $env:DATABASE_URL"
npm run db:seed
$envFile = Get-Content .env
foreach ($line in $envFile) {
    if ($line -match "^DATABASE_URL=(.*)") {
        $env:DATABASE_URL = $matches[1].Trim('"')
        break
    }
}
Write-Host "Seeding with URL: $env:DATABASE_URL"
npm run db:seed
$envFile = Get-Content .env
foreach ($line in $envFile) {
    if ($line -match "^DATABASE_URL=(.*)") {
        $env:DATABASE_URL = $matches[1].Trim('"')
        break
    }
}
Write-Host "Seeding with URL: $env:DATABASE_URL"
npm run db:seed
