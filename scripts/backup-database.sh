#!/bin/bash

#############################################
# Database Backup Script
# Creates automated backups of PostgreSQL
#############################################

set -e

# Configuration
BACKUP_DIR="/var/backups/databases"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
DB_NAME=${DATABASE_NAME:-flow_production}
DB_USER=${DATABASE_USER:-flow_user}
BACKUP_FILE="$BACKUP_DIR/flow_$DATE.sql.gz"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_info() { echo -e "${YELLOW}ℹ️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

print_info "Starting database backup..."
print_info "Database: $DB_NAME"
print_info "Backup file: $BACKUP_FILE"

# Create backup
if docker exec flow-postgres pg_dump -U $DB_USER $DB_NAME | gzip > "$BACKUP_FILE"; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    print_success "Backup completed: $BACKUP_FILE ($BACKUP_SIZE)"
else
    print_error "Backup failed!"
    exit 1
fi

# Delete backups older than 7 days
print_info "Cleaning up old backups (keeping last 7 days)..."
DELETED=$(find $BACKUP_DIR -name "flow_*.sql.gz" -mtime +7 -delete -print | wc -l)
if [ $DELETED -gt 0 ]; then
    print_success "Deleted $DELETED old backup(s)"
else
    print_info "No old backups to delete"
fi

# Count remaining backups
BACKUP_COUNT=$(ls -1 $BACKUP_DIR/flow_*.sql.gz 2>/dev/null | wc -l)
print_info "Total backups: $BACKUP_COUNT"

# Log to file
echo "$(date): Backup created: $BACKUP_FILE" >> /var/log/applications/flow/backup.log

print_success "Backup process complete!"
