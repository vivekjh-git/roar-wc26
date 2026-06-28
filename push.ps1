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
$deployOutput = npx vercel --prod --yes 2>&1
Write-Host $deployOutput
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Vercel deployment failed."
    exit 1
}

# 6. Extract deployment URL and alias to roarfifa.vercel.app
$deployUrl = ($deployOutput | Select-String "Production\s+https://(\S+)" | ForEach-Object { $_.Matches[0].Groups[1].Value }) | Select-Object -Last 1
if ($deployUrl) {
    Write-Step "Aliasing $deployUrl → roarfifa.vercel.app..."
    npx vercel alias set $deployUrl roarfifa.vercel.app
    if ($LASTEXITCODE -eq 0) {
        Write-Success "roarfifa.vercel.app now points to $deployUrl"
    } else {
        Write-Host "  Note: alias step failed, set manually if needed." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "-------------------------------------------" -ForegroundColor Magenta
Write-Host "  Deployed successfully to production!" -ForegroundColor Magenta
Write-Host "-------------------------------------------" -ForegroundColor Magenta
Write-Host ""
