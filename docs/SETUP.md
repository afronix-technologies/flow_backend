# 🔧 CI/CD Pipeline Setup Guide

> Quick reference for setting up the complete deployment infrastructure

## ✅ Pre-Deployment Checklist

### 1. **Generate Secrets** (Run locally)

```bash
# Database password
openssl rand -base64 32

# JWT secrets
openssl rand -hex 64

# Generate SSH key for deployment
ssh-keygen -t rsa -b 4096 -C "github-actions@afronix.com" -f ~/.ssh/github_deploy_key
```

### 2. **VPS Initial Setup** (Run on VPS as root)

```bash
# SSH to VPS
ssh root@YOUR_VPS_IP

# Download and run setup script
cd /tmp
wget https://raw.githubusercontent.com/afronix-technologies/flow_backend/main/scripts/setup-vps.sh
chmod +x setup-vps.sh
./setup-vps.sh

# Set deploy user password
passwd deploy

# Copy SSH key from local machine
# (Run from local machine)
ssh-copy-id -i ~/.ssh/github_deploy_key.pub deploy@YOUR_VPS_IP
```

### 3. **Configure DNS**

Add these A records to your domain:

```
api.flow.afronix.com → YOUR_VPS_IP
api.staging.flow.afronix.com → YOUR_VPS_IP
```

Verify:
```bash
dig api.flow.afronix.com
dig api.staging.flow.afronix.com
```

### 4. **SSL Certificates** (Run on VPS as root)

```bash
# Production certificate
certbot --nginx -d api.flow.afronix.com --email your-email@afronix.com --agree-tos --no-eff-email

# Staging certificate
certbot --nginx -d api.staging.flow.afronix.com --email your-email@afronix.com --agree-tos --no-eff-email

# Enable Nginx sites
ln -s /etc/nginx/sites-available/flow /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/flow-staging /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 5. **GitHub Secrets Configuration**

Go to: **GitHub Repository → Settings → Secrets and variables → Actions → New repository secret**

#### Required Secrets:

```bash
# VPS Access
VPS_HOST=YOUR_VPS_IP
VPS_USER=deploy
VPS_SSH_KEY=<contents of ~/.ssh/github_deploy_key>

# Docker Hub
DOCKERHUB_USERNAME=your_dockerhub_username
DOCKERHUB_TOKEN=your_dockerhub_access_token

# Production Database
PROD_DATABASE_USER=flow_user
PROD_DATABASE_PASSWORD=<generated password>

# Production Authentication
PROD_JWT_SECRET=<generated hex 64>
PROD_JWT_REFRESH_SECRET=<generated hex 64>

# Staging Database
STAGING_DATABASE_USER=flow_user_staging
STAGING_DATABASE_PASSWORD=<generated password>

# Staging Authentication
STAGING_JWT_SECRET=<generated hex 64>
STAGING_JWT_REFRESH_SECRET=<generated hex 64>

# SMTP (shared between environments)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

## 🚀 First Deployment

### 1. Push to Develop (Staging)

```bash
# Ensure you're on develop
git checkout develop
git pull origin develop

# Push to trigger staging deployment
git push origin develop
```

**Watch deployment:**
- GitHub Actions: https://github.com/afronix-technologies/flow_backend/actions
- Workflow: `Deploy to Staging`

**Verify staging:**
```bash
# Check health
curl https://staging.flow.afronix.com/api/auth/health

# SSH and verify
ssh deploy@YOUR_VPS_IP
docker ps
cd /opt/flow-staging && docker compose logs
```

### 2. Push to Main (Production)

curl https://api.staging.flow.afronix.com/api/auth/health
```

**This will trigger staging deployment automatically**

### 6. **Deploy to Production**

```bash
# Create PR: develop → main
# Review changes
# Merge PR
# Approve deployment in GitHub Actions
# Verify at https://api.flow.afronix.com
```

---

## 📝 Daily Development Workflow

```bash
# 1. Create feature branch
git checkout develop
git pull origin develop
git checkout -b feature/my-feature

