#!/bin/bash

#############################################
# VPS Initial Setup Script
# Sets up the VPS infrastructure for Flow
# Based on Afronix VPS Infrastructure Guide
#############################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

echo "================================================"
echo "   Afronix Flow VPS Setup"
echo "================================================"
echo ""

# Check if root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root"
   exit 1
fi

#############################################
# 1. SYSTEM UPDATE
#############################################
print_info "Step 1/12: Updating system packages..."
apt update && apt upgrade -y
print_success "System updated"

#############################################
# 2. INSTALL ESSENTIAL TOOLS
#############################################
print_info "Step 2/12: Installing essential tools..."
apt install -y curl wget git vim nano tree htop ufw fail2ban
print_success "Essential tools installed"

#############################################
# 3. SET TIMEZONE
#############################################
print_info "Step 3/12: Setting timezone..."
timedatectl set-timezone UTC
print_success "Timezone set to UTC"

#############################################
# 4. CREATE DEPLOY USER
#############################################
print_info "Step 4/12: Creating deploy user..."

if id "deploy" &>/dev/null; then
    print_warning "Deploy user already exists"
else
    useradd -m -s /bin/bash deploy
    usermod -aG sudo deploy
    print_success "Deploy user created"
fi

#############################################
# 5. CREATE DIRECTORY STRUCTURE
#############################################
print_info "Step 5/12: Creating directory structure..."

# Create directories for production
mkdir -p /opt/flow/{scripts,docker}
mkdir -p /var/log/applications/flow
mkdir -p /var/backups/databases
mkdir -p /etc/app-environment
mkdir -p /srv/data/flow

# Create directories for staging
mkdir -p /opt/flow-staging/{scripts,docker}
mkdir -p /var/log/applications/flow-staging

# Home directories
mkdir -p /home/deploy/{.ssh,scripts}
chmod 700 /home/deploy/.ssh

print_success "Directory structure created"

#############################################
# 6. SET PERMISSIONS
#############################################
print_info "Step 6/12: Setting permissions..."

chown -R deploy:deploy /home/deploy
chown -R deploy:deploy /opt/flow
chown -R deploy:deploy /opt/flow-staging
chown -R deploy:deploy /var/log/applications
chown -R deploy:deploy /var/backups
chown -R deploy:deploy /srv/data

chmod 750 /var/backups/databases
chmod 700 /etc/app-environment

print_success "Permissions configured"

#############################################
# 7. INSTALL DOCKER
#############################################
print_info "Step 7/12: Installing Docker..."

# Remove old versions
apt remove -y docker docker-engine docker.io containerd runc || true

# Add Docker's GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add deploy to docker group
usermod -aG docker deploy

# Configure Docker daemon
cat > /etc/docker/daemon.json << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
EOF

# Start Docker
systemctl start docker
systemctl enable docker

print_success "Docker installed ($(docker --version))"

#############################################
# 8. INSTALL NGINX
#############################################
print_info "Step 8/12: Installing Nginx..."

apt install -y nginx
systemctl start nginx
systemctl enable nginx

print_success "Nginx installed"

#############################################
# 9. CONFIGURE NGINX
#############################################
print_info "Step 9/12: Configuring Nginx..."

# Production configuration
cat > /etc/nginx/sites-available/flow << 'EOF'
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name api.flow.afronix.com;
    return 301 https://$host$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name api.flow.afronix.com;

    # SSL certificates (will be added by Certbot)
    ssl_certificate /etc/letsencrypt/live/api.flow.afronix.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.flow.afronix.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Auth service
    location /api/auth {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Notification service
    location /api/notifications {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Job service
    location /api/jobs {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Staging configuration
cat > /etc/nginx/sites-available/flow-staging << 'EOF'
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name api.staging.flow.afronix.com;
    return 301 https://$host$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name api.staging.flow.afronix.com;

    # SSL certificates (will be added by Certbot)
    ssl_certificate /etc/letsencrypt/live/api.staging.flow.afronix.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.staging.flow.afronix.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Staging uses different ports
    location /api {
        proxy_pass http://localhost:4001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Note: Don't enable sites yet - wait for SSL
print_success "Nginx configured"

#############################################
# 10. INSTALL CERTBOT
#############################################
print_info "Step 10/12: Installing Certbot..."

apt install -y certbot python3-certbot-nginx

print_success "Certbot installed"

#############################################
# 11. CONFIGURE FIREWALL
#############################################
print_info "Step 11/12: Configuring firewall..."

ufw --force default deny incoming
ufw --force default allow outgoing
ufw --force allow ssh
ufw --force allow 80/tcp
ufw --force allow 443/tcp
ufw --force enable

print_success "Firewall configured"

#############################################
# 12. CONFIGURE FAIL2BAN
#############################################
print_info "Step 12/12: Configuring Fail2ban..."

cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
EOF

systemctl start fail2ban
systemctl enable fail2ban

print_success "Fail2ban configured"

#############################################
# FINAL STEPS
#############################################
echo ""
echo "================================================"
echo "   Setup Complete!"
echo "================================================"
echo ""

print_success "VPS infrastructure is ready!"
echo ""
print_info "Next steps:"
echo "  1. Set deploy user password: passwd deploy"
echo "  2. Add SSH key: ssh-copy-id deploy@$(hostname -I | awk '{print $1}')"
echo "  3. Configure DNS:"
echo "     - api.flow.afronix.com → $(hostname -I | awk '{print $1}')"
echo "     - api.staging.flow.afronix.com → $(hostname -I | awk '{print $1}')"
echo "  4. Get SSL certificates:"
echo "     certbot --nginx -d api.flow.afronix.com"
echo "     certbot --nginx -d api.staging.flow.afronix.com"
echo "  5. Enable Nginx sites:"
echo "     ln -s /etc/nginx/sites-available/flow /etc/nginx/sites-enabled/"
echo "     ln -s /etc/nginx/sites-available/flow-staging /etc/nginx/sites-enabled/"
echo "     systemctl reload nginx"
echo "  6. Set up GitHub Secrets for CI/CD"
echo "  7. Deploy application via GitHub Actions"
echo ""

# Display system info
print_info "System Information:"
echo "  IP Address: $(hostname -I | awk '{print $1}')"
echo "  Hostname: $(hostname)"
echo "  OS: $(lsb_release -d | cut -f2)"
echo "  Docker: $(docker --version)"
echo ""

print_warning "IMPORTANT: Complete the next steps before deploying!"
