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

# 5. Deploy to Vercel production
Write-Step "Deploying to Vercel (production)..."
npx vercel --prod --yes
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Vercel deployment failed."
    exit 1
}

# 6. Re-alias roarfifa.vercel.app to the latest production deployment
Write-Step "Aliasing latest deployment -> roarfifa.vercel.app..."
# In Vercel CLI, we map the subdomain alias using vercel alias
npx vercel alias set roarfifa.vercel.app
if ($LASTEXITCODE -eq 0) {
    Write-Success "roarfifa.vercel.app is bound to production"
} else {
    Write-Host "  Note: domain binding skipped or already applied." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "-------------------------------------------" -ForegroundColor Magenta
Write-Host "  Deployed successfully to production!" -ForegroundColor Magenta
Write-Host "-------------------------------------------" -ForegroundColor Magenta
Write-Host ""