# 2. Make changes
# ... code ...

# 3. Test locally
npm run test
npm run lint
npm run format

# 4. Push
git push origin feature/my-feature

# 5. Create PR to develop on GitHub
# CI runs automatically

# 6. After approval, merge PR
# Automatically deploys to staging

# 7. Test on staging
# https://api.staging.flow.afronix.com

# 8. When ready for production:
# Create PR: develop → main
# Get approval, merge
# Manually approve deployment in GitHub Actions
```

---

## 🔍 Verification Commands

### Check CI/CD Status

```bash
# View GitHub Actions
https://github.com/afronix-technologies/flow_backend/actions

# Check workflow files
cat .github/workflows/continuous-integration.yml
cat .github/workflows/deploy-staging.yml
cat .github/workflows/deploy-production.yml
```

### Check VPS Services

```bash
ssh deploy@YOUR_VPS_IP

# Production
cd /opt/flow
docker compose ps
docker compose logs --tail=50
bash scripts/health-check.sh

# Staging
cd /opt/flow-staging
docker compose ps
docker compose logs --tail=50
```

### Test Endpoints

```bash
# Staging
curl https://api.staging.flow.afronix.com/api/auth/health
curl https://api.staging.flow.afronix.com/api/notifications/health
curl https://api.staging.flow.afronix.com/api/jobs/health

# Production
curl https://api.flow.afronix.com/api/auth/health
curl https://api.flow.afronix.com/api/notifications/health
curl https://api.flow.afronix.com/api/jobs/health
```

---

## 🆘 Troubleshooting

### Issue: CI Checks Failing

```bash
# Run locally
npm run lint
npm run test
npm run format

# Fix errors and push again
```

### Issue: Deployment Fails

```bash
# Check GitHub Actions logs
# Look for red X and error messages

# Common issues:
# - Missing GitHub Secrets
# - VPS SSH connection failed
# - Docker Hub authentication failed
```

### Issue: Services Not Healthy

```bash
ssh deploy@YOUR_VPS_IP
cd /opt/flow

# Check what's wrong
docker ps -a
docker compose logs auth-service
docker compose logs postgres
docker compose logs redis

# Restart if needed
docker compose restart
```

### Issue: Can't Connect to Site

```bash
# Check Nginx
ssh deploy@YOUR_VPS_IP
sudo nginx -t
sudo systemctl status nginx

# Check SSL
sudo certbot certificates

# Check firewall
sudo ufw status
```

---

## 📚 Important Files

| File | Purpose |
|------|---------|
| `.github/workflows/continuous-integration.yml` | CI checks on all branches |
| `.github/workflows/deploy-staging.yml` | Auto-deploy to staging |
| `.github/workflows/deploy-production.yml` | Manual deploy to production |
| `docker-compose.prod.yml` | Production containers config |
| `.env.production` | Production env template |
| `.env.staging` | Staging env template |
| `scripts/setup-vps.sh` | VPS infrastructure setup |
| `scripts/health-check.sh` | Service health verification |
| `scripts/rollback.sh` | Emergency rollback |
| `scripts/backup-database.sh` | Database backup |
| `docs/DEPLOYMENT.md` | Full deployment guide |

---

## 🎯 Quick Commands Reference

```bash
# Local development
npm run docker:dev              # Start all services
npm run test                    # Run tests
npm run lint                    # Check code quality

# VPS management
ssh deploy@YOUR_VPS_IP          # SSH to VPS
docker compose ps               # View containers
docker compose logs -f          # Follow logs
docker compose restart          # Restart all
bash scripts/health-check.sh    # Health check
bash scripts/rollback.sh        # Rollback deployment

# Deployment
git push origin develop         # Auto-deploy staging
git push origin main            # Deploy production (needs approval)
```

---

**Setup Time:** ~30-45 minutes (first time)  
**Subsequent deployments:** Automatic (staging) or ~2 minutes (production approval)

**Need help?** See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.
