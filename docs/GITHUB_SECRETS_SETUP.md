# GitHub Secrets Setup Guide

This guide will walk you through setting up all the required secrets for your GitHub Actions deployment workflows.

## 📋 Overview

Your deployment workflows require secrets for:
- **Docker Hub** (for container registry)
- **VPS Server** (for deployment target)
- **Database** (for staging and production)
- **JWT Authentication** (for secure tokens)
- **SMTP/Email** (for notifications)

---

## 🔐 How to Add Secrets to GitHub

1. Go to your GitHub repository
2. Click **Settings** (top right)
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Enter the **Name** and **Value**, then click **Add secret**

---

## 📝 Required Secrets List

### 1. Docker Hub Secrets

| Secret Name | Description | How to Get It |
|-------------|-------------|---------------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username | Create account at https://hub.docker.com |
| `DOCKERHUB_TOKEN` | Docker Hub access token | Go to Docker Hub → Account Settings → Security → New Access Token |

**Steps to create Docker Hub Token:**
```
1. Log in to hub.docker.com
2. Click your profile → Account Settings
3. Go to "Security" tab
4. Click "New Access Token"
5. Name it "GitHub Actions Deploy"
6. Set permissions to "Read, Write, Delete"
7. Copy the token (you won't see it again!)
```

---

### 2. VPS Server Secrets

| Secret Name | Description | How to Get It |
|-------------|-------------|---------------|
| `VPS_HOST` | Your VPS server IP or domain | Your VPS provider dashboard (e.g., `123.45.67.89`) |
| `VPS_USER` | SSH username for VPS | Usually `root` or `ubuntu` |
| `VPS_SSH_KEY` | Private SSH key for authentication | Generate with command below |

**Steps to create SSH Key:**
```bash
# On your local machine, run:
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions

# This creates two files:
# - github_actions (private key) ← Use this for VPS_SSH_KEY secret
# - github_actions.pub (public key) ← Add this to your VPS

# Copy the PRIVATE key:
cat ~/.ssh/github_actions

# Copy the PUBLIC key to your VPS:
ssh-copy-id -i ~/.ssh/github_actions.pub your-user@your-vps-ip
# OR manually add it to ~/.ssh/authorized_keys on your VPS
```

> ⚠️ **IMPORTANT**: Copy the **ENTIRE** private key including the `-----BEGIN` and `-----END` lines!

---

### 3. Database Secrets (Staging)

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `STAGING_DATABASE_USER` | Staging database username | `flow_staging_user` |
| `STAGING_DATABASE_PASSWORD` | Staging database password | Generate using command below |

**Generate a secure password:**
```bash
# Option 1: Using openssl (recommended)
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Online generator
# Visit: https://www.random.org/passwords/ (32 chars, with symbols)
```

---

### 4. Database Secrets (Production)

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `PROD_DATABASE_USER` | Production database username | `flow_prod_user` |
| `PROD_DATABASE_PASSWORD` | Production database password | Generate using command above |

---

### 5. JWT Authentication Secrets

| Secret Name | Description | How to Generate |
|-------------|-------------|-----------------|
| `STAGING_JWT_SECRET` | JWT signing key for staging | Generate using command below |
| `STAGING_JWT_REFRESH_SECRET` | JWT refresh token key for staging | Generate using command below |
| `PROD_JWT_SECRET` | JWT signing key for production | Generate using command below |
| `PROD_JWT_REFRESH_SECRET` | JWT refresh token key for production | Generate using command below |

