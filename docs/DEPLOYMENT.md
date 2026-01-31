# Flow Application Deployment Guide

> **Complete guide for deploying the Flow application to production and staging environments**

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [First-Time Setup](#first-time-setup)
4. [Daily Development Workflow](#daily-development-workflow)
5. [Deployment Process](#deployment-process)
6. [Rollback Procedures](#rollback-procedures)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Overview

### Architecture

```
Developer → Feature Branch → CI Checks → PR to develop → Staging VPS
              ↓
         develop → PR to main → Manual Approval → Production VPS
```

### Environments

| Environment | Branch | URL | Auto-Deploy | Manual Approval |
|------------|--------|-----|-------------|-----------------|
| **Staging** | `develop` | https://api.staging.flow.afronix.com | ✅ Yes | ❌ No |
| **Production** | `main` | https://api.flow.afronix.com | ✅ Yes | ✅ Required |

---

## Prerequisites

### Required Accounts & Access

- [x] GitHub repository access
- [x] Docker Hub account
- [x] VPS SSH access (Hostinger)
- [x] Domain DNS management (afronix.com)

### Required Tools (Local Development)

```bash
# Verify you have these installed
node --version   # v18+
npm --version    # v9+
git --version    # v2.30+
docker --version # v20+
```

---

## First-Time Setup

### Step 1: VPS Infrastructure Setup

**Run on VPS as root:**

```bash
# SSH to VPS
ssh root@YOUR_VPS_IP

# Download and run setup script
wget https://raw.githubusercontent.com/afronix/flow/main/scripts/setup-vps.sh
chmod +x setup-vps.sh
sudo ./setup-vps.sh
```

**This script will:**
- ✅ Install Docker, Nginx, Certbot
- ✅ Configure firewall (UFW) and fail2ban
- ✅ Create directory structure
- ✅ Set up deploy user

### Step 2: Configure DNS

Point your domain to the VPS IP:

```
A Record: api.flow.afronix.com → YOUR_VPS_IP
A Record: api.staging.flow.afronix.com → YOUR_VPS_IP
```

**Verify DNS propagation:**
```bash
dig api.flow.afronix.com
```

### Step 3: SSL Certificates

**Run on VPS as root:**

```bash
# Production SSL
certbot --nginx -d api.flow.afronix.com --email your-email@afronix.com --agree-tos --no-eff-email

# Staging SSL
certbot --nginx -d api.staging.flow.afronix.com --email your-email@afronix.com --agree-tos --no-eff-email

# Enable Nginx sites
ln -s /etc/nginx/sites-available/flow /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/flow-staging /etc/nginx/sites-enabled/
systemctl reload nginx
```

### Step 4: Configure GitHub Secrets

Go to **GitHub → Settings → Secrets and variables → Actions**

#### VPS Access Secrets

| Secret Name | Description | Example |
|------------|-------------|---------|
| `VPS_HOST` | VPS IP address | `123.45.67.89` |
| `VPS_USER` | SSH username | `deploy` |
| `VPS_SSH_KEY` | Private SSH key | `-----BEGIN RSA PRIVATE KEY-----...` |

**Generate SSH key for deployment:**

```bash
# On your local machine
ssh-keygen -t rsa -b 4096 -C "github-actions@afronix.com" -f ~/.ssh/github_deploy_key

# Copy public key to VPS
ssh-copy-id -i ~/.ssh/github_deploy_key.pub deploy@YOUR_VPS_IP

# Copy private key value for GitHub Secret
cat ~/.ssh/github_deploy_key
```

#### Docker Hub Secrets

| Secret Name | Description |
|------------|-------------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token |

**Create Docker Hub token:**
1. Go to https://hub.docker.com/settings/security
2. Click "New Access Token"
3. Name: "GitHub Actions"
4. Copy token value

#### Production Environment Secrets

| Secret Name | Description | How to Generate |
|------------|-------------|-----------------|
| `PROD_DATABASE_USER` | PostgreSQL username | Choose secure username |
| `PROD_DATABASE_PASSWORD` | PostgreSQL password | `openssl rand -base64 32` |
| `PROD_JWT_SECRET` | JWT signing secret | `openssl rand -hex 64` |
| `PROD_JWT_REFRESH_SECRET` | JWT refresh secret | `openssl rand -hex 64` |
| `SMTP_HOST` | Email SMTP server | e.g., `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP username | Your email |
| `SMTP_PASS` | SMTP password | App password |

#### Staging Environment Secrets

Repeat the same for staging with `STAGING_` prefix:
- `STAGING_DATABASE_USER`
- `STAGING_DATABASE_PASSWORD`
- `STAGING_JWT_SECRET`
- `STAGING_JWT_REFRESH_SECRET`

### Step 5: Initial Deployment

After GitHub Secrets are configured:

```bash
# Push to develop branch (triggers staging deployment)
git checkout develop
git push origin develop

# Watch GitHub Actions
# https://github.com/afronix/flow/actions
```

---

## Daily Development Workflow

### Creating a New Feature

```bash
# 1. Ensure you're on latest develop
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Make changes
# ... code, code, code ...

# 4. Test locally
npm run test
npm run lint
npm run format -- --check

# 5. Commit changes
git add .
git commit -m "feat: add new feature description"

# 6. Push to GitHub
git push origin feature/your-feature-name
```

**This will trigger CI checks automatically** ✅

### Opening a Pull Request

1. Go to GitHub repository
2. Click "Pull Request"
3. Set base branch to `develop`
4. Fill in PR description
5. Request code review

**CI must pass before merging!**

### After PR Approval

```bash
# Merge PR via GitHub UI
# This automatically triggers staging deployment
```

**Verify on staging:**
```
https://api.staging.flow.afronix.com
```

---

## Deployment Process

### Deploying to Staging (Automatic)

**Trigger:** Merge to `develop` branch

**What happens:**
1. ✅ CI checks run (tests, linting, security scan)
2. ✅ Docker images built and tagged (`staging-XXXXX`)
3. ✅ Images pushed to Docker Hub
4. ✅ VPS pulls new images
5. ✅ Services restarted with new images
6. ✅ Health checks run
7. ✅ Deployment complete!

**Monitor:**
[GitHub Actions Workflow](https://github.com/afronix/flow/actions)

### Deploying to Production (Manual Approval Required)

**Trigger:** Merge to `main` branch

**Process:**

1. **Create PR from develop to main**
   ```bash
   # On GitHub UI:
   # develop → main
   ```

2. **Review & Approve PR**
   - Review all changes
   - Get team approval
   - Merge PR to `main`

3. **GitHub Actions starts**
   - Builds production images
   - **Pauses for manual approval** ⏸️

4. **Approve deployment**
   - Go to Actions tab
   - Click on running workflow
   - Click "Review deployments"
   - Click "Approve and deploy"

5. **Deployment executes**
   - Database backup created
   - New images deployed
   - Health checks run
   - **Auto-rollback on failure**

**Monitor:**
```bash
# SSH to VPS
ssh deploy@YOUR_VPS_IP

# Watch deployment
docker ps
docker compose logs -f
```

---

## Rollback Procedures

### Automatic Rollback

Production deployments **automatically rollback** if:
- Health checks fail after deployment
- Services don't start within timeout
- Any critical error during deployment

### Manual Rollback

**If you need to manually rollback production:**

```bash
# SSH to VPS
ssh deploy@YOUR_VPS_IP

# Navigate to production directory
cd /opt/flow

# Run rollback script
sudo bash scripts/rollback.sh

# Confirm rollback
# Services will revert to previous version
```

**What rollback does:**
1. Stops current containers
2. Restores database from latest backup
3. Starts previous Docker images
4. Verifies health checks

**Time to rollback:** ~2-3 minutes

### Emergency Hotfix

**For critical production bugs:**

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug-description

# 2. Fix the bug
# ... make fixes ...

# 3. Test thoroughly
npm run test

# 4. Commit and push
git commit -m "fix: critical bug description"
git push origin hotfix/critical-bug-description

# 5. Create PR to main (expedited review)
# Request immediate review

# 6. After merge, backport to develop
git checkout develop
git cherry-pick <commit-hash>
git push origin develop
```

---

## Monitoring & Maintenance

### Health Checks

**Automated health checks run:**
- Every 30 seconds on each service
- After every deployment
- Can be manually triggered

**Manual health check:**
```bash
ssh deploy@YOUR_VPS_IP
cd /opt/flow
bash scripts/health-check.sh
```

### View Logs

**Production logs:**
```bash
ssh deploy@YOUR_VPS_IP

# All services
docker compose -f /opt/flow/docker-compose.prod.yml logs -f

# Specific service
docker logs -f auth-service
docker logs -f notification-service
docker logs -f job-service

# PostgreSQL logs
docker logs -f flow-postgres

# Last 100 lines
docker compose logs --tail=100
```

### Database Backups

**Automated backups:**
- Run daily at 2:00 AM UTC
- Stored in `/var/backups/databases/`
- Retention: 7 days

**Manual backup:**
```bash
ssh deploy@YOUR_VPS_IP
sudo bash /home/deploy/scripts/backup-database.sh
```

**Restore from backup:**
```bash
# List backups
ls -lh /var/backups/databases/

# Restore specific backup
BACKUP_FILE="/var/backups/databases/flow_2024-01-31_02-00-00.sql.gz"
gunzip -c $BACKUP_FILE | docker exec -i flow-postgres psql -U flow_user flow_production
```

### System Monitoring

**Check system resources:**
```bash
ssh deploy@YOUR_VPS_IP

# CPU and memory
htop

# Disk usage
df -h

# Docker stats
docker stats
```

---

## Troubleshooting

### CI/CD Issues

#### ❌ CI Checks Failing

**Problem:** PR can't be merged because CI fails

**Solution:**
```bash
# Run checks locally
npm run lint          # Fix linting errors
npm run format        # Fix formatting
npm run test          # Fix failing tests

# Re-push
git add .
git commit -m "fix: resolve CI issues"
git push
```

#### ❌ Docker Build Fails

**Problem:** Docker image build fails in GitHub Actions

**Check:**
1. Dockerfile syntax
2. npm dependencies in `package.json`
3. GitHub Actions logs

**Solution:**
```bash
# Test build locally
docker build -f apps/auth-service/Dockerfile -t test .
```

### Deployment Issues

#### ❌ Deployment Fails - Health Check

**Problem:** Services don't pass health checks

**Investigate:**
```bash
ssh deploy@YOUR_VPS_IP

# Check container status
docker ps -a

# Check logs
docker compose logs auth-service

# Check if services are responding
curl http://localhost:3001/health
```

**Common causes:**
- Database connection issues
- Missing environment variables
- Port conflicts

#### ❌ Database Connection Failed

**Problem:** Services can't connect to PostgreSQL

**Check:**
```bash
# Is PostgreSQL running?
docker ps | grep postgres

# Can you connect manually?
docker exec -it flow-postgres psql -U flow_user flow_production

# Check environment variables
docker exec auth-service env | grep DATABASE
```

**Solution:**
```bash
# Restart PostgreSQL
docker compose restart postgres

# Check logs
docker logs flow-postgres
```

#### ❌ SSL Certificate Issues

**Problem:** HTTPS not working

**Check:**
```bash
# Certificate status
sudo certbot certificates

# Nginx configuration
sudo nginx -t

# Renew certificate
sudo certbot renew --dry-run
```

### Application Issues

#### ❌ 502 Bad Gateway

**Problem:** Nginx shows 502 error

**Cause:** Backend service is down or not responding

**Solution:**
```bash
# Check which service is down
docker ps

# Restart services
docker compose restart

# Check Nginx logs
tail -f /var/log/nginx/error.log
```

#### ❌ Out of Disk Space

**Problem:** VPS disk is full

**Solution:**
```bash
# Check disk usage
df -h

# Clean Docker
docker system prune -a
docker volume prune

# Clean old backups
find /var/backups/databases/ -name "flow_*.sql.gz" -mtime +7 -delete

# Clean logs
journalctl --vacuum-time=7d
```

### Getting Help

**Check these resources:**
1. [GitHub Actions logs](https://github.com/afronix/flow/actions)
2. VPS logs: `/var/log/applications/flow/`
3. Docker logs: `docker compose logs`
4. This deployment guide

**Emergency contacts:**
- DevOps Lead: [contact]
- VPS Provider: Hostinger Support

---

## Quick Reference

### Useful Commands

```bash
# VPS access
ssh deploy@YOUR_VPS_IP

# View running containers
docker ps

# Restart all services
cd /opt/flow && docker compose restart

# View logs (live)
docker compose logs -f

# Health check
bash scripts/health-check.sh

# Manual backup
bash /home/deploy/scripts/backup-database.sh

# Rollback
bash scripts/rollback.sh

# Check disk space
df -h

# Check system resources
htop
```

### Directory Structure on VPS

```
/opt/flow/                      # Production
/opt/flow-staging/              # Staging
/var/backups/databases/         # Database backups
/var/log/applications/flow/     # Application logs
/etc/app-environment/           # Environment files
```

---

**Last updated:** 2024-01-31  
**Maintained by:** Afronix DevOps Team
