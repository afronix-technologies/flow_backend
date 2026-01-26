#!/bin/bash

echo "🚀 Setting up Afronix Tracker Development Environment..."

# 1. Environment Files
if [ ! -f .env.development ]; then
    echo "Creating .env.development from example..."
    cp .env.example .env.development
fi

# 2. Install Dependencies
echo "📦 Installing dependencies..."
npm install

# 3. Start Docker Containers (Infra only)
echo "🐳 Starting Docker infrastructure (Redis, Nginx)..."
docker-compose up -d redis nginx

# 4. Run Migrations
echo "🔄 Running database migrations..."
npm run migration:run

echo "✅ Setup Complete! Run 'npm run start:dev' to start the server."
