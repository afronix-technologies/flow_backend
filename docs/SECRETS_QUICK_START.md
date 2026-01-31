# Quick Guide: Setting Up GitHub Secrets

## ✅ What's Already Done

Your `.env.secrets` file has been created with:
- ✅ Production database password (auto-generated)
- ✅ Staging database password (auto-generated)  
- ✅ Production JWT secrets (auto-generated)
- ✅ Staging JWT secrets (auto-generated)
- ✅ SSH key pair created at `C:\Users\hp\.ssh\github_deploy_key`

## 📝 What You Need to Fill In

Open `.env.secrets` and replace these placeholders:

### 1. VPS Server Details
```
VPS_HOST=YOUR_VPS_IP_HERE         ← Your server IP (e.g., 123.456.78.90)
VPS_USER=deploy                    ← Keep as 'deploy' or change to 'root'/'ubuntu'
```

### 2. Get VPS SSH Key
Run this command to get your private key:
```powershell
Get-Content $env:USERPROFILE\.ssh\github_deploy_key -Raw | clip
```
Then paste it as the value for `VPS_SSH_KEY=` in `.env.secrets`

### 3. Docker Hub
- Create account at https://hub.docker.com
- Get token: https://hub.docker.com/settings/security → New Access Token
- Fill in:
  ```
  DOCKERHUB_USERNAME=your-username
  DOCKERHUB_TOKEN=your-token-here
  ```

### 4. SMTP Email (choose one):

**Option A: Gmail**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=<Get App Password from https://myaccount.google.com/apppasswords>
```

**Option B: SendGrid** (free tier available)
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=<Your SendGrid API key>
```

## 🔑 Add SSH Public Key to Your VPS

Copy the public key to your server:
```powershell
# Option 1: Automatic (if you can SSH already)
type $env:USERPROFILE\.ssh\github_deploy_key.pub | ssh your-user@your-vps-ip "cat >> ~/.ssh/authorized_keys"

# Option 2: Manual
# 1. Get the public key:
Get-Content $env:USERPROFILE\.ssh\github_deploy_key.pub

# 2. SSH into your VPS and run:
echo "PASTE_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

## 📤 Upload Secrets to GitHub

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** for each secret below
4. Copy the value from `.env.secrets` and paste it in GitHub

**Required Secrets (17 total):**
```
VPS_HOST
VPS_USER  
VPS_SSH_KEY (entire private key, including -----BEGIN/END lines)
DOCKERHUB_USERNAME
DOCKERHUB_TOKEN
PROD_DATABASEUSER
PROD_DATABASE_PASSWORD
PROD_JWT_SECRET
PROD_JWT_REFRESH_SECRET
STAGING_DATABASE_USER
STAGING_DATABASE_PASSWORD
STAGING_JWT_SECRET
STAGING_JWT_REFRESH_SECRET
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASS
```

## ✅ Test Your Setup

### Test SSH Connection
```powershell
ssh -i $env:USERPROFILE\.ssh\github_deploy_key deploy@YOUR_VPS_IP
```

### Test GitHub Actions
1. Go to **Actions** tab in GitHub
2. Select "Deploy to Staging" workflow
3. Click "Run workflow" button
4. Watch it deploy!

## 🔒 Security Checklist

- [ ] `.env.secrets` is in `.gitignore` (DO NOT commit it!)
- [ ] Never share your private SSH key
- [ ] All secrets uploaded to GitHub
- [ ] SSH key added to VPS server
- [ ] Test SSH connection works
- [ ] Test workflow runs successfully

## 📁 File Locations

```
Local files:
- c:\Users\hp\Desktop\afronix-tracker\.env.secrets
- c:\Users\hp\.ssh\github_deploy_key (private)
- c:\Users\hp\.ssh\github_deploy_key.pub (public)

GitHub:
- Settings → Secrets and variables → Actions
```

## 🆘 Quick Commands

```powershell
# Copy private key to clipboard
Get-Content $env:USERPROFILE\.ssh\github_deploy_key -Raw | clip

# Copy public key to clipboard  
Get-Content $env:USERPROFILE\.ssh\github_deploy_key.pub | clip

# View .env.secrets
notepad .env.secrets

# Test SSH
ssh -i $env:USERPROFILE\.ssh\github_deploy_key deploy@YOUR_VPS_IP
```

---

**🎯 Next Step:** Fill in the TODO values in `.env.secrets`, then upload each secret to GitHub!
