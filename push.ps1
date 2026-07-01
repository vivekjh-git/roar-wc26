param(
    [string]$Message = ""
)

$ErrorActionPreference = "Stop"

function Write-Step($text) {
    Write-Host ""
    Write-Host ">>  $text" -ForegroundColor Cyan
}

function Write-Success($text) {
    Write-Host "OK  $text" -ForegroundColor Green
}

function Write-Fail($text) {
    Write-Host "ERR $text" -ForegroundColor Red
}

# 1. TypeScript check
Write-Step "Running TypeScript check..."
npm run typecheck
if ($LASTEXITCODE -ne 0) {
    Write-Fail "TypeScript errors found. Fix them before deploying."
    exit 1
}
Write-Success "TypeScript OK"

# 1.5 Update Version in src/version.json
Write-Step "Updating version in src/version.json..."
$versionFile = Join-Path $PSScriptRoot "src/version.json"
if (Test-Path $versionFile) {
    $versionContent = Get-Content $versionFile -Raw | ConvertFrom-Json
    $versionStr = $versionContent.version
    $parts = $versionStr.Split('.')
    if ($parts.Length -eq 3) {
        $patch = [int]$parts[2] + 1
        $newVersion = "$($parts[0]).$($parts[1]).$patch"
        $versionContent.version = $newVersion
        $json = $versionContent | ConvertTo-Json
        $utf8NoBom = New-Object System.Text.UTF8Encoding $False
        [System.IO.File]::WriteAllText($versionFile, $json, $utf8NoBom)
        Write-Success "Version updated: $versionStr -> $newVersion"
    } else {
        Write-Fail "Invalid version format: $versionStr"
        exit 1
    }
} else {
    Write-Fail "version.json not found at $versionFile"
    exit 1
}

# 2. Stage all changes
Write-Step "Staging changes..."
git add .
Write-Success "All changes staged"

# 3. Check if there is anything to commit
$status = git status --porcelain
if (-not $status) {
    Write-Host ""
    Write-Host "  Nothing to commit - working tree clean." -ForegroundColor Yellow
} else {
    if (-not $Message) {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
        $Message = "update: $timestamp"
    }

    Write-Step "Committing: '$Message'..."
    git commit -m $Message
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "Commit failed."
        exit 1
    }
    Write-Success "Committed"

    # 4. Push to GitHub
    Write-Step "Pushing to GitHub (main)..."
    git push
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "Git push failed."
        exit 1
    }
    Write-Success "Pushed to GitHub"
}

# 5. Deploy to Vercel production — capture the deployment URL via temp file
Write-Step "Deploying to Vercel (production)..."
$tmpOut = [System.IO.Path]::GetTempFileName()
$ErrorActionPreference = "Continue"
npx vercel --prod --yes | Tee-Object -FilePath $tmpOut
$ErrorActionPreference = "Stop"
if ($LASTEXITCODE -ne 0) {
    Remove-Item $tmpOut -Force -ErrorAction SilentlyContinue
    Write-Fail "Vercel deployment failed."
    exit 1
}

# Extract the new deployment URL (e.g. roarfifa-xxxxxxxx-vivek-jh.vercel.app)
$deployContent = Get-Content $tmpOut -Raw
Remove-Item $tmpOut -Force -ErrorAction SilentlyContinue

$matchResult = [regex]::Match($deployContent, "https://(roarfifa-[^\s]+\.vercel\.app)")
$newDeployUrl = if ($matchResult.Success) { $matchResult.Groups[1].Value } else { $null }

if (-not $newDeployUrl) {
    Write-Host "  Could not auto-detect deployment URL. Aliasing from project default..." -ForegroundColor Yellow
    npx vercel alias roarfifa.vercel.app
} else {
    Write-Success "New deployment URL: $newDeployUrl"

    # 6. Re-alias roarfifa.vercel.app to the exact new deployment URL
    Write-Step "Aliasing $newDeployUrl -> roarfifa.vercel.app..."
    npx vercel alias set $newDeployUrl roarfifa.vercel.app
    if ($LASTEXITCODE -eq 0) {
        Write-Success "roarfifa.vercel.app now points to $newDeployUrl"
    } else {
        Write-Fail "Alias failed. Run manually: vercel alias set $newDeployUrl roarfifa.vercel.app"
    }
}

Write-Host ""
Write-Host "-------------------------------------------" -ForegroundColor Magenta
Write-Host "  Deployed successfully to production!" -ForegroundColor Magenta
Write-Host "-------------------------------------------" -ForegroundColor Magenta
Write-Host ""
