#!/bin/bash

#############################################
# Rollback Script for Flow Application
# Reverts to previous deployment
#############################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

echo "======================================"
echo "   Flow Application Rollback"
echo "======================================"
echo ""

# Check if running in correct directory
if [ ! -f "docker-compose.prod.yml" ]; then
    print_error "docker-compose.prod.yml not found. Are you in the right directory?"
    exit 1
fi

print_warning "This will rollback to the previous deployment!"
print_info "Current directory: $(pwd)"
echo ""

# Find the most recent backup
LATEST_BACKUP=$(ls -t /var/backups/databases/flow_*.sql.gz 2>/dev/null | head -1)

if [ -z "$LATEST_BACKUP" ]; then
    print_error "No database backup found in /var/backups/databases/"
    exit 1
fi

print_info "Latest backup found: $LATEST_BACKUP"
BACKUP_DATE=$(basename "$LATEST_BACKUP" | sed 's/flow_\(.*\)\.sql\.gz/\1/')
print_info "Backup date: $BACKUP_DATE"
echo ""

# Confirm rollback
if [ "$1" != "--force" ]; then
    read -p "🔄 Proceed with rollback? (yes/no): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        print_warning "Rollback cancelled"
        exit 0
    fi
fi

echo ""
print_info "Starting rollback process..."
echo ""

# 1. Stop current containers
print_info "Step 1/4: Stopping current containers..."
docker compose -f docker-compose.prod.yml down
print_success "Containers stopped"
echo ""

# 2. Restore database from backup
print_info "Step 2/4: Restoring database from backup..."
print_info "This may take a few minutes..."

# Start only PostgreSQL
docker compose -f docker-compose.prod.yml up -d postgres
sleep 10

# Restore database
DB_USER=${DATABASE_USER:-flow_user}
DB_NAME=${DATABASE_NAME:-flow_production}

print_info "Dropping and recreating database..."
docker exec flow-postgres psql -U $DB_USER -c "DROP DATABASE IF EXISTS ${DB_NAME};" postgres || true
docker exec flow-postgres psql -U $DB_USER -c "CREATE DATABASE ${DB_NAME};" postgres

print_info "Restoring from backup..."
gunzip -c "$LATEST_BACKUP" | docker exec -i flow-postgres psql -U $DB_USER $DB_NAME

if [ $? -eq 0 ]; then
    print_success "Database restored from $LATEST_BACKUP"
else
    print_error "Database restore failed!"
    exit 1
fi
echo ""

# 3. Get previous Docker image tags
print_info "Step 3/4: Reverting to previous Docker images..."

# Read current image tag from .env file
if [ -f ".env.production" ]; then
    CURRENT_TAG=$(grep "IMAGE_TAG=" .env.production | cut -d'=' -f2)
    print_info "Current tag: $CURRENT_TAG"
fi

# Use production-latest or a specific previous tag
ROLLBACK_TAG="production-latest"
print_info "Rolling back to tag: $ROLLBACK_TAG"

# Update .env file to use previous tag
sed -i "s/IMAGE_TAG=.*/IMAGE_TAG=$ROLLBACK_TAG/" .env.production || true
print_success "Image tag updated"
echo ""

# 4. Start containers with previous images
print_info "Step 4/4: Starting containers with previous version..."
docker compose --env-file .env.production -f docker-compose.prod.yml pull
docker compose --env-file .env.production -f docker-compose.prod.yml up -d

print_info "Waiting for services to start..."
sleep 15
echo ""

# 5. Health check
print_info "Running health check..."
if bash scripts/health-check.sh; then
    echo ""
    echo "======================================"
    print_success "Rollback completed successfully!"
    echo "======================================"
    echo ""
    print_info "Next steps:"
    echo "  1. Verify application functionality: https://api.flow.afronix.com"
    echo "  2. Check logs: docker compose logs -f"
    echo "  3. Review what went wrong before attempting another deployment"
    echo ""
    exit 0
else
    echo ""
    print_error "Health check failed after rollback!"
    print_warning "Manual intervention required"
    echo ""
    print_info "To investigate:"
    echo "  docker ps"
    echo "  docker compose logs"
    echo ""
    exit 1
fi
