#!/bin/bash

#############################################
# Health Check Script for Flow Services
# Verifies all services are running correctly
#############################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${YELLOW}ℹ️  $1${NC}"; }

FAILED=0

echo "======================================"
echo "   Flow Services Health Check"
echo "======================================"
echo ""

# Check Docker containers are running
print_info "Checking Docker containers..."
if ! docker ps | grep -q "flow-"; then
    print_error "No Flow containers are running"
    FAILED=1
else
    CONTAINER_COUNT=$(docker ps | grep -c "flow-" || true)
    print_success "Found $CONTAINER_COUNT Flow containers running"
fi

# Check PostgreSQL
print_info "Checking PostgreSQL..."
if docker exec flow-postgres pg_isready -U ${DATABASE_USER:-flow_user} > /dev/null 2>&1; then
    print_success "PostgreSQL is healthy"
else
    print_error "PostgreSQL is not responding"
    FAILED=1
fi

# Check Redis
print_info "Checking Redis..."
if docker exec flow-redis redis-cli ping > /dev/null 2>&1; then
    print_success "Redis is healthy"
else
    print_error "Redis is not responding"
    FAILED=1
fi

# Check Auth Service
print_info "Checking Auth Service..."
AUTH_RESPONSE=$(docker exec auth-service curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health 2>/dev/null || echo "000")
if [ "$AUTH_RESPONSE" = "200" ]; then
    print_success "Auth Service is healthy (HTTP 200)"
else
    print_error "Auth Service is not responding (HTTP $AUTH_RESPONSE)"
    FAILED=1
fi

# Check Notification Service
print_info "Checking Notification Service..."
NOTIF_RESPONSE=$(docker exec notification-service curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/health 2>/dev/null || echo "000")
if [ "$NOTIF_RESPONSE" = "200" ]; then
    print_success "Notification Service is healthy (HTTP 200)"
else
    print_error "Notification Service is not responding (HTTP $NOTIF_RESPONSE)"
    FAILED=1
fi

# Check Job Service
print_info "Checking Job Service..."
JOB_RESPONSE=$(docker exec job-service curl -s -o /dev/null -w "%{http_code}" http://localhost:3003/health 2>/dev/null || echo "000")
if [ "$JOB_RESPONSE" = "200" ]; then
    print_success "Job Service is healthy (HTTP 200)"
else
    print_error "Job Service is not responding (HTTP $JOB_RESPONSE)"
    FAILED=1
fi

# Check disk space
print_info "Checking disk space..."
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 85 ]; then
    print_success "Disk usage is ${DISK_USAGE}% (healthy)"
else
    print_error "Disk usage is ${DISK_USAGE}% (critical)"
    FAILED=1
fi

# Check memory
print_info "Checking memory..."
MEM_AVAILABLE=$(free -m | awk 'NR==2 {print $7}')
if [ "$MEM_AVAILABLE" -gt 500 ]; then
    print_success "Memory available: ${MEM_AVAILABLE}MB (healthy)"
else
    print_error "Memory available: ${MEM_AVAILABLE}MB (low)"
    FAILED=1
fi

echo ""
echo "======================================"
if [ $FAILED -eq 0 ]; then
    print_success "All health checks passed!"
    exit 0
else
    print_error "Some health checks failed!"
    exit 1
fi