**Generate JWT secrets (make each one unique!):**
```bash
# Generate a strong random secret (run this 4 times for each secret)
openssl rand -base64 64

# OR using Node.js:
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

> 🔒 **IMPORTANT**: Each secret should be **different**! Run the command 4 times and use different values.

---

### 6. SMTP/Email Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `SMTP_HOST` | SMTP server hostname | `smtp.gmail.com` or `smtp.sendgrid.net` |
| `SMTP_PORT` | SMTP server port | `587` (TLS) or `465` (SSL) |
| `SMTP_USER` | SMTP username/email | `your-email@gmail.com` |
| `SMTP_PASS` | SMTP password/app password | See provider-specific instructions below |

**Common SMTP Providers:**

#### Gmail
```
SMTP_HOST: smtp.gmail.com
SMTP_PORT: 587
SMTP_USER: your-email@gmail.com
SMTP_PASS: (App Password - see below)
```

**Get Gmail App Password:**
1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification (if not already enabled)
3. Go to "App passwords"
4. Select "Mail" and "Other (Custom name)"
5. Enter "Flow Backend" and click Generate
6. Copy the 16-character password

#### SendGrid
```
SMTP_HOST: smtp.sendgrid.net
SMTP_PORT: 587
SMTP_USER: apikey
SMTP_PASS: (Your SendGrid API key)
```

#### Mailgun
```
SMTP_HOST: smtp.mailgun.org
SMTP_PORT: 587
SMTP_USER: (Your Mailgun SMTP username)
SMTP_PASS: (Your Mailgun SMTP password)
```

---

### 7. Legacy Deployment Secrets (Optional)

These are used in `deploy.yml` if you're using it:

| Secret Name | Description |
|-------------|-------------|
| `PROD_HOST` | Production server hostname |
| `PROD_USERNAME` | Production SSH username |
| `PROD_SSH_KEY` | Production SSH private key |

---

## ✅ Quick Setup Checklist

Use this checklist to track your progress:

- [ ] **Docker Hub**
  - [ ] Create Docker Hub account
  - [ ] Generate access token
  - [ ] Add `DOCKERHUB_USERNAME` secret
  - [ ] Add `DOCKERHUB_TOKEN` secret

- [ ] **VPS Server**
  - [ ] Generate SSH key pair
  - [ ] Add public key to VPS
  - [ ] Add `VPS_HOST` secret (your server IP)
  - [ ] Add `VPS_USER` secret (usually `root` or `ubuntu`)
  - [ ] Add `VPS_SSH_KEY` secret (entire private key)

- [ ] **Staging Database**
  - [ ] Generate secure password
  - [ ] Add `STAGING_DATABASE_USER` secret
  - [ ] Add `STAGING_DATABASE_PASSWORD` secret

- [ ] **Production Database**
  - [ ] Generate secure password (different from staging!)
  - [ ] Add `PROD_DATABASE_USER` secret
  - [ ] Add `PROD_DATABASE_PASSWORD` secret

- [ ] **JWT Secrets**
  - [ ] Generate 4 unique secrets
  - [ ] Add `STAGING_JWT_SECRET` secret
  - [ ] Add `STAGING_JWT_REFRESH_SECRET` secret
  - [ ] Add `PROD_JWT_SECRET` secret
  - [ ] Add `PROD_JWT_REFRESH_SECRET` secret

- [ ] **SMTP/Email**
  - [ ] Choose SMTP provider
  - [ ] Get SMTP credentials
  - [ ] Add `SMTP_HOST` secret
  - [ ] Add `SMTP_PORT` secret
  - [ ] Add `SMTP_USER` secret
  - [ ] Add `SMTP_PASS` secret

---

## 🧪 Testing Your Secrets

After adding all secrets, test by:

1. **Trigger the workflow manually:**
   - Go to **Actions** tab in GitHub
   - Select "Deploy to Staging" workflow
   - Click "Run workflow" → "Run workflow"

2. **Check the workflow run:**
   - It should start building Docker images
   - Watch for any authentication errors
   - If it fails, check the logs for which secret is missing/incorrect

---

## 🔍 Troubleshooting

### "Error: secrets.XXXX is not defined"
- You forgot to add that secret in GitHub Settings

### "Permission denied (publickey)"
- Your `VPS_SSH_KEY` is incorrect or incomplete
- Make sure you copied the **entire** private key
- Verify the public key is in `~/.ssh/authorized_keys` on your VPS

### "docker login failed"
- Check `DOCKERHUB_USERNAME` (should be your exact Docker Hub username)
- Check `DOCKERHUB_TOKEN` is valid and has write permissions

### "SMTP authentication failed"
- For Gmail, make sure you're using an **App Password**, not your regular password
- Check your SMTP credentials are correct

---

## 📚 Additional Resources

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Docker Hub Access Tokens](https://docs.docker.com/docker-hub/access-tokens/)
- [SSH Key Generation Guide](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)

---

## 🆘 Need Help?

If you get stuck:
1. Check the Actions logs in GitHub for specific error messages
2. Verify each secret is named **exactly** as shown (case-sensitive!)
3. Make sure there are no extra spaces when pasting secrets
4. Regenerate any suspicious keys/tokens and try again
