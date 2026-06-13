#!/bin/bash

#############################################
# Health Check Script for Flow Services
# Verifies all services are running correctly
#############################################

# No set -e — each check reports and continues so we get a full picture on failure

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error()   { echo -e "${RED}❌ $1${NC}"; }
print_info()    { echo -e "${YELLOW}ℹ️  $1${NC}"; }

FAILED=0

# ---------------------------------------------------------------------------
# wait_for_service <container> <url> <label>
#   Retries the curl check every 5 s for up to 60 s.
#   On failure prints the last 30 log lines from the container.
# ---------------------------------------------------------------------------
wait_for_service() {
  local container=$1
  local url=$2
  local label=$3
  local attempts=0
  local max_attempts=12   # 12 × 5 s = 60 s
  local code="000"

  print_info "Checking $label..."

  while [ $attempts -lt $max_attempts ]; do
    code=$(docker exec "$container" curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    if [ "$code" = "200" ]; then
      print_success "$label is healthy (HTTP 200)"
      return 0
    fi
    attempts=$((attempts + 1))
    if [ $attempts -lt $max_attempts ]; then
      echo "    ↳ HTTP $code — retrying in 5 s (attempt $attempts/$max_attempts)..."
      sleep 5
    fi
  done

  print_error "$label is not responding after 60 s (last HTTP $code)"
  echo ""
  echo "--- Last 30 log lines from $container ---"
  docker logs "$container" --tail 30 2>&1 || echo "(no logs available)"
  echo "--- End $container logs ---"
  echo ""
  FAILED=1
  return 1
}

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
if docker exec flow-postgres pg_isready -U "${DATABASE_USER:-flow_user}" > /dev/null 2>&1; then
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

# Application services
wait_for_service auth-service         "http://localhost:3001/api/v1/health"            "Auth Service"
wait_for_service notification-service "http://localhost:3002/api/v1/notifications/health" "Notification Service"
wait_for_service job-service          "http://localhost:3003/api/v1/jobs/health"       "Job Service"
wait_for_service file-service         "http://localhost:3004/api/v1/files/health"      "File Service"
wait_for_service settings-service     "http://localhost:3005/api/v1/health"            "Settings Service"
wait_for_service api                  "http://localhost:3000/api/v1/health"            "API Service (projects/tasks)"

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
