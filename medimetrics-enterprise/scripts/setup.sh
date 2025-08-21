#!/bin/bash
set -e

echo "🚀 MediMetrics Platform Setup"
echo "============================="

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Aborting." >&2; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "❌ Docker Compose is required but not installed. Aborting." >&2; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting." >&2; exit 1; }

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js 20+ is required. Current version: $(node -v)"
    exit 1
fi

# Install pnpm if not present
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

# Setup environment files
if [ ! -f apps/enterprise/.env ]; then
    echo "📝 Creating enterprise .env file..."
    cp apps/enterprise/.env.example apps/enterprise/.env
    echo "⚠️  Please update apps/enterprise/.env with your configuration"
fi

if [ ! -f apps/marketing/.env ]; then
    echo "📝 Creating marketing .env file..."
    cp apps/marketing/.env.example apps/marketing/.env
    echo "⚠️  Please update apps/marketing/.env with your configuration"
fi

# Create necessary directories
mkdir -p data/{postgres,redis,minio,models,uploads}
mkdir -p logs
mkdir -p backups

# Set permissions
chmod 755 scripts/*.sh

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Initialize Docker services
echo "🐳 Starting Docker services..."
cd apps/enterprise
docker-compose up -d postgres redis minio

# Wait for services
echo "⏳ Waiting for services to be ready..."
sleep 10

# Initialize MinIO buckets
echo "📦 Creating MinIO buckets..."
./scripts/init-minio-buckets.sh

# Run database migrations
echo "🗄️ Running database migrations..."
docker-compose run --rm api pnpm run migration:run

# Seed initial data
echo "🌱 Seeding database..."
docker-compose run --rm api pnpm run seed

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update environment variables in .env files"
echo "2. Run 'cd apps/enterprise && docker-compose up' to start the platform"
echo "3. Access the application at http://localhost:3000"
echo "4. Login with admin@demo.local / Demo123!"