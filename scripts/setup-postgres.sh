#!/bin/bash

echo "🚀 Setting up PostgreSQL for TowerConnect..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if container already exists
if docker ps -a --format "table {{.Names}}" | grep -q "tower-connect-db"; then
    echo "📦 PostgreSQL container already exists. Starting it..."
    docker start tower-connect-db
else
    echo "🐘 Creating PostgreSQL container..."
    docker run --name tower-connect-db \
        -e POSTGRES_DB=tower_connect \
        -e POSTGRES_USER=postgres \
        -e POSTGRES_PASSWORD=postgres \
        -p 5432:5432 \
        -d postgres:15
    
    echo "⏳ Waiting for PostgreSQL to start..."
    sleep 5
fi

# Check if container is running
if docker ps --format "table {{.Names}}" | grep -q "tower-connect-db"; then
    echo "✅ PostgreSQL is running!"
    echo "📊 Database: tower_connect"
    echo "👤 User: postgres"
    echo "🔑 Password: postgres"
    echo "🌐 Port: 5432"
    echo ""
    echo "Next steps:"
    echo "1. Copy env.example to .env"
    echo "2. Run: npm install"
    echo "3. Run: npm run db:push"
    echo "4. Run: npm run setup"
    echo "5. Run: npm run dev"
else
    echo "❌ Failed to start PostgreSQL container"
    exit 1
fi
