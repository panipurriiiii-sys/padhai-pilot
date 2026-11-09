# Reads .env, applies 2 pending migrations, then seeds the study library.
# Run from A:\padhai-pilot:  .\run-migrations-and-seed.ps1

# Load .env into current process
Get-Content .env | ForEach-Object {
    $line = $_.Trim()
    if ($line -and !$line.StartsWith('#') -and $line -match '^([^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $val = $matches[2].Trim().Trim('"').Trim("'")
        [System.Environment]::SetEnvironmentVariable($key, $val, 'Process')
    }
}

$directUrl = $env:DIRECT_URL
if (-not $directUrl) { $directUrl = $env:DATABASE_URL }
if (-not $directUrl) { Write-Error "No DIRECT_URL or DATABASE_URL found in .env"; exit 1 }

Write-Host "Using DB: $($directUrl.Split('@')[-1])" -ForegroundColor Cyan

# Apply migrations using prisma db execute
Write-Host "`n[1/3] Applying notifications migration..." -ForegroundColor Yellow
npx prisma db execute --url $directUrl --file "apps/api/prisma/migrations/20261109000000_device_tokens_and_interactive_notifications/migration.sql" --schema apps/api/prisma/schema.prisma
if ($LASTEXITCODE -ne 0) { Write-Error "Migration 1 failed"; exit 1 }
Write-Host "Done." -ForegroundColor Green

Write-Host "`n[2/3] Applying study-library migration..." -ForegroundColor Yellow
npx prisma db execute --url $directUrl --file "apps/api/prisma/migrations/20261109000100_study_library/migration.sql" --schema apps/api/prisma/schema.prisma
if ($LASTEXITCODE -ne 0) { Write-Error "Migration 2 failed"; exit 1 }
Write-Host "Done." -ForegroundColor Green

Write-Host "`n[3/3] Seeding study library (40+ real textbook links)..." -ForegroundColor Yellow
npx tsx apps/api/src/scripts/seed-study-library.ts
if ($LASTEXITCODE -ne 0) { Write-Error "Seed failed"; exit 1 }
Write-Host "`nAll done! Refresh the portals." -ForegroundColor Green
