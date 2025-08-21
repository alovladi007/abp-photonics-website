#!/bin/bash
set -e

echo "🏥 MediMetrics Health Check"
echo "=========================="

# Function to check service health
check_service() {
    local name=$1
    local url=$2
    
    if curl -f -s "$url" > /dev/null; then
        echo "✅ $name: Healthy"
        return 0
    else
        echo "❌ $name: Unhealthy"
        return 1
    fi
}

# Check all services
ERRORS=0

check_service "API" "http://localhost:8000/health" || ((ERRORS++))
check_service "Web" "http://localhost:3000" || ((ERRORS++))
check_service "Inference" "http://localhost:9200/health" || ((ERRORS++))
check_service "MinIO" "http://localhost:9000/minio/health/live" || ((ERRORS++))
check_service "Orthanc" "http://localhost:8042/system" || ((ERRORS++))
check_service "Prometheus" "http://localhost:9090/-/healthy" || ((ERRORS++))
check_service "Grafana" "http://localhost:3001/api/health" || ((ERRORS++))

# Check database
if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ PostgreSQL: Healthy"
else
    echo "❌ PostgreSQL: Unhealthy"
    ((ERRORS++))
fi

# Check Redis
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis: Healthy"
else
    echo "❌ Redis: Unhealthy"
    ((ERRORS++))
fi

echo "=========================="

if [ $ERRORS -eq 0 ]; then
    echo "✅ All services are healthy!"
    exit 0
else
    echo "❌ $ERRORS service(s) are unhealthy"
    exit 1
fi