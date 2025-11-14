#!/bin/bash

# Production deployment script for Google Photos Clone
# Usage: ./scripts/deploy.sh

set -e

echo "🚀 Starting production deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ docker-compose is not installed.${NC}"
    exit 1
fi

# Navigate to project root
cd "$(dirname "$0")/.."

echo -e "${YELLOW}📦 Pulling latest code...${NC}"
git pull origin main || echo "⚠️  Git pull failed or not a git repo"

echo -e "${YELLOW}🔨 Building Docker images...${NC}"
docker-compose -f docker-compose.prod.yml build --no-cache

echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
docker-compose -f docker-compose.prod.yml down

echo -e "${YELLOW}🚀 Starting containers...${NC}"
docker-compose -f docker-compose.prod.yml up -d

echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 10

echo -e "${YELLOW}🔧 Running migrations...${NC}"
docker-compose -f docker-compose.prod.yml exec -T app php artisan migrate --force

echo -e "${YELLOW}🔗 Creating storage symlink...${NC}"
docker-compose -f docker-compose.prod.yml exec -T app php artisan storage:link || echo "⚠️  Storage link may already exist"

echo -e "${YELLOW}💾 Caching configuration...${NC}"
docker-compose -f docker-compose.prod.yml exec -T app php artisan config:clear
docker-compose -f docker-compose.prod.yml exec -T app php artisan config:cache
docker-compose -f docker-compose.prod.yml exec -T app php artisan route:cache
docker-compose -f docker-compose.prod.yml exec -T app php artisan view:cache

echo -e "${YELLOW}🔐 Setting permissions...${NC}"
sudo chown -R www-data:www-data storage bootstrap/cache || echo "⚠️  Permission fix skipped (may need sudo)"
sudo chmod -R 775 storage bootstrap/cache || echo "⚠️  Permission fix skipped (may need sudo)"

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}📊 Checking container status...${NC}"
docker-compose -f docker-compose.prod.yml ps

echo -e "${GREEN}🎉 All done! Your application should be running.${NC}"

