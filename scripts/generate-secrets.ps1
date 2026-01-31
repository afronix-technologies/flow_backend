# GitHub Secrets Generator
# Run this script to generate all secure values for your GitHub secrets

Write-Host "🔐 Generating Secure Secrets..." -ForegroundColor Cyan
Write-Host ""

# Generate random secrets
$prodDB = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object { [char]$_ })
$stagingDB = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object { [char]$_ })  
$prodJWT = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object { [char]$_ })
$prodJWTRefresh = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object { [char]$_ })
$stagingJWT = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object { [char]$_ })
$stagingJWTRefresh = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object { [char]$_ })

Write-Host "✅ All passwords and JWT secrets generated!" -ForegroundColor Green
Write-Host "✅ Secrets file created at .env.secrets" -ForegroundColor Green
Write-Host ""
Write-Host "📝 TODO: Fill in these values yourself:" -ForegroundColor Yellow
Write-Host "  - VPS_HOST (your server IP)"
Write-Host "  - VPS_SSH_KEY (run: Get-Content `$env:USERPROFILE\.ssh\github_deploy_key -Raw)"
Write-Host "  - DOCKERHUB_USERNAME"
Write-Host "  - DOCKERHUB_TOKEN"
Write-Host "  - SMTP_* values"
Write-Host ""
Write-Host "🔑 Next: Generate SSH key with:" -ForegroundColor Cyan
Write-Host "  ssh-keygen -t rsa -b 4096 -f `$env:USERPROFILE\.ssh\github_deploy_key" -ForegroundColor White

# Create secrets file
@"
# ============================================
# GitHub Secrets Configuration  
# Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
# ============================================
#
# INSTRUCTIONS:
# 1. Fill in values marked YOUR_VALUE_HERE
# 2. Add each to GitHub: Settings → Secrets → Actions → New secret
# 3. DO NOT commit this file!

# ===== VPS ACCESS =====
VPS_HOST=YOUR_VPS_IP_HERE
VPS_USER=deploy
VPS_SSH_KEY=YOUR_SSH_PRIVATE_KEY_HERE

# ===== DOCKER HUB =====
DOCKERHUB_USERNAME=YOUR_DOCKERHUB_USERNAME_HERE
DOCKERHUB_TOKEN=YOUR_DOCKERHUB_TOKEN_HERE

# ===== PRODUCTION DATABASE =====
PROD_DATABASE_USER=flow_prod_user
PROD_DATABASE_PASSWORD=$prodDB

# ===== PRODUCTION JWT =====
PROD_JWT_SECRET=$prodJWT
PROD_JWT_REFRESH_SECRET=$prodJWTRefresh

# ===== STAGING DATABASE =====
STAGING_DATABASE_USER=flow_staging_user
STAGING_DATABASE_PASSWORD=$stagingDB

# ===== STAGING JWT =====
STAGING_JWT_SECRET=$stagingJWT
STAGING_JWT_REFRESH_SECRET=$stagingJWTRefresh

# ===== SMTP (shared) =====
SMTP_HOST=YOUR_SMTP_HOST_HERE
SMTP_PORT=587
SMTP_USER=YOUR_SMTP_EMAIL_HERE
SMTP_PASS=YOUR_SMTP_PASSWORD_HERE
"@ | Out-File -FilePath ".env.secrets" -Encoding UTF8
