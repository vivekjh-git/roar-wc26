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

# 5. Deploy to Vercel production — capture the deployment URL
Write-Step "Deploying to Vercel (production)..."
$deployOutput = npx vercel --prod --yes 2>&1
$deployOutput | ForEach-Object { Write-Host $_ }
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Vercel deployment failed."
    exit 1
}

# Extract the new deployment URL (e.g. roarfifa-xxxxxxxx-vivek-jh.vercel.app)
$newDeployUrl = ($deployOutput | Select-String -Pattern "https://(roarfifa-[^\s]+\.vercel\.app)" | ForEach-Object { $_.Matches[0].Groups[1].Value } | Select-Object -First 1)

if (-not $newDeployUrl) {
    Write-Fail "Could not detect new deployment URL. Skipping alias."
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
